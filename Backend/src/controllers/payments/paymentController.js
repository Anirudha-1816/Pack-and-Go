import {
  createPaymentOrder as createPaymentOrderService,
  getPaymentStatus as getPaymentStatusService,
  verifyPayment as verifyPaymentService,
} from "../../services/paymentService.js";
import { handleRazorpayWebhook as handleRazorpayWebhookService } from "../../services/webhookService.js";
import { createStripeCheckoutSession as createStripeCheckoutSessionService } from "../../services/stripePaymentService.js";
import { handleStripeWebhook as handleStripeWebhookService } from "../../services/stripeWebhookService.js";
import statusCode from "../../utils/statusCodes.js";

const sendServiceResult = (res, result) =>
  res.status(result.statusCode).json(result.body);

export const createPaymentOrder = async (req, res, next) => {
  try {
    const result = await createPaymentOrderService(req.user?.userId, req.body);
    return sendServiceResult(res, result);
  } catch (error) {
    return next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const result = await verifyPaymentService(req.user?.userId, req.body);
    return sendServiceResult(res, result);
  } catch (error) {
    return next(error);
  }
};

export const getPaymentStatus = async (req, res, next) => {
  try {
    const result = await getPaymentStatusService(req.user?.userId, req.params.bookingId);
    return sendServiceResult(res, result);
  } catch (error) {
    return next(error);
  }
};

export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const acknowledgement = await handleRazorpayWebhookService(
      req.body,
      req.get("x-razorpay-signature"),
      req.get("x-razorpay-event-id")
    );
    return res.status(statusCode.OK).json(acknowledgement);
  } catch (error) {
    return next(error);
  }
};

export const createStripeCheckoutSession = async (req, res, next) => {
  try {
    const result = await createStripeCheckoutSessionService(req.user?.userId, req.body);
    return sendServiceResult(res, result);
  } catch (error) {
    return next(error);
  }
};

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