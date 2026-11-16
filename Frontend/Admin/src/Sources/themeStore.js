import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const getSystemTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = (portal, theme) => {
  if (typeof document === "undefined") return;

  const html = document.documentElement;
  html.setAttribute("data-portal", portal);
  html.setAttribute("data-theme", theme);

  // Also set a class for CSS-in-JS solutions if needed
  html.classList.remove("light", "dark");
  html.classList.add(theme);
};

export const useThemeStore = create(
  persist(
    (set, get) => ({
      mode: "system",
      resolvedTheme: "light",
      portal: "traveler",

      setMode: (mode) => {
        const resolved = mode === "system" ? getSystemTheme() : mode;
        set({ mode, resolvedTheme: resolved });
        applyTheme(get().portal, resolved);
      },

      setPortal: (portal) => {
        const { mode, resolvedTheme } = get();
        set({ portal });
        applyTheme(portal, resolvedTheme);
      },

      initialize: () => {
        const { mode, portal } = get();
        const resolved = mode === "system" ? getSystemTheme() : mode;
        set({ resolvedTheme: resolved });
        applyTheme(portal, resolved);

        // Listen for system theme changes
        if (typeof window !== "undefined") {
          const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
          const handler = () => {
            const { mode, portal } = get();
            if (mode === "system") {
              const newResolved = mediaQuery.matches ? "dark" : "light";
              set({ resolvedTheme: newResolved });
              applyTheme(portal, newResolved);
            }
          };
          mediaQuery.addEventListener("change", handler);

          // Store cleanup function
          (window).__themeCleanup = () => mediaQuery.removeEventListener("change", handler);
        }
      },

      toggleTheme: () => {
        const { mode, resolvedTheme } = get();
        if (mode === "system") {
          // Switch to explicit opposite of current resolved
          const newMode = resolvedTheme === "dark" ? "light" : "dark";
          get().setMode(newMode);
        } else {
          // Toggle between light and dark
          const newMode = mode === "dark" ? "light" : "dark";
          get().setMode(newMode);
        }
      },
    }),
    {
      name: "packgo-theme",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mode: state.mode,
        portal: state.portal,
      }),
    }
  )
);

// Initialize theme on app load
if (typeof window !== "undefined") {
  useThemeStore.getState().initialize();
}