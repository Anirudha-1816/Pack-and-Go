
import mongoose from "mongoose";

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
    },


    // Final booking amount
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"],
    },

    // Booking status
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },

    // (actual payment integration can be added later)
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    // Payment reference from a payment provider, when available
    paymentReference: {
      type: String,
      trim: true,
      default: null,
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
