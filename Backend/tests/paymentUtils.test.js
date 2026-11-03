// Small tests for payment prices, trip dates, and Stripe webhook signatures.

import test from "node:test";
import assert from "node:assert/strict";
import { getStripe, getStripeWebhookSecret } from "../src/configs/stripe.js";
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  getPaymentPrice,
  isTripDateAvailable,
  validateBookingId,
  validateCreatePayment,
} from "../src/utils/paymentUtils.js";
import { handleStripeWebhook } from "../src/services/paymentService.js";

// Calculate the saved rupee total and smallest-unit Stripe amount.
test("calculates the saved price and amount in paise", () => {
  assert.deepEqual(getPaymentPrice(6499, 3), {
    pricePerPerson: 6499,
    subtotal: 19497,
    amount: 1949700,
    currency: "INR",
  });
});

// Reject inputs that could create a zero, fractional, or unsafe payment.
test("rejects invalid traveler counts and prices", () => {
  assert.throws(() => getPaymentPrice(6499, 0));
  assert.throws(() => getPaymentPrice(6499, 1.5));
  assert.throws(() => getPaymentPrice(Number.MAX_SAFE_INTEGER, 2));
});

// Accept trips starting today or later, but not trips in the past.
test("checks trip dates using a supplied current date", () => {
  const now = new Date("2026-11-02T15:00:00.000Z");
  assert.equal(isTripDateAvailable("2026-11-02", now), true);
  assert.equal(isTripDateAvailable("2026-11-03", now), true);
  assert.equal(isTripDateAvailable("2026-11-01", now), false);
});

// Validate the signed-in user and traveler-provided booking fields.
test("validates a payment request", () => {
  const userId = "507f1f77bcf86cd799439011";
  const tripId = "507f1f77bcf86cd799439012";
  assert.deepEqual(validateCreatePayment(userId, { tripId, travelers: 2 }), {
    userId,
    tripId,
    travelers: 2,
  });
  assert.throws(() => validateCreatePayment(userId, { tripId: "bad", travelers: 2 }));
  assert.throws(() => validateCreatePayment(userId, { tripId, travelers: 1.5 }));
});

// Reject invalid booking IDs before querying MongoDB.
test("validates booking IDs", () => {
  assert.equal(
    validateBookingId("507f1f77bcf86cd799439011"),
    "507f1f77bcf86cd799439011"
  );
  assert.throws(() => validateBookingId("invalid"));
});

// Keep the status values used by the service and booking schema easy to compare.
test("defines the booking and payment states", () => {
  assert.equal(BOOKING_STATUS.CONFIRMED, "confirmed");
  assert.equal(PAYMENT_STATUS.PENDING, "pending");
  assert.equal(PAYMENT_STATUS.PAID, "paid");
  assert.equal(PAYMENT_STATUS.FAILED, "failed");
});

// Restore Stripe environment settings after checking webhook behavior.
test("checks Stripe configuration and webhook signatures", async () => {
  const names = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"];
  const saved = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  names.forEach((name) => delete process.env[name]);

  try {
    assert.throws(() => getStripe(), (error) => error.statusCode === 503);
    assert.throws(() => getStripeWebhookSecret(), (error) => error.statusCode === 503);

    process.env.STRIPE_SECRET_KEY = "sk_test_unit_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_unit_test";
    const stripe = getStripe();
    process.env.STRIPE_SECRET_KEY = "sk_live_unit_test";
    assert.doesNotThrow(() => getStripe());

    const body = Buffer.from(JSON.stringify({
      id: "evt_unit_test",
      type: "unhandled.event",
      data: { object: {} },
    }));
    const signature = stripe.webhooks.generateTestHeaderString({
      payload: body.toString("utf8"),
      secret: process.env.STRIPE_WEBHOOK_SECRET,
    });

    assert.deepEqual(await handleStripeWebhook(body, signature), {
      success: true,
      received: true,
    });
    await assert.rejects(
      handleStripeWebhook(body, "invalid-signature"),
      (error) => error.statusCode === 400
    );
  } finally {
    names.forEach((name) => {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    });
  }
});
