import Razorpay from "razorpay";

const configError = (message) => {
  const error = new Error(message);
  error.statusCode = 503;
  return error;
};

export const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw configError("Razorpay is not configured on this server.");
  }

  return {
    client: new Razorpay({ key_id: keyId, key_secret: keySecret }),
    keyId,
    keySecret,
  };
};

export const getWebhookSecret = () => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    throw configError("Razorpay webhooks are not configured on this server.");
  }

  return secret;
};