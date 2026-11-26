import User from "../../models/users/usersModel.js";
import bcrypt from "bcrypt";
import jwt  from 'jsonwebtoken'
import statusCode from "../../utils/statusCodes.js";
import { logActivity } from "../../controllers/admin/adminSettingsController.js";

import crypto from "node:crypto";
import Session from "../../models/sessions/sessionModel.js"; 
import { getRequestInfo } from "../../utils/device/getRequestInfo.js";

export const createUser = async (req, res, next) => {

  try {

    const  verificationEmail = req.verifiedEmail;
    const  {otp} = req.body ?? {};

    // 1. Validate request structure and terms
   const { terms, ...body } = req.body;

if (!body || typeof body !== "object" || terms !== true) {
  const error = new Error("Invalid registration data");
  error.statusCode = statusCode.BAD_REQUEST;
  error.extraDetails =
    "Please provide valid fields and accept the terms.";
  return next(error);
}
    const { gender, fullName, email, password, city } = body;

    // 2. Check required fields
    if (
      !gender?.trim() ||
      !fullName?.trim() ||
      !email?.trim() ||
      typeof password !== "string" ||
      !password ||
      !city?.trim()
    ) {
      const error = new Error("All fields are required");
      error.statusCode = statusCode.BAD_REQUEST;
      return next(error);
    }

    // 3. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 4. Check existing email
    const isEmailExist = await User.findOne({
      email: normalizedEmail,
    });

    if (isEmailExist) {
      const error = new Error("Email already exists");
      error.statusCode = statusCode.CONFLICT;
      error.extraDetails =
        "Please log in or use another email address.";
      return next(error);
    }

    // Verify the Otp 



    // 5. Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // 6. Create user
    await User.create({
      email: normalizedEmail,
      fullName: fullName.trim(),
      password: hashPassword,
      gender,
      terms,
      role : 'user',
      city: city.trim()
    });

    return res.status(statusCode.CREATED).json({
      success: true,
      message: "User created successfully",
    });
  } catch (err) {
    // Handle duplicate email race conditions
    if (err.code === 11000) {
      err.statusCode = statusCode.CONFLICT;
      err.message = "Email already exists";
    }

    next(err);
  }
};


export const loginUser = async (req, res, next) => {
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

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      const error = new Error("Invalid email or password");
      error.status = statusCode.UNAUTHORIZED;
      error.extraDetails = "Please check your login credentials.";
      return next(error);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const error = new Error("Invalid email or password");
      error.status = statusCode.UNAUTHORIZED;
      error.extraDetails = "Please check your login credentials.";
      return next(error);
    }

    // 1. Generate a unique session ID
    const sessionId = crypto.randomUUID();

    // 2. Collect device and request information
    const requestInfo = getRequestInfo(req);

    // 3. Set session expiry to 7 days
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // 4. Save the session in MongoDB
    await Session.create({
      user: user._id,
      sessionId,
      ...requestInfo,
      expiresAt,
    });

    // 5. Generate JWT linked to this session
    const token = jwt.sign(
      {
        userId: user._id,
        sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 6. Set authentication cookie
    const isProduction = process.env.NODE_ENV === "production";
    const cookieMaxAge = 7 * 24 * 60 * 60 * 1000;

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: cookieMaxAge,
      expires: expiresAt,
    });

    const { password: _, ...userData } = user.toObject();

    return res.status(statusCode.OK).json({
      success: true,
      message: "Logged in successfully",
      data: userData,
    });
  } catch (err) {
    return next(err);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

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
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser =  async (req,res,next) => {

  try {
    const user = await User.findById(req.user.userId).select('-password')

    if(!user){
      const error = new Error('User not found')
      error.status = statusCode.UNAUTHORIZED
      error.extraDetails = 'This user is no longer available'

      return next(error)
    }

    res.status(statusCode.OK).json({
      success : true,
      data : user
    })
  } catch (err) {

  next(err)

  }
}

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body ?? {};

    // Validate required fields
    if (
      typeof currentPassword !== "string" ||
      !currentPassword ||
      typeof newPassword !== "string" ||
      !newPassword ||
      typeof confirmPassword !== "string" ||
      !confirmPassword
    ) {
      const error = new Error("All password fields are required");
      error.statusCode = statusCode.BAD_REQUEST;
      return next(error);
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      const error = new Error("New password and confirmation do not match");
      error.statusCode = statusCode.BAD_REQUEST;
      return next(error);
    }

    // Validate new password length
    if (newPassword.length < 8) {
      const error = new Error("New password must be at least 8 characters");
      error.statusCode = statusCode.BAD_REQUEST;
      return next(error);
    }

    // Get user with password
    const user = await User.findById(req.user.userId);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = statusCode.UNAUTHORIZED;
      error.extraDetails = "This user is no longer available";
      return next(error);
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      // Log failed password change attempt
      await logActivity(req.user, "Failed password change", "Security settings", "Failed");
      const error = new Error("Current password is incorrect");
      error.statusCode = statusCode.UNAUTHORIZED;
      error.extraDetails = "Please enter your correct current password";
      return next(error);
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      const error = new Error("New password must be different from current password");
      error.statusCode = statusCode.BAD_REQUEST;
      return next(error);
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Log successful password change
    await logActivity(req.user, "Changed password", "Security settings", "Success");

    return res.status(statusCode.OK).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    // Log unexpected error
    await logActivity(req.user, "Error changing password", "Security settings", "Failed");
    next(err);
  }
};

export const getThemePreference = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('themePreference');

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = statusCode.UNAUTHORIZED;
      error.extraDetails = "This user is no longer available";
      return next(error);
    }

    return res.status(statusCode.OK).json({
      success: true,
      data: { themePreference: user.themePreference || 'system' },
    });
  } catch (err) {
    next(err);
  }
};

export const updateThemePreference = async (req, res, next) => {
  try {
    const { themePreference } = req.body ?? {};

    if (!themePreference || !['light', 'dark', 'system'].includes(themePreference)) {
      const error = new Error("Invalid theme preference");
      error.statusCode = statusCode.BAD_REQUEST;
      error.extraDetails = "Theme preference must be 'light', 'dark', or 'system'";
      return next(error);
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { themePreference },
      { new: true, select: 'themePreference' }
    );

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = statusCode.UNAUTHORIZED;
      error.extraDetails = "This user is no longer available";
      return next(error);
    }

    return res.status(statusCode.OK).json({
      success: true,
      message: "Theme preference updated successfully",
      data: { themePreference: user.themePreference },
    });
  } catch (err) {
    next(err);
  }
};


