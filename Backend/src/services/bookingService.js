import Bookings from "../models/Bookings/bookingModel.js";
import Payment from "../models/payments/paymentModel.js";
import paymentError from "../utils/paymentError.js";
import statusCode from "../utils/statusCodes.js";
import { getPaymentPrice, makeActivePaymentKey } from "../utils/paymentUtils.js";

export const getOrCreateBooking = async (userId, trip, travelers) => {
  const activePaymentKey = makeActivePaymentKey(userId, trip._id, travelers);
  let booking = await Bookings.findOne({ activePaymentKey });

  if (["paid", "refunded"].includes(booking?.paymentStatus)) {
    throw paymentError("This booking cannot accept another payment.", statusCode.CONFLICT);
  }
  if (booking?.status === "cancelled") {
    throw paymentError("This booking has been cancelled.", statusCode.CONFLICT);
  }

  if (booking) return booking;

  const pricing = getPaymentPrice(trip.pricePerHead, travelers);

  try {
    return await Bookings.create({
      user: userId,
      trip: trip._id,
      travelers,
      pricing: {
        pricePerPerson: pricing.pricePerPerson,
        subtotal: pricing.subtotal,
        currency: pricing.currency,
      },
      totalPrice: pricing.subtotal,
      status: "pending",
      paymentStatus: "pending",
      activePaymentKey,
    });
  } catch (error) {
    if (error.code !== 11000) throw error;

    booking = await Bookings.findOne({ activePaymentKey });
    if (!booking) throw error;
    return booking;
  }
};

export const findOwnedPayment = async (userId, orderId) => {
  const payment = await Payment.findOne({ razorpayOrderId: orderId });
  if (!payment || payment.user.toString() !== userId.toString()) return null;

  const booking = await Bookings.findOne({ _id: payment.booking, user: userId });
  return booking ? { payment, booking } : null;
};

export const markBookingPaymentFailed = async (payment, booking) => {
  if (!booking) return;

  await Payment.updateOne(
    { _id: payment._id, status: { $nin: ["captured", "refunded"] } },
    {
      $set: { status: "failed", failureReason: "Payment was not completed." },
      $unset: { activeAttemptKey: 1 },
    }
  );

  const currentPayment = await Payment.findById(payment._id);
  if (currentPayment?.status !== "failed") return;

  await Bookings.updateOne(
    {
      _id: booking._id,
      paymentStatus: { $nin: ["paid", "refunded"] },
      razorpayOrderId: payment.razorpayOrderId,
    },
    { $set: { paymentStatus: "failed" } }
  );
};

export const confirmBookingAfterCapture = async (payment, booking, paymentReference) => {
  const confirmedBooking = await Bookings.findOneAndUpdate(
    {
      _id: booking._id,
      paymentStatus: { $nin: ["paid", "refunded"] },
      status: { $ne: "cancelled" },
    },
    {
      $set: {
        status: "confirmed",
        paymentStatus: "paid",
        paymentReference,
        ...(payment.provider === "razorpay" && { razorpayOrderId: payment.razorpayOrderId }),
      },
    },
    { new: true }
  );

  if (confirmedBooking) return { booking: confirmedBooking, duplicatePayment: false };

  const currentBooking = await Bookings.findById(booking._id);
  if (currentBooking?.paymentReference === paymentReference) {
    return { booking: currentBooking, duplicatePayment: false };
  }

  return { booking: currentBooking, duplicatePayment: true };
};