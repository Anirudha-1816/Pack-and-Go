import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Readable } from "stream";
import Operator from "../../models/users/operatorsModel.js";
import OperatorTrip from "../../models/components/operatorTripModel.js";
import Booking from "../../models/Bookings/bookingModel.js";
import cloudinary from "../../configs/cloudinary.js";
import { uploadMedia } from "../../services/cloudinaryService.js";
import statusCode from "../../utils/statusCodes.js";

// Reuse the same JSON parsing and validation logic from tripController
const badRequest = (message) => {
  const error = new Error(message);
  error.status = statusCode.BAD_REQUEST;
  return error;
};

const parseJson = (value, name) => {
  try {
    return JSON.parse(value);
  } catch {
    throw badRequest(`${name} is missing or not valid.`);
  }
};

export const createOperators = async (req, res, next) => {
  let uploadedImage;

  try {
    const { name, email, password, phone, location, experience } = req.body ?? {};
    const yearsOfExperience = experience === undefined || experience === ""
      ? 0
      : Number(experience);
    if (
      typeof name !== "string" || !name.trim() ||
      typeof email !== "string" || !email.trim() ||
      typeof password !== "string" || !password ||
      typeof phone !== "string" || !phone.trim() ||
      typeof location !== "string" || !location.trim() ||
      !Number.isFinite(yearsOfExperience) ||
      yearsOfExperience < 0 ||
      yearsOfExperience > 60
    ) {
      const error = new Error("Name, email, password, phone, and location are required; experience must be from 0 to 60.");
      error.status = statusCode.BAD_REQUEST;
      return next(error);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingOperator = await Operator.findOne({ email: normalizedEmail });
    if (existingOperator) {
      const error = new Error("Email already exists.");
      error.status = statusCode.CONFLICT;
      return next(error);
    }

    if (req.file) {
      uploadedImage = await uploadMedia(Readable.from([req.file.buffer]), "image");
    }

    const operator = await Operator.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      phone: phone.trim(),
      location: location.trim(),
      experience: yearsOfExperience,
      profileImage: uploadedImage?.url ?? "",
    });

    const { password: _, ...operatorData } = operator.toObject();
    return res.status(statusCode.CREATED).json({
      success: true,
      message: "Operator application submitted successfully.",
      data: operatorData,
    });
  } catch (err) {
    if (uploadedImage?.publicId) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.publicId);
      } catch (cleanupError) {
        console.error("Failed to clean up operator profile image:", cleanupError);
      }
    }

    if (err.code === 11000) {
      err.status = statusCode.CONFLICT;
      err.message = "Email already exists.";
    }
    return next(err);
  }
};

export const loginOperators = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      const error = new Error("Email and password are required");
      error.status = statusCode.BAD_REQUEST;
      error.extraDetails = "Please provide valid login credentials.";
      return next(error);
    }

    const operator = await Operator.findOne({
      email: email.trim().toLowerCase(),
    });

    const fail = () => {
      const error = new Error("Invalid email or password");
      error.status = statusCode.UNAUTHORIZED;
      error.extraDetails = "Please check your login credentials.";
      return next(error);
    };

    if (!operator) return fail();

    const isMatch = await bcrypt.compare(password, operator.password);
    if (!isMatch) return fail();

    if (operator.status !== "approved") {
      return res.status(statusCode.FORBIDDEN).json({
        success: false,
        status: operator.status,
        message: operator.status === "rejected"
          ? operator.rejectionReason || "Your operator application was not approved."
          : "Your operator application is awaiting approval.",
      });
    }

    const token = jwt.sign(
      { userId: operator._id, role: "operator" },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    const isProduction = process.env.NODE_ENV === "production";
    const cookieMaxAge = 2 * 24 * 60 * 60 * 1000; // 2 days to match JWT expiry
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/", // Ensure cookie is available on all paths
      maxAge: cookieMaxAge,
      expires: new Date(Date.now() + cookieMaxAge),
    });

    const { password: _, ...operatorData } = operator.toObject();
    return res.status(statusCode.OK).json({
      success: true,
      message: "Operator logged in successfully",
      data: operatorData,
    });
  } catch (err) {
    return next(err);
  }
};

export const getAllOperatorsReq = async (req, res , next) => {
  try {
    const operatorsReq = await Operator.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(statusCode.OK).json({
      success: true,
      data: operatorsReq,
    })
  } catch (err) {
    return next(err)
  }
};

export const updateOperatorRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body ?? {};

    if (!mongoose.isValidObjectId(id)) {
      const error = new Error("Invalid operator ID.");
      error.status = statusCode.BAD_REQUEST;
      return next(error);
    }

    if (!["approved", "rejected", "pending"].includes(status)) {
      const error = new Error("Status must be approved, rejected, or pending.");
      error.status = statusCode.BAD_REQUEST;
      return next(error);
    }

    const reason = typeof rejectionReason === "string" ? rejectionReason.trim() : "";
    if (status === "rejected" && reason.length < 10) {
      const error = new Error("A rejection reason of at least 10 characters is required.");
      error.status = statusCode.BAD_REQUEST;
      return next(error);
    }

    const operator = await Operator.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          rejectionReason: status === "rejected" ? reason : "",
          approvedAt: status === "approved" ? new Date() : null,
        },
      },
      { new: true, runValidators: true } 
    ).select("-password");

    if (!operator) {
      const error = new Error("Operator not found.");
      error.status = statusCode.NOT_FOUND;
      return next(error);
    }

    return res.status(statusCode.OK).json({
      success: true,
      message: `Operator request ${status}.`,
      data: operator,
    });
  } catch (err) {
    return next(err);
  }
};

export const getCurrentOperator = async (req, res, next) => {
  try {
    const operatorId = req.user?.userId;
    if (!operatorId) {
      const error = new Error("Operator not authorized");
      error.status = statusCode.UNAUTHORIZED;
      return next(error);
    }

    const operator = await Operator.findById(operatorId).select("-password");
    if (!operator) {
      const error = new Error("Operator not found");
      error.status = statusCode.NOT_FOUND;
      return next(error);
    }

    return res.status(statusCode.OK).json({
      success: true,
      data: operator,
    });
  } catch (err) {
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

export const getOperatorBookings = async (req, res, next) => {
  try {
    const operatorId = req.user?.userId;
    if (!operatorId) {
      const error = new Error("Operator not authorized");
      error.status = statusCode.UNAUTHORIZED;
      return next(error);
    }

    // Get operator's trips first
    const operatorTrips = await OperatorTrip.find({ operator: operatorId }).select("_id");
    const tripIds = operatorTrips.map((t) => t._id);

    // Get bookings for those trips
    const bookings = await Booking.find({ trip: { $in: tripIds } })
      .populate("trip", "from to date duration")
      .populate("user", "fullName email phone")
      .sort({ createdAt: -1 });

    return res.status(statusCode.OK).json({
      success: true,
      data: bookings,
    });
  } catch (err) {
    return next(err);
  }
};


export const createOperatorTrip = async (req, res, next) => {
  let images = [];

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

    // The operator's own trips are looked up by `guide: operator.name`
    // (see getOperatorTrips), so the guide must be the operator's name.
    const operator = await Operator.findById(operatorId);
    if (!operator) {
      throw badRequest("Operator not authorized");
    }

    // 4. Take only the fields we expect
    const {
      from, to, date,
      pickupTime, pickupLocation, dropTime, dropLocation,
      duration, pricePerHead,
      tripType, stays, travel, termsType, customTerms,
    } = req.body;

    // The form may send a guide name; fall back to the operator's own name so
    // the trip is always attributable to, and discoverable by, this operator.
    const guide = (typeof req.body.guide === "string" && req.body.guide.trim()) || operator.name;

    // 4b. "meals" and "roadmap" arrive as JSON strings inside the FormData.
    //     They are optional at parse time; the model still enforces its own
    //     requirements (meals defaults to [], roadmap needs at least one stop).
    const meals = req.body.meals ? parseJson(req.body.meals, "meals") : [];
    const roadmap = req.body.roadmap ? parseJson(req.body.roadmap, "roadmap") : [];

    // 5. Save the trip with operator reference and pending status
    const trip = await Trip.create({
      from, to, guide, date,
      pickupTime, pickupLocation, dropTime, dropLocation,
      duration, pricePerHead,
      tripType, stays, travel, termsType, customTerms,
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

// Old createOperatorTrip removed - now handled by dedicated operatorTripController

export const logoutOperator = async (req, res, next) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    // Clear the token cookie with SAME attributes as login
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      expires: new Date(0),
    });

    return res.status(statusCode.OK).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    return next(err);
  }
};

export const getOperatorThemePreference = async (req, res, next) => {
  try {
    const operatorId = req.user?.userId;
    if (!operatorId) {
      const error = new Error("Operator not authorized");
      error.status = statusCode.UNAUTHORIZED;
      return next(error);
    }

    const operator = await Operator.findById(operatorId).select('themePreference');
    if (!operator) {
      const error = new Error("Operator not found");
      error.status = statusCode.NOT_FOUND;
      return next(error);
    }

    return res.status(statusCode.OK).json({
      success: true,
      data: { themePreference: operator.themePreference || 'system' },
    });
  } catch (err) {
    return next(err);
  }
};

export const updateOperatorThemePreference = async (req, res, next) => {
  try {
    const operatorId = req.user?.userId;
    if (!operatorId) {
      const error = new Error("Operator not authorized");
      error.status = statusCode.UNAUTHORIZED;
      return next(error);
    }

    const { themePreference } = req.body ?? {};

    if (!themePreference || !['light', 'dark', 'system'].includes(themePreference)) {
      const error = new Error("Invalid theme preference");
      error.status = statusCode.BAD_REQUEST;
      error.extraDetails = "Theme preference must be 'light', 'dark', or 'system'";
      return next(error);
    }

    const operator = await Operator.findByIdAndUpdate(
      operatorId,
      { themePreference },
      { new: true, select: 'themePreference' }
    );

    if (!operator) {
      const error = new Error("Operator not found");
      error.status = statusCode.NOT_FOUND;
      return next(error);
    }

    return res.status(statusCode.OK).json({
      success: true,
      message: "Theme preference updated successfully",
      data: { themePreference: operator.themePreference },
    });
  } catch (err) {
    return next(err);
  }
};