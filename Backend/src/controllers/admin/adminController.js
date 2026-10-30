import bcrypt from 'bcrypt'
import User from "../../models/users/usersModel.js";
import statusCode from '../../utils/statusCodes.js';
import jwt from 'jsonwebtoken';

export const loginAdmin = async (req, res, next) => {
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

    // Same message for "no user", "wrong password" and "not an admin",
    // so nobody can find out which emails exist or who is an admin.
    
    const fail = () => {
      const error = new Error("Invalid email or password");
      error.status = statusCode.UNAUTHORIZED;
      error.extraDetails = "Please check your login credentials.";
      return next(error);
    };

    if (!user) return fail();

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return fail();


    if (user.role !== "admin"){

        const error = new Error('Unauthorized')
        error.status = statusCode.UNAUTHORIZED
        error.extraDetails = 'You are not allow to access this route'
        return next(error)
    } 

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // shorter than a normal user
    );

    const isProd = true

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userData } = user.toObject();

    return res.status(statusCode.OK).json({
      success: true,
      message: "Admin logged in successfully",
      data: userData,
    });
  } catch (err) {
    return next(err);
  }
};