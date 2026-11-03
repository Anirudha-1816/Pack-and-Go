import statusCode from "./statusCodes.js";

const paymentError = (message, status = statusCode.BAD_REQUEST) => {
  const error = new Error(message);
  error.statusCode = status;
  return error;
};

export default paymentError;