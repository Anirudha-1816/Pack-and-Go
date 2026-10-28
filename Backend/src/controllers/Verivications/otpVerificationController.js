import dotenv from 'dotenv'
import statusCode from "../../utils/statusCodes.js";
import OTP from "../../models/verifications/verificationModel.js";
import bcrypt from "bcrypt";
import crypto from "node:crypto";

import jwt from 'jsonwebtoken'

import { transporter } from "../../utils/emails/sendEmail.js";

dotenv.config()

// Send the original `otp` by email using Nodemailer.


export const createOtp = async (req, res, next) => {
  try {
    const email = req.body?.email?.toLowerCase().trim();

    if (!email) {
      const error = new Error("Email is required.");
      error.status = statusCode.BAD_REQUEST;
      return next(error);
    }

    // 1. Generate a 6-digit OTP
    const otp = crypto
      .randomInt(0, 1_000_000)
      .toString()
      .padStart(6, "0");

    // 2. Hash the OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    // 3. Store the hashed OTP
    await OTP.findOneAndUpdate(
      { email },
      {
        email,
        hashedOtp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
      }
    );

    // 4. Send the OTP by email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Pack&Go Verification Code",
      text: `Your OTP is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`,
    });


    // 5. Respond after the email has been sent
    return res.status(statusCode.OK).json({
      success: true,
      message: "OTP sent successfully to your email.",
    });
  } catch (err) {
    return next(err);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body ?? {};

    if (!email || !otp) {
      const error = new Error("Email and OTP are required.");
      error.status = statusCode.BAD_REQUEST;
      return next(error);
    }

    if (!/^\d{6}$/.test(otp)) {
      const error = new Error("Please enter a valid 6-digit OTP.");
      error.status = statusCode.BAD_REQUEST;
      return next(error);
    }

    const verification = await OTP.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!verification) {
      const error = new Error("OTP not found. Please request a new OTP.");
      error.status = statusCode.BAD_REQUEST;
      return next(error);
    }

    if (verification.expiresAt <= new Date()) {
      await OTP.deleteOne({ _id: verification._id });

      const error = new Error("OTP has expired. Please request a new one.");
      error.status = statusCode.BAD_REQUEST;
      extraDetails = ('Otp expired please try again with new section ')
      return next(error);
    }

    if (verification.attempts >= 5) {
      await OTP.deleteOne({ _id: verification._id });

      const error = new Error("Too many attempts. Please request a new OTP.");
      error.status = statusCode.BAD_REQUEST;
      return next(error);
    }

    const isOtpValid = await bcrypt.compare(
      otp,
      verification.hashedOtp
    );

    if (!isOtpValid) {
      verification.attempts += 1;
      await verification.save();
      
      const error = new Error("Incorrect OTP.");
      error.status = statusCode.BAD_REQUEST;
      return next(error);
    }

    const verificationToken = jwt.sign(
      {email: verification.email,
        purpose : 'email_verification'
      },
        process.env.EMAIL_VERIFICATION_SECRET,
        {expiresIn : '10min'}
    )
    
    await OTP.deleteOne({ _id: verification._id });

    return res.status(statusCode.OK).json({
      success: true,
      message: "Email verified successfully.",
      verificationToken
      
    });
  } catch (err) {
    next(err);
  }
};


