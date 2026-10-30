import { create } from "zustand";
import apiUsers from "../api/getadmin";

const useAuthStore = create((set) => ({
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
    } else {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
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