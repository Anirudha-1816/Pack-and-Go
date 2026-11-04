// Flow: trip price in rupees -> validated amount in paise -> saved booking.
// These shared rules keep every payment request using the same money format.

import mongoose from "mongoose";
import paymentError from "./paymentError.js";
import statusCode from "./statusCodes.js";

export const BOOKING_STATUS = Object.freeze({
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
});

// Payment states: pending is waiting for Stripe; paid is verified by webhook;
// failed can be retried; refunded means money was returned and needs a new booking.
export const PAYMENT_STATUS = Object.freeze({
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
});

// A single booking can contain no more than ten travelers.
export const MAX_TRAVELERS = 10;

// Convert the trip's database price to paise once and multiply by travelers.
// Stripe receives paise, so the booking stores this same integer amount.
export const getPaymentPrice = (pricePerHead, travelers) => {
  const price = Number(pricePerHead);
  if (
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isInteger(travelers) ||
    travelers < 1 ||
    travelers > MAX_TRAVELERS
  ) {
    throw paymentError(
      `Price must be positive and travelers must be a whole number from 1 to ${MAX_TRAVELERS}.`
    );
  }

  const amount = Math.round(price * 100) * travelers;
  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw paymentError("The calculated payment amount is invalid.");
  }

  return { amount, currency: "INR" };
};

// Return true when the trip date is today or later.
export const isTripDateAvailable = (tripDate, now = new Date()) => {
  const start = new Date(tripDate);
  const today = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  today.setUTCHours(0, 0, 0, 0);
  return !Number.isNaN(start.getTime()) && start >= today;
};

// Check the signed-in user and the trip and traveler values sent by the browser.
export const validateCreatePayment = (userId, body = {}) => {
  const { tripId, travelers } = body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw paymentError("Please log in to book a trip.", statusCode.UNAUTHORIZED);
  }
  if (typeof tripId !== "string" || !mongoose.Types.ObjectId.isValid(tripId)) {
    throw paymentError("A valid trip ID is required.");
  }
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > MAX_TRAVELERS) {
    throw paymentError(`Travelers must be a whole number from 1 to ${MAX_TRAVELERS}.`);
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
