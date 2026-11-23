import Feedback from "../../models/components/feedbackModel.js";
import statusCode from "../../utils/statusCodes.js";
import mongoose from "mongoose";

// Makes a 400 error that your error middleware understands
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

const forbidden = (message) => {
  const error = new Error(message);
  error.status = statusCode.FORBIDDEN;
  return error;
};

// ---------- User-facing APIs ----------

/**
 * GET /feedback
 * Public: Get all approved feedback with pagination, filters, sorting
 * Query params: page, limit, category, rating, sortBy
 */
export const getAllFeedback = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      rating,
      sortBy = "newest",
    } = req.query;

    const filter = { status: "approved", isDeleted: { $ne: true } };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (rating) {
      filter.rating = Number(rating);
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      highest: { rating: -1, createdAt: -1 },
      lowest: { rating: 1, createdAt: 1 },
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [feedback, total] = await Promise.all([
      Feedback.find(filter)
        .populate("user", "fullName profileImage")
        .populate("trip", "title from to tripIdentifier")
        .sort(sortOptions[sortBy] || sortOptions.newest)
        .skip(skip)
        .limit(Number(limit)),
      Feedback.countDocuments(filter),
    ]);

    return res.status(statusCode.OK).json({
      success: true,
      data: feedback,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /feedback/stats
 * Public: Get rating statistics (average, distribution, total)
 */
export const getFeedbackStats = async (req, res, next) => {
  try {
    const filter = { status: "approved", isDeleted: { $ne: true } };

    const [stats] = await Feedback.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          distribution: {
            $push: { rating: "$rating", count: 1 },
          },
        },
      },
    ]);

    if (!stats) {
      return res.status(statusCode.OK).json({
        success: true,
        data: {
          averageRating: 0,
          totalReviews: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      });
    }

    // Calculate distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    stats.distribution.forEach((item) => {
      if (distribution.hasOwnProperty(item.rating)) {
        distribution[item.rating]++;
      }
    });

    return res.status(statusCode.OK).json({
      success: true,
      data: {
        averageRating: Math.round(stats.averageRating * 100) / 100,
        totalReviews: stats.totalReviews,
        distribution,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /feedback/:id
 * Public: Get single feedback by ID
 */
export const getFeedbackById = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate("user", "fullName profileImage")
      .populate("trip", "title from to tripIdentifier");

    if (!feedback || feedback.status !== "approved" || feedback.isDeleted) {
      throw notFound("Feedback not found");
    }

    return res.status(statusCode.OK).json({
      success: true,
      data: feedback,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /feedback
 * Protected: Submit new feedback (authenticated users only)
 * Body: rating, title, description, category, trip (optional)
 */
export const createFeedback = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw forbidden("Authentication required");
    }

    const { rating, title, description, category, trip } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      throw badRequest("Rating must be between 1 and 5");
    }

    if (!description || description.trim().length < 10) {
      throw badRequest("Review description must be at least 10 characters");
    }

    // Check if trip exists and user has booked it (optional validation)
    if (trip) {
      if (!mongoose.isValidObjectId(trip)) {
        throw badRequest("Invalid trip ID");
      }
      // Could add booking verification here if needed
    }

    const feedback = await Feedback.create({
      user: userId,
      trip: trip || null,
      rating,
      title: title?.trim() || "",
      description: description.trim(),
      category: category || "Curated Trips",
    });

    // Populate for response
    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate("user", "fullName profileImage")
      .populate("trip", "title from to tripIdentifier");

    return res.status(statusCode.CREATED).json({
      success: true,
      message: "Review submitted successfully! It will appear after admin approval.",
      data: populatedFeedback,
    });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error
      throw badRequest("You have already reviewed this trip");
    }
    return next(err);
  }
};

/**
 * PUT /feedback/:id
 * Protected: Update own feedback
 */
export const updateFeedback = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw forbidden("Authentication required");
    }

    const { rating, title, description, category } = req.body;

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      throw notFound("Feedback not found");
    }

    // Check ownership
    if (feedback.user.toString() !== userId.toString()) {
      throw forbidden("You can only edit your own reviews");
    }

    // Only allow editing if status is still pending or approved (not rejected)
    if (feedback.status === "rejected") {
      throw badRequest("Cannot edit a rejected review");
    }

    // Validate
    if (rating && (rating < 1 || rating > 5)) {
      throw badRequest("Rating must be between 1 and 5");
    }

    if (description && description.trim().length < 10) {
      throw badRequest("Review description must be at least 10 characters");
    }

    // Update
    const updatedFeedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          rating: rating ?? feedback.rating,
          title: title?.trim() ?? feedback.title,
          description: description?.trim() ?? feedback.description,
          category: category ?? feedback.category,
          // Reset status to pending after edit
          status: "pending",
        },
      },
      { new: true, runValidators: true }
    )
      .populate("user", "fullName profileImage")
      .populate("trip", "title from to tripIdentifier");

    return res.status(statusCode.OK).json({
      success: true,
      message: "Review updated successfully! It will be re-reviewed by admin.",
      data: updatedFeedback,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /feedback/:id
 * Protected: Delete own feedback (soft delete)
 */
export const deleteFeedback = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw forbidden("Authentication required");
    }

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      throw notFound("Feedback not found");
    }

    // Check ownership
    if (feedback.user.toString() !== userId.toString()) {
      throw forbidden("You can only delete your own reviews");
    }

    // Soft delete
    feedback.isDeleted = true;
    await feedback.save();

    return res.status(statusCode.OK).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (err) {
    return next(err);
  }
};

// ---------- User's own reviews ----------

/**
 * GET /feedback/my-reviews
 * Protected: Get current user's reviews
 */
export const getMyReviews = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw forbidden("Authentication required");
    }

    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Feedback.find({ user: userId, isDeleted: { $ne: true } })
        .populate("trip", "title from to tripIdentifier")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Feedback.countDocuments({ user: userId, isDeleted: { $ne: true } }),
    ]);

    return res.status(statusCode.OK).json({
      success: true,
      data: reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    return next(err);
  }
};

// ---------- Admin APIs ----------

/**
 * GET /admin/feedback
 * Admin: Get all feedback with filters, pagination
 */
export const getAllFeedbackForAdmin = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      search,
      sortBy = "newest",
    } = req.query;

    const filter = { isDeleted: { $ne: true } };

    if (status && status !== "All") {
      filter.status = status;
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "user.fullName": { $regex: search, $options: "i" } },
      ];
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      highest: { rating: -1 },
      lowest: { rating: 1 },
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [feedback, total] = await Promise.all([
      Feedback.find(filter)
        .populate("user", "fullName email profileImage")
        .populate("trip", "title tripIdentifier")
        .sort(sortOptions[sortBy] || { createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Feedback.countDocuments(filter),
    ]);

    return res.status(statusCode.OK).json({
      success: true,
      data: feedback,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /admin/feedback/:id/status
 * Admin: Update feedback status (approve/reject)
 */
export const updateFeedbackStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      throw badRequest("Status must be 'approved' or 'rejected'");
    }

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      throw notFound("Feedback not found");
    }

    if (feedback.isDeleted) {
      throw badRequest("Cannot update deleted feedback");
    }

    feedback.status = status;

    if (status === "rejected") {
      if (!rejectionReason || rejectionReason.trim().length < 10) {
        throw badRequest("Rejection reason must be at least 10 characters");
      }
      feedback.rejectionReason = rejectionReason.trim();
    }

    await feedback.save();

    return res.status(statusCode.OK).json({
      success: true,
      message: `Feedback ${status} successfully`,
      data: feedback,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /admin/feedback/:id/toggle-visibility
 * Admin: Toggle visibility (soft delete/restore)
 */
export const toggleFeedbackVisibility = async (req, res, next) => {
  try {
    const { isDeleted } = req.body;

    if (typeof isDeleted !== "boolean") {
      throw badRequest("isDeleted must be a boolean");
    }

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      throw notFound("Feedback not found");
    }

    feedback.isDeleted = isDeleted;
    await feedback.save();

    return res.status(statusCode.OK).json({
      success: true,
      message: isDeleted ? "Feedback hidden successfully" : "Feedback restored successfully",
      data: feedback,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /admin/feedback/:id
 * Admin: Hard delete feedback
 */
export const deleteFeedbackByAdmin = async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);

    if (!feedback) {
      throw notFound("Feedback not found");
    }

    return res.status(statusCode.OK).json({
      success: true,
      message: "Feedback permanently deleted",
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/feedback/stats
 * Admin: Get feedback statistics
 */
export const getAdminFeedbackStats = async (req, res, next) => {
  try {
    const [total, pending, approved, rejected, avgRating] = await Promise.all([
      Feedback.countDocuments({ isDeleted: { $ne: true } }),
      Feedback.countDocuments({ status: "pending", isDeleted: { $ne: true } }),
      Feedback.countDocuments({ status: "approved", isDeleted: { $ne: true } }),
      Feedback.countDocuments({ status: "rejected", isDeleted: { $ne: true } }),
      Feedback.aggregate([
        { $match: { status: "approved", isDeleted: { $ne: true } } },
        { $group: { _id: null, avg: { $avg: "$rating" } } },
      ]),
    ]);

    return res.status(statusCode.OK).json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        averageRating: avgRating[0] ? Math.round(avgRating[0].avg * 100) / 100 : 0,
      },
    });
  } catch (err) {
    return next(err);
  }
};