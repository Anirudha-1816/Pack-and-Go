import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
       match: [
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    "Please provide a valid email address",
  ],

    },

    hashedOtp: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const OTP = mongoose.model("OTP", verificationSchema);

export default OTP;