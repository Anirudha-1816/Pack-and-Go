import express from "express";
import {
  createPaymentOrder,
  createStripeCheckoutSession,
  getPaymentStatus,
  verifyPayment,
} from "../../controllers/payments/paymentController.js";
import checkForAuth from "../../middlewares/Authentication/checkForAuth.js";
import { paymentRateLimiter } from "../../middlewares/Limiters/rateLimitersMiddleware.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-order", checkForAuth, paymentRateLimiter, createPaymentOrder);
paymentRouter.post("/create-checkout-session", checkForAuth, paymentRateLimiter, createStripeCheckoutSession);
paymentRouter.post("/verify", checkForAuth, paymentRateLimiter, verifyPayment);
paymentRouter.get("/status/:bookingId", checkForAuth, getPaymentStatus);

export default paymentRouter;