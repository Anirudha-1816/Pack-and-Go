
import User from "../../models/users/usersModel.js";
import bcrypt from "bcrypt";
import jwt  from 'jsonwebtoken'
import statusCode from "../../utils/statusCodes.js";

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
    const { gender, fullName, email, password } = body;

    // 2. Check required fields
    if (
      !gender?.trim() ||
      !fullName?.trim() ||
      !email?.trim() ||
      typeof password !== "string" ||
      !password
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
      role : 'user'
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
    })

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

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,// Ask Sir about it How it work differently on both production and development 
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
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
    res.clearCookie("token", {
      httpOnly: true,
      secure: "production",
      sameSite: "lax",
      path: "/",
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