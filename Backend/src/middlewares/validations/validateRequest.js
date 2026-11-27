// import { statusCode } from "../../utils/statusCodes.js";

import statusCode from "../../utils/statusCodes.js";

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const error = new Error("Validation failed");

      error.statusCode = statusCode.BAD_REQUEST;
      error.extraDetails = result.error.issues.map(
        (issue) => ({
          field: issue.path.join("."),
          message: issue.message
        })
      );

      return next(error);
    }

    // Replace request body with validated and transformed data
    req.body = result.data;

    next();
  };
};
