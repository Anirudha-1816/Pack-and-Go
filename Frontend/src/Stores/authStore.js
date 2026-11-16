import { create } from "zustand";
import apiUsers from "../apis/apiUsers";
import { useThemeStore } from "../Sources/themeStore";

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

      // Sync theme preference from backend if available
      if (currentUser?.themePreference) {
        useThemeStore.getState().setMode(currentUser.themePreference);
      }

      return currentUser;
    } catch (err) {
      set({
        user: null,
        isAuthenticated: false,
      });

      console.error(
        "fetchUser failed:",
        err.response?.status,
        err.response?.data || err.message
      );

      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // Update theme preference on backend
  updateThemePreference: async (themePreference) => {
    try {
      await apiUsers.put("/theme-preference", { themePreference });
      set((state) => ({
        user: state.user ? { ...state.user, themePreference } : null,
      }));
      useThemeStore.getState().setMode(themePreference);
      return true;
    } catch (err) {
      console.error("Failed to update theme preference:", err);
      return false;
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