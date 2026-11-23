
import { create } from "zustand";
import apiUsers from "../api/getadmin";

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

// Prevent duplicate authentication requests
let fetchUserRequest = null;

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Get currently logged-in admin
  fetchUser: async () => {
    if (fetchUserRequest) {
      return fetchUserRequest;
    }

    set({ isLoading: true });

    fetchUserRequest = (async () => {
      try {
        const { data } = await withRetry(() => apiUsers.get("/get-current-user"));

        const currentUser = data?.data;

        if (currentUser?.role === "admin") {
          set({
            user: currentUser,
            isAuthenticated: true,
          });

          return currentUser;
        }

        set({
          user: null,
          isAuthenticated: false,
        });

        return null;
      } catch (error) {
        console.error(
          "Authentication failed:",
          error.response?.data || error.message
        );

        const status = error.response?.status;
        if ([401, 403, 404].includes(status)) {
          set({ user: null, isAuthenticated: false });
        }

        return null;
      } finally {
        set({ isLoading: false });
        fetchUserRequest = null;
      }
    })();

    return fetchUserRequest;
  },

  // Set admin after successful login
  setUser: (user) => {
    if (user?.role === "admin") {
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Clear local authentication state
  clearUser: () => {
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  // Logout
  logout: async () => {
    try {
      await apiUsers.post("/logout", {});
    } catch (error) {
      console.error(
        "Backend logout failed:",
        error.response?.data || error.message
      );
    } finally {
      // Always clear local state, even if the API fails
      fetchUserRequest = null;

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));

export default useAuthStore;
