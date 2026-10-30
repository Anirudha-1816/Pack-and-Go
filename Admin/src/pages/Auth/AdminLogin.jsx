
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import adminApi from "../../api/adminApi";
import useAuthStore from "../../store/authStore";

// Input styles
const inputBase =
  "h-12 w-full rounded-[10px] border bg-white px-4 text-[15px] text-[#14211a] placeholder:text-[#9aa59d] transition focus:outline-none focus:ring-4";

const inputOk =
  "border-[#d9ddd4] focus:border-[#0f3d2a] focus:ring-[#0f3d2a]/10";

const inputBad = "border-[#b3261e] focus:ring-[#b3261e]/10";

const labelStyle = "mb-2 block text-sm font-medium text-[#2b3a31]";
const errorStyle = "mt-1.5 text-[13px] text-[#b3261e]";

// Brand component
function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="font-['Figtree',system-ui,sans-serif] text-xl font-semibold tracking-tight text-white">
        Pack<span className="text-[#ff7a1a]">&amp;</span>Go
      </span>

      <span className="rounded-full border border-white/25 px-2.5 py-0.5 text-xs text-white/70">
        Admin
      </span>
    </div>
  );
}

export default function AdminLogin() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [unauthorized, setUnauthorized] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUser = useAuthStore((state) => state.fetchUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Admin login
  const onSubmit = async (data) => {
    setUnauthorized("");
    setIsSubmitting(true);

    try {
      // Login API
      await adminApi.post("/admin-login", data, {
        withCredentials: true,
      });

      // Verify logged-in user and update Zustand
      const user = await fetchUser();

      // Check admin authorization
      if (!user || user.role !== "admin") {
        setUnauthorized("Unauthorized! Admin access only.");
        return;
      }

      // Navigate after authentication succeeds
      navigate("/admin", { replace: true });

    } catch (err) {
      console.error(
        "Login error:",
        err.response?.data || err.message
      );

      setUnauthorized(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr] bg-[#fafaf7] font-['Figtree',system-ui,sans-serif] text-[#14211a] lg:grid-cols-[1.1fr_1fr] lg:grid-rows-1">

      {/* Mobile top bar */}
      <div className="bg-[#0b2218] px-6 py-5 lg:hidden">
        <Brand />
      </div>

      {/* Left: Brand panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#0b2218,#0f3d2a)] p-14 lg:flex">

        {/* Background contour lines */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 800 900"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <filter
              id="warp"
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.0045"
                numOctaves="2"
                seed="7"
                result="noise"
              />

              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="260"
              />
            </filter>
          </defs>

          <g
            fill="none"
            stroke="#fff"
            strokeOpacity="0.09"
            strokeWidth="1.2"
            filter="url(#warp)"
          >
            {Array.from({ length: 22 }, (_, i) => (
              <circle
                key={i}
                cx="560"
                cy="300"
                r={30 + i * 34}
              />
            ))}
          </g>
        </svg>

        <div className="relative">
          <Brand />
        </div>

        <div className="relative max-w-[460px]">
          <div className="mb-6 h-[3px] w-12 bg-[#ff7a1a]" />

          <h1 className="font-['Instrument_Serif',Georgia,serif] text-[56px] font-normal leading-[1.05] text-white">
            Every trip, handled with care.
          </h1>

          <p className="mt-5 text-[17px] leading-relaxed text-[#b9cfc2]">
            Manage trips, bookings and guides from one place.
          </p>
        </div>

        <p className="relative text-sm text-white/50">
          © {new Date().getFullYear()} Pack&amp;Go
        </p>
      </section>

      {/* Right: Login form */}
      <section className="flex flex-col px-6 py-8 sm:px-12">

        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-10">

          {/* Unauthorized / Error message */}
          {unauthorized && (
            <div
              className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
              role="alert"
            >
              {unauthorized}
            </div>
          )}

          <h2 className="font-['Instrument_Serif',Georgia,serif] text-[42px] font-normal leading-none text-[#0f3d2a]">
            Sign in
          </h2>

          <p className="mb-8 mt-3 text-[#55655b]">
            Access the Pack&amp;Go admin console.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Email */}
            <div className="mb-5">
              <label htmlFor="email" className={labelStyle}>
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@packandgo.com"
                autoComplete="email"
                aria-invalid={errors.email ? "true" : "false"}
                className={`${inputBase} ${
                  errors.email ? inputBad : inputOk
                }`}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />

              {errors.email && (
                <p className={errorStyle} role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-5">
              <label htmlFor="password" className={labelStyle}>
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={errors.password ? "true" : "false"}
                  className={`${inputBase} pr-16 ${
                    errors.password ? inputBad : inputOk
                  }`}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-1 text-sm font-medium text-[#55655b] hover:text-[#0f3d2a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff7a1a]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password && (
                <p className={errorStyle} role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full cursor-pointer rounded-[10px] bg-[#0f3d2a] text-[15px] font-semibold text-white transition hover:bg-[#0a2b1e] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#ff7a1a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>

          </form>
        </div>

        <p className="text-center text-xs text-[#8a958d]">
          Authorized personnel only.
        </p>

      </section>
    </main>
  );
}
