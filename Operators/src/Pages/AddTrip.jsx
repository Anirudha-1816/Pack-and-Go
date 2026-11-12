import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const TRIP_TYPES = [
  "Solo travelers only",
  "Couples only",
  "Mixed group",
  "Friends group",
  "Family"
];

const TIERS = [
  "Not included",
  "Budget",
  "Deluxe",
  "Premium"
];

const MEALS = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
  "Tea / Coffee"
];

const MAX_FILE_MB = 5;

const inputBase =
  "h-12 w-full rounded-2xl border bg-white px-4 text-[15px] text-[#243746] placeholder:text-[#87949d] transition focus:outline-none focus:ring-4";
const inputOk = "border-[#d9e0e2] focus:border-[#2f6b8a] focus:ring-[#2f6b8a]/15";
const inputBad = "border-[#b3261e] focus:ring-[#b3261e]/10";

const labelStyle = "mb-2 block text-sm font-semibold text-[#142b3b]";
const errorStyle = "mt-1.5 text-[13px] text-[#b3261e]";

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

function FileInput({ label, accept, onChange, preview, error, removePreview }) {
  return (
    <div className="mb-4">
      <label className={labelStyle}>{label}</label>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-[#e8e5de] bg-[#e8eff1] text-[#61717b]">
          {preview ? (
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#142b3b]">Upload image</p>
          <div className="mt-1.5 flex items-center gap-3">
            <button
              type="button"
              onClick={onChange}
              className="rounded-full border border-[#d9e0e2] bg-white px-3 py-1.5 text-xs font-bold text-[#24566f] transition hover:border-[#2f6b8a] hover:bg-[#e8eff1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c49a55]"
            >
              {preview ? "Change" : "Choose"}
            </button>
            {preview && (
              <button
                type="button"
                onClick={removePreview}
                className="text-sm text-[#61717b] underline underline-offset-4 hover:text-[#b3261e]"
              >
                Remove
              </button>
            )}
          </div>
          {error && <p className={errorStyle} role="alert">{error.message}</p>}
        </div>
        <input type="file" accept={accept} hidden onChange={(e) => onChange(e.target.files[0])} />
      </div>
    </div>
  );
}

export default function AddTrip() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [thumbPreview, setThumbPreview] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      from: "",
      to: "",
      guide: "",
      date: "",
      pickupTime: "",
      pickupLocation: "",
      dropTime: "",
      dropLocation: "",
      duration: "",
      pricePerHead: "",
      tripType: "",
      stays: "",
      travel: "",
      termsType: "regular",
      customTerms: "",
      meals: [],
      roadmap: [],
    },
  });

  const mealsSelected = watch("meals");
  const termsType = watch("termsType");

  function handleFilePreview(file, setter, previewSetter) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return "Please choose an image file";
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return `Image must be under ${MAX_FILE_MB} MB`;
    }
    setter(file);
    const url = URL.createObjectURL(file);
    previewSetter(url);
    return null;
  }

  async function onSubmit(data) {
    setSubmitError(null);
    setSubmitting(true);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== "") {
        formData.append(key, value);
      }
    });

    if (bannerFile) formData.append("banner", bannerFile);
    if (thumbFile) formData.append("thumbnail", thumbFile);

    try {
      const res = await axios.post(
        `${API_URL}/operator/trips`,
        formData,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      navigate("/operator/dashboard");
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Could not submit trip. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr] bg-[#fafaf7] font-['Plus_Jakarta_Sans',system-ui,-apple-system,'Segoe_UI',sans-serif] text-[#243746] lg:h-screen lg:min-h-[640px] lg:grid-cols-[1fr_1.1fr] lg:grid-rows-1">
      {/* Mobile top bar */}
      <div className="bg-[#142b3b] px-6 py-5 lg:hidden">
        <Brand />
      </div>

      {/* Left: dark brand panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#142b3b,#2f6b8a)] p-10 xl:p-14 lg:flex">
        <div className="relative">
          <Brand />
        </div>
        <div className="relative max-w-[460px]">
          <div className="mb-6 h-1 w-12 rounded-full bg-[#c49a55]" />
          <h1 className="font-['Bricolage_Grotesque',Outfit,system-ui,sans-serif] text-[54px] font-extrabold leading-[1.05] tracking-[-0.04em] text-white">
            Create a new trip
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-[#e1ebef]">
            Fill in the details below. Your trip will be reviewed before going live.
          </p>
        </div>
        <p className="relative text-sm text-white/50">
          © {new Date().getFullYear()} Pack&Go
        </p>
      </section>

      {/* Right: the form */}
      <section className="flex flex-col px-5 py-4 sm:px-8 sm:py-5 lg:min-h-0 lg:overflow-y-auto lg:px-10 lg:py-4">
        <div className="flex justify-end">
          <Link
            to="/operator/dashboard"
            className="text-sm font-semibold text-[#61717b] no-underline transition hover:text-[#142b3b]"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mx-auto my-auto w-full max-w-[520px] py-3">
          <div className="rounded-[1.5rem] border border-[#e8e5de] bg-white p-5 shadow-[0_18px_48px_rgba(20,43,59,0.08)] sm:p-6">
            <h2 className="font-['Bricolage_Grotesque',Outfit,system-ui,sans-serif] text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#142b3b] sm:text-[38px]">
              Add new trip
            </h2>
            <p className="mb-4 mt-2 text-sm leading-relaxed text-[#61717b]">
              Step {step} of 3
            </p>

            {/* Step indicator */}
            <div className="mb-6 flex items-center gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 flex items-center">
                  <div className={`flex-1 h-1 rounded-full transition-colors ${
                    s <= step ? "bg-[#2f6b8a]" : "bg-[#e8e5de]"
                  }`} />
                  {s < 3 && (
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      s < step ? "bg-[#2f6b8a] text-white" : s === step ? "bg-[#c49a55] text-[#142b3b]" : "bg-[#e8e5de] text-[#61717b]"
                    }`}>
                      {s}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {submitError && (
              <div className="mb-4 rounded-xl border border-[#e6c4c0] bg-[#fdf0ee] px-4 py-3 text-sm text-[#8f1d17]" role="alert">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <>
                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="from" className={labelStyle}>From city</label>
                      <input
                        id="from"
                        type="text"
                        placeholder="e.g. Jaipur"
                        autoComplete="address-level2"
                        aria-invalid={errors.from ? "true" : "false"}
                        className={`${inputBase} ${errors.from ? inputBad : inputOk}`}
                        {...register("from", { required: "From city is required" })}
                      />
                      {errors.from && <p className={errorStyle} role="alert">{errors.from.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="to" className={labelStyle}>To city</label>
                      <input
                        id="to"
                        type="text"
                        placeholder="e.g. Goa"
                        autoComplete="address-level2"
                        aria-invalid={errors.to ? "true" : "false"}
                        className={`${inputBase} ${errors.to ? inputBad : inputOk}`}
                        {...register("to", { required: "To city is required" })}
                      />
                      {errors.to && <p className={errorStyle} role="alert">{errors.to.message}</p>}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="guide" className={labelStyle}>Guide name</label>
                    <input
                      id="guide"
                      type="text"
                      placeholder="Guide/instructor name"
                      autoComplete="name"
                      aria-invalid={errors.guide ? "true" : "false"}
                      className={`${inputBase} ${errors.guide ? inputBad : inputOk}`}
                      {...register("guide", { required: "Guide is required" })}
                    />
                    {errors.guide && <p className={errorStyle} role="alert">{errors.guide.message}</p>}
                  </div>

                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="date" className={labelStyle}>Trip date</label>
                      <input
                        id="date"
                        type="date"
                        aria-invalid={errors.date ? "true" : "false"}
                        className={`${inputBase} ${errors.date ? inputBad : inputOk}`}
                        {...register("date", { required: "Trip date is required" })}
                      />
                      {errors.date && <p className={errorStyle} role="alert">{errors.date.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="duration" className={labelStyle}>Duration (days)</label>
                      <input
                        id="duration"
                        type="number"
                        min="2"
                        max="15"
                        placeholder="e.g. 5"
                        aria-invalid={errors.duration ? "true" : "false"}
                        className={`${inputBase} ${errors.duration ? inputBad : inputOk}`}
                        {...register("duration", { required: "Duration is required", min: 2, max: 15 })}
                      />
                      {errors.duration && <p className={errorStyle} role="alert">{errors.duration.message}</p>}
                    </div>
                  </div>

                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="pickupTime" className={labelStyle}>Pickup time (24h)</label>
                      <input
                        id="pickupTime"
                        type="time"
                        aria-invalid={errors.pickupTime ? "true" : "false"}
                        className={`${inputBase} ${errors.pickupTime ? inputBad : inputOk}`}
                        {...register("pickupTime", { required: "Pickup time is required" })}
                      />
                      {errors.pickupTime && <p className={errorStyle} role="alert">{errors.pickupTime.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="dropTime" className={labelStyle}>Drop time (24h)</label>
                      <input
                        id="dropTime"
                        type="time"
                        aria-invalid={errors.dropTime ? "true" : "false"}
                        className={`${inputBase} ${errors.dropTime ? inputBad : inputOk}`}
                        {...register("dropTime", { required: "Drop time is required" })}
                      />
                      {errors.dropTime && <p className={errorStyle} role="alert">{errors.dropTime.message}</p>}
                    </div>
                  </div>

                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="pickupLocation" className={labelStyle}>Pickup location</label>
                      <input
                        id="pickupLocation"
                        type="text"
                        placeholder="e.g. Jaipur Railway Station"
                        aria-invalid={errors.pickupLocation ? "true" : "false"}
                        className={`${inputBase} ${errors.pickupLocation ? inputBad : inputOk}`}
                        {...register("pickupLocation", { required: "Pickup location is required" })}
                      />
                      {errors.pickupLocation && <p className={errorStyle} role="alert">{errors.pickupLocation.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="dropLocation" className={labelStyle}>Drop location</label>
                      <input
                        id="dropLocation"
                        type="text"
                        placeholder="e.g. Goa Airport"
                        aria-invalid={errors.dropLocation ? "true" : "false"}
                        className={`${inputBase} ${errors.dropLocation ? inputBad : inputOk}`}
                        {...register("dropLocation", { required: "Drop location is required" })}
                      />
                      {errors.dropLocation && <p className={errorStyle} role="alert">{errors.dropLocation.message}</p>}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="h-11 px-6 rounded-full bg-[#2f6b8a] text-white font-bold transition hover:bg-[#24566f] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#c49a55]"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {/* Step 2: Pricing & Type */}
              {step === 2 && (
                <>
                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="pricePerHead" className={labelStyle}>Price per head (₹)</label>
                      <input
                        id="pricePerHead"
                        type="number"
                        min="1"
                        placeholder="e.g. 5000"
                        aria-invalid={errors.pricePerHead ? "true" : "false"}
                        className={`${inputBase} ${errors.pricePerHead ? inputBad : inputOk}`}
                        {...register("pricePerHead", { required: "Price is required", min: 1 })}
                      />
                      {errors.pricePerHead && <p className={errorStyle} role="alert">{errors.pricePerHead.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="tripType" className={labelStyle}>Trip type</label>
                      <select
                        id="tripType"
                        aria-invalid={errors.tripType ? "true" : "false"}
                        className={`${inputBase} ${errors.tripType ? inputBad : inputOk}`}
                        {...register("tripType", { required: "Trip type is required" })}
                      >
                        <option value="">Select trip type</option>
                        {TRIP_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      {errors.tripType && <p className={errorStyle} role="alert">{errors.tripType.message}</p>}
                    </div>
                  </div>

                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="stays" className={labelStyle}>Accommodation tier</label>
                      <select
                        id="stays"
                        aria-invalid={errors.stays ? "true" : "false"}
                        className={`${inputBase} ${errors.stays ? inputBad : inputOk}`}
                        {...register("stays", { required: "Required" })}
                      >
                        <option value="">Select tier</option>
                        {TIERS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      {errors.stays && <p className={errorStyle} role="alert">{errors.stays.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="travel" className={labelStyle}>Travel tier</label>
                      <select
                        id="travel"
                        aria-invalid={errors.travel ? "true" : "false"}
                        className={`${inputBase} ${errors.travel ? inputBad : inputOk}`}
                        {...register("travel", { required: "Required" })}
                      >
                        <option value="">Select tier</option>
                        {TIERS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      {errors.travel && <p className={errorStyle} role="alert">{errors.travel.message}</p>}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="meals" className={labelStyle}>
                      Meals included
                      <span className="font-normal text-[#87949d]"> (select all that apply)</span>
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {MEALS.map((meal) => (
                        <label key={meal} className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            value={meal}
                            className="h-4 w-4 rounded accent-[#2f6b8a]"
                            {...register("meals")}
                          />
                          <span className="text-sm text-[#142b3b]">{meal}</span>
                        </label>
                      ))}
                    </div>
                    {errors.meals && <p className={errorStyle} role="alert">{errors.meals.message}</p>}
                  </div>

                  <div className="mb-4">
                    <label className={labelStyle}>Terms type</label>
                    <div className="mt-2 flex gap-4">
                      {["regular", "custom"].map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value={type}
                            className="h-4 w-4 accent-[#2f6b8a]"
                            {...register("termsType")}
                          />
                          <span className="text-sm text-[#142b3b] capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {termsType === "custom" && (
                    <div className="mb-4">
                      <label htmlFor="customTerms" className={labelStyle}>Custom terms</label>
                      <textarea
                        id="customTerms"
                        rows={4}
                        placeholder="Write your custom terms and conditions..."
                        aria-invalid={errors.customTerms ? "true" : "false"}
                        className={`${inputBase} ${errors.customTerms ? inputBad : inputOk} resize-none`}
                        {...register("customTerms", { required: termsType === "custom" })}
                      />
                      {errors.customTerms && <p className={errorStyle} role="alert">{errors.customTerms.message}</p>}
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="h-11 px-6 rounded-full border border-[#d9e0e2] bg-white text-[#24566f] font-bold transition hover:border-[#2f6b8a] hover:bg-[#e8eff1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c49a55]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="h-11 px-6 rounded-full bg-[#2f6b8a] text-white font-bold transition hover:bg-[#24566f] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#c49a55]"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {/* Step 3: Images & Roadmap */}
              {step === 3 && (
                <>
                  <div className="mb-4">
                    <label className={labelStyle}>Roadmap</label>
                    <p className="mt-1 text-sm text-[#61717b]">Add places in order (minimum 1)</p>
                    <div className="mt-2 space-y-3" id="roadmap-list">
                      {(() => {
                        const roadmap = watch("roadmap");
                        return roadmap.map((stop, i) => (
                          <div key={i} className="flex gap-3">
                            <input
                              type="text"
                              placeholder="Place name"
                              className={`${inputBase} flex-1 ${errors.roadmap?.[i]?.place ? inputBad : inputOk}`}
                              {...register(`roadmap.${i}.place`, { required: "Place name is required" })}
                            />
                            <input
                              type="number"
                              min="1"
                              placeholder="Days"
                              className={`${inputBase} w-24 ${errors.roadmap?.[i]?.days ? inputBad : inputOk}`}
                              {...register(`roadmap.${i}.days`, { required: "Days required", min: 1 })}
                            />
                            <input
                              type="text"
                              placeholder="Note (optional)"
                              className={`${inputBase} flex-1 ${errors.roadmap?.[i]?.note ? inputBad : inputOk}`}
                              {...register(`roadmap.${i}.note`)}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const current = watch("roadmap");
                                current.splice(i, 1);
                                setValue("roadmap", current, { shouldValidate: true });
                              }}
                              className="text-sm text-[#b3261e] underline underline-offset-2 hover:text-[#8f1d17]"
                            >
                              Remove
                            </button>
                          </div>
                        ));
                      })()}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const current = watch("roadmap");
                        current.push({ place: "", days: 1, note: "" });
                        setValue("roadmap", current);
                      }}
                      className="mt-2 rounded-full border border-[#d9e0e2] bg-white px-3 py-1.5 text-xs font-bold text-[#24566f] transition hover:border-[#2f6b8a] hover:bg-[#e8eff1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c49a55]"
                    >
                      Add another stop
                    </button>
                    {errors.roadmap && <p className={errorStyle} role="alert">{errors.roadmap.message}</p>}
                  </div>

                  <FileInput
                    label="Banner image (required)"
                    accept="image/*"
                    onChange={(file) => {
                      const err = handleFilePreview(file, setBannerFile, setBannerPreview);
                      if (err) setSubmitError(err);
                      else setSubmitError(null);
                    }}
                    preview={bannerPreview}
                    error={errors.banner}
                    removePreview={() => { setBannerFile(null); setBannerPreview(""); }}
                  />

                  <FileInput
                    label="Thumbnail image (required)"
                    accept="image/*"
                    onChange={(file) => {
                      const err = handleFilePreview(file, setThumbFile, setThumbPreview);
                      if (err) setSubmitError(err);
                      else setSubmitError(null);
                    }}
                    preview={thumbPreview}
                    error={errors.thumbnail}
                    removePreview={() => { setThumbFile(null); setThumbPreview(""); }}
                  />

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="h-11 px-6 rounded-full border border-[#d9e0e2] bg-white text-[#24566f] font-bold transition hover:border-[#2f6b8a] hover:bg-[#e8eff1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c49a55]"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="h-11 px-6 rounded-full bg-[#2f6b8a] text-white font-bold transition hover:bg-[#24566f] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#c49a55] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Submitting..." : "Submit for approval"}
                    </button>
                  </div>
                </>
              )}

            </form>
          </div>
        </div>

        <p className="text-center text-xs text-[#87949d]">
          Submitted trips are reviewed by the Pack&Go team before going live.
        </p>
      </section>
    </main>
  );
}
