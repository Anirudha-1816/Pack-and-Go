import express from "express";
import {
  getAllFeedback,
  getFeedbackStats,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getMyReviews,
  // Admin
  getAllFeedbackForAdmin,
  updateFeedbackStatus,
  toggleFeedbackVisibility,
  deleteFeedbackByAdmin,
  getAdminFeedbackStats,
} from "../../controllers/components/feedbackController.js";
import checkForAuth from "../../middlewares/Authentication/checkForAuth.js";
import checkForAdmin from "../../middlewares/Authentication/checkForAdmin.js";

const feedbackRouter = express.Router();

// Public routes
feedbackRouter.get("/", getAllFeedback);
feedbackRouter.get("/stats", getFeedbackStats);

// Admin routes (require admin auth) - must come before :id route
feedbackRouter.use("/admin", checkForAuth, checkForAdmin);
feedbackRouter.get("/admin", getAllFeedbackForAdmin);
feedbackRouter.get("/admin/stats", getAdminFeedbackStats);
feedbackRouter.patch("/admin/:id/status", updateFeedbackStatus);
feedbackRouter.patch("/admin/:id/toggle-visibility", toggleFeedbackVisibility);
feedbackRouter.delete("/admin/:id", deleteFeedbackByAdmin);

// Protected user routes (require authentication)
feedbackRouter.use(checkForAuth);
feedbackRouter.post("/", createFeedback);
feedbackRouter.get("/my-reviews", getMyReviews);
feedbackRouter.put("/:id", updateFeedback);
feedbackRouter.delete("/:id", deleteFeedback);
feedbackRouter.get("/:id", getFeedbackById);

export default feedbackRouter;