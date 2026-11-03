import Payment from "../../models/payments/paymentModel.js";
import { recordWebhookEvent } from "./webhookEventService.js";

export const handleRefundFailed = async (payment, eventId, eventType) => {
  if (payment.status === "refunded") return;

  await Payment.updateOne(
    { _id: payment._id },
    {
      $set: {
        refundInProgress: false,
        reconciliationRequired: true,
        failureReason: "Razorpay could not process a refund.",
      },
    }
  );
  await recordWebhookEvent(payment._id, eventId, eventType);
};