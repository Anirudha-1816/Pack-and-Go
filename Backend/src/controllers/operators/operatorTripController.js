import cloudinary from "../../configs/cloudinary.js";
import statusCode from "../../utils/statusCodes.js";
import OperatorTrip from "../../models/components/operatorTripModel.js";
import Operator from "../../models/users/operatorsModel.js";

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
      pickupTime,
      pickupLocation,
      dropTime,
      dropLocation,
      duration,
      pricePerHead,
      maxTravelers,
      tripType,
      stays,
      travel,
      termsType,
      customTerms,
    } = req.body;

    // Operator form uses destination for both from and to
    const from = (destination || "").trim();
    const to = from;

    // Guide defaults to operator's name
    const guide = operator.name;

    // Parse JSON fields
    const meals = req.body.meals ? parseJson(req.body.meals, "meals") : [];
    const roadmap = req.body.roadmap ? parseJson(req.body.roadmap, "roadmap") : [];

    // Validate required fields
    if (!title?.trim()) throw badRequest("Package title is required");
    if (!description?.trim()) throw badRequest("Description is required");
    if (!destination?.trim()) throw badRequest("Destination is required");
    if (!date) throw badRequest("Trip date is required");
    if (!duration) throw badRequest("Duration is required");
    if (!pricePerHead) throw badRequest("Price is required");
    if (!maxTravelers) throw badRequest("Max travelers is required");

    // 5. Save the trip with operator reference and pending status
    const trip = await OperatorTrip.create({
      title,
      description,
      destination,
      from,
      to,
      guide,
      date,
      pickupTime,
      pickupLocation,
      dropTime,
      dropLocation,
      duration,
      pricePerHead,
      maxTravelers,
      tripType,
      stays,
      travel,
      termsType,
      customTerms,
      meals,
      roadmap,
      banner,
      thumbnail,
      operator: operatorId,
      status: "pending", // operator-created trips need admin approval
    });

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

    // Get trips belonging to the authenticated operator
    const trips = await OperatorTrip.find({ operator: operatorId }).sort({ createdAt: -1 });

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