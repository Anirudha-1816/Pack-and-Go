import mongoose from "mongoose";

const policySchema = new mongoose.Schema(
  {
    userSignup: {
      type: Boolean,
      default: true,
    },
    operatorSignup: {
      type: Boolean,
      default: true,
    },
    operatorApproval: {
      type: Boolean,
      default: true,
    },
    cancellation: {
      type: String,
      enum: ["flexible", "moderate", "strict"],
      default: "moderate",
    },
    reviews: {
      type: String,
      enum: ["auto", "flagged", "all"],
      default: "flagged",
    },
    suspension: {
      type: String,
      enum: ["manual", "reports", "strict"],
      default: "reports",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one policies document exists
policySchema.index({}, { unique: true });

const Policy = mongoose.model("Policy", policySchema);

export default Policy;