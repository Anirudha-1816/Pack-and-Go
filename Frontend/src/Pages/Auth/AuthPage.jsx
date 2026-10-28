
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

import styles from "./Auth.module.css";
import apiUsers from "../../apis/apiUsers";
import useAuthStore from "../../Stores/authStore";
import OtpVerification from "./OtpVerification";
import Navbar from "../../Components/Navbar/Navbar";

const OTP_API = `${import.meta.env.VITE_API_URL}/otp`;

const emailRe =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

const fakeDomains = [
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "trashmail.com",
  "fakeinbox.com",
  "example.com",
  "test.com",
];

function Field({ label, error, children }) {
  return (
    <label className={`${styles.field} ${error ? styles.bad : ""}`}>
      <span>{label}</span>
      {children}
      {error && <small role="alert">{error.message}</small>}
    </label>
  );
}

export default function AuthPage({ signup = true }) {
  const [isSignup, setIsSignup] = useState(signup);
  const [show, setShow] = useState(false);
  const [pendingSignup, setPendingSignup] = useState(null);
  const [showOtp, setShowOtp] = useState(false);

  const navigate = useNavigate();
  const fetchUser = useAuthStore((state) => state.fetchUser);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      gender: "",
    },
  });

  const switchMode = () => {
    setIsSignup((current) => !current);
    setShow(false);
    setPendingSignup(null);
    setShowOtp(false);
    reset();
  };

  // Handle signup OTP request or user login.
  const onSubmit = async ({ confirmPassword, terms, ...body }) => {
    try {
      if (isSignup) {
        const email = body.email.trim().toLowerCase();

        // Request OTP before showing the verification screen.
        const response = await axios.post(`${OTP_API}/create`, {
          email,
        });

        // Keep signup details until OTP verification is complete.
        setPendingSignup({
          ...body,
          email,
          confirmPassword,
          terms,
        });

        setShowOtp(true);

        toast.success(
          response.data.message || `Verification code sent to ${email}`
        );

        return;
      }

      // Existing login flow.
const response = await apiUsers.post("/login", {
  email: body.email.trim().toLowerCase(),
  password: body.password,
});

const user = await fetchUser();

if (!user) {
  toast.error("Login worked, but your session could not be verified. Please try again.");
  return;
}

toast.success(response.data.message || "Login successful!");

navigate(user.role === "admin" ? "/admin-dashboard" : "/", { replace: true });
    } catch (error) {
      console.error(
        "Authentication error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };

  // Return to signup and restore entered details.
  const handleBackToSignup = () => {
    setShowOtp(false);

    if (pendingSignup) {
      reset(pendingSignup);
    }
  };

  // Called by OtpVerification after the backend verifies the OTP.
  const handleOtpVerified = async ({ email, verificationToken }) => {
    if (!pendingSignup) {
      toast.error("Signup details are missing. Please try again.");
      setShowOtp(false);
      return;
    }

    try {
      const { terms, ...body } = pendingSignup;

      // Backend validates the verification token before account creation.
      await apiUsers.post(
        "/create",
        {
          ...body,
          terms,
          email: email.trim().toLowerCase(),
        },
        {
          headers: {
            Authorization: `Bearer ${verificationToken}`,
          },
        }
      );

      toast.success(
        "Email verified! Your account is ready. Please log in."
      );

      setShowOtp(false);
      setPendingSignup(null);
      setIsSignup(false);
      setShow(false);
      reset();
    } catch (error) {
      console.error(
        "Signup error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Could not create your account. Please try again."
      );

      // Keep the OTP screen and signup details for retrying.
    }
  };

  // Render OTP verification separately from the signup form.
  if (showOtp && pendingSignup) {
    return (
      <>
      <main className={styles.page}>
        <div className={styles.card}>
          <OtpVerification
            email={pendingSignup.email}
            onVerified={handleOtpVerified}
            onChangeEmail={handleBackToSignup}
            />
        </div>
      </main>
            </>
    );
  }

  return (
    <>
    <Navbar/>
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>

        <form
          className={styles.form}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          {/* Full name */}
          {isSignup && (
            <Field label="Full name" error={errors.fullName}>
              <input
                autoComplete="name"
                placeholder="Your full name"
                {...register("fullName", {
                  required: "Enter your full name",
                  pattern: {
                    value: /^\p{L}[\p{L}\s.'-]+$/u,
                    message: "Use letters only",
                  },
                })}
              />
            </Field>
          )}

          {/* Email */}
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              autoComplete="email"
              placeholder="Email address"
              {...register("email", {
                required: "Enter your email",
                pattern: {
                  value: emailRe,
                  message: "Enter a valid email address",
                },
                validate: (value) => {
                  const email = value.trim().toLowerCase();
                  const domain = email.split("@")[1];

                  return (
                    (!email.includes("..") &&
                      !fakeDomains.includes(domain)) ||
                    "Please use a valid email address"
                  );
                },
              })}
            />
          </Field>

          {/* Password */}
          <Field label="Password" error={errors.password}>
            <div className={styles.pw}>
              <input
                type={show ? "text" : "password"}
                autoComplete={
                  isSignup ? "new-password" : "current-password"
                }
                placeholder="Password"
                {...register(
                  "password",
                  isSignup
                    ? {
                      required: "Enter a password",
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                        message:
                        "Min 8 characters with upper, lower and a number",
                      },
                    }
                    : {
                        required: "Enter your password",
                      }
                    )}
              />

              <button
                type="button"
                onClick={() => setShow((current) => !current)}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </Field>

          {/* Signup-only fields */}
          {isSignup && (
            <>
              {/* Confirm password */}
              <Field
                label="Confirm password"
                error={errors.confirmPassword}
                >
                <input
                  type={show ? "text" : "password"}
                  placeholder="Enter password"
                  autoComplete="new-password"
                  {...register("confirmPassword", {
                    required: "Confirm your password",
                    validate: (value) =>
                      value === watch("password") ||
                      "Passwords do not match",
                    })}
                />
              </Field>

              {/* Gender */}
              <Field label="Gender" error={errors.gender}>
                <select
                  {...register("gender", {
                    required: "Select your gender",
                  })}
                  >
                  <option value="" disabled>
                    Select your gender
                  </option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>

              {/* Terms */}
              <label className={styles.terms}>
                <input
                  type="checkbox"
                  {...register("terms", {
                    required: "Please accept the terms",
                  })}
                  />

                <span>
                  I agree to the <Link to="/terms">Terms</Link> and{" "}
                  <Link to="/privacy">Privacy Policy</Link>
                </span>
              </label>

              {errors.terms && (
                <small className={styles.termsErr} role="alert">
                  {errors.terms.message}
                </small>
              )}
            </>
          )}

          {/* Submit */}
          <button className={styles.button} disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : isSignup
              ? "Create account"
                : "Log in"}
          </button>
        </form>

        {/* Switch between signup and login */}
        <p className={styles.switch}>
          {isSignup
            ? "Already have an account?"
            : "New to Pack&Go?"}{" "}
          <button type="button" onClick={switchMode}>
            {isSignup ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    </main>
            </>
  );
}
