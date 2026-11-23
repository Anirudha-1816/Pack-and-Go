import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
// import toast from "react-hot-toast";
import {
  FaGlassCheers,
  FaRoute,
  FaMountain,
  FaHandshake,
  FaUserFriends,
  FaPlus,
  FaPen,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import {
  getCategories,
  createCategory,
  updateCategory,
  toggleCategory,
  deleteCategory,
} from "./adminEventCategoryApi";

// Same icon names the operator popup uses
const ICONS = {
  festival: { label: "Festival", Icon: FaGlassCheers },
  trip: { label: "Trip", Icon: FaRoute },
  adventure: { label: "Adventure", Icon: FaMountain },
  networking: { label: "Networking", Icon: FaHandshake },
  social: { label: "Social", Icon: FaUserFriends },
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20";

// ---------- Small components ----------

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <FaTimes />
        </button>

        <h2 className="pr-10 text-xl font-semibold text-slate-900">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Switch({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        on ? "bg-teal-700" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

// ---------- Page ----------

export default function ContentManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // the category being edited, or null when adding
  const [deleting, setDeleting] = useState(null); // the category waiting for delete confirmation
  const [toast, setToast] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data || []);
      setError("");
    } catch {
      setError("Could not load categories. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCategories();
  }, []);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Runs an API call, closes the popup, shows the success/error message and reloads the list
  const runAction = async (action, onDone) => {
    try {
      const res = await action();
      onDone?.();
      showToast(res.message || "Done", "success");
      await loadCategories();
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong", "error");
    }
  };

  const openForm = (category = null) => {
    setEditing(category);
    reset(
      category
        ? {
            name: category.name,
            description: category.description,
            icon: category.icon,
            order: category.order,
          }
        : { name: "", description: "", icon: "festival", order: categories.length + 1 }
    );
    setFormOpen(true);
  };

  const onSubmit = (data) => {
    const body = { ...data, order: Number(data.order) };

    return runAction(
      () => (editing ? updateCategory(editing._id, body) : createCategory(body)),
      () => setFormOpen(false)
    );
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Content management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Event categories operators see in the "Add Events" popup. A lower order number shows first.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openForm()}
          className="flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-900"
        >
          <FaPlus className="text-xs" /> Add category
        </button>
      </div>

      {/* Category list */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading && <p className="p-8 text-center text-sm text-slate-500">Loading categories...</p>}

        {error && <p className="p-8 text-center text-sm text-red-600">{error}</p>}

        {!loading && !error && categories.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500">
            No categories yet. Add your first one.
          </p>
        )}

        <ul className="divide-y divide-slate-100">
          {categories.map((category) => {
            const { Icon } = ICONS[category.icon] || ICONS.trip;

            return (
              <li
                key={category._id}
                className={`flex items-center gap-3 p-4 sm:gap-4 ${
                  category.isActive ? "" : "bg-slate-50"
                }`}
              >
                <span className="w-6 text-center text-sm font-semibold text-slate-400">
                  {category.order}
                </span>

                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${
                    category.isActive ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Icon />
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`font-semibold ${
                      category.isActive ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {category.name}
                  </p>
                  <p className="truncate text-sm text-slate-500">{category.description}</p>
                </div>

                <span className="hidden text-xs font-medium text-slate-500 sm:block">
                  {category.isActive ? "Visible" : "Hidden"}
                </span>

                <Switch
                  on={category.isActive}
                  label={`Show ${category.name} to operators`}
                  onChange={() => runAction(() => toggleCategory(category._id))}
                />

                <button
                  type="button"
                  onClick={() => openForm(category)}
                  aria-label={`Edit ${category.name}`}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-teal-800"
                >
                  <FaPen />
                </button>

                <button
                  type="button"
                  onClick={() => setDeleting(category)}
                  aria-label={`Delete ${category.name}`}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <FaTrash />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Add / edit popup */}
      {formOpen && (
        <Modal title={editing ? "Edit category" : "Add category"} onClose={() => setFormOpen(false)}>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input
                {...register("name", { required: "Name is required" })}
                className={inputClass}
                placeholder="Festivals & Celebrations"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                {...register("description", { required: "Description is required" })}
                rows={3}
                className={inputClass}
                placeholder="One short line operators will read"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Icon</label>
                <select {...register("icon")} className={inputClass}>
                  {Object.entries(ICONS).map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Order</label>
                <input
                  type="number"
                  min="0"
                  {...register("order", { required: "Order is required", min: 0 })}
                  className={inputClass}
                />
                {errors.order && <p className="mt-1 text-xs text-red-600">{errors.order.message}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900 disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <Modal title={`Delete "${deleting.name}"?`} onClose={() => setDeleting(null)}>
          <p className="mt-2 text-sm text-slate-500">
            Operators will no longer see this category in the "Add Events" popup.
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => runAction(() => deleteCategory(deleting._id), () => setDeleting(null))}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}

      {/* Success / error message */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[110] rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === "success" ? "bg-teal-800" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}