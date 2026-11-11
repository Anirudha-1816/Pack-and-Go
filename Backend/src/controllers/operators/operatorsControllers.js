import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Readable } from "stream";
import Operator from "../../models/users/operatorsModel.js";
import cloudinary from "../../configs/cloudinary.js";
import { uploadMedia } from "../../services/cloudinaryService.js";
import statusCode from "../../utils/statusCodes.js";

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

    const isProd = true;
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
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