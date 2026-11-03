import Stripe from "stripe";
import paymentError from "../utils/paymentError.js";
import statusCode from "../utils/statusCodes.js";

export const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sk_test_")) {
    throw paymentError("Stripe Test Mode is not configured on this server.", statusCode.SERVICE_UNAVAILABLE);
  }

  return new Stripe(secretKey);
};

export const getStripeWebhookSecret = () => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw paymentError("Stripe webhooks are not configured on this server.", statusCode.SERVICE_UNAVAILABLE);
  }

  return webhookSecret;
};

export const getClientUrl = () => {
  const clientUrl = process.env.CLIENT_URL;
  if (!clientUrl) {
    throw paymentError("The customer app URL is not configured on this server.", statusCode.SERVICE_UNAVAILABLE);
  }

  return clientUrl.replace(/\/$/, "");
};