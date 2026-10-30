import { create } from "zustand";
import apiUsers from "../apis/apiUsers";

const useAuthStore = create((set) => ({
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