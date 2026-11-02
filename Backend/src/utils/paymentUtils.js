import crypto from "node:crypto";

export const getPaymentPrice = (pricePerPerson, travelers) => {
  const price = Number(pricePerPerson);

  if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(travelers) || travelers < 1) {
    throw new Error("Price and traveler count must be valid positive numbers.");
  }

  const priceInPaise = Math.round(price * 100);
  const amount = priceInPaise * travelers;

  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw new Error("The calculated payment amount is invalid.");
  }

  return {
    pricePerPerson: priceInPaise / 100,
    subtotal: amount / 100,
    amount,
    currency: "INR",
  };
};

export const makeActivePaymentKey = (userId, tripId, travelers) =>
  `${userId}_${tripId}_${travelers}`;

export const makeReceipt = (paymentId) => paymentId.toString();

export const isTripDateAvailable = (tripDate, now = new Date()) => {
  const start = new Date(tripDate);
  const today = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  today.setUTCHours(0, 0, 0, 0);
  return !Number.isNaN(start.getTime()) && start >= today;
};

export const verifyCheckoutSignature = (orderId, paymentId, signature, secret) => {
  if (typeof signature !== "string" || !orderId || !paymentId || !secret) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest();

  let actual;
  try {
    actual = Buffer.from(signature, "hex");
  } catch {
    return false;
  }

  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

export const verifyWebhookSignature = (body, signature, secret) => {
  if (!Buffer.isBuffer(body) || typeof signature !== "string" || !secret) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(body).digest();
  const actual = Buffer.from(signature, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

export const getWebhookEventId = (body, headerValue) =>
  headerValue || crypto.createHash("sha256").update(body).digest("hex");

export const matchesRazorpayPayment = (payment, order) =>
  payment?.order_id === order.orderId &&
  payment.amount === order.amount &&
  payment.currency === order.currency;