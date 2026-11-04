// Flow: payment service saves one booking -> Stripe session is stored ->
// a signed webhook updates the payment result.
// The browser never changes the saved amount or confirms payment.
import mongoose from "mongoose";
import {
  BOOKING_STATUS,
  MAX_TRAVELERS,
  PAYMENT_STATUS,
} from "../../utils/paymentUtils.js";

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
      max: [MAX_TRAVELERS, `No more than ${MAX_TRAVELERS} travelers are allowed`],
      validate: Number.isInteger,
    },

    // Amount is a whole number of paise, not rupees.
    amount: {
      type: Number,
      required: [true, "Amount in paise is required"],
      min: [1, "Amount must be greater than zero"],
      validate: Number.isSafeInteger,
    },

    currency: {
      type: String,
      required: true,
      enum: ["INR"],
      default: "INR",
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

    // Each new checkout try gets a higher number after the last session expires.
    stripeSessionGeneration: {
      type: Number,
      min: 0,
      default: 0,
    },

    // True when a signed payment event reports an amount different from this booking.
    paymentReviewRequired: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// fetch a user's bookings, newest first
bookingSchema.index({ user: 1, createdAt: -1 });

// Only one unpaid or failed booking for a user, trip, and traveler count may
// be active. Cancelled and refunded bookings are outside this index.
bookingSchema.index(
  { user: 1, trip: 1, travelers: 1 },
  {
    unique: true,
    name: "uniq_active_user_trip_travelers",
    partialFilterExpression: {
      status: BOOKING_STATUS.PENDING,
      paymentStatus: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.FAILED] },
    },
  }
);

const Bookings = mongoose.model("Booking", bookingSchema);

export default Bookings;
