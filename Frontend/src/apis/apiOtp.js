import axios from "axios";

const apiOtp = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/otp`,
  withCredentials: true,
});

// Response interceptor: only treat 401/403 as auth failures
apiOtp.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isAuthError = status === 401 || status === 403;

    if (isAuthError) {
      console.debug('Auth error intercepted (otp):', status, error.response?.data?.message);
    }

    return Promise.reject(error);
  }
);

export default apiOtp;