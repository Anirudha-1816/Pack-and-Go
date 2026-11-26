
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },

    sessionId: {
      type: String,
      required: [true, "Session ID is required"],
      unique: true,
      trim: true,
    },

    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "unknown",
    },

    operatingSystem: {
      type: String,
      trim: true,
      default: "Unknown",
    },

    browser: {
      type: String,
      trim: true,
      default: "Unknown",
    },

    ipAddress: {
      type: String,
      required: [true, "IP address is required"],
      trim: true,
    },

    location: {
      city: { type: String, default: "Unknown" },
      region: { type: String, default: "Unknown" },
      country: { type: String, default: "Unknown" },
    },

    lastActive: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: [true, "Session expiration is required"],
    },

    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;
