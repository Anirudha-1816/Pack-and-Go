import axios from "axios";

const apiFeedback = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/feedback`,
  withCredentials: true,
});

// Response interceptor: only treat 401/403 as auth failures
apiFeedback.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isAuthError = status === 401 || status === 403;

    if (isAuthError) {
      console.debug("Auth error intercepted (feedback):", status, error.response?.data?.message);
    }

    return Promise.reject(error);
  }
);

export default apiFeedback;