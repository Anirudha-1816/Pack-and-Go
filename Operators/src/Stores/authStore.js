
import { create } from "zustand";
import axios from "axios";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retries only when the server is unreachable or waking up (network error or 5xx).
// 4xx errors are never retried.
async function withRetry(request, retries = 2, delayMs = 3000) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await request();
    } catch (err) {
      const status = err.response?.status;
      const retryable = !err.response || status >= 500;
      if (!retryable || attempt >= retries) throw err;
      await wait(delayMs);
    }
  }
}

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

let authRequestId = 0;

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Fetch currently logged-in operator
  fetchUser: async () => {
    const requestId = ++authRequestId;

    set({ isLoading: true });

    try {
      const { data } = await withRetry(() =>
        axios.get(`${API_URL}/operator/me`, { withCredentials: true })
      );

      const currentUser = data?.data || null;

      // Ignore outdated requests
      if (requestId !== authRequestId) return null;

      set({
        user: currentUser,
        isAuthenticated: !!currentUser,
      });

      return currentUser;

    } catch (error) {
      // Ignore outdated requests
      if (requestId !== authRequestId) return null;

      const status = error.response?.status;
      if ([401, 403, 404].includes(status)) {
        set({ user: null, isAuthenticated: false });
      }

      console.error(
        "Authentication failed:",
        error.response?.data || error.message
      );

      return null;

    } finally {
      if (requestId === authRequestId) {
        set({ isLoading: false });
      }
    }
  },

  // Set user after successful login
  setUser: (user) => {
    authRequestId++;

    set({
      user: user || null,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  // Logout
  logout: async () => {
    authRequestId++;

    try {
      await axios.post(
        `${API_URL}/operator/logout`,
        {},
        { withCredentials: true }
      );

    } catch (error) {
      console.error(
        "Logout failed:",
        error.response?.data || error.message
      );

    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));

export default useAuthStore;
  