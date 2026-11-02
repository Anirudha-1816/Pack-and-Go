import express from "express";
import {
  createPaymentOrder,
  getPaymentStatus,
  verifyPayment,
} from "../../controllers/payments/paymentControllers.js";
import checkForAuth from "../../middlewares/Authentication/checkForAuth.js";
import { paymentRateLimiter } from "../../middlewares/Limiters/rateLimitersMiddleware.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-order", checkForAuth, paymentRateLimiter, createPaymentOrder);
paymentRouter.post("/verify", checkForAuth, paymentRateLimiter, verifyPayment);
paymentRouter.get("/status/:bookingId", checkForAuth, getPaymentStatus);

export default paymentRouter;