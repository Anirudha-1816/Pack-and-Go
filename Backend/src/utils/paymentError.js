// Create payment errors with an HTTP status the error middleware can return.

import statusCode from "./statusCodes.js";

// Attach the status code while leaving error handling to the shared middleware.
const paymentError = (message, status = statusCode.BAD_REQUEST) => {
  const error = new Error(message);
  error.statusCode = status;
  return error;
};

export default paymentError;