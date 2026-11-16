import { useState, useEffect, useRef } from "react";
import { useThemeStore } from "./themeStore";

const themeIcons = {
  light: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  dark: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  system: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
};

const themeLabels = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const themeDescriptions = {
  light: "Always use light mode",
  dark: "Always use dark mode",
  system: "Match your device settings",
};

export default function ThemeSwitcher({ className = "", showLabels = true, variant = "dropdown" }) {
  const { mode, resolvedTheme, setMode } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (triggerRef.current && !triggerRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleSelect = (newMode) => {
    setMode(newMode);
    setIsOpen(false);
  };

  if (variant === "simple") {
    return (
      <button
        ref={triggerRef}
        type="button"
        className={`theme-switcher-trigger ${className}`}
        onClick={() => useThemeStore.getState().toggleTheme()}
        aria-label={`Current theme: ${themeLabels[resolvedTheme]}. Click to toggle.`}
        title={`Current: ${themeLabels[resolvedTheme]}. Click to toggle.`}
      >
        {themeIcons[resolvedTheme]}
        <span className="sr-only">{themeLabels[resolvedTheme]}</span>
      </button>
    );
  }

  return (
    <div className={`theme-switcher ${className}`} ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        className="theme-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Theme: ${themeLabels[mode]}. Click to change.`}
      >
        {themeIcons[resolvedTheme]}
        {showLabels && <span>{themeLabels[mode]}</span>}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`${isOpen ? "rotate-180" : ""} transition-transform duration-200`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="theme-switcher-menu" role="listbox" aria-label="Select theme">
          {(["light", "dark", "system"]).map((theme) => (
            <button
              key={theme}
              type="button"
              role="option"
              aria-selected={mode === theme}
              className={`theme-switcher-option ${mode === theme ? "active" : ""}`}
              onClick={() => handleSelect(theme)}
            >
              <span className="theme-switcher-option-icon" aria-hidden="true">
                {themeIcons[theme]}
              </span>
              <span>{themeLabels[theme]}</span>
              {showLabels && <span className="text-muted text-xs ml-auto">{themeDescriptions[theme]}</span>}
              {mode === theme && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ml-auto text-[var(--on-primary)]">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Add rotate utility
const style = document.createElement("style");
style.textContent = `
  .rotate-180 { transform: rotate(180deg); }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
`;
if (typeof document !== "undefined" && !document.head.querySelector('style[data-theme-switcher]')) {
  style.setAttribute("data-theme-switcher", "");
  document.head.appendChild(style);
}