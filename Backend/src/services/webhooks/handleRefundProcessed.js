import Bookings from "../../models/Bookings/bookingModel.js";
import Payment from "../../models/payments/paymentModel.js";
import { recordWebhookEvent } from "./webhookEventService.js";

export const handleRefundProcessed = async (payment, refund, eventId, eventType) => {
  if (!Number.isInteger(refund.amount) || refund.amount < 1) return;

  if (refund.currency && refund.currency !== payment.currency) {
    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: {
          reconciliationRequired: true,
          failureReason: "Refund currency did not match the payment currency.",
        },
      }
    );
    await recordWebhookEvent(payment._id, eventId, eventType);
    return;
  }

  if (payment.status === "refunded" && payment.refundId === refund.id) {
    await recordWebhookEvent(payment._id, eventId, eventType);
    return;
  }

  const updatedPayment = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      "webhookEvents.eventId": { $ne: eventId },
      $expr: { $lte: [{ $add: ["$refundedAmount", refund.amount] }, "$amount"] },
    },
    {
      $inc: { refundedAmount: refund.amount },
      $push: { webhookEvents: { eventId, eventType } },
      $set: { refundInProgress: false, refundId: refund.id },
    },
    { new: true }
  );

  if (!updatedPayment) {
    const alreadyHandled = await Payment.exists({
      _id: payment._id,
      "webhookEvents.eventId": eventId,
    });
    if (alreadyHandled) return;

    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: {
          reconciliationRequired: true,
          failureReason: "Refund amount exceeded the original payment amount.",
        },
      }
    );
    return;
  }

  if (updatedPayment.refundedAmount >= updatedPayment.amount) {
    await Payment.updateOne(
      { _id: updatedPayment._id },
      {
        $set: {
          status: "refunded",
          refundInProgress: false,
          reconciliationRequired: false,
          failureReason: "",
        },
      }
    );
    await Bookings.updateOne(
      { _id: updatedPayment.booking, paymentReference: updatedPayment.razorpayPaymentId },
      {
        $set: { paymentStatus: "refunded", status: "cancelled" },
        $unset: { activePaymentKey: 1 },
      }
    );
  }
};