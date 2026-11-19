import * as operatorTripService from "../../services/operatorTripService.js";
import statusCode from "../../utils/statusCodes.js";

/**
 * GET /admin/operator-trips?status=pending|approved|rejected
 * Lists all operator trips, newest first, with operator name.
 * Admin only.
 */
export const listOperatorTrips = async (req, res, next) => {
  try {
    const { status } = req.query;
    const trips = await operatorTripService.getOperatorTripsForAdmin(status);
    return res.status(statusCode.OK).json({
      success: true,
      data: trips,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/operator-trips/:id
 * Full detail of one operator package.
 * Admin only.
 */
export const getOperatorTripDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trip = await operatorTripService.getOperatorTripByIdForAdmin(id);
    return res.status(statusCode.OK).json({
      success: true,
      data: trip,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /admin/operator-trips/:id/approve
 * Approves an operator trip:
 * - Only works if status is "pending" (blocks double approval)
 * - Copies the package into the public Trip model (only fields Trip needs)
 * - Saves the new Trip _id in OperatorTrip.approvedTrip
 * - Sets status to "approved"
 * - Does the copy and status update together in a transaction
 * Admin only.
 */
export const approveOperatorTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { operatorTrip, publicTrip } = await operatorTripService.approveOperatorTrip(id);

    return res.status(statusCode.OK).json({
      success: true,
      message: "Operator trip approved and published for travelers.",
      data: {
        operatorTrip,
        publicTrip,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /admin/operator-trips/:id/reject
 * Rejects an operator trip:
 * - Only works if status is "pending"
 * - Body needs a reason (required, min 10 characters)
 * - Sets status "rejected" and saves rejectionReason
 * Admin only.
 */
export const rejectOperatorTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body ?? {};

    if (!rejectionReason || typeof rejectionReason !== "string") {
      const error = new Error("Rejection reason is required.");
      error.status = statusCode.BAD_REQUEST;
      return next(error);
    }

    const trimmedReason = rejectionReason.trim();
    if (trimmedReason.length < 10) {
      const error = new Error("Rejection reason must be at least 10 characters.");
      error.status = statusCode.BAD_REQUEST;
      return next(error);
    }

    const operatorTrip = await operatorTripService.rejectOperatorTrip(id, trimmedReason);

    return res.status(statusCode.OK).json({
      success: true,
      message: "Operator trip rejected.",
      data: operatorTrip,
    });
  } catch (err) {
    return next(err);
  }
};