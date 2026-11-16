import axios from "axios";

const apiTrip = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/trip`,
  withCredentials: true,
});

// Response interceptor: only treat 401/403 as auth failures
apiTrip.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isAuthError = status === 401 || status === 403;

    if (isAuthError) {
      console.debug('Auth error intercepted (trip):', status, error.response?.data?.message);
    }

    return Promise.reject(error);
  }
);

export default apiTrip;