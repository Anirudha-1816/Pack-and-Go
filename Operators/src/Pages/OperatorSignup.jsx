import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import styles from "./Auth.module.css";

const MAX_PHOTO_MB = 5;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const SUBMIT_STATUS_STYLES = {
  success: "statusSuccess",
  error: "statusError",
};

// Logo + name, used on both the blue panel and the mobile top bar
function Brand() {
  return (
    <div className={styles.brand}>
      <img src="/operators.png" alt="" className="h-9 w-9" />
      <span className={styles.brandName}>
        Pack<span className={styles.brandAmp}>&</span>Go
      </span>
      <span className={styles.brandBadge}>Operator</span>
    </div>
  );
}

// Show / hide button inside a password field
function ShowHide({ shown, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={styles.passwordToggle}
    >
      {shown ? "Hide" : "Show"}
    </button>
  );
}

export default function OperatorSignup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [preview, setPreview] = useState(""); // link to show the chosen photo
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const fileInput = useRef(null);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    resetField,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      location: "",
      experience: "",
      password: "",
      confirmPassword: "",
      agree: false,
    },
  });

  // The photo input needs our own ref too (to open it from the button)
  const { ref: photoRef, ...photoField } = register("profileImage", {
    validate: (files) => {
      const file = files?.[0];
      if (!file) return true; // the photo is optional
      if (!file.type.startsWith("image/")) return "Please choose an image file";
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) return `Photo must be under ${MAX_PHOTO_MB} MB`;
      return true;
    },
  });

  // Show a small preview of the chosen photo
  const photoFiles = watch("profileImage");
  useEffect(() => {
    const file = photoFiles?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFiles]);

  // Runs only when every field is valid
  async function onSubmit(data) {
    setSubmitStatus(null);
    setSubmitting(true);

    const formData = new FormData();
    formData.append("name", data.name.trim());
    formData.append("email", data.email.trim().toLowerCase());
    formData.append("password", data.password);
    formData.append("phone", data.phone.trim());
    formData.append("location", data.location.trim());
    formData.append("experience", String(Number(data.experience || 0)));

    if (data.profileImage?.[0]) {
      formData.append("media", data.profileImage[0]);
    }

    try {
      const response = await axios.post(
        `${API_URL}/operator/register`,
        formData,
        { withCredentials: true }
      );
      setSubmitStatus({
        type: "success",
        message: response.data.message || "Your application was submitted successfully.",
      });
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: error.response?.data?.message || "Could not submit your application. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      {/* ---------- Mobile top bar (the big panel is hidden on phones) ---------- */}
      <div className={styles.mobileTopBar}>
        <Brand />
      </div>

      {/* ---------- Left: blue brand panel ---------- */}
      <section className={styles.leftPanel}>
        <div className="relative">
          <Brand />
        </div>

        <div className="relative max-w-[460px]">
          <div className={styles.brandDivider} />
          <h1 className={styles.leftPanelTitle}>
            Run trips people remember.
          </h1>
          <p className={styles.leftPanelText}>
            Apply in a few minutes. Our team reviews every application before your account goes live.
          </p>
        </div>

        <p className={styles.copyright}>
          © {new Date().getFullYear()} Pack&Go
        </p>
      </section>

      {/* ---------- Right: the form ---------- */}
      <section className={styles.rightPanel}>
        <div className={styles.rightInner}>
          <div className={styles.flexJustifyEnd}>
            <Link to="/" className={styles.backLink}>
              Back to website
            </Link>
          </div>

          <div className="mx-auto my-auto w-full max-w-[520px] py-3">
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>
                Become an operator
              </h2>
              <p className={styles.formSubtitle}>
                Create your account and share the trips you love.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Profile photo (optional) */}
                <div className={styles.photoUpload}>
                  <div className={styles.photoPreview}>
                    {preview ? (
                      <img src={preview} alt="Your profile preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className={styles.photoPreviewPlaceholder}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Profile photo (optional)</p>
                    <div className={styles.photoActions}>
                      <button
                        type="button"
                        onClick={() => fileInput.current.click()}
                        className={styles.photoBtn}
                      >
                        {preview ? "Change photo" : "Choose photo"}
                      </button>
                      {preview && (
                        <button
                          type="button"
                          onClick={() => {
                            fileInput.current.value = "";
                            resetField("profileImage");
                          }}
                          className={styles.photoBtnRemove}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {errors.profileImage && (
                      <p className={styles.errorText} role="alert">
                        {errors.profileImage.message}
                      </p>
                    )}
                  </div>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  {...photoField}
                  ref={(el) => {
                    photoRef(el);
                    fileInput.current = el;
                  }}
                  className={styles.fileInputHidden}
                />

                {/* Name */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.label}>
                      Full name
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      autoComplete="name"
                      aria-invalid={errors.name ? "true" : "false"}
                      className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
                      {...register("name", {
                        required: "Name is required",
                        minLength: { value: 2, message: "Name must be at least 2 characters" },
                      })}
                    />
                    {errors.name && (
                      <p className={styles.errorText} role="alert">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      aria-invalid={errors.email ? "true" : "false"}
                      className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Enter a valid email address",
                        },
                      })}
                    />
                    {errors.email && (
                      <p className={styles.errorText} role="alert">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone and location */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="phone" className={styles.label}>
                      Phone number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                      aria-invalid={errors.phone ? "true" : "false"}
                      className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                      {...register("phone", {
                        required: "Phone number is required",
                        pattern: {
                          value: /^\+?[0-9\s-]{10,15}$/,
                          message: "Enter a valid phone number",
                        },
                      })}
                    />
                    {errors.phone && (
                      <p className={styles.errorText} role="alert">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="location" className={styles.label}>
                      Location
                    </label>
                    <input
                      id="location"
                      type="text"
                      placeholder="City you operate from"
                      autoComplete="address-level2"
                      aria-invalid={errors.location ? "true" : "false"}
                      className={`${styles.input} ${errors.location ? styles.inputError : ""}`}
                      {...register("location", { required: "Location is required" })}
                    />
                    {errors.location && (
                      <p className={styles.errorText} role="alert">
                        {errors.location.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Experience */}
                <div className={styles.formGroup}>
                  <label htmlFor="experience" className={styles.label}>
                    Years of experience <span className={styles.labelOptional}>(optional)</span>
                  </label>
                  <input
                    id="experience"
                    type="number"
                    min="0"
                    max="60"
                    placeholder="0"
                    aria-invalid={errors.experience ? "true" : "false"}
                    className={`${styles.input} ${errors.experience ? styles.inputError : ""}`}
                    {...register("experience", {
                      validate: (value) =>
                        value === "" || (Number(value) >= 0 && Number(value) <= 60) || "Enter a number from 0 to 60",
                    })}
                  />
                  {errors.experience && (
                    <p className={styles.errorText} role="alert">
                      {errors.experience.message}
                    </p>
                  )}
                </div>

                {/* Passwords */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="password" className={styles.label}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        aria-invalid={errors.password ? "true" : "false"}
                        className={`${styles.input} ${styles.inputWithToggle} ${errors.password ? styles.inputError : ""}`}
                        {...register("password", {
                          required: "Password is required",
                          minLength: { value: 8, message: "Use at least 8 characters" },
                        })}
                      />
                      <ShowHide shown={showPassword} onClick={() => setShowPassword(!showPassword)} />
                    </div>
                    {errors.password && (
                      <p className={styles.errorText} role="alert">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="confirmPassword" className={styles.label}>
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Type it again"
                        autoComplete="new-password"
                        aria-invalid={errors.confirmPassword ? "true" : "false"}
                        className={`${styles.input} ${styles.inputWithToggle} ${errors.confirmPassword ? styles.inputError : ""}`}
                        {...register("confirmPassword", {
                          required: "Please confirm your password",
                          validate: (value) => value === getValues("password") || "Passwords do not match",
                        })}
                      />
                      <ShowHide shown={showConfirm} onClick={() => setShowConfirm(!showConfirm)} />
                    </div>
                    {errors.confirmPassword && (
                      <p className={styles.errorText} role="alert">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Terms */}
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded"
                    {...register("agree", { required: "Please accept the terms to continue" })}
                  />
                  <span>
                    I agree to the{" "}
                    <Link to="/terms" className={styles.link}>
                      Terms and conditions
                    </Link>{" "}
                    and the{" "}
                    <Link to="/privacy" className={styles.link}>
                      Privacy policy
                    </Link>
                    .
                  </span>
                </div>
                {errors.agree && (
                  <p className={styles.errorText} role="alert">
                    {errors.agree.message}
                  </p>
                )}

                {submitStatus && (
                  <p
                    className={`${styles.statusMessage} ${styles[SUBMIT_STATUS_STYLES[submitStatus.type]]}`}
                    role={submitStatus.type === "error" ? "alert" : "status"}
                  >
                    {submitStatus.message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.submitBtn}
                >
                  {submitting ? "Submitting..." : "Submit application"}
                </button>
              </form>

              <p className={styles.linkText}>
                Already have an account?{" "}
                <Link
                  to="/operator/login"
                  className={styles.link}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
          </div>

          <p className={styles.footerNote}>
            New accounts are reviewed and approved by the Pack&Go team.
          </p>
        </section>
      </main>
  );
}