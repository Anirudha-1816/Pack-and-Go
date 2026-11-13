import { create } from "zustand";
import apiUsers from "../api/getadmin";
import { useThemeStore } from "../Sources/themeStore";

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Get currently logged-in admin
  fetchUser: async () => {
    set({ isLoading: true });

    try {
      const { data } = await apiUsers.get("/get-current-user");

      const currentUser = data?.data;

      if (currentUser?.role === "admin") {
        set({
          user: currentUser,
          isAuthenticated: true,
        });

        // Sync theme preference from backend if available
        if (currentUser?.themePreference) {
          useThemeStore.getState().setMode(currentUser.themePreference);
        }

        return currentUser;
      }

      set({
        user: null,
        isAuthenticated: false,
      });

      return null;
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
      });

      console.error(
        "Authentication failed:",
        error.response?.data || error.message
      );

      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // Set admin after successful login
  setUser: (user) => {
    if (user?.role === "admin") {
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      // Sync theme preference from backend if available
      if (user?.themePreference) {
        useThemeStore.getState().setMode(user.themePreference);
      }
    } else {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
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

  // Logout
  logout: async () => {
    try {
      await apiUsers.post(
        "/logout",
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