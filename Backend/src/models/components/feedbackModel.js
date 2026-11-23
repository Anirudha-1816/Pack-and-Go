import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    // User who submitted the feedback
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },

    // Optional: associated trip/event
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
      index: true,
    },

    // Rating 1-5
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },

    // Review title (optional)
    title: {
      type: String,
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    // Review description
    description: {
      type: String,
      required: [true, "Review description is required"],
      trim: true,
      maxlength: [5000, "Review cannot exceed 5000 characters"],
      minlength: [10, "Review must be at least 10 characters"],
    },

    // Category of the feedback
    category: {
      type: String,
      enum: [
        "Curated Trips",
        "Adventure & Outdoors",
        "Festivals & Celebrations",
        "Networking & Learning Meetups",
        "Social Gatherings & Parties",
        "Customer Support",
      ],
      default: "Curated Trips",
    },

    // Is this a verified booking review?
    verified: {
      type: Boolean,
      default: false,
    },

    // Helpful count
    helpful: {
      type: Number,
      default: 0,
    },

    // Status for admin moderation
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    // Admin rejection reason
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

    // Admin can hide without deleting
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for common queries
feedbackSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
feedbackSchema.index({ user: 1, createdAt: -1 });
feedbackSchema.index({ trip: 1, createdAt: -1 });
feedbackSchema.index({ category: 1, status: 1 });

// Prevent duplicate reviews from same user for same trip
feedbackSchema.index(
  { user: 1, trip: 1 },
  {
    unique: true,
    partialFilterExpression: { trip: { $ne: null } },
  }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;