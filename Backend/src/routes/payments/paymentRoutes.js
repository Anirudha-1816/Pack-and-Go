// Routes for creating a Stripe checkout and checking the signed-in user's status.

import express from "express";
import {
  createStripeCheckoutSession,
  getPaymentStatus,
} from "../../controllers/payments/paymentController.js";
import checkForAuth from "../../middlewares/Authentication/checkForAuth.js";
import { paymentRateLimiter } from "../../middlewares/Limiters/rateLimitersMiddleware.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-checkout-session", checkForAuth, paymentRateLimiter, createStripeCheckoutSession);
paymentRouter.get("/status/:bookingId", checkForAuth, getPaymentStatus);

export default paymentRouter;