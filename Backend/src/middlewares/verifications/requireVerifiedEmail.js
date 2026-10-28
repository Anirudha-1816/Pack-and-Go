import jwt from "jsonwebtoken";
import statusCode from "../../utils/statusCodes.js";
export const requireVerifiedEmail = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      const error = new Error("Email verification is required.");
      error.status = statusCode.FORBIDDEN;
      return next(error);
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.EMAIL_VERIFICATION_SECRET
    );

    if (
      decoded.purpose !== "email_verification" ||
      !decoded.email
    ) {
      const error = new Error("Invalid verification token.");
      error.status = statusCode.FORBIDDEN;
      return next(error);
    }

    const requestedEmail = req.body?.email?.toLowerCase().trim();
    const verifiedEmail = decoded.email.toLowerCase().trim();

    if (!requestedEmail || requestedEmail !== verifiedEmail) {
      const error = new Error(
        "The verified email does not match the requested email."
      );
      error.status = statusCode.FORBIDDEN;
      return next(error);
    }

    req.verifiedEmail = verifiedEmail;
    next();
  } catch {
    const error = new Error(
      "Verification token is invalid or has expired."
    );
    error.status = statusCode.FORBIDDEN;
    next(error);
  }
};