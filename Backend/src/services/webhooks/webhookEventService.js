import Payment from "../../models/payments/paymentModel.js";

export const recordWebhookEvent = async (paymentId, eventId, eventType) => {
  await Payment.updateOne(
    { _id: paymentId, "webhookEvents.eventId": { $ne: eventId } },
    { $push: { webhookEvents: { eventId, eventType } } }
  );
};