import { useState } from "react";
import { useForm } from "react-hook-form";
import { Camera } from "lucide-react";
import styles from "./AddAdmin.module.css";
import toast from "react-hot-toast";
import AdminSideNav from "../Dashboard/components/AdminSideNav";

// ---------- Dropdown options ----------
const roles = ["Super Admin", "Admin", "Moderator"];

// today's date for validation
const today = new Date().toLocaleDateString("en-CA");

// ---------- Small helper: a label + input + error message ----------
function Field({ label, error, children }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {error && <small className={styles.error}>{error.message}</small>}
    </label>
  );
}

export default function AddAdmin() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { role: "Admin" },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data) => {
    console.log("Form data:", data);
    setIsSubmitting(true);
    const toastId = toast.loading("Adding admin...");

    try {
      // TODO: Add API call when backend is ready
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Admin added successfully", { id: toastId });
      reset();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* NEW: sidebar slot */}
      <aside className={styles.sidebar}>
        <AdminSideNav />
      </aside>

      {/* NEW: everything else lives inside content */}
      <main className={styles.content}>
        <h1 className={styles.title}>Add admin user</h1>

        <form className={styles.box} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.layout}>
            {/* ================= LEFT SIDE ================= */}
            <div className={styles.left}>
              {/* Profile image */}
              <div className={styles.imageBox}>
                <Camera />
                <p>Profile photo (optional)</p>
              </div>

              {/* Role */}
              <Field label="Role" error={errors.role}>
                <select
                  className={styles.input}
                  {...register("role", { required: "Select a role" })}
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* ================= RIGHT SIDE ================= */}
            <div className={styles.right}>
              {/* Full name */}
              <Field label="Full name" error={errors.fullName}>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className={styles.input}
                  {...register("fullName", { required: "Full name is required" })}
                />
              </Field>

              {/* Email */}
              <Field label="Email address" error={errors.email}>
                <input
                  type="email"
                  placeholder="e.g. john@example.com"
                  className={styles.input}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                />
              </Field>

              {/* Phone */}
              <Field label="Phone number" error={errors.phone}>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  className={styles.input}
                  {...register("phone", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[+\d\s()-]{7,20}$/,
                      message: "Enter a valid phone number",
                    },
                  })}
                />
              </Field>

              {/* Password */}
              <Field label="Password" error={errors.password}>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  className={styles.input}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                />
              </Field>

              {/* Permissions */}
              <div className={styles.permissions}>
                <h3 className={styles.permissionTitle}>Permissions</h3>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" {...register("permissions.bookings")} />
                    <span>Manage bookings</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" {...register("permissions.trips")} />
                    <span>Manage trips</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" {...register("permissions.feedback")} />
                    <span>View feedback</span>
                  </label>
                </div>
              </div>

              {/* Date fields */}
              <div className={styles.row}>
                <Field label="Start date" error={errors.startDate}>
                  <input
                    type="date"
                    min={today}
                    className={styles.input}
                    {...register("startDate", { required: "Start date is required" })}
                  />
                </Field>
                <Field label="End date" error={errors.endDate}>
                  <input
                    type="date"
                    min={today}
                    className={styles.input}
                    {...register("endDate", {
                      required: "End date is required",
                      validate: (value) =>
                        new Date(value) >= new Date(watch("startDate")) ||
                        "End date must be after start date",
                    })}
                  />
                </Field>
              </div>

              <button type="submit" className={styles.submit} disabled={isSubmitting}>
                {isSubmitting && <span className={styles.spinner} aria-hidden="true" />}
                {isSubmitting ? "Adding admin..." : "Add admin"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}