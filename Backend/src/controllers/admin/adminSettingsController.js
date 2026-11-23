import statusCode from "../../utils/statusCodes.js";
import Policy from "../../models/components/policyModel.js";
import ActivityLog from "../../models/components/activityLogModel.js";

const badRequest = (message) => {
  const error = new Error(message);
  error.status = statusCode.BAD_REQUEST;
  return error;
};

const notFound = (message) => {
  const error = new Error(message);
  error.status = statusCode.NOT_FOUND;
  return error;
};

// Helper to log admin activity
export const logActivity = async (admin, action, resource, status = "Success") => {
  try {
    await ActivityLog.create({
      admin: admin._id,
      adminName: admin.fullName || admin.name || "Unknown Admin",
      action,
      resource,
      status,
    });
  } catch (err) {
    // Never throw from logging - just log to console
    console.error("Failed to log activity:", err.message);
  }
};

/**
 * GET /admin/policies
 * Returns the single policies document. Creates it with defaults if missing.
 */
export const getPolicies = async (req, res, next) => {
  try {
    let policy = await Policy.findOne();

    if (!policy) {
      policy = await Policy.create({});
    }

    return res.status(statusCode.OK).json({
      success: true,
      data: policy,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /admin/policies
 * Updates the policies document. Validates enum values.
 */
export const updatePolicies = async (req, res, next) => {
  try {
    const {
      userSignup,
      operatorSignup,
      operatorApproval,
      cancellation,
      reviews,
      suspension,
    } = req.body ?? {};

    // Validation
    if (typeof userSignup !== "boolean") return next(badRequest("userSignup must be a boolean"));
    if (typeof operatorSignup !== "boolean") return next(badRequest("operatorSignup must be a boolean"));
    if (typeof operatorApproval !== "boolean") return next(badRequest("operatorApproval must be a boolean"));

    const validCancellation = ["flexible", "moderate", "strict"];
    if (!validCancellation.includes(cancellation)) {
      return next(badRequest(`cancellation must be one of: ${validCancellation.join(", ")}`));
    }

    const validReviews = ["auto", "flagged", "all"];
    if (!validReviews.includes(reviews)) {
      return next(badRequest(`reviews must be one of: ${validReviews.join(", ")}`));
    }

    const validSuspension = ["manual", "reports", "strict"];
    if (!validSuspension.includes(suspension)) {
      return next(badRequest(`suspension must be one of: ${validSuspension.join(", ")}`));
    }

    const policy = await Policy.findOneAndUpdate(
      {},
      {
        $set: {
          userSignup,
          operatorSignup,
          operatorApproval,
          cancellation,
          reviews,
          suspension,
        },
      },
      { new: true, runValidators: true, upsert: true }
    );

    // Log the activity
    await logActivity(req.user, "Updated platform policies", "Policy settings", "Success");

    return res.status(statusCode.OK).json({
      success: true,
      message: "Policies updated successfully",
      data: policy,
    });
  } catch (err) {
    // Log failure
    await logActivity(req.user, "Failed to update platform policies", "Policy settings", "Failed");
    return next(err);
  }
};

/**
 * GET /admin/activity-logs
 * Query params: search, status, page, limit
 * Returns: { data, total, page, totalPages }
 */
export const getActivityLogs = async (req, res, next) => {
  try {
    const {
      search = "",
      status = "All",
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      // Use text search or regex fallback
      filter.$or = [
        { adminName: { $regex: searchTerm, $options: "i" } },
        { action: { $regex: searchTerm, $options: "i" } },
        { resource: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limitNum));

    return res.status(statusCode.OK).json({
      success: true,
      data: logs,
      total,
      page: pageNum,
      totalPages,
    });
  } catch (err) {
    return next(err);
  }
};