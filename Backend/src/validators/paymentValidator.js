import mongoose from "mongoose";
import statusCode from "../utils/statusCodes.js";
import paymentError from "../utils/paymentError.js";

const isValidObjectId = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

export const validateCreateOrder = (userId, body = {}) => {
  const { tripId, travelers } = body;

  if (!userId) {
    throw paymentError("Please log in to book a trip.", statusCode.UNAUTHORIZED);
  }
  if (!isValidObjectId(tripId)) {
    throw paymentError("A valid trip ID is required.");
  }
  if (!Number.isInteger(travelers) || travelers < 1) {
    throw paymentError("Travelers must be a positive whole number.");
  }
  if (!isValidObjectId(userId)) {
    throw paymentError("Please log in to book a trip.", statusCode.UNAUTHORIZED);
  }

  return { userId, tripId, travelers };
};

export const validatePaymentVerification = (body = {}) => {
  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = body;

  if (
    typeof orderId !== "string" ||
    typeof paymentId !== "string" ||
    typeof signature !== "string"
  ) {
    throw paymentError("Payment verification details are incomplete.");
  }

  return { orderId, paymentId, signature };
};

export const validateBookingId = (bookingId) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw paymentError("A valid booking ID is required.");
  }

  return bookingId;
};

export const parseWebhookBody = (rawBody) => {
  try {
    return JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw paymentError("Invalid webhook body.");
  }
};