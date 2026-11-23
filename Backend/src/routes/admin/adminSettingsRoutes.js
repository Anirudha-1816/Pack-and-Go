import express from "express";
import {
  getPolicies,
  updatePolicies,
  getActivityLogs,
} from "../../controllers/admin/adminSettingsController.js";
import checkForAuth from "../../middlewares/Authentication/checkForAuth.js";
import checkForAdmin from "../../middlewares/Authentication/checkForAdmin.js";

const adminSettingsRouter = express.Router();

// All routes require admin authentication
adminSettingsRouter.use(checkForAuth);
adminSettingsRouter.use(checkForAdmin);

// Policies
adminSettingsRouter.get("/policies", getPolicies);
adminSettingsRouter.put("/policies", updatePolicies);

// Activity Logs
adminSettingsRouter.get("/activity-logs", getActivityLogs);

export default adminSettingsRouter;