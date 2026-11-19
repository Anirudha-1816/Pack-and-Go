import axios from "axios";

// Base URL for the Pack&Go backend API.
// Falls back to localhost so the app keeps working even if the env var is missing.
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

const tripsBaseUrlApi = axios.create({
  baseURL: `${API_URL}/operator`,
  withCredentials: true, // send/receive the auth cookie
});

export default tripsBaseUrlApi;