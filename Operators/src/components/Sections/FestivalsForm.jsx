// Festivals & Celebrations Form
// Needs: npm i react-hook-form lucide-react react-hot-toast
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import tripsBaseUrlApi from "../../apis/tripsApi";
import {
  AlertCircle,
  Camera,
  CalendarDays,
  FileText,
  ImagePlus,
  Loader2,
  PackagePlus,
  MapPin,
  Plus,
  Trash2,
  X,
  Utensils,
  Music,
} from "lucide-react";

// ---------- Dropdown / choice options ----------
const eventTypes = [
  "Cultural Festival",
  "Religious Celebration",
  "Music Festival",
  "Food Festival",
  "Dance Festival",
  "Seasonal Celebration",
  "Local Fair / Mela",
  "Holiday Celebration",
  "Concert",
  "Other",
];

const dressCodeOptions = [
  "Traditional Wear",
  "Ethnic Wear",
  "Formal Wear",
  "Smart Casuals",
  "Casual Wear",
  "Western Wear",
  "Sportswear",
  "Comfortable Clothing",
  "White Theme",
  "Black Theme",
  "Festive Wear",
  "Costume / Theme-based",
  "No Dress Code",
  "Other",
];

const tierOptions = ["Not included", "Budget", "Deluxe", "Premium", "Not needed"];

const pickupDropOptions = [
  { value: "group", label: "Pickup & drop service" },
  { value: "self", label: "Self drop & pickup" },
];

const termsOptions = [
  { value: "regular", label: "Regular terms" },
  { value: "custom", label: "Add new terms" },
];

const getToday = () => new Date().toLocaleDateString("en-CA");

// ---------- Toast style ----------
const toastStyle = {
  background: "#ffffff",
  color: "#0f172a",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "12px 16px",
  fontSize: "14px",
  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.08)",
};

const showSuccess = (message) =>
  toast.success(message, {
    style: { ...toastStyle, borderLeft: "4px solid #0f766e" },
    iconTheme: { primary: "#0f766e", secondary: "#ffffff" },
  });

const showError = (message) =>
  toast.error(message, {
    style: { ...toastStyle, borderLeft: "4px solid #dc2626" },
    iconTheme: { primary: "#dc2626", secondary: "#ffffff" },
  });

// ---------- Shared input style ----------
const inputClass = (error) =>
  "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 " +
  "placeholder:text-slate-400 outline-none transition focus:ring-4 " +
  (error
    ? "border-red-500 bg-red-50/40 focus:border-red-600 focus:ring-red-500/15"
    : "border-slate-200 focus:border-teal-700 focus:ring-teal-700/10");

// ---------- Helpers ----------
function Card({ icon: Icon, title, children, className = "" }) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-800">
          <Icon size={18} />
        </span>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ErrorText({ error }) {
  if (!error) return null;
  return (
    <small role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
      <AlertCircle size={13} className="shrink-0" />
      {error.message}
    </small>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className={`mb-1.5 block text-sm font-medium ${error ? "text-red-600" : "text-slate-700"}`}>
        {label}
      </span>
      {children}
      {hint && !error && <small className="mt-1 block text-xs text-slate-500">{hint}</small>}
      <ErrorText error={error} />
    </label>
  );
}

function Choice({ type, name, options, register, rules }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label key={option.value} className="cursor-pointer">
          <input type={type} value={option.value} className="peer sr-only" {...register(name, rules)} />
          <span
            className="block rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition
                       hover:border-teal-700 peer-checked:border-teal-800 peer-checked:bg-teal-800
                       peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-teal-700/20"
          >
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}

function ImagePicker({ name, label, hint, register, error, className = "" }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const field = register(name, {
    required: `${label} is required`,
    validate: (files) => files[0]?.size <= 5 * 1024 * 1024 || "Image must be under 5 MB",
  });

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
    field.onChange(e);
  };

  return (
    <div>
      <span className={`mb-1.5 block text-sm font-medium ${error ? "text-red-600" : "text-slate-700"}`}>
        {label}
      </span>

      <label
        className={`group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl
                    border-2 border-dashed transition ${
                      error
                        ? "border-red-400 bg-red-50/40"
                        : "border-slate-300 bg-slate-50 hover:border-teal-700 hover:bg-teal-50/50"
                    } ${className}`}
      >
        <input type="file" accept="image/*" className="sr-only" {...field} onChange={handleChange} />

        {preview ? (
          <>
            <img src={preview} alt={`${label} preview`} className="h-full w-full object-cover" />
            <span
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5
                         text-xs font-medium text-slate-800 shadow"
            >
              <Camera size={14} /> Change
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                error ? "bg-red-100 text-red-600" : "bg-teal-50 text-teal-800"
              }`}
            >
              <ImagePlus size={22} />
            </span>
            <p className="text-sm font-medium text-slate-700">Click to select</p>
            <small className="text-xs text-slate-500">{hint}</small>
          </div>
        )}
      </label>

      <ErrorText error={error} />
    </div>
  );
}

function TierPicker({ name, label, register, error, options = tierOptions }) {
  return (
    <Field label={label} error={error}>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option} className="cursor-pointer">
            <input
              type="radio"
              value={option}
              className="peer sr-only"
              {...register(name, { required: `Please choose a ${label.toLowerCase()} option` })}
            />
            <span
              className={`block rounded-full border px-4 py-2 text-sm text-slate-600 transition
                         hover:border-teal-700 peer-checked:border-teal-800 peer-checked:bg-teal-800
                         peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-teal-700/20 ${
                           error ? "border-red-300" : "border-slate-200"
                         }`}
            >
              {option}
            </span>
          </label>
        ))}
      </div>
    </Field>
  );
}

function UploadingOverlay({ progress }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-800">
          <Loader2 size={28} className="animate-spin" />
        </span>

        <h3 className="mt-4 text-lg font-semibold text-slate-900">Adding your event</h3>
        <p className="mt-1 text-sm text-slate-500">
          {progress < 100 ? "Uploading images and details..." : "Almost done, saving your event..."}
        </p>

        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-700 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs font-medium text-slate-600">{progress}%</p>

        <p className="mt-4 text-xs text-slate-400">Please don't close or refresh this page.</p>
      </div>
    </div>
  );
}

// ---------- Main Component ----------
export default function FestivalsForm() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    trigger,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { termsType: "regular", pickupDropType: "group", dressCode: "No Dress Code" },
  });

  const [formKey, setFormKey] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  const eventType = watch("eventType");
  const dressCode = watch("dressCode");
  const pickupDropType = watch("pickupDropType");
  const termsType = watch("termsType");
  const isSelfService = pickupDropType === "self";

  const today = getToday();

  const onInvalid = (formErrors) => {
    showError("Please fix the highlighted fields and try again.");
  };

  const onSubmit = async (data) => {
    const { banner, thumbnail, location, ...rest } = data;

    // Handle "Other" selections
    if (eventType === "Other" && data.customEventType) {
      rest.eventType = data.customEventType;
    }
    if (dressCode === "Other" && data.customDressCode) {
      rest.dressCode = data.customDressCode;
    }

    const payload = {
      ...rest,
      category: "festivals-celebrations",
      categoryDetails: {
        eventType: rest.eventType,
        dressCode: rest.dressCode,
        whatsIncluded: rest.whatsIncluded,
      },
      destination: location,
      from: (location || "").trim(),
      to: (location || "").trim(),
    };

    if (payload.termsType === "regular") delete payload.customTerms;

    if (isSelfService) {
      delete payload.pickupTime;
      delete payload.pickupLocation;
      delete payload.dropTime;
      delete payload.dropLocation;
    } else {
      delete payload.meetupPoint;
    }

    const formData = new FormData();
    formData.append("banner", banner[0]);
    formData.append("thumbnail", thumbnail[0]);
    formData.append("categoryDetails", JSON.stringify(payload.categoryDetails));

    Object.keys(payload).forEach((key) => {
      const value = payload[key];
      if (value === undefined || value === null) return;
      formData.append(key, String(value));
    });

    console.log("FormData:", Object.fromEntries(formData));

    setUploadProgress(0);
    try {
      const res = await tripsBaseUrlApi.post("/trips", formData, {
        withCredentials: true,
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      showSuccess(res.data?.message || "Festival event added successfully.");
      reset();
      setFormKey((key) => key + 1);
    } catch (error) {
      console.error(error);
      showError(
        error.response?.data?.message ||
        error.response?.data?.extraDetails ||
        "We couldn't add the event. Please try again."
      );
    } finally {
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f5]">
      {isSubmitting && <UploadingOverlay progress={uploadProgress} />}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Add a Festival Event</h1>
          <p className="mt-2 text-slate-500">Create a festival or celebration event for travelers to book.</p>
        </header>

        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          noValidate
          className="grid gap-6 lg:grid-cols-3"
        >
          {/* ================= LEFT SIDE ================= */}
          <div className="space-y-6 lg:col-span-2">
            {/* Images */}
            <Card icon={ImagePlus} title="Photos">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <ImagePicker
                    key={`banner-${formKey}`}
                    name="banner"
                    label="Banner image"
                    hint="Wide photo, under 5 MB"
                    className="h-52"
                    register={register}
                    error={errors.banner}
                  />
                </div>
                <ImagePicker
                  key={`thumbnail-${formKey}`}
                  name="thumbnail"
                  label="Small image"
                  hint="Square photo, under 5 MB"
                  className="h-52"
                  register={register}
                  error={errors.thumbnail}
                />
              </div>
            </Card>

            {/* Basic details */}
            <Card icon={FileText} title="Event Details">
              <div className="space-y-4">
                <Field label="Event title" error={errors.title}>
                  <input
                    type="text"
                    placeholder="e.g. Diwali Festival Celebration"
                    className={inputClass(errors.title)}
                    {...register("title", {
                      required: "Enter an event title",
                      minLength: { value: 5, message: "Title must be at least 5 characters" },
                    })}
                  />
                </Field>

                <Field label="Event type" error={errors.eventType}>
                  <select
                    className={inputClass(errors.eventType)}
                    {...register("eventType", { required: "Select the event type" })}
                  >
                    <option value="">Select event type</option>
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </Field>

                {eventType === "Other" && (
                  <Field label="Custom event type" error={errors.customEventType}>
                    <input
                      type="text"
                      placeholder="Enter custom event type"
                      className={inputClass(errors.customEventType)}
                      {...register("customEventType", { required: "Enter the custom event type" })}
                    />
                  </Field>
                )}

                <Field
                  label="Destination / City"
                  hint="One place, e.g. Jaipur, Rajasthan"
                  error={errors.location}
                >
                  <input
                    type="text"
                    placeholder="e.g. Jaipur, Rajasthan"
                    className={inputClass(errors.location)}
                    {...register("location", { required: "Enter the destination" })}
                  />
                </Field>

                <Field label="Description" error={errors.description}>
                  <textarea
                    rows={4}
                    placeholder="Tell travelers what to expect at this festival..."
                    className={`${inputClass(errors.description)} resize-y`}
                    {...register("description", {
                      required: "Write a short description",
                      minLength: { value: 20, message: "Description must be at least 20 characters" },
                    })}
                  />
                </Field>
              </div>
            </Card>

            {/* Pricing and capacity */}
            <Card icon={Utensils} title="Pricing and Capacity">
              <div className="space-y-4">
                <Field label="Price per head (₹)" error={errors.pricePerHead}>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 2999"
                    className={inputClass(errors.pricePerHead)}
                    {...register("pricePerHead", {
                      required: "Enter the price per head",
                      valueAsNumber: true,
                      min: { value: 1, message: "Price must be more than 0" },
                    })}
                  />
                </Field>

                <Field label="Available seats" error={errors.availableSeats}>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    className={inputClass(errors.availableSeats)}
                    {...register("availableSeats", {
                      required: "Enter the number of seats",
                      valueAsNumber: true,
                      min: { value: 1, message: "Must have at least 1 seat" },
                    })}
                  />
                </Field>
              </div>
            </Card>

            {/* Location and schedule */}
            <Card icon={MapPin} title="Location and Schedule">
              <div className="space-y-5">
                <div>
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Pickup & drop option
                  </span>
                  <Choice
                    type="radio"
                    name="pickupDropType"
                    options={pickupDropOptions}
                    register={register}
                  />
                  <small className="mt-1.5 block text-xs text-slate-500">
                    {isSelfService
                      ? "Travelers reach the meetup point and return home on their own."
                      : "We pick up and drop the group at a fixed place and time."}
                  </small>
                </div>

                {isSelfService ? (
                  <Field
                    label="Meeting point"
                    hint="Where travelers should reach on the event day"
                    error={errors.meetupPoint}
                  >
                    <input
                      type="text"
                      placeholder="e.g. Albert Hall Museum, Jaipur"
                      className={inputClass(errors.meetupPoint)}
                      {...register("meetupPoint", { required: "Enter the meeting point" })}
                    />
                  </Field>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Pickup time" error={errors.pickupTime}>
                      <input
                        type="time"
                        className={inputClass(errors.pickupTime)}
                        {...register("pickupTime", { required: "Select the pickup time" })}
                      />
                    </Field>

                    <Field label="Pickup location" error={errors.pickupLocation}>
                      <input
                        type="text"
                        placeholder="e.g. Sindhi Camp bus stand, Jaipur"
                        className={inputClass(errors.pickupLocation)}
                        {...register("pickupLocation", { required: "Enter the pickup location" })}
                      />
                    </Field>

                    <Field label="Drop time" error={errors.dropTime}>
                      <input
                        type="time"
                        className={inputClass(errors.dropTime)}
                        {...register("dropTime", { required: "Select the drop time" })}
                      />
                    </Field>

                    <Field label="Drop location" error={errors.dropLocation}>
                      <input
                        type="text"
                        placeholder="e.g. Sindhi Camp bus stand, Jaipur"
                        className={inputClass(errors.dropLocation)}
                        {...register("dropLocation", { required: "Enter the drop location" })}
                      />
                    </Field>
                  </div>
                )}

                <Field label="Event date" error={errors.date}>
                  <input
                    type="date"
                    min={today}
                    className={inputClass(errors.date)}
                    {...register("date", {
                      required: "Select the event date",
                      validate: (value) => value >= getToday() || "Event date can't be in the past",
                    })}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Start time" error={errors.startTime}>
                    <input
                      type="time"
                      className={inputClass(errors.startTime)}
                      {...register("startTime", { required: "Select the start time" })}
                    />
                  </Field>

                  <Field label="End time" error={errors.endTime}>
                    <input
                      type="time"
                      className={inputClass(errors.endTime)}
                      {...register("endTime", { required: "Select the end time" })}
                    />
                  </Field>
                </div>
              </div>
            </Card>

            {/* Dress Code */}
            <Card icon={Music} title="Dress Code">
              <div className="space-y-4">
                <Field label="Dress code" error={errors.dressCode}>
                  <select
                    className={inputClass(errors.dressCode)}
                    {...register("dressCode", { required: "Select a dress code" })}
                  >
                    <option value="">Select dress code</option>
                    {dressCodeOptions.map((code) => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </Field>

                {dressCode === "Other" && (
                  <Field label="Custom dress code" error={errors.customDressCode}>
                    <input
                      type="text"
                      placeholder="Enter custom dress code"
                      className={inputClass(errors.customDressCode)}
                      {...register("customDressCode", { required: "Enter the custom dress code" })}
                    />
                  </Field>
                )}
              </div>
            </Card>

            {/* What's Included */}
            <Card icon={Utensils} title="What's Included">
              <Field label="What's included (optional)" error={errors.whatsIncluded}>
                <textarea
                  rows={4}
                  placeholder="e.g. Food, refreshments, entry pass, decorations, music, etc."
                  className={`${inputClass(errors.whatsIncluded)} resize-y`}
                  {...register("whatsIncluded")}
                />
              </Field>
            </Card>

            {/* Terms */}
            <Card icon={FileText} title="Terms">
              <Choice type="radio" name="termsType" options={termsOptions} register={register} />

              {termsType === "custom" && (
                <div className="mt-4">
                  <Field label="Your terms" error={errors.customTerms}>
                    <textarea
                      rows={4}
                      placeholder="Write the new terms here..."
                      className={`${inputClass(errors.customTerms)} resize-y`}
                      {...register("customTerms", { required: "Write the terms for this event" })}
                    />
                  </Field>
                </div>
              )}
            </Card>
          </div>

          {/* ================= RIGHT SIDE ================= */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Card icon={CalendarDays} title="Date and price">
              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-teal-800 px-6 py-3
                             text-sm font-semibold text-white transition hover:bg-teal-700
                             focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-700/30
                             disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <PackagePlus size={18} />}
                  {isSubmitting ? "Adding event..." : "Add event"}
                </button>
              </div>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}