// This file creates Stripe checkout sessions, checks booking status, and handles Stripe webhooks.
//
// Payment flow:
// Browser -> create booking/session -> Stripe Checkout
// Stripe -> signed webhook -> confirm the booking in MongoDB
// Browser return -> status endpoint (never used as payment proof)

import Bookings from "../models/Bookings/bookingModel.js";
import Trip from "../models/components/tripModel.js";
import { getClientUrl, getStripe, getStripeWebhookSecret } from "../configs/stripe.js";
import paymentError from "../utils/paymentError.js";
import statusCode from "../utils/statusCodes.js";
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  getPaymentPrice,
  isTripDateAvailable,
  validateBookingId,
  validateCreatePayment,
} from "../utils/paymentUtils.js";

// Keep the response fields used by the checkout page and payment-status screen.
const checkoutData = (booking, session, amount) => ({
  bookingId: booking._id,
  checkoutSessionId: session.id,
  checkoutUrl: session.url,
  amount,
  currency: booking.pricing.currency,
  travelers: booking.travelers,
  pricing: booking.pricing,
  totalPrice: booking.totalPrice,
});

// Return the current booking and one Stripe attempt in the old response shape.
const paymentStatusData = (booking) => ({
  bookingId: booking._id,
  status: booking.status,
  paymentStatus: booking.paymentStatus,
  travelers: booking.travelers,
  totalPrice: booking.totalPrice,
  pricing: booking.pricing,
  paymentReference: booking.paymentReference,
  attempts: booking.stripeSessionId
    ? [{
        provider: "stripe",
        stripeCheckoutSessionId: booking.stripeSessionId,
        amount: Math.round(booking.totalPrice * 100),
        currency: booking.pricing.currency,
        status: booking.paymentStatus === PAYMENT_STATUS.PAID
          ? "captured"
          : booking.paymentStatus === PAYMENT_STATUS.FAILED
            ? "failed"
            : "created",
        createdAt: booking.updatedAt,
      }]
    : [],
});

// Find an existing booking, or create one with the trip's current price.
const findOrCreateBooking = async (userId, trip, travelers) => {
  let booking = await Bookings.findOne({
    user: userId,
    trip: trip._id,
    travelers,
  }).sort({ createdAt: -1 });

  if (booking?.paymentStatus === PAYMENT_STATUS.PAID) {
    throw paymentError("This booking has already been paid.", statusCode.CONFLICT);
  }
  if (booking?.paymentStatus === PAYMENT_STATUS.REFUNDED || booking?.status === BOOKING_STATUS.CANCELLED) {
    throw paymentError("This booking cannot be paid because it is cancelled.", statusCode.CONFLICT);
  }
  if (booking) return booking;

  const pricing = getPaymentPrice(trip.pricePerHead, travelers);
  booking = await Bookings.create({
    user: userId,
    trip: trip._id,
    travelers,
    pricing: {
      pricePerPerson: pricing.pricePerPerson,
      subtotal: pricing.subtotal,
      currency: pricing.currency,
    },
    totalPrice: pricing.subtotal,
    status: BOOKING_STATUS.PENDING,
    paymentStatus: PAYMENT_STATUS.PENDING,
  });

  return booking;
};

// Reuse a still-open Checkout page so retrying Pay does not create another session.
const getOpenCheckout = async (stripe, booking) => {
  if (!booking.stripeSessionId) return null;

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
  } catch {
    throw paymentError("Could not check the existing Stripe session. Please retry.", statusCode.BAD_GATEWAY);
  }

  if (session.status === "open" && session.url) {
    const amount = Math.round(booking.totalPrice * 100);
    return {
      statusCode: statusCode.OK,
      body: { success: true, data: checkoutData(booking, session, amount) },
    };
  }

  if (session.status === "complete") {
    return {
      statusCode: statusCode.ACCEPTED,
      body: { success: true, data: paymentStatusData(booking) },
    };
  }

  // An expired session can be replaced. The webhook also marks it failed.
  await Bookings.updateOne(
    {
      _id: booking._id,
      stripeSessionId: session.id,
      paymentStatus: { $ne: PAYMENT_STATUS.PAID },
    },
    { $set: { paymentStatus: PAYMENT_STATUS.FAILED } }
  );
  booking.paymentStatus = PAYMENT_STATUS.FAILED;
  return null;
};

// Create or resume the Stripe Checkout session for a signed-in traveler.
export const createStripeCheckoutSession = async (userId, body) => {
  const input = validateCreatePayment(userId, body);
  const trip = await Trip.findById(input.tripId);

  if (!trip) throw paymentError("Trip not found.", statusCode.NOT_FOUND);
  if (trip.isActive === false) {
    throw paymentError("This trip is not available.", statusCode.GONE);
  }
  if (!isTripDateAvailable(trip.date)) {
    throw paymentError("This trip date has passed.", statusCode.GONE);
  }

  const stripe = getStripe();
  const booking = await findOrCreateBooking(input.userId, trip, input.travelers);
  const openCheckout = await getOpenCheckout(stripe, booking);
  if (openCheckout) return openCheckout;

  // Reuse the saved price for retries; it is the price the traveler first agreed to.
  const amount = Math.round(booking.totalPrice * 100);
  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw paymentError("The saved booking price is invalid.", statusCode.BAD_REQUEST);
  }

  const clientUrl = getClientUrl();
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: booking.pricing.currency.toLowerCase(),
          unit_amount: amount,
          product_data: {
            name: `${trip.from} to ${trip.to}`,
            description: `${booking.travelers} ${booking.travelers === 1 ? "traveler" : "travelers"}`,
          },
        },
        quantity: 1,
      }],
      metadata: { bookingId: booking._id.toString() },
      success_url: `${clientUrl}/trip/${trip._id}?checkout=success&bookingId=${booking._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/trip/${trip._id}?checkout=cancelled&bookingId=${booking._id}`,
    });
  } catch (error) {
    console.error("[stripe checkout] Session creation failed.", {
      type: error.type,
      code: error.code,
      parameter: error.param,
      requestId: error.requestId,
      message: error.message,
    });
    throw paymentError("Could not create a Stripe checkout session. Please try again.", statusCode.BAD_GATEWAY);
  }

  // Store the session ID so another Pay request can resume the same checkout.
  booking.stripeSessionId = session.id;
  booking.paymentStatus = PAYMENT_STATUS.PENDING;
  await booking.save();

  return {
    statusCode: statusCode.CREATED,
    body: { success: true, data: checkoutData(booking, session, amount) },
  };
};

// Return payment details only when this booking belongs to the signed-in user.
export const getPaymentStatus = async (userId, bookingId) => {
  validateBookingId(bookingId);

  const booking = await Bookings.findOne({ _id: bookingId, user: userId }).lean();
  if (!booking) throw paymentError("Booking not found.", statusCode.NOT_FOUND);

  return {
    statusCode: statusCode.OK,
    body: { success: true, data: paymentStatusData(booking) },
  };
};

// Apply a successful Stripe event to a booking. A repeated event is harmless.
const completeCheckout = async (session) => {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    console.warn("[stripe webhook] Completed session has no booking ID.");
    return;
  }

  const booking = await Bookings.findById(bookingId);
  if (!booking) {
    console.warn(`[stripe webhook] Booking ${bookingId} was not found.`);
    return;
  }
  if (booking.paymentStatus === PAYMENT_STATUS.PAID) {
    console.log(`[stripe webhook] Booking ${bookingId} is already paid.`);
    return;
  }
  if (session.payment_status !== "paid") {
    console.log(`[stripe webhook] Session ${session.id} is not paid yet.`);
    return;
  }

  const expectedAmount = Math.round(booking.totalPrice * 100);
  if (session.amount_total !== expectedAmount) {
    console.error(`[stripe webhook] Amount did not match booking ${bookingId}.`);
    return;
  }

  booking.status = BOOKING_STATUS.CONFIRMED;
  booking.paymentStatus = PAYMENT_STATUS.PAID;
  booking.paymentReference = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.id;
  booking.stripeSessionId = session.id;
  await booking.save();
  console.log(`[stripe webhook] Booking ${bookingId} confirmed.`);
};

// Mark an expired session failed unless it has already been paid or replaced.
const expireCheckout = async (session) => {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    console.warn("[stripe webhook] Expired session has no booking ID.");
    return;
  }

  const result = await Bookings.updateOne(
    {
      _id: bookingId,
      stripeSessionId: session.id,
      paymentStatus: { $ne: PAYMENT_STATUS.PAID },
    },
    { $set: { paymentStatus: PAYMENT_STATUS.FAILED } }
  );

  if (result.modifiedCount) {
    console.log(`[stripe webhook] Checkout session ${session.id} expired.`);
  }
};

// Verify Stripe's signature, handle the two events we need, and acknowledge the rest.
export const handleStripeWebhook = async (rawBody, signature) => {
  const stripe = getStripe();
  const webhookSecret = getStripeWebhookSecret();
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    throw paymentError("Invalid Stripe webhook signature.", statusCode.BAD_REQUEST);
  }

  console.log(`[stripe webhook] Received ${event.type}.`);
  if (event.type === "checkout.session.completed") {
    await completeCheckout(event.data.object);
  } else if (event.type === "checkout.session.expired") {
    await expireCheckout(event.data.object);
  } else {
    console.log(`[stripe webhook] Ignored ${event.type}.`);
  }

  return { success: true, received: true };
};
