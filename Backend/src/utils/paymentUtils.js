// Shared payment constants and small checks used by the payment service.

import mongoose from "mongoose";
import paymentError from "./paymentError.js";
import statusCode from "./statusCodes.js";

// Keep status spelling in one place so the service and model agree.
export const BOOKING_STATUS = Object.freeze({
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
});

// Calculate the saved rupee price and Stripe amount in paise.
export const getPaymentPrice = (pricePerPerson, travelers) => {
  const price = Number(pricePerPerson);
  if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(travelers) || travelers < 1) {
    throw paymentError("Price and traveler count must be valid positive numbers.");
  }

  const priceInPaise = Math.round(price * 100);
  const amount = priceInPaise * travelers;
  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw paymentError("The calculated payment amount is invalid.");
  }

  return {
    pricePerPerson: priceInPaise / 100,
    subtotal: amount / 100,
    amount,
    currency: "INR",
  };
};

// Return true when the trip date is today or later.
export const isTripDateAvailable = (tripDate, now = new Date()) => {
  const start = new Date(tripDate);
  const today = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  today.setUTCHours(0, 0, 0, 0);
  return !Number.isNaN(start.getTime()) && start >= today;
};

// Check the signed-in user and the two values the browser may choose.
export const validateCreatePayment = (userId, body = {}) => {
  const { tripId, travelers } = body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw paymentError("Please log in to book a trip.", statusCode.UNAUTHORIZED);
  }
  if (typeof tripId !== "string" || !mongoose.Types.ObjectId.isValid(tripId)) {
    throw paymentError("A valid trip ID is required.");
  }
  if (!Number.isInteger(travelers) || travelers < 1) {
    throw paymentError("Travelers must be a positive whole number.");
  }

  return { userId, tripId, travelers };
};

// Reject malformed booking IDs before querying MongoDB.
export const validateBookingId = (bookingId) => {
  if (typeof bookingId !== "string" || !mongoose.Types.ObjectId.isValid(bookingId)) {
    throw paymentError("A valid booking ID is required.");
  }
  return bookingId;
};
