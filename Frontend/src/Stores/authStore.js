
import { create } from "zustand";
import apiUsers from "../apis/apiUsers";

const useAuthStore = create((set) => ({
   user: null,
  isAuthenticated: false,
  isLoading: true, // Wait for the initial session check

  // Get the current logged-in user
  fetchUser: async () => {
    set({ isLoading: true });

    try {
      const { data } = await apiUsers.get("/get-current-user");

      set({
        user: data.data,
        isAuthenticated: Boolean(data.data),
      });

  
    } catch (err) {
      set({
        user: null,
        isAuthenticated: false,
      });
      console.log(err)
    } finally {
      set({ isLoading: false });
    }
  },

  // Logout the user
  logout: async () => {
    try {
      await apiUsers.post("/logout");
    } finally {
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },
}));

export default useAuthStore;
