import OperatorTrip from "../models/components/operatorTripModel.js";
import Trip from "../models/components/tripModel.js";
import Operator from "../models/users/operatorsModel.js";
import mongoose from "mongoose";
import statusCode from "../utils/statusCodes.js";

/**
 * Creates a 400/403/404/409 error that the error middleware understands
 */
const error = (message, code, extraDetails) => {
  const err = new Error(message);
  err.status = code;
  if (extraDetails) err.extraDetails = extraDetails;
  return err;
};

/**
 * Atomically copies an OperatorTrip to a public Trip and marks the OperatorTrip as approved.
 * Uses a MongoDB session (transaction) so the copy and status update succeed or fail together.
 *
 * @param {string} operatorTripId - The _id of the OperatorTrip to approve
 * @returns {Promise<{ operatorTrip: OperatorTrip, publicTrip: Trip }>} The updated operator trip and the new public trip
 */
export const approveOperatorTrip = async (operatorTripId) => {
  // Validate ObjectId
  if (!mongoose.isValidObjectId(operatorTripId)) {
    throw error("Invalid operator trip ID.", statusCode.BAD_REQUEST);
  }

  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find the operator trip and lock it (pessimistic locking via session)
    const operatorTrip = await OperatorTrip.findById(operatorTripId).session(session);

    if (!operatorTrip) {
      throw error("Operator trip not found.", statusCode.NOT_FOUND);
    }

    // 2. Check if it's still pending (block double approval)
    if (operatorTrip.status !== "pending") {
      throw error(
        `This trip is already ${operatorTrip.status}. It cannot be approved again.`,
        statusCode.CONFLICT,
        "Only pending trips can be approved."
      );
    }

    // Get operator to copy location as city
    const operator = await Operator.findById(operatorTrip.operator).session(session);

    // 3. Build the public Trip data from the OperatorTrip
    // Only copy fields that the Trip model expects
    const publicTripData = {
      // Route
      from: operatorTrip.from,
      to: operatorTrip.to,
      guide: operatorTrip.guide,
      date: operatorTrip.date,

      // Pickup & drop
      pickupDropType: operatorTrip.pickupDropType,
      meetupPoint: operatorTrip.meetupPoint,
      pickupTime: operatorTrip.pickupTime,
      pickupLocation: operatorTrip.pickupLocation,
      dropTime: operatorTrip.dropTime,
      dropLocation: operatorTrip.dropLocation,

      // Duration & pricing
      duration: operatorTrip.duration,
      pricePerHead: operatorTrip.pricePerHead,
      maxTravelers: operatorTrip.maxTravelers,

      // Type
      tripType: operatorTrip.tripType,

      // Includes
      meals: operatorTrip.meals,
      stays: operatorTrip.stays,
      travel: operatorTrip.travel,

      // Terms
      termsType: operatorTrip.termsType,
      customTerms: operatorTrip.customTerms,

      // Roadmap
      roadmap: operatorTrip.roadmap,

      // Images
      banner: operatorTrip.banner,
      thumbnail: operatorTrip.thumbnail,

      // Status & operator reference
      status: "approved",
      isActive: true,
      operator: operatorTrip.operator,

      // City from operator's location (for events filtering)
      city: operator?.location || operatorTrip.from,
    };

    // 4. Create the public Trip
    const [publicTrip] = await Trip.create([publicTripData], { session });

    // 5. Update the OperatorTrip: set status to approved, link to the public Trip
    operatorTrip.status = "approved";
    operatorTrip.approvedTrip = publicTrip._id;
    await operatorTrip.save({ session });

    // 6. Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return { operatorTrip, publicTrip };
  } catch (err) {
    // Abort transaction on any error
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * Rejects an operator trip.
 * Only works if the trip is still pending.
 *
 * @param {string} operatorTripId - The _id of the OperatorTrip to reject
 * @param {string} rejectionReason - The reason for rejection (min 10 chars, validated by caller)
 * @returns {Promise<OperatorTrip>} The updated operator trip
 */
export const rejectOperatorTrip = async (operatorTripId, rejectionReason) => {
  if (!mongoose.isValidObjectId(operatorTripId)) {
    throw error("Invalid operator trip ID.", statusCode.BAD_REQUEST);
  }

  const operatorTrip = await OperatorTrip.findById(operatorTripId);

  if (!operatorTrip) {
    throw error("Operator trip not found.", statusCode.NOT_FOUND);
  }

  // Only pending trips can be rejected
  if (operatorTrip.status !== "pending") {
    throw error(
      `This trip is already ${operatorTrip.status}. It cannot be rejected.`,
      statusCode.CONFLICT,
      "Only pending trips can be rejected."
    );
  }

  operatorTrip.status = "rejected";
  operatorTrip.rejectionReason = rejectionReason.trim();
  await operatorTrip.save();

  return operatorTrip;
};

/**
 * Gets all operator trips for admin, optionally filtered by status.
 * Newest first. Includes operator name.
 *
 * @param {string} [status] - Filter by status: pending | approved | rejected
 * @returns {Promise<Array>} List of operator trips with operator name
 */
export const getOperatorTripsForAdmin = async (status) => {
  const filter = {};
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    filter.status = status;
  }

  const trips = await OperatorTrip.find(filter)
    .populate("operator", "name email")
    .sort({ createdAt: -1 });

  return trips;
};

/**
 * Gets a single operator trip by ID with full details and operator info.
 *
 * @param {string} operatorTripId
 * @returns {Promise<Object>} The operator trip with operator details
 */
export const getOperatorTripByIdForAdmin = async (operatorTripId) => {
  if (!mongoose.isValidObjectId(operatorTripId)) {
    throw error("Invalid operator trip ID.", statusCode.BAD_REQUEST);
  }

  const trip = await OperatorTrip.findById(operatorTripId)
    .populate("operator", "name email phone location experience profileImage");

  if (!trip) {
    throw error("Operator trip not found.", statusCode.NOT_FOUND);
  }

  return trip;
};