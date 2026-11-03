// Read Stripe's private settings and create the server-side Stripe client.

import Stripe from "stripe";
import paymentError from "../utils/paymentError.js";
import statusCode from "../utils/statusCodes.js";

// Create the Stripe client only when a payment request needs it.
export const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !/^sk_(test|live)_/.test(secretKey)) {
    throw paymentError("A valid Stripe secret key is not configured on this server.", statusCode.SERVICE_UNAVAILABLE);
  }

  return new Stripe(secretKey);
};

// Return the webhook signing secret used to check Stripe events.
export const getStripeWebhookSecret = () => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw paymentError("Stripe webhooks are not configured on this server.", statusCode.SERVICE_UNAVAILABLE);
  }

  return webhookSecret;
};

// Return the customer website URL used for Stripe's return links.
export const getClientUrl = () => {
  const clientUrl = process.env.CLIENT_URL;
  if (!clientUrl) {
    throw paymentError("The customer app URL is not configured on this server.", statusCode.SERVICE_UNAVAILABLE);
  }

  return clientUrl.replace(/\/$/, "");
};