import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const options = { withCredentials: true };

// Every function returns the server response: { success, data, message }

/**
 * Fetch current user profile (name, email, createdAt)
 * GET /users/get-current-user
 */
export const getCurrentUser = () =>
  axios.get(`${API_URL}/users/get-current-user`, options).then((res) => res.data);

/**
 * Update password
 * PUT /users/update-password
 * Body: { currentPassword, newPassword, confirmPassword }
 */
export const updatePassword = (body) =>
  axios.put(`${API_URL}/users/update-password`, body, options).then((res) => res.data);

/**
 * Fetch platform policies
 * GET /admin/policies
 */
export const getPolicies = () =>
  axios.get(`${API_URL}/admin/policies`, options).then((res) => res.data);

/**
 * Update platform policies
 * PUT /admin/policies
 * Body: { userSignup, operatorSignup, operatorApproval, cancellation, reviews, suspension }
 */
export const updatePolicies = (body) =>
  axios.put(`${API_URL}/admin/policies`, body, options).then((res) => res.data);

/**
 * Fetch activity logs with search, filter, pagination
 * GET /admin/activity-logs?search=&status=&page=&limit=
 * Returns: { success, data, total, page, totalPages }
 */
export const getActivityLogs = (params = {}) =>
  axios.get(`${API_URL}/admin/activity-logs`, { ...options, params }).then((res) => res.data);