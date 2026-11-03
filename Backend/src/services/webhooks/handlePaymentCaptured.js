import Bookings from "../../models/Bookings/bookingModel.js";
import Payment from "../../models/payments/paymentModel.js";
import { settleCapturedPayment } from "../paymentService.js";
import { recordWebhookEvent } from "./webhookEventService.js";

export const handlePaymentCaptured = async (payment, paymentEntity, eventId, eventType) => {
  await Payment.updateOne(
    { _id: payment._id, status: { $ne: "refunded" } },
    {
      $set: {
        status: "captured",
        razorpayPaymentId: paymentEntity.id,
        failureReason: "",
      },
      $unset: { activeAttemptKey: 1 },
    }
  );

  await recordWebhookEvent(payment._id, eventId, eventType);

  const booking = await Bookings.findById(payment.booking);
  if (booking) {
    await settleCapturedPayment(null, payment, booking, paymentEntity);
  }
};