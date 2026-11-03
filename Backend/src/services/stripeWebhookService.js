import Bookings from "../models/Bookings/bookingModel.js";
import Payment from "../models/payments/paymentModel.js";
import { getStripe, getStripeWebhookSecret } from "../configs/stripe.js";
import paymentError from "../utils/paymentError.js";
import statusCode from "../utils/statusCodes.js";
import { confirmBookingAfterCapture } from "./bookingService.js";

const recordEvent = async (paymentId, event) => {
  await Payment.updateOne(
    { _id: paymentId, "webhookEvents.eventId": { $ne: event.id } },
    { $push: { webhookEvents: { eventId: event.id, eventType: event.type } } }
  );
};

const markBookingFailedWhenNoRetryIsActive = async (payment) => {
  const activeAttempt = await Payment.findOne({
    booking: payment.booking,
    activeAttemptKey: payment.booking.toString(),
  });
  if (activeAttempt) return;

  await Bookings.updateOne(
    { _id: payment.booking, paymentStatus: { $nin: ["paid", "refunded"] } },
    { $set: { paymentStatus: "failed" } }
  );
};

const completeFullRefund = async (payment) => {
  const latestPayment = await Payment.findById(payment._id);
  if (!latestPayment || latestPayment.refundedAmount < latestPayment.amount) return;

  await Payment.updateOne(
    { _id: latestPayment._id, status: { $ne: "refunded" } },
    { $set: { status: "refunded", refundInProgress: false, reconciliationRequired: false } }
  );
  await Bookings.updateOne(
    { _id: latestPayment.booking, paymentReference: latestPayment.stripePaymentIntentId },
    { $set: { paymentStatus: "refunded", status: "cancelled" } }
  );
};

const findSessionPayment = (session) => {
  const { bookingId, paymentId, userId } = session.metadata || {};
  if (!bookingId || !paymentId || !userId) return null;

  return Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    user: userId,
    provider: "stripe",
    stripeCheckoutSessionId: session.id,
  });
};

const sessionMatchesPayment = (session, payment) =>
  session.client_reference_id === payment.booking.toString() &&
  session.amount_total === payment.amount &&
  session.currency?.toUpperCase() === payment.currency;

const flagForReconciliation = async (payment, event, reason) => {
  await Payment.updateOne(
    { _id: payment._id, "webhookEvents.eventId": { $ne: event.id } },
    {
      $set: { reconciliationRequired: true, failureReason: reason },
      $push: { webhookEvents: { eventId: event.id, eventType: event.type } },
    }
  );
};

const refundDuplicatePayment = async (stripe, payment) => {
  const claimed = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      provider: "stripe",
      status: "captured",
      refundInProgress: false,
    },
    { $set: { refundInProgress: true, reconciliationRequired: true } },
    { new: true }
  );
  if (!claimed) return;

  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: payment.stripePaymentIntentId,
        amount: payment.amount,
        reason: "duplicate",
      },
      { idempotencyKey: `duplicate-${payment._id}` }
    );
    const refunded = refund.status === "succeeded";

    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: {
          refundId: refund.id,
          status: refunded ? "refunded" : "captured",
          refundedAmount: refunded ? payment.amount : 0,
          refundInProgress: !refunded,
          reconciliationRequired: !refunded,
          failureReason: refunded
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

const confirmStripePayment = async (stripe, payment, paymentIntent, event) => {
  const capturedPayment = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      provider: "stripe",
      status: { $ne: "refunded" },
      "webhookEvents.eventId": { $ne: event.id },
    },
    {
      $set: {
        status: "captured",
        stripePaymentIntentId: paymentIntent.id,
        signatureVerified: true,
        failureReason: "",
      },
      $unset: { activeAttemptKey: 1 },
      $push: { webhookEvents: { eventId: event.id, eventType: event.type } },
    },
    { new: true }
  );

  if (!capturedPayment) {
    const alreadyHandled = await Payment.exists({
      _id: payment._id,
      "webhookEvents.eventId": event.id,
    });
    const currentPayment = await Payment.findById(payment._id);
    if (!alreadyHandled || currentPayment?.status !== "captured") return;
    if (currentPayment.stripePaymentIntentId !== paymentIntent.id) return;
  }

  const booking = await Bookings.findById(payment.booking);
  if (!booking) return;

  const result = await confirmBookingAfterCapture(
    capturedPayment || await Payment.findById(payment._id),
    booking,
    paymentIntent.id
  );
  if (result.duplicatePayment) {
    await refundDuplicatePayment(stripe, capturedPayment || payment);
  }
};

const handleSessionPaid = async (stripe, payment, session, event) => {
  if (session.payment_status !== "paid") {
    await recordEvent(payment._id, event);
    return;
  }

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id;
  if (!paymentIntentId) {
    await flagForReconciliation(payment, event, "Paid Checkout Session did not include a PaymentIntent.");
    return;
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    throw paymentError("Stripe payment status could not be checked.", statusCode.BAD_GATEWAY);
  }

  if (
    paymentIntent.status !== "succeeded" ||
    paymentIntent.amount_received !== payment.amount ||
    paymentIntent.currency?.toUpperCase() !== payment.currency
  ) {
    await flagForReconciliation(payment, event, "Stripe PaymentIntent did not match the Checkout Session.");
    return;
  }

  await confirmStripePayment(stripe, payment, paymentIntent, event);
};

const handleSessionFailed = async (payment, session, event) => {
  const failedPayment = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      provider: "stripe",
      stripeCheckoutSessionId: session.id,
      activeAttemptKey: payment.booking.toString(),
      status: { $nin: ["captured", "failed", "refunded"] },
      "webhookEvents.eventId": { $ne: event.id },
    },
    {
      $set: {
        status: "failed",
        failureReason: session.status === "expired"
          ? "Checkout session expired."
          : "Payment was not completed.",
      },
      $unset: { activeAttemptKey: 1 },
      $push: { webhookEvents: { eventId: event.id, eventType: event.type } },
    },
    { new: true }
  );

  if (!failedPayment) {
    await recordEvent(payment._id, event);
  }

  const currentPayment = await Payment.findById(payment._id);
  if (currentPayment?.status === "failed" && currentPayment.stripeCheckoutSessionId === session.id) {
    await markBookingFailedWhenNoRetryIsActive(currentPayment);
  }
};

const handlePaymentIntentFailed = async (intent, event) => {
  const payment = await Payment.findOne({
    _id: intent.metadata?.paymentId,
    provider: "stripe",
  });
  if (!payment) return;
  if (payment.stripePaymentIntentId && payment.stripePaymentIntentId !== intent.id) return;

  await Payment.updateOne(
    {
      _id: payment._id,
      status: { $nin: ["captured", "failed", "refunded"] },
      activeAttemptKey: payment.booking.toString(),
      "webhookEvents.eventId": { $ne: event.id },
    },
    {
      $set: {
        status: "failed",
        stripePaymentIntentId: intent.id,
        failureReason: "Payment was not completed.",
      },
      $unset: { activeAttemptKey: 1 },
      $push: { webhookEvents: { eventId: event.id, eventType: event.type } },
    }
  );

  await recordEvent(payment._id, event);
  const currentPayment = await Payment.findById(payment._id);
  if (currentPayment?.status === "failed" && currentPayment.stripePaymentIntentId === intent.id) {
    await markBookingFailedWhenNoRetryIsActive(currentPayment);
  }
};

const handleChargeRefunded = async (payment, charge, event) => {
  if (
    charge.currency?.toUpperCase() !== payment.currency ||
    !Number.isInteger(charge.amount_refunded) ||
    charge.amount_refunded > payment.amount
  ) {
    await flagForReconciliation(payment, event, "Stripe refund amount or currency did not match the payment.");
    return;
  }

  const updatedPayment = await Payment.findOneAndUpdate(
    { _id: payment._id, provider: "stripe", "webhookEvents.eventId": { $ne: event.id } },
    {
      $max: { refundedAmount: charge.amount_refunded },
      $push: { webhookEvents: { eventId: event.id, eventType: event.type } },
      $set: { stripePaymentIntentId: charge.payment_intent },
    },
    { new: true }
  );
  await completeFullRefund(updatedPayment || payment);
};

const handleStripeEvent = async (stripe, event) => {
  if (event.type.startsWith("checkout.session.")) {
    const session = event.data.object;
    const payment = await findSessionPayment(session);
    if (!payment) return;
    if (!sessionMatchesPayment(session, payment)) {
      await flagForReconciliation(payment, event, "Checkout session amount or currency did not match the payment.");
      return;
    }

    if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      await handleSessionFailed(payment, session, event);
      return;
    }

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await handleSessionPaid(stripe, payment, session, event);
    }
    return;
  }

  if (event.type === "payment_intent.payment_failed") {
    await handlePaymentIntentFailed(event.data.object, event);
    return;
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    const payment = await Payment.findOne({
      provider: "stripe",
      stripePaymentIntentId: charge.payment_intent,
    });
    if (payment) await handleChargeRefunded(payment, charge, event);
  }
};

export const handleStripeWebhook = async (rawBody, signature) => {
  const stripe = getStripe();
  const webhookSecret = getStripeWebhookSecret();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    throw paymentError("Invalid Stripe webhook signature.", statusCode.BAD_REQUEST);
  }

  await handleStripeEvent(stripe, event);
  return { success: true, received: true };
};