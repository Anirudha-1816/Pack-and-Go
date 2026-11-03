import Payment from "../models/payments/paymentModel.js";
import { getWebhookSecret } from "../configs/razorpay.js";
import paymentError from "../utils/paymentError.js";
import { webhookAcknowledgement } from "../utils/paymentResponse.js";
import {
  getWebhookEventId,
  matchesRazorpayPayment,
  verifyWebhookSignature,
} from "../utils/paymentUtils.js";
import { parseWebhookBody } from "../validators/paymentValidator.js";
import { recordWebhookEvent } from "./webhooks/webhookEventService.js";
import { handlePaymentAuthorized } from "./webhooks/handlePaymentAuthorized.js";
import { handlePaymentCaptured } from "./webhooks/handlePaymentCaptured.js";
import { handlePaymentFailed } from "./webhooks/handlePaymentFailed.js";
import { handleRefundFailed } from "./webhooks/handleRefundFailed.js";
import { handleRefundProcessed } from "./webhooks/handleRefundProcessed.js";

const handlePaymentEvent = async (event, eventId) => {
  const paymentEntity = event.payload?.payment?.entity;
  if (!paymentEntity?.order_id) return;

  const payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id });
  if (!payment) return;

  if (!matchesRazorpayPayment(paymentEntity, {
    orderId: payment.razorpayOrderId,
    amount: payment.amount,
    currency: payment.currency,
  })) {
    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: {
          reconciliationRequired: true,
          failureReason: "Webhook amount or currency did not match the order.",
        },
      }
    );
    await recordWebhookEvent(payment._id, eventId, event.event);
    return;
  }

  const handlers = {
    "payment.captured": handlePaymentCaptured,
    "payment.failed": handlePaymentFailed,
    "payment.authorized": handlePaymentAuthorized,
  };

  await handlers[event.event](payment, paymentEntity, eventId, event.event);
};

const handleRefundEvent = async (event, eventId) => {
  const refund = event.payload?.refund?.entity;
  if (!refund?.payment_id) return;

  const payment = await Payment.findOne({ razorpayPaymentId: refund.payment_id });
  if (!payment) return;

  if (event.event === "refund.failed") {
    await handleRefundFailed(payment, eventId, event.event);
    return;
  }

  await handleRefundProcessed(payment, refund, eventId, event.event);
};

export const handleRazorpayWebhook = async (rawBody, signature, headerEventId) => {
  const webhookSecret = getWebhookSecret();
  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    throw paymentError("Invalid webhook signature.");
  }

  const event = parseWebhookBody(rawBody);
  const eventId = getWebhookEventId(rawBody, headerEventId);

  if (["payment.captured", "payment.failed", "payment.authorized"].includes(event.event)) {
    await handlePaymentEvent(event, eventId);
  } else if (["refund.processed", "refund.failed"].includes(event.event)) {
    await handleRefundEvent(event, eventId);
  }

  return webhookAcknowledgement();
};