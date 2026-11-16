
import { create } from "zustand";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Fetch currently logged-in operator
  fetchUser: async () => {
    set({ isLoading: true });

    try {
      const { data } = await axios.get(
        `${API_URL}/operator/me`,
        { withCredentials: true }
      );

      const currentUser = data?.data;

      if (currentUser) {
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

  // Set user after successful login
  setUser: (user) => {
    set({
      user: user || null,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  // Logout
  logout: async () => {
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
