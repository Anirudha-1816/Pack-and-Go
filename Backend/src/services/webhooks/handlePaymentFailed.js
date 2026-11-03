import Bookings from "../../models/Bookings/bookingModel.js";
import Payment from "../../models/payments/paymentModel.js";
import { markBookingPaymentFailed } from "../bookingService.js";
import { recordWebhookEvent } from "./webhookEventService.js";

export const handlePaymentFailed = async (payment, paymentEntity, eventId, eventType) => {
  await Payment.updateOne(
    { _id: payment._id, status: { $nin: ["captured", "refunded"] } },
    {
      $set: {
        status: "failed",
        razorpayPaymentId: paymentEntity.id,
        failureReason: "Payment was not completed.",
      },
      $unset: { activeAttemptKey: 1 },
    }
  );

  await recordWebhookEvent(payment._id, eventId, eventType);

  const currentPayment = await Payment.findById(payment._id);
  if (currentPayment?.status === "failed") {
    const booking = await Bookings.findById(payment.booking);
    await markBookingPaymentFailed(currentPayment, booking);
  }
};