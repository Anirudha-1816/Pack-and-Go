import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Input styles. The red version is used when a field has an error.
const inputBase =
  "h-12 w-full rounded-2xl border bg-white px-4 text-[15px] text-[#243746] placeholder:text-[#87949d] transition focus:outline-none focus:ring-4";
const inputOk = "border-[#d9e0e2] focus:border-[#2f6b8a] focus:ring-[#2f6b8a]/15";
const inputBad = "border-[#b3261e] focus:ring-[#b3261e]/10";

const labelStyle = "mb-2 block text-sm font-semibold text-[#142b3b]";
const errorStyle = "mt-1.5 text-[13px] text-[#b3261e]";

// Message box shown above the form, for the operator's account status.
// "pending" and "rejected" match the status values in your Operator schema.
const NOTICE_STYLE = {
  pending: "border-[#f0d9a8] bg-[#fff8e6] text-[#7a5a00]",
  rejected: "border-[#e6c4c0] bg-[#fdf0ee] text-[#8f1d17]",
  error: "border-[#e6c4c0] bg-[#fdf0ee] text-[#8f1d17]",
};

// Logo + name, used on both the dark panel and the mobile top bar
function Brand() {
  return (
    <div className="flex items-center gap-3">
      <img src="/favicon.svg" alt="" className="h-9 w-9" />
      <span className="font-['Bricolage_Grotesque',Outfit,system-ui,sans-serif] text-xl font-extrabold tracking-tight text-white">
        Pack<span className="text-[#c49a55]">&</span>Go
      </span>
      <span className="rounded-full border border-white/25 px-2.5 py-0.5 text-xs font-medium text-white/75">
        Operator
      </span>
    </div>
  );
}

export default function OperatorLogin() {
  const [showPassword, setShowPassword] = useState(false);

  // null, or { type: "pending" | "rejected" | "error", title, text }
  const [notice, setNotice] = useState(null);

  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  // Runs only when every field is valid
  async function onSubmit  (data) {
    setNotice(null);

    // The schema saves emails in lowercase without spaces, so we send them the same way
    const loginData = { ...data, email: data.email.trim().toLowerCase() };
    console.log(loginData);

    // Later, when your backend is ready:
    try {
      const res = await axios.post(`${API_URL}/operator/login`, loginData, { withCredentials: true });


      if(res.data.status === "success") {

        navigate("/operator/dashboard");
      }
      console.log(res)
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
    <main className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr] bg-[#fafaf7] font-['Plus_Jakarta_Sans',system-ui,-apple-system,'Segoe_UI',sans-serif] text-[#243746] lg:h-screen lg:min-h-[640px] lg:grid-cols-[1fr_1.1fr] lg:grid-rows-1">
      {/* ---------- Mobile top bar (the big panel is hidden on phones) ---------- */}
      <div className="bg-[#142b3b] px-6 py-5 lg:hidden">
        <Brand />
      </div>

      {/* ---------- Left: dark brand panel ---------- */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#142b3b,#2f6b8a)] p-10 xl:p-14 lg:flex">
        {/* Soft map-style contour lines */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 800 900"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <filter id="warp" x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency="0.0045" numOctaves="2" seed="11" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="260" />
            </filter>
          </defs>
          <g fill="none" stroke="#fff" strokeOpacity="0.09" strokeWidth="1.2" filter="url(#warp)">
            {Array.from({ length: 22 }, (_, i) => (
              <circle key={i} cx="240" cy="640" r={30 + i * 34} />
            ))}
          </g>
        </svg>

        <div className="relative">
          <Brand />
        </div>

        <div className="relative max-w-[460px]">
          <div className="mb-6 h-1 w-12 rounded-full bg-[#c49a55]" />
          <h1 className="font-['Bricolage_Grotesque',Outfit,system-ui,sans-serif] text-[54px] font-extrabold leading-[1.05] tracking-[-0.04em] text-white">
            Great trips start with great operators.
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-[#e1ebef]">
            Sign in to manage your trips and keep your availability up to date.
          </p>
        </div>

        <p className="relative text-sm text-white/50">
          © {new Date().getFullYear()} Pack&Go
        </p>
      </section>

      {/* ---------- Right: the form ---------- */}
      <section className="flex flex-col px-5 py-4 sm:px-8 sm:py-5 lg:min-h-0 lg:overflow-y-auto lg:px-10 lg:py-4">
        <div className="flex justify-end">
          <Link
            to="/"
            className="text-sm font-semibold text-[#61717b] no-underline transition hover:text-[#142b3b]"
          >
            Back to website
          </Link>
        </div>

        <div className="mx-auto my-auto w-full max-w-[440px] py-3">
          <div className="rounded-[1.5rem] border border-[#e8e5de] bg-white p-5 shadow-[0_18px_48px_rgba(20,43,59,0.08)] sm:p-6">
            <h2 className="font-['Bricolage_Grotesque',Outfit,system-ui,sans-serif] text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#142b3b] sm:text-[38px]">
              Operator sign in
            </h2>
            <p className="mb-5 mt-2 text-sm leading-relaxed text-[#61717b]">Welcome back. Sign in to your operator account.</p>

          {/* Account status message */}
          {notice && (
            <div
              role="alert"
              className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${NOTICE_STYLE[notice.type]}`}
            >
              <p className="font-semibold">{notice.title}</p>
              <p className="mt-0.5 leading-relaxed">{notice.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className={labelStyle}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={errors.email ? "true" : "false"}
                className={`${inputBase} ${errors.email ? inputBad : inputOk}`}
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
            <div className="mb-4">
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
                  className={`${inputBase} pr-16 ${errors.password ? inputBad : inputOk}`}
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-1 text-sm font-semibold text-[#61717b] hover:text-[#142b3b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c49a55]"
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

            {/* Remember me */}
            <label className="mb-5 flex cursor-pointer items-center gap-2.5 text-sm text-[#61717b]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-[#2f6b8a]"
                {...register("rememberMe")}
              />
              Keep me signed in
            </label>

            <button
              type="submit"
              className="h-11 w-full cursor-pointer rounded-full bg-[#2f6b8a] text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(47,107,138,0.2)] transition hover:bg-[#24566f] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#c49a55]"
            >
              Sign in
            </button>
          </form>

          {/* New operators apply here */}
          <p className="mt-5 text-center text-sm text-[#61717b]">
            New to Pack&Go?{" "}
            <Link
              to="/operator/register"
              className="font-bold text-[#24566f] underline underline-offset-4 decoration-[#c49a55] hover:text-[#142b3b]"
            >
              Apply to become an operator
            </Link>
          </p>
          </div>
        </div>

        <p className="text-center text-xs text-[#87949d]">
          New accounts are reviewed and approved by the Pack&Go team.
        </p>
      </section>
    </main>
  );
}