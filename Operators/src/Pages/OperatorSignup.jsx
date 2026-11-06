import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";

// Photo limits
const MAX_PHOTO_MB = 5;

// Input styles. The red version is used when a field has an error.
const inputBase =
  "h-12 w-full rounded-2xl border bg-white px-4 text-[15px] text-[#243746] placeholder:text-[#87949d] transition focus:outline-none focus:ring-4";
const inputOk = "border-[#d9e0e2] focus:border-[#2f6b8a] focus:ring-[#2f6b8a]/15";
const inputBad = "border-[#b3261e] focus:ring-[#b3261e]/10";

const labelStyle = "mb-2 block text-sm font-semibold text-[#142b3b]";
const errorStyle = "mt-1.5 text-[13px] text-[#b3261e]";

// Logo + name, used on both the blue panel and the mobile top bar
function Brand() {
  return (
    <div className="flex items-center gap-3">
      <img src="/favicon.svg" alt="" className="h-9 w-9" />
      <span className="font-['Bricolage_Grotesque',Outfit,system-ui,sans-serif] text-xl font-extrabold tracking-tight text-white">
        Pack<span className="text-[#c49a55]">&amp;</span>Go
      </span>
      <span className="rounded-full border border-white/25 px-2.5 py-0.5 text-xs font-medium text-white/75">
        Operator
      </span>
    </div>
  );
}

// Show / hide button inside a password field
function ShowHide({ shown, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-1 text-sm font-semibold text-[#61717b] hover:text-[#142b3b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c49a55]"
    >
      {shown ? "Hide" : "Show"}
    </button>
  );
}

export default function OperatorSignup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [preview, setPreview] = useState(""); // link to show the chosen photo

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
  function onSubmit(data) {
    const file = data.profileImage?.[0];

    // These are the fields of your Operator schema.
    // availability ("available") and status ("pending") are set by the schema defaults.
    const operatorData = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      phone: data.phone.trim(),
      location: data.location.trim(),
      experience: data.experience === "" ? 0 : Number(data.experience),
      profileImage: file ? { name: file.name, type: file.type, size: file.size } : null,
    };
    console.log(operatorData);

    // Later, send it as multipart form data (your upload uses the field name "media"):
    // const formData = new FormData();
    // Object.entries(operatorData).forEach(([key, value]) => key !== "profileImage" && formData.append(key, value));
    // if (file) formData.append("media", file);
    // axios.post(`${import.meta.env.VITE_API_URL}/operator/register`, formData, { withCredentials: true });
  }

  return (
    <main className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr] bg-[#fafaf7] font-['Plus_Jakarta_Sans',system-ui,-apple-system,'Segoe_UI',sans-serif] text-[#243746] lg:h-screen lg:min-h-[640px] lg:grid-cols-[1fr_1.1fr] lg:grid-rows-1">
      {/* ---------- Mobile top bar (the big panel is hidden on phones) ---------- */}
      <div className="bg-[#142b3b] px-6 py-5 lg:hidden">
        <Brand />
      </div>

      {/* ---------- Left: blue brand panel ---------- */}
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
              <feTurbulence type="fractalNoise" baseFrequency="0.0045" numOctaves="2" seed="5" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="260" />
            </filter>
          </defs>
          <g fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="1.2" filter="url(#warp)">
            {Array.from({ length: 22 }, (_, i) => (
              <circle key={i} cx="260" cy="650" r={30 + i * 34} />
            ))}
          </g>
        </svg>

        <div className="relative">
          <Brand />
        </div>

        <div className="relative max-w-[440px]">
          <div className="mb-6 h-1 w-12 rounded-full bg-[#c49a55]" />
          <h1 className="font-['Bricolage_Grotesque',Outfit,system-ui,sans-serif] text-[54px] font-extrabold leading-[1.05] tracking-[-0.04em] text-white">
            Run trips people remember.
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-[#e1ebef]">
            Apply in a few minutes. Our team reviews every application before your account goes live.
          </p>
        </div>

        <p className="relative text-sm text-white/50">
          © {new Date().getFullYear()} Pack&amp;Go
        </p>
      </section>

      {/* ---------- Right: the form ---------- */}
      <section className="flex flex-col px-5 py-4 sm:px-8 sm:py-5 lg:min-h-0 lg:overflow-y-auto lg:px-10 lg:py-4">
        <div className="flex justify-end">
          <Link to="/" className="text-sm font-semibold text-[#61717b] no-underline transition hover:text-[#142b3b]">
            Back to website
          </Link>
        </div>

        <div className="mx-auto my-auto w-full max-w-[520px] py-3">
          <div className="rounded-[1.5rem] border border-[#e8e5de] bg-white p-5 shadow-[0_18px_48px_rgba(20,43,59,0.08)] sm:p-6">
            <h2 className="font-['Bricolage_Grotesque',Outfit,system-ui,sans-serif] text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#142b3b] sm:text-[38px]">
              Become an operator
            </h2>
            <p className="mb-4 mt-2 text-sm leading-relaxed text-[#61717b]">
              Create your account and share the trips you love.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Profile photo (optional) */}
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-[#e8e5de] bg-[#e8eff1] text-[#61717b]">
                {preview ? (
                  <img src={preview} alt="Your profile preview" className="h-full w-full object-cover" />
                ) : (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                  </svg>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-[#142b3b]">Profile photo (optional)</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInput.current.click()}
                    className="rounded-full border border-[#d9e0e2] bg-white px-3 py-1.5 text-xs font-bold text-[#24566f] transition hover:border-[#2f6b8a] hover:bg-[#e8eff1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c49a55]"
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
                      className="text-sm text-[#61717b] underline underline-offset-4 hover:text-[#b3261e]"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {errors.profileImage && (
                  <p className={errorStyle} role="alert">
                    {errors.profileImage.message}
                  </p>
                )}
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
              />
            </div>

            {/* Name */}
              <div className="mb-3 grid gap-3 sm:grid-cols-2">
                <div>
              <label htmlFor="name" className={labelStyle}>
                Full name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your full name"
                autoComplete="name"
                aria-invalid={errors.name ? "true" : "false"}
                className={`${inputBase} ${errors.name ? inputBad : inputOk}`}
                {...register("name", {
                  required: "Name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" },
                })}
              />
              {errors.name && (
                <p className={errorStyle} role="alert">
                  {errors.name.message}
                </p>
              )}
              </div>

            {/* Email */}
              <div>
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
            </div>

            {/* Phone and location */}
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className={labelStyle}>
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  aria-invalid={errors.phone ? "true" : "false"}
                  className={`${inputBase} ${errors.phone ? inputBad : inputOk}`}
                  {...register("phone", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^\+?[0-9\s-]{10,15}$/,
                      message: "Enter a valid phone number",
                    },
                  })}
                />
                {errors.phone && (
                  <p className={errorStyle} role="alert">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="location" className={labelStyle}>
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  placeholder="City you operate from"
                  autoComplete="address-level2"
                  aria-invalid={errors.location ? "true" : "false"}
                  className={`${inputBase} ${errors.location ? inputBad : inputOk}`}
                  {...register("location", { required: "Location is required" })}
                />
                {errors.location && (
                  <p className={errorStyle} role="alert">
                    {errors.location.message}
                  </p>
                )}
              </div>
            </div>

            {/* Experience */}
            <div className="mb-3">
              <label htmlFor="experience" className={labelStyle}>
                Years of experience <span className="font-normal text-[#87949d]">(optional)</span>
              </label>
              <input
                id="experience"
                type="number"
                min="0"
                max="60"
                placeholder="0"
                aria-invalid={errors.experience ? "true" : "false"}
                className={`${inputBase} ${errors.experience ? inputBad : inputOk}`}
                {...register("experience", {
                  validate: (value) =>
                    value === "" || (Number(value) >= 0 && Number(value) <= 60) || "Enter a number from 0 to 60",
                })}
              />
              {errors.experience && (
                <p className={errorStyle} role="alert">
                  {errors.experience.message}
                </p>
              )}
            </div>

            {/* Passwords */}
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className={labelStyle}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    aria-invalid={errors.password ? "true" : "false"}
                    className={`${inputBase} pr-16 ${errors.password ? inputBad : inputOk}`}
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Use at least 8 characters" },
                    })}
                  />
                  <ShowHide shown={showPassword} onClick={() => setShowPassword(!showPassword)} />
                </div>
                {errors.password && (
                  <p className={errorStyle} role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className={labelStyle}>
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Type it again"
                    autoComplete="new-password"
                    aria-invalid={errors.confirmPassword ? "true" : "false"}
                    className={`${inputBase} pr-16 ${errors.confirmPassword ? inputBad : inputOk}`}
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) => value === getValues("password") || "Passwords do not match",
                    })}
                  />
                  <ShowHide shown={showConfirm} onClick={() => setShowConfirm(!showConfirm)} />
                </div>
                {errors.confirmPassword && (
                  <p className={errorStyle} role="alert">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* Terms */}
            <div className="mb-4">
              <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed text-[#61717b]">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded accent-[#2f6b8a]"
                  {...register("agree", { required: "Please accept the terms to continue" })}
                />
                <span>
                  I agree to the{" "}
                  <Link to="/terms" className="font-bold text-[#24566f] underline underline-offset-4 decoration-[#c49a55]">
                    Terms and conditions
                  </Link>{" "}
                  and the{" "}
                  <Link to="/privacy" className="font-bold text-[#24566f] underline underline-offset-4 decoration-[#c49a55]">
                    Privacy policy
                  </Link>
                  .
                </span>
              </label>
              {errors.agree && (
                <p className={errorStyle} role="alert">
                  {errors.agree.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="h-11 w-full cursor-pointer rounded-full bg-[#2f6b8a] text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(47,107,138,0.2)] transition hover:bg-[#24566f] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#c49a55]"
            >
              Submit application
            </button>
            </form>

            <p className="mt-4 text-center text-sm text-[#61717b]">
              Already have an account?{" "}
              <Link
                to="/operator/login"
                className="font-bold text-[#24566f] underline underline-offset-4 decoration-[#c49a55] hover:text-[#142b3b]"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[#87949d]">
          New accounts are reviewed and approved by the Pack&amp;Go team.
        </p>
      </section>
    </main>
  );
}