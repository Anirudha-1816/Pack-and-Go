import axios from "axios";

const apiPayments = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/payments`,
  withCredentials: true,
});

export const createPaymentOrder = (tripId, travelers) =>
  apiPayments.post("/create-order", { tripId, travelers });

export const verifyPayment = (payment) =>
  apiPayments.post("/verify", payment);

export const getPaymentStatus = (bookingId) =>
  apiPayments.get(`/status/${bookingId}`);

export default apiPayments;