import Bookings from "../models/Bookings/bookingModel.js";
import Payment from "../models/payments/paymentModel.js";
import Trip from "../models/components/tripModel.js";
import User from "../models/users/usersModel.js";
import { getClientUrl, getStripe } from "../configs/stripe.js";
import paymentError from "../utils/paymentError.js";
import statusCode from "../utils/statusCodes.js";
import { getPaymentPrice, isTripDateAvailable, makeReceipt } from "../utils/paymentUtils.js";
import { getOrCreateBooking } from "./bookingService.js";
import { validateCreateOrder } from "../validators/paymentValidator.js";

const checkoutResult = (booking, payment, session, responseStatus) => ({
  statusCode: responseStatus,
  body: {
    success: true,
    data: {
      bookingId: booking._id,
      checkoutSessionId: session.id,
      checkoutUrl: session.url,
      amount: payment.amount,
      currency: payment.currency,
      travelers: booking.travelers,
      pricing: booking.pricing,
      totalPrice: booking.totalPrice,
    },
  },
});

const markSessionExpired = async (payment, booking) => {
  const result = await Payment.updateOne(
    { _id: payment._id, status: { $nin: ["captured", "failed", "refunded"] } },
    {
      $set: { status: "failed", failureReason: "Checkout session expired." },
      $unset: { activeAttemptKey: 1 },
    }
  );

  if (result.modifiedCount > 0) {
    await Bookings.updateOne(
      { _id: booking._id, paymentStatus: { $nin: ["paid", "refunded"] } },
      { $set: { paymentStatus: "failed" } }
    );
  }
};

const getExistingSessionResult = async (stripe, booking, payment) => {
  if (payment.provider !== "stripe") {
    throw paymentError(
      "A payment attempt for this booking is already active with another provider.",
      statusCode.CONFLICT
    );
  }
  if (!payment.stripeCheckoutSessionId) {
    throw paymentError("Your payment session is still being prepared.", statusCode.CONFLICT);
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(payment.stripeCheckoutSessionId);
  } catch {
    throw paymentError("Could not check the existing checkout session. Please retry.", statusCode.BAD_GATEWAY);
  }

  if (session.status === "open" && session.url) {
    return checkoutResult(booking, payment, session, statusCode.OK);
  }
  if (session.status === "expired") {
    await markSessionExpired(payment, booking);
    return null;
  }

  return {
    statusCode: statusCode.ACCEPTED,
    body: {
      success: true,
      data: {
        bookingId: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      },
    },
  };
};

const createPaymentAttempt = async (booking, userId) => {
  const activeAttemptKey = booking._id.toString();
  const pricing = getPaymentPrice(booking.pricing.pricePerPerson, booking.travelers);
  const payment = new Payment({
    booking: booking._id,
    user: userId,
    provider: "stripe",
    amount: pricing.amount,
    currency: booking.pricing.currency,
    activeAttemptKey,
  });
  payment.receipt = makeReceipt(payment._id);

  try {
    await payment.save();
    return payment;
  } catch (error) {
    if (error.code !== 11000) throw error;
    throw paymentError("Your payment session is still being prepared.", statusCode.CONFLICT);
  }
};

const createStripeSession = async (stripe, payment, booking, trip, user, clientUrl) => {
  const metadata = {
    bookingId: booking._id.toString(),
    paymentId: payment._id.toString(),
    userId: user._id.toString(),
  };

  try {
    return await stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: booking._id.toString(),
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: payment.currency.toLowerCase(),
              unit_amount: payment.amount,
              product_data: {
                name: `${trip.from} to ${trip.to}`,
                description: `${booking.travelers} ${booking.travelers === 1 ? "traveler" : "travelers"}`,
              },
            },
            quantity: 1,
          },
        ],
        payment_intent_data: { metadata },
        metadata,
        success_url: `${clientUrl}/trip/${trip._id}?checkout=success&bookingId=${booking._id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/trip/${trip._id}?checkout=cancelled&bookingId=${booking._id}`,
      },
      { idempotencyKey: payment._id.toString() }
    );
  } catch {
    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: { status: "failed", failureReason: "Checkout session creation failed." },
        $unset: { activeAttemptKey: 1 },
      }
    );
    await Bookings.updateOne(
      { _id: booking._id, paymentStatus: { $ne: "paid" } },
      { $set: { paymentStatus: "failed" } }
    );
    throw paymentError("Could not create a Stripe checkout session. Please try again.", statusCode.BAD_GATEWAY);
  }
};

export const createStripeCheckoutSession = async (userId, body) => {
  const input = validateCreateOrder(userId, body);
  const user = await User.findById(input.userId).select("_id email");
  if (!user) throw paymentError("Please log in to book a trip.", statusCode.UNAUTHORIZED);

  const trip = await Trip.findById(input.tripId);
  if (!trip) throw paymentError("Trip not found.", statusCode.NOT_FOUND);
  if (trip.isActive === false) throw paymentError("This trip is not available.", statusCode.GONE);
  if (!isTripDateAvailable(trip.date)) {
    throw paymentError(
      "This trip date has passed . If you still wish to book, please contact support.",
      statusCode.GONE
    );
  }

  const stripe = getStripe();
  const clientUrl = getClientUrl();
  const booking = await getOrCreateBooking(input.userId, trip, input.travelers);
  const activeAttemptKey = booking._id.toString();
  const existingPayment = await Payment.findOne({ activeAttemptKey });

  if (existingPayment) {
    const result = await getExistingSessionResult(stripe, booking, existingPayment);
    if (result) return result;
  }

  if (!booking.pricing?.pricePerPerson || !booking.pricing?.subtotal) {
    throw paymentError("This booking cannot be retried. Please start a new booking.", statusCode.CONFLICT);
  }

  const payment = await createPaymentAttempt(booking, input.userId);
  const session = await createStripeSession(stripe, payment, booking, trip, user, clientUrl);

  try {
    payment.stripeCheckoutSessionId = session.id;
    payment.stripePaymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
    await payment.save();
    booking.paymentStatus = "pending";
    await booking.save();
  } catch {
    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: {
          status: "failed",
          failureReason: "Checkout session could not be saved. Reconciliation may be required.",
          reconciliationRequired: true,
        },
        $unset: { activeAttemptKey: 1 },
      }
    ).catch(() => {});
    throw paymentError("Could not prepare Stripe checkout. Please try again.", statusCode.BAD_GATEWAY);
  }

  return checkoutResult(booking, payment, session, statusCode.CREATED);
};