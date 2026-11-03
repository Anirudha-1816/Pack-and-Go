// A booking also stores the single Stripe session currently used to pay for it.
import mongoose from "mongoose";
import { BOOKING_STATUS, PAYMENT_STATUS } from "../../utils/paymentUtils.js";

const bookingSchema = new mongoose.Schema(
  {
    // User who made the booking
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },

    // Trip being booked
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: [true, "Trip is required"],
    },

    // Number of travelers
    travelers: {
      type: Number,
      required: [true, "Number of travelers is required"],
      min: [1, "At least one traveler is required"],
      validate: Number.isInteger,
    },

    pricing: {
      pricePerPerson: { type: Number, required: true, min: 0 },
      subtotal: { type: Number, required: true, min: 0 },
      currency: { type: String, required: true, enum: ["INR"], default: "INR" },
    },

    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"],
    },

    // Booking status
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
    },

    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },

    paymentReference: {
      type: String,
      trim: true,
      default: null,
    },

    stripeSessionId: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// fetch a user's bookings, newest first
bookingSchema.index({ user: 1, createdAt: -1 });

const Bookings = mongoose.model("Booking", bookingSchema);

export default Bookings;
