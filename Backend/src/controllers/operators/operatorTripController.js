import cloudinary from "../../configs/cloudinary.js";
import statusCode from "../../utils/statusCodes.js";
import OperatorTrip from "../../models/components/operatorTripModel.js";
import Operator from "../../models/users/operatorsModel.js";
import {
  MEALS,
  TIERS,
  TRIP_TYPES,
  PICKUP_DROP_TYPES,
  MIN_REJECTION_REASON_LENGTH,
} from "../../constants/tripConstants.js";
import { VALID_CATEGORIES } from "../../models/components/operatorTripModel.js";

// Makes a 400 error that your error middleware understands
const badRequest = (message) => {
  const error = new Error(message);
  error.status = statusCode.BAD_REQUEST;
  return error;
};

// "meals" and "roadmap" come as JSON strings in FormData, so turn them back into arrays
const parseJson = (value, name) => {
  try {
    return JSON.parse(value);
  } catch {
    throw badRequest(`${name} is missing or not valid.`);
  }
};

// Category-specific validation
const validateCategoryDetails = (category, details, body) => {
  if (!details) return;

  switch (category) {
    case "festivals-celebrations":
      if (!details.eventType) throw badRequest("Event type is required for festivals");
      if (details.eventType === "Other" && !details.customEventType) {
        throw badRequest("Custom event type is required when 'Other' is selected");
      }
      if (!details.dressCode) throw badRequest("Dress code is required for festivals");
      if (details.dressCode === "Other" && !details.customDressCode) {
        throw badRequest("Custom dress code is required when 'Other' is selected");
      }
      break;

    case "adventure-outdoors":
      if (!details.activityType) throw badRequest("Activity type is required for adventure");
      if (details.activityType === "Other" && !details.customActivityType) {
        throw badRequest("Custom activity type is required when 'Other' is selected");
      }
      if (!details.duration) throw badRequest("Duration is required for adventure");
      if (!details.durationUnit) throw badRequest("Duration unit is required for adventure");
      if (!details.difficultyLevel) throw badRequest("Difficulty level is required for adventure");
      if (!details.safetyInstructions) throw badRequest("Safety instructions are required for adventure");
      if (!details.guideIncluded) throw badRequest("Guide inclusion is required for adventure");
      break;

    case "social-gatherings":
    case "networking-meetups":
      if (!details.eventType) throw badRequest("Event type is required for social events");
      if (details.eventType === "Other" && !details.customEventType) {
        throw badRequest("Custom event type is required when 'Other' is selected");
      }
      if (!details.ageGroup) throw badRequest("Age group is required for social events");
      if (details.ageGroup === "custom") {
        if (!details.minimumAge) throw badRequest("Minimum age is required for custom age range");
        if (!details.maximumAge) throw badRequest("Maximum age is required for custom age range");
      }
      if (!details.atmosphere) throw badRequest("Atmosphere is required for social events");
      if (!details.dressCode) throw badRequest("Dress code is required for social events");
      if (details.dressCode === "Other" && !details.customDressCode) {
        throw badRequest("Custom dress code is required when 'Other' is selected");
      }
      if (!details.foodAndDrinks) throw badRequest("Food & drinks option is required for social events");
      break;
  }
};

export const createOperatorTrip = async (req, res, next) => {
  let images = []; // images already on Cloudinary, so we can delete them if saving fails

  try {
    // 1. Wait for both images to finish uploading
    const results = await Promise.allSettled([req.uploads.banner, req.uploads.thumbnail]);
    const [banner, thumbnail] = results.map((r) => (r.status === "fulfilled" ? r.value : undefined));
    images = [banner, thumbnail].filter(Boolean);

    // 2. Check the images
    if (req.uploadError) throw badRequest(req.uploadError);
    if (results.some((r) => r.status === "rejected")) {
      throw new Error("Image upload failed. Please try again.");
    }
    if (!banner || !thumbnail) {
      throw badRequest("Banner image and small image are both required.");
    }

    // 3. Get operator ID from auth
    const operatorId = req.user?.userId;
    if (!operatorId) {
      throw badRequest("Operator not authorized");
    }

    const operator = await Operator.findById(operatorId);
    if (!operator) {
      throw badRequest("Operator not authorized");
    }

    // 4. Take only the fields we expect from the form
    const {
      title,
      description,
      destination,
      date,
      pickupDropType = "group", // "group" = we pick up & drop, "self" = travelers come on their own
      pickupTime,
      pickupLocation,
      dropTime,
      dropLocation,
      meetupPoint, // only for self drop & pickup
      duration,
      pricePerHead,
      maxTravelers,
      tripType,
      stays,
      travel,
      termsType,
      customTerms,
      category, // New field
      categoryDetails, // New field - JSON string
    } = req.body;

    // Operator form uses destination for both from and to
    const from = (destination || "").trim();
    const to = from;

    // Guide defaults to operator's name
    const guide = operator.name;

    // Parse JSON fields
    const meals = req.body.meals ? parseJson(req.body.meals, "meals") : [];
    const roadmap = req.body.roadmap ? parseJson(req.body.roadmap, "roadmap") : [];
    const parsedCategoryDetails = categoryDetails ? parseJson(categoryDetails, "categoryDetails") : {};

    // 5. Validate required fields
    if (!title?.trim()) throw badRequest("Package title is required");
    if (!description?.trim()) throw badRequest("Description is required");
    if (!destination?.trim()) throw badRequest("Destination is required");
    if (!date) throw badRequest("Trip date is required");
    if (!duration) throw badRequest("Duration is required");
    if (!pricePerHead) throw badRequest("Price is required");
    if (!maxTravelers) throw badRequest("Max travelers is required");
    if (!category) throw badRequest("Category is required");
    if (!VALID_CATEGORIES.includes(category)) {
      throw badRequest("Invalid category");
    }

    // Category-specific validation
    validateCategoryDetails(category, parsedCategoryDetails, req.body);

    // Pickup & drop type
    if (!PICKUP_DROP_TYPES.includes(pickupDropType)) {
      throw badRequest("Pickup & drop option must be 'group' or 'self'");
    }

    const isSelfService = pickupDropType === "self";

    if (isSelfService) {
      if (!meetupPoint?.trim()) throw badRequest("Meetup point is required");
    } else {
      if (!pickupTime) throw badRequest("Pickup time is required");
      if (!pickupLocation?.trim()) throw badRequest("Pickup location is required");
      if (!dropTime) throw badRequest("Drop time is required");
      if (!dropLocation?.trim()) throw badRequest("Drop location is required");
    }

    // Roadmap days must add up to the trip duration (only for curated trips)
    if (category === "curated-trips") {
      if (!Array.isArray(roadmap) || roadmap.length === 0) {
        throw badRequest("Add at least one place to the roadmap");
      }
      const totalDays = roadmap.reduce((sum, stop) => sum + Number(stop.days || 0), 0);
      if (totalDays !== Number(duration)) {
        throw badRequest(`Roadmap adds up to ${totalDays} days, but duration is ${duration} days`);
      }
    }

    // 6. Save the trip with operator reference and pending status
    const tripData = {
      title,
      description,
      destination,
      from,
      to,
      guide,
      date,
      pickupDropType,
      ...(isSelfService
        ? { meetupPoint }
        : { pickupTime, pickupLocation, dropTime, dropLocation }),
      duration,
      pricePerHead,
      maxTravelers,
      tripType,
      stays,
      travel,
      termsType,
      ...(termsType === "custom" && { customTerms }),
      meals,
      roadmap,
      banner,
      thumbnail,
      operator: operatorId,
      category,
      categoryDetails: parsedCategoryDetails,
      status: "pending", // operator-created trips need admin approval
    };

    const trip = await OperatorTrip.create(tripData);

    return res.status(statusCode.CREATED).json({
      success: true,
      message: "Trip submitted for approval.",
      data: trip,
    });
  } catch (err) {
    // Saving failed, so remove the images we already uploaded
    await Promise.all(images.map((img) => cloudinary.uploader.destroy(img.publicId))).catch(() => {});

    // Turn common database errors into clear 400 messages
    if (err.name === "ValidationError") {
      err.status = statusCode.BAD_REQUEST;
      err.message = Object.values(err.errors)[0].message;
    }
    if (err.code === 11000) {
      err.status = statusCode.BAD_REQUEST;
      err.message = "Trip identifier already exists. Please try again.";
    }

    return next(err);
  }
};

export const getOperatorTrips = async (req, res, next) => {
  try {
    const operatorId = req.user?.userId;
    if (!operatorId) {
      const error = new Error("Operator not authorized");
      error.status = statusCode.UNAUTHORIZED;
      return next(error);
    }

    // Get trips belonging to the authenticated operator (exclude deleted)
    const trips = await OperatorTrip.find({ operator: operatorId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });

    return res.status(statusCode.OK).json({
      success: true,
      data: trips,
    });
  } catch (err) {
    return next(err);
  }
};

export const getOperatorTripById = async (req, res, next) => {
  try {
    const operatorId = req.user?.userId;
    if (!operatorId) {
      const error = new Error("Operator not authorized");
      error.status = statusCode.UNAUTHORIZED;
      return next(error);
    }

    const trip = await OperatorTrip.findOne({ _id: req.params.id, operator: operatorId });

    if (!trip) {
      const error = new Error("Trip not found.");
      error.status = statusCode.NOT_FOUND;
      return next(error);
    }

    return res.status(200).json({ success: true, data: trip });
  } catch (err) {
    return next(err);
  }
};

export const deleteOperatorTripById = async (req, res, next) => {
  try {
    const operatorId = req.user?.userId;
    if (!operatorId) {
      const error = new Error("Operator not authorized");
      error.status = statusCode.UNAUTHORIZED;
      return next(error);
    }

    const trip = await OperatorTrip.findOne({ _id: req.params.id, operator: operatorId });

    if (!trip) {
      const error = new Error("Trip not found.");
      error.status = statusCode.NOT_FOUND;
      return next(error);
    }

    // Soft delete: mark as deleted instead of permanently removing
    trip.isDeleted = true;
    await trip.save();

    res.status(200).json({
      success: true,
      message: "Trip deleted successfully.",
    });
  } catch (err) {
    return next(err);
  }
};