// Forward payment API requests to the payment service and send its responses.

import {
  createStripeCheckoutSession as createStripeCheckoutSessionService,
  getPaymentStatus as getPaymentStatusService,
  handleStripeWebhook as handleStripeWebhookService,
} from "../../services/paymentService.js";
import statusCode from "../../utils/statusCodes.js";

// Create or resume a Stripe session for the signed-in traveler.
export const createStripeCheckoutSession = async (req, res, next) => {
  try {
    const result = await createStripeCheckoutSessionService(req.user?.userId, req.body);
    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
};

// Return the signed-in traveler's booking and payment status.
export const getPaymentStatus = async (req, res, next) => {
  try {
    const result = await getPaymentStatusService(req.user?.userId, req.params.bookingId);
    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
};

// Pass Stripe's raw request body and signature to the webhook handler.
export const handleStripeWebhook = async (req, res, next) => {
  try {
    const acknowledgement = await handleStripeWebhookService(
      req.body,
      req.get("stripe-signature")
    );
    return res.status(statusCode.OK).json(acknowledgement);
  } catch (error) {
    return next(error);
  }
};
