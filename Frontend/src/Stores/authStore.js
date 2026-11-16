import { create } from "zustand";
import apiUsers from "../apis/apiUsers";

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Get the current logged-in user.
  fetchUser: async () => {
    set({ isLoading: true });

    try {
      const { data } = await apiUsers.get("/get-current-user");

      const currentUser = data.data;

      set({
        user: currentUser,
        isAuthenticated: Boolean(currentUser),
      });

      return currentUser;
    } catch (err) {
      // Only clear auth state on genuine authentication failure (401/403)
      // Network errors, timeouts, 5xx should NOT log the user out
      const status = err.response?.status;
      const isAuthError = status === 401 || status === 403;

      if (isAuthError) {
        set({
          user: null,
          isAuthenticated: false,
        });
      }

      console.error(
        "fetchUser failed:",
        status,
        err.response?.data || err.message
      );

      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // Logout the user.
  logout: async () => {
    try {
      await apiUsers.post("/logout");
    } catch (err) {
      console.error(
        "Logout failed:",
        err.response?.data || err.message
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