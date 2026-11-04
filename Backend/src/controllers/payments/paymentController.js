// Flow: HTTP request -> payment service -> HTTP response.
// The service returns plain data; this file chooses response status codes.

import {
  createStripeCheckoutSession as createStripeCheckoutSessionService,
  getPaymentStatus as getPaymentStatusService,
  handleStripeWebhook as handleStripeWebhookService,
} from "../../services/paymentService.js";
import statusCode from "../../utils/statusCodes.js";

// Create or resume checkout and choose the matching HTTP response status.
export const createStripeCheckoutSession = async (req, res, next) => {
  try {
    const result = await createStripeCheckoutSessionService(
      req.user?.userId,
      req.body
    );
    const { resumed, pendingConfirmation, ...data } = result;
    let responseStatus = statusCode.CREATED;

    if (resumed) {
      responseStatus = statusCode.OK;
    }
    if (result.paymentStatus === "paid") {
      responseStatus = statusCode.OK;
    }
    if (pendingConfirmation) {
      responseStatus = statusCode.ACCEPTED;
    }

    return res.status(responseStatus).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

// Return the signed-in traveler's booking and payment status.
export const getPaymentStatus = async (req, res, next) => {
  try {
    const data = await getPaymentStatusService(
      req.user?.userId,
      req.params.bookingId
    );
    return res.status(statusCode.OK).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

// Send Stripe's raw request body and signature to the service for verification.
export const handleStripeWebhook = async (req, res, next) => {
  try {
    const acknowledgement = await handleStripeWebhookService(
      req.body,
      req.get("stripe-signature")
    );
    return res.status(statusCode.OK).json({
      success: true,
      ...acknowledgement,
    });
  } catch (error) {
    return next(error);
  }
};
