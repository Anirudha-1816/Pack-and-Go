import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    adminName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Success", "Failed", "Warning"],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for common queries
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ status: 1 });
activityLogSchema.index({ admin: 1, createdAt: -1 });

// Text index for search
activityLogSchema.index({
  adminName: "text",
  action: "text",
  resource: "text",
});

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;