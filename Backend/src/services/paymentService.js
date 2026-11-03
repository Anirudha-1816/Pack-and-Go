import Bookings from "../models/Bookings/bookingModel.js";
import Payment from "../models/payments/paymentModel.js";
import Trip from "../models/components/tripModel.js";
import User from "../models/users/usersModel.js";
import { getRazorpay } from "../configs/razorpay.js";
import statusCode from "../utils/statusCodes.js";
import paymentError from "../utils/paymentError.js";
import { checkoutData } from "../utils/paymentResponse.js";
import {
  getPaymentPrice,
  isTripDateAvailable,
  makeReceipt,
  matchesRazorpayPayment,
  verifyCheckoutSignature,
} from "../utils/paymentUtils.js";
import {
  findOwnedPayment,
  getOrCreateBooking,
  markBookingPaymentFailed,
  confirmBookingAfterCapture,
} from "./bookingService.js";
import { validateBookingId, validateCreateOrder, validatePaymentVerification } from "../validators/paymentValidator.js";

const findOrCreatePaymentAttempt = async (booking, userId, keyId) => {
  const activeAttemptKey = booking._id.toString();
  const existingPayment = await Payment.findOne({ activeAttemptKey });

  if (existingPayment) {
    if (!existingPayment.razorpayOrderId) {
      throw paymentError("Your payment order is still being prepared.", statusCode.CONFLICT);
    }

    return {
      payment: existingPayment,
      statusCode: statusCode.OK,
      data: checkoutData(booking, existingPayment, keyId),
    };
  }

  if (!booking.pricing?.pricePerPerson || !booking.pricing?.subtotal) {
    throw paymentError("This booking cannot be retried. Please start a new booking.", statusCode.CONFLICT);
  }

  const pricing = getPaymentPrice(booking.pricing.pricePerPerson, booking.travelers);
  const payment = new Payment({
    booking: booking._id,
    user: userId,
    amount: pricing.amount,
    currency: booking.pricing.currency,
    activeAttemptKey,
  });
  payment.receipt = makeReceipt(payment._id);

  try {
    await payment.save();
  } catch (error) {
    if (error.code !== 11000) throw error;

    const activePayment = await Payment.findOne({ activeAttemptKey });
    if (activePayment?.razorpayOrderId) {
      return {
        payment: activePayment,
        statusCode: statusCode.OK,
        data: checkoutData(booking, activePayment, keyId),
      };
    }

    throw paymentError("Your payment order is still being prepared.", statusCode.CONFLICT);
  }

  return { payment, statusCode: null, data: null };
};

const createRazorpayOrder = async (client, payment, booking) => {
  try {
    return await client.orders.create({
      amount: payment.amount,
      currency: payment.currency,
      receipt: payment.receipt,
      notes: { bookingId: booking._id.toString() },
    });
  } catch {
    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: { status: "failed", failureReason: "Order creation failed." },
        $unset: { activeAttemptKey: 1 },
      }
    );
    await Bookings.updateOne(
      { _id: booking._id, paymentStatus: { $ne: "paid" } },
      { $set: { paymentStatus: "failed" } }
    );

    throw paymentError("Could not create a payment order. Please try again.", statusCode.BAD_GATEWAY);
  }
};

const saveRazorpayOrder = async (order, payment, booking) => {
  try {
    payment.razorpayOrderId = order.id;
    await payment.save();
    booking.razorpayOrderId = order.id;
    booking.paymentStatus = "pending";
    await booking.save();
  } catch {
    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: {
          status: "failed",
          failureReason: "Order could not be saved. Reconciliation may be required.",
          reconciliationRequired: true,
        },
        $unset: { activeAttemptKey: 1 },
      }
    ).catch(() => {});
    await Bookings.updateOne(
      { _id: booking._id, paymentStatus: { $ne: "paid" } },
      { $set: { paymentStatus: "failed" } }
    ).catch(() => {});

    throw paymentError("Could not prepare the payment. Please try again.", statusCode.BAD_GATEWAY);
  }
};

export const createPaymentOrder = async (userId, body) => {
  const input = validateCreateOrder(userId, body);
  const user = await User.findById(input.userId).select("_id");
  if (!user) {
    throw paymentError("Please log in to book a trip.", statusCode.UNAUTHORIZED);
  }

  const trip = await Trip.findById(input.tripId);
  if (!trip) throw paymentError("Trip not found.", statusCode.NOT_FOUND);
  if (trip.isActive === false) throw paymentError("This trip is not available.", statusCode.GONE);
  if (!isTripDateAvailable(trip.date)) {
    throw paymentError(
      "This trip date has passed . If you still wish to book, please contact support.",
      statusCode.GONE
    );
  }

  const { client, keyId } = getRazorpay();
  const booking = await getOrCreateBooking(input.userId, trip, input.travelers);
  const attempt = await findOrCreatePaymentAttempt(booking, input.userId, keyId);

  if (attempt.statusCode) {
    return {
      statusCode: attempt.statusCode,
      body: { success: true, data: attempt.data },
    };
  }

  const order = await createRazorpayOrder(client, attempt.payment, booking);
  await saveRazorpayOrder(order, attempt.payment, booking);

  return {
    statusCode: statusCode.CREATED,
    body: {
      success: true,
      data: checkoutData(booking, attempt.payment, keyId),
    },
  };
};

const markPaymentCaptured = async (payment, razorpayPayment) => {
  const latestPayment = await Payment.findById(payment._id);
  if (latestPayment?.status === "refunded") return false;

  await Payment.updateOne(
    { _id: payment._id, status: { $ne: "refunded" } },
    {
      $set: {
        status: "captured",
        razorpayPaymentId: razorpayPayment.id,
        signatureVerified: true,
        failureReason: "",
      },
      $unset: { activeAttemptKey: 1 },
    }
  );

  return true;
};

const refundDuplicatePayment = async (client, payment) => {
  const claimed = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      status: "captured",
      refundInProgress: false,
    },
    {
      $set: { refundInProgress: true, reconciliationRequired: true },
    },
    { new: true }
  );

  if (!claimed) return;

  try {
    const razorpayClient = client || getRazorpay().client;
    const refund = await razorpayClient.payments.refund(payment.razorpayPaymentId, {
      amount: payment.amount,
      notes: { reason: "Duplicate successful payment for one booking" },
    });

    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: {
          refundId: refund.id,
          status: refund.status === "processed" ? "refunded" : "captured",
          refundedAmount: refund.status === "processed" ? payment.amount : 0,
          refundInProgress: refund.status !== "processed",
          reconciliationRequired: refund.status !== "processed",
          failureReason:
            refund.status === "processed"
              ? "Duplicate payment refunded."
              : "Duplicate payment refund is still processing.",
        },
      }
    );
  } catch {
    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: {
          refundInProgress: true,
          reconciliationRequired: true,
          failureReason: "Duplicate captured payment needs refund reconciliation.",
        },
      }
    );
  }
};

export const settleCapturedPayment = async (client, payment, booking, razorpayPayment) => {
  const captured = await markPaymentCaptured(payment, razorpayPayment);
  if (!captured) return { booking, refunded: false };

  const result = await confirmBookingAfterCapture(payment, booking, razorpayPayment.id);
  if (!result.duplicatePayment) return { booking: result.booking, refunded: false };

  await refundDuplicatePayment(client, payment);
  return { booking: result.booking, refunded: true };
};

export const verifyPayment = async (userId, body) => {
  const input = validatePaymentVerification(body);
  const owned = await findOwnedPayment(userId?.toString(), input.orderId);
  if (!owned) throw paymentError("Payment was not found.", statusCode.NOT_FOUND);

  const { payment, booking } = owned;
  const { client, keySecret } = getRazorpay();
  if (!verifyCheckoutSignature(input.orderId, input.paymentId, input.signature, keySecret)) {
    throw paymentError("Payment signature is invalid.", statusCode.BAD_REQUEST);
  }

  let razorpayPayment;
  try {
    razorpayPayment = await client.payments.fetch(input.paymentId);
  } catch {
    throw paymentError("Payment status could not be checked. Please retry.", statusCode.BAD_GATEWAY);
  }

  if (!matchesRazorpayPayment(razorpayPayment, {
    orderId: input.orderId,
    amount: payment.amount,
    currency: payment.currency,
  })) {
    throw paymentError("Payment details do not match this order.", statusCode.BAD_REQUEST);
  }

  if (razorpayPayment.status === "failed") {
    await markBookingPaymentFailed(payment, booking);
    return {
      statusCode: statusCode.OK,
      body: {
        success: true,
        data: { bookingId: booking._id, status: booking.status, paymentStatus: "failed" },
      },
    };
  }

  let verifiedPayment = razorpayPayment;
  if (verifiedPayment.status === "authorized") {
    try {
      await client.payments.capture(input.paymentId, payment.amount, payment.currency);
      verifiedPayment = await client.payments.fetch(input.paymentId);
    } catch {
      return {
        statusCode: statusCode.ACCEPTED,
        body: {
          success: true,
          data: { bookingId: booking._id, status: booking.status, paymentStatus: "pending" },
        },
      };
    }
  }

  if (verifiedPayment.status !== "captured") {
    return {
      statusCode: statusCode.ACCEPTED,
      body: {
        success: true,
        data: { bookingId: booking._id, status: booking.status, paymentStatus: "pending" },
      },
    };
  }

  const result = await settleCapturedPayment(client, payment, booking, verifiedPayment);
  if (result.refunded) {
    throw paymentError(
      "This payment arrived after another payment confirmed the booking. It is being refunded or reconciled.",
      statusCode.CONFLICT
    );
  }

  return {
    statusCode: statusCode.OK,
    body: {
      success: true,
      data: {
        bookingId: result.booking._id,
        status: result.booking.status,
        paymentStatus: result.booking.paymentStatus,
        totalPrice: result.booking.totalPrice,
        paymentReference: result.booking.paymentReference,
      },
    },
  };
};

export const getPaymentStatus = async (userId, bookingId) => {
  validateBookingId(bookingId);

  const booking = await Bookings.findOne({ _id: bookingId, user: userId }).lean();
  if (!booking) throw paymentError("Booking not found.", statusCode.NOT_FOUND);

  const attempts = await Payment.find({ booking: booking._id, user: userId })
    .sort({ createdAt: -1 })
    .select("provider razorpayOrderId razorpayPaymentId stripeCheckoutSessionId stripePaymentIntentId amount currency status failureReason createdAt refundedAmount reconciliationRequired")
    .lean();

  return {
    statusCode: statusCode.OK,
    body: {
      success: true,
      data: {
        bookingId: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        travelers: booking.travelers,
        totalPrice: booking.totalPrice,
        pricing: booking.pricing,
        paymentReference: booking.paymentReference,
        attempts,
      },
    },
  };
};