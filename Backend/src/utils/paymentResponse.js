export const checkoutData = (booking, payment, keyId) => ({
  bookingId: booking._id,
  orderId: payment.razorpayOrderId,
  receipt: payment.receipt,
  amount: payment.amount,
  currency: payment.currency,
  keyId,
  travelers: booking.travelers,
  pricing: booking.pricing,
  totalPrice: booking.totalPrice,
});

export const webhookAcknowledgement = () => ({ success: true, received: true });