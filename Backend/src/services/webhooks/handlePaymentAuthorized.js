import Payment from "../../models/payments/paymentModel.js";
import { recordWebhookEvent } from "./webhookEventService.js";

export const handlePaymentAuthorized = async (payment, paymentEntity, eventId, eventType) => {
  await Payment.updateOne(
    { _id: payment._id, status: { $nin: ["captured", "failed", "refunded"] } },
    {
      $set: {
        status: "authorized",
        razorpayPaymentId: paymentEntity.id,
      },
    }
  );

  await recordWebhookEvent(payment._id, eventId, eventType);
};