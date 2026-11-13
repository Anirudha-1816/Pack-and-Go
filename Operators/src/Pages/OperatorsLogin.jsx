import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import styles from "./Auth.module.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const STATUS_STYLES = {
  pending: "statusPending",
  rejected: "statusError",
  error: "statusError",
};

// Logo + name, used on both the dark panel and the mobile top bar
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

export default function OperatorLogin() {
  const [showPassword, setShowPassword] = useState(false);

  // null, or { type: "pending" | "rejected" | "error", title, text }
  const [notice, setNotice] = useState(null);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  // Runs only when every field is valid
  async function onSubmit(data) {
    setNotice(null);

    // The schema saves emails in lowercase without spaces, so we send them the same way
    const loginData = { ...data, email: data.email.trim().toLowerCase() };
    console.log(loginData);

    try {
      const res = await axios.post(`${API_URL}/operator/login`, loginData, { withCredentials: true });

      console.log(res);

      navigate("/operator/dashboard", { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong. Please try again.";
      if (err.response?.data?.status === "pending")
        setNotice({ type: "pending", title: "Waiting for approval", text: message });
      else if (err.response?.data?.status === "rejected")
        setNotice({ type: "rejected", title: "Application not approved", text: message }); // message can hold rejectionReason
      else setNotice({ type: "error", title: "Could not sign in", text: message });
    }
  }

  return (
    <main className={styles.page}>
      {/* ---------- Mobile top bar (the big panel is hidden on phones) ---------- */}
      <div className={styles.mobileTopBar}>
        <Brand />
      </div>

      {/* ---------- Left: dark brand panel ---------- */}
      <section className={styles.leftPanel}>
        <div className="relative">
          <Brand />
        </div>

        <div className="relative max-w-[460px]">
          <div className={styles.brandDivider} />
          <h1 className={styles.leftPanelTitle}>
            Great trips start with great operators.
          </h1>
          <p className={styles.leftPanelText}>
            Sign in to manage your trips and keep your availability up to date.
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
            <Link
              to="/"
              className={styles.backLink}
            >
              Back to website
            </Link>
          </div>

          <div className="mx-auto my-auto w-full max-w-[440px] py-3">
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>
                Operator sign in
              </h2>
              <p className={styles.formSubtitle}>Welcome back. Sign in to your operator account.</p>

              {/* Account status message */}
              {notice && (
                <div
                  role="alert"
                  className={`${styles.statusMessage} ${styles[STATUS_STYLES[notice.type]]}`}
                >
                  <p className={styles.statusTitle}>{notice.title}</p>
                  <p className="mt-0.5 leading-relaxed">{notice.text}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
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

                {/* Password */}
                <div className={styles.formGroup}>
                  <label htmlFor="password" className={styles.label}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      aria-invalid={errors.password ? "true" : "false"}
                      className={`${styles.input} ${styles.inputWithToggle} ${errors.password ? styles.inputError : ""}`}
                      {...register("password", {
                        required: "Password is required",
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.passwordToggle}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.password && (
                    <p className={styles.errorText} role="alert">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember me */}
                <label className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    {...register("rememberMe")}
                  />
                  Keep me signed in
                </label>

                <button
                  type="submit"
                  className={styles.submitBtn}
                >
                  Sign in
                </button>
              </form>

              {/* New operators apply here */}
              <p className={styles.linkText}>
                New to Pack&Go?{" "}
                <Link
                  to="/operator/register"
                  className={styles.link}
                >
                  Apply to become an operator
                </Link>
              </p>
            </div>
          </div>
        </div>
        </section>
        </main>
  );
}