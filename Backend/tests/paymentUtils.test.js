import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { getRazorpay, getWebhookSecret } from "../src/configs/razorpay.js";
import {
  createPaymentOrder,
  getPaymentStatus,
} from "../src/controllers/payments/paymentControllers.js";
import {
  getPaymentPrice,
  getWebhookEventId,
  isTripDateAvailable,
  makeActivePaymentKey,
  makeReceipt,
  matchesRazorpayPayment,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "../src/utils/paymentUtils.js";

const callController = async (controller, req) => {
  let result;
  const res = {
    status(status) {
      this.statusCode = status;
      return this;
    },
    json(body) {
      result = { statusCode: this.statusCode, body };
      return result;
    },
  };

  await controller(req, res, (error) => {
    result = { error };
  });

  return result;
};

test("calculates one fixed per-person price for every traveler", () => {
  assert.deepEqual(getPaymentPrice(6499, 3), {
    pricePerPerson: 6499,
    subtotal: 19497,
    amount: 1949700,
    currency: "INR",
  });
});

test("rejects invalid traveler counts and unsafe prices", () => {
  assert.throws(() => getPaymentPrice(6499, 0));
  assert.throws(() => getPaymentPrice(6499, 1.5));
  assert.throws(() => getPaymentPrice(Number.MAX_SAFE_INTEGER, 2));
});

test("creates stable keys and valid Razorpay receipts", () => {
  assert.equal(makeActivePaymentKey("user1", "trip1", 2), "user1_trip1_2");
  assert.equal(makeReceipt("507f1f77bcf86cd799439011"), "507f1f77bcf86cd799439011");
});

test("allows today and future trip dates, but rejects past dates", () => {
  const now = new Date("2026-11-02T15:00:00.000Z");
  assert.equal(isTripDateAvailable("2026-11-02", now), true);
  assert.equal(isTripDateAvailable("2026-11-03", now), true);
  assert.equal(isTripDateAvailable("2026-11-01", now), false);
});

test("verifies checkout signatures and rejects malformed signatures", () => {
  const secret = "test-secret";
  const signature = crypto
    .createHmac("sha256", secret)
    .update("order_123|payment_456")
    .digest("hex");

  assert.equal(verifyCheckoutSignature("order_123", "payment_456", signature, secret), true);
  assert.equal(verifyCheckoutSignature("order_123", "payment_456", "bad", secret), false);
});

test("verifies webhook signatures against the original body", () => {
  const secret = "webhook-secret";
  const body = Buffer.from('{"event":"payment.captured"}');
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

  assert.equal(verifyWebhookSignature(body, signature, secret), true);
  assert.equal(verifyWebhookSignature(body, signature, "wrong-secret"), false);
  assert.equal(getWebhookEventId(body), crypto.createHash("sha256").update(body).digest("hex"));
});

test("matches a provider payment to the expected order, amount, and currency", () => {
  const expected = { orderId: "order_test", amount: 1299800, currency: "INR" };
  const payment = { order_id: "order_test", amount: 1299800, currency: "INR" };

  assert.equal(matchesRazorpayPayment(payment, expected), true);
  assert.equal(matchesRazorpayPayment({ ...payment, amount: 1 }, expected), false);
  assert.equal(matchesRazorpayPayment({ ...payment, currency: "USD" }, expected), false);
  assert.equal(matchesRazorpayPayment({ ...payment, order_id: "wrong" }, expected), false);
});

test("Razorpay credentials are checked only when a payment operation needs them", () => {
  const names = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"];
  const saved = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  names.forEach((name) => delete process.env[name]);

  try {
    assert.throws(() => getRazorpay(), (error) => error.statusCode === 503);
    assert.throws(() => getWebhookSecret(), (error) => error.statusCode === 503);
  } finally {
    names.forEach((name) => {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    });
  }
});

test("rejects malformed trip IDs before starting payment work", async () => {
  const result = await callController(createPaymentOrder, {
    user: { userId: "507f1f77bcf86cd799439011" },
    body: { tripId: "not-an-object-id", travelers: 1 },
  });

  assert.equal(result.error.statusCode, 400);
  assert.match(result.error.message, /valid trip ID/i);
});

test("rejects invalid traveler counts before starting payment work", async () => {
  const result = await callController(createPaymentOrder, {
    user: { userId: "507f1f77bcf86cd799439011" },
    body: { tripId: "507f1f77bcf86cd799439012", travelers: 1.5 },
  });

  assert.equal(result.error.statusCode, 400);
  assert.match(result.error.message, /positive whole number/i);
});

test("rejects invalid booking IDs without looking up another user's status", async () => {
  const result = await callController(getPaymentStatus, {
    user: { userId: "507f1f77bcf86cd799439011" },
    params: { bookingId: "invalid" },
  });

  assert.equal(result.error.statusCode, 400);
  assert.match(result.error.message, /valid booking ID/i);
});