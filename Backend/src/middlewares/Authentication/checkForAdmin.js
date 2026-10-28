
import statusCode from "../../utils/statusCodes.js";
import User from "../../models/users/usersModel.js";

const checkForAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      const error = new Error("Please login first check");
      error.status = statusCode.UNAUTHORIZED;
      return next(error);
    }

    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("User not found");
      error.status = statusCode.NOT_FOUND;
      return next(error);
    }

    if (user.role !== "admin") {
      const error = new Error("You are not authorized");
      error.status = statusCode.FORBIDDEN;
      error.extraDetails = "Admin access required";
      return next(error);
    }

    next();
  } catch (err) {
    next(err);
  }
};

export default checkForAdmin;
