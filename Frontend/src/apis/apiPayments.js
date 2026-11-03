// Calls the signed-in payment endpoints on the backend.

import axios from "axios";

const apiPayments = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/payments`,
  withCredentials: true,
});

// Ask the server to calculate the total and return a Stripe Checkout URL.
export const createStripeCheckoutSession = (tripId, travelers) =>
  apiPayments.post("/create-checkout-session", { tripId, travelers });

// Read the signed-in user's booking status after Stripe redirects back.
export const getPaymentStatus = (bookingId) =>
  apiPayments.get(`/status/${bookingId}`);

export default apiPayments;
