import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGlassCheers,
  FaRoute,
  FaMountain,
  FaHandshake,
  FaUserFriends,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";
import { getEventCategories } from "./eventCategories";
// The database only stores an icon name. This turns the name into a real icon.
const ICONS = {
  festival: FaGlassCheers,
  trip: FaRoute,
  adventure: FaMountain,
  networking: FaHandshake,
  social: FaUserFriends,
};

// Map category slugs to their form routes
const CATEGORY_ROUTES = {
  "festivals-celebrations": "/operator/add-festival",
  "curated-trips": "/operator/add-package",
  "adventure-outdoors": "/operator/add-adventure",
  "social-gatherings": "/operator/add-social",
  "networking-meetups": "/operator/add-social", // Networking uses social form
};

export default function AddEventModal({ open, onClose }) {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load the categories once
  useEffect(() => {
    getEventCategories()
      .then(setCategories)
      .catch(() => setError("Could not load categories. Please close this and try again."))
      .finally(() => setLoading(false));
    //   console.log(categories)
  }, []);

  // Close with the Escape key
  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const chooseCategory = (category) => {
    onClose();
    const route = CATEGORY_ROUTES[category.slug] || "/operator/add-package";
    navigate(route);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-event-title"
      aria-hidden={!open}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-200 ${
        open ? "visible opacity-100" : "invisible opacity-0"
      }`}
    >
      {/* Dark backdrop, click to close */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Popup card */}
      <div
        className={`relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl transition-transform duration-200 sm:p-8 ${
          open ? "scale-100" : "scale-95"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <FaTimes />
        </button>

        <h2 id="add-event-title" className="pr-10 text-2xl font-semibold text-slate-900">
          What are you hosting?
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Pick a category and we will take you to the right form.
        </p>

        <div className="mt-6 space-y-3">
          {loading && <p className="py-6 text-center text-sm text-slate-500">Loading categories...</p>}

          {error && <p className="py-6 text-center text-sm text-red-600">{error}</p>}

          {categories.map((category) => {
            const Icon = ICONS[category.icon] || FaRoute;

            return (
              <button
                key={category._id}
                type="button"
                onClick={() => chooseCategory(category)}
                className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-teal-700 hover:bg-teal-50/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                {/* Icon turns dark teal on hover */}
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-lg text-teal-800 transition group-hover:bg-teal-800 group-hover:text-white">
                  <Icon />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-900">{category.name}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-slate-500">
                    {category.description}
                  </span>
                </span>

                <FaChevronRight className="shrink-0 text-sm text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-700" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}