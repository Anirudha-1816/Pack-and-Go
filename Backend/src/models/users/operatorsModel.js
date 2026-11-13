import mongoose from "mongoose";

const operatorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    experience: {
      type: Number,
      default: 0,
    },

    location: {
      type: String,
      required: true,
    },

    availability: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    approvedAt: {
      type: Date,
      default: null,
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  },
  { timestamps: true }
);

const Operator = mongoose.model("Operator", operatorSchema);

export default Operator;