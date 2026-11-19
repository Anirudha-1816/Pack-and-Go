import express from "express";
import {
  listOperatorTrips,
  getOperatorTripDetail,
  approveOperatorTrip,
  rejectOperatorTrip,
} from "../../controllers/admin/adminOperatorTripController.js";
import checkForAuth from "../../middlewares/Authentication/checkForAuth.js";
import checkForAdmin from "../../middlewares/Authentication/checkForAdmin.js";

const adminOperatorTripRouter = express.Router();

// All routes require admin authentication
adminOperatorTripRouter.use(checkForAuth);
adminOperatorTripRouter.use(checkForAdmin);

// GET /admin/operator-trips?status=pending|approved|rejected -> list all operator trips
adminOperatorTripRouter.get("/", listOperatorTrips);

// GET /admin/operator-trips/:id -> full detail of one package
adminOperatorTripRouter.get("/:id", getOperatorTripDetail);

// PATCH /admin/operator-trips/:id/approve -> approve operator trip
adminOperatorTripRouter.patch("/:id/approve", approveOperatorTrip);

// PATCH /admin/operator-trips/:id/reject -> reject operator trip (requires reason)
adminOperatorTripRouter.patch("/:id/reject", rejectOperatorTrip);

export default adminOperatorTripRouter;