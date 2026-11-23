// Social Gatherings & Parties Form
// Needs: npm i react-hook-form lucide-react react-hot-toast
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
  Users,
  GlassWater,
  Music,
  Coffee,
  Utensils,
} from "lucide-react";

// ---------- Dropdown / choice options ----------
const eventTypes = [
  "Rooftop Party",
  "Pool Party",
  "Club Night",
  "Music Night",
  "DJ Party",
  "Bonfire Night",
  "Cafe Meetup",
  "Friends Meetup",
  "Social Networking",
  "Business Networking",
  "College Meetup",
  "Community Gathering",
  "Board Games Meetup",
  "Movie Night",
  "Dinner Meetup",
  "Brunch Meetup",
  "Speed Dating",
  "Open Mic",
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

const ageGroups = [
  { value: "all", label: "All Ages" },
  { value: "18+", label: "18+" },
  { value: "21+", label: "21+" },
  { value: "25+", label: "25+" },
  { value: "custom", label: "Custom Age Range" },
];

const atmospheres = [
  { value: "chill", label: "Chill & Relaxed" },
  { value: "energetic", label: "Energetic & Party" },
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual & Friendly" },
  { value: "romantic", label: "Romantic" },
  { value: "creative", label: "Creative & Artistic" },
];

const foodDrinksOptions = [
  { value: "none", label: "No Food / Drinks" },
  { value: "snacks", label: "Snacks Included" },
  { value: "meals", label: "Meals Included" },
  { value: "drinks", label: "Drinks Included" },
  { value: "food-drinks", label: "Food & Drinks Included" },
  { value: "purchase", label: "Available for Purchase" },
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

// eslint-disable-next-line no-unused-vars
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
export default function SocialEventsForm() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      termsType: "regular",
      pickupDropType: "self",
      dressCode: "Casual Wear",
      ageGroup: "all",
      atmosphere: "casual",
      foodAndDrinks: "snacks"
    },
  });

  const [formKey, setFormKey] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  const eventType = watch("eventType");
  const dressCode = watch("dressCode");
  const ageGroup = watch("ageGroup");
  const pickupDropType = watch("pickupDropType");
  const termsType = watch("termsType");
  const isSelfService = pickupDropType === "self";

  const today = getToday();

  const onInvalid = () => {
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
    if (ageGroup === "custom" && (data.minimumAge || data.maximumAge)) {
      rest.minimumAge = data.minimumAge;
      rest.maximumAge = data.maximumAge;
    }

    const payload = {
      ...rest,
      category: "social-gatherings",
      categoryDetails: {
        eventType: rest.eventType,
        ageGroup: rest.ageGroup,
        minimumAge: rest.minimumAge,
        maximumAge: rest.maximumAge,
        atmosphere: rest.atmosphere,
        dressCode: rest.dressCode,
        foodAndDrinks: rest.foodAndDrinks,
        whatsIncluded: rest.whatsIncluded,
        specialInstructions: rest.specialInstructions,
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

      showSuccess(res.data?.message || "Social event added successfully.");
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Add a Social Event</h1>
          <p className="mt-2 text-slate-500">Create a social gathering or party event for travelers to book.</p>
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
                    placeholder="e.g. Weekend Rooftop Party"
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
                  hint="One place, e.g. Mumbai, Maharashtra"
                  error={errors.location}
                >
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Maharashtra"
                    className={inputClass(errors.location)}
                    {...register("location", { required: "Enter the destination" })}
                  />
                </Field>

                <Field label="Description" error={errors.description}>
                  <textarea
                    rows={4}
                    placeholder="Tell travelers what to expect at this event..."
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
            <Card icon={Users} title="Pricing and Capacity">
              <div className="space-y-4">
                <Field label="Price per head (₹)" error={errors.pricePerHead}>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1999"
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
                    placeholder="e.g. 100"
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
                      ? "Travelers reach the venue on their own."
                      : "We pick up and drop the group at a fixed place and time."}
                  </small>
                </div>

                {isSelfService ? (
                  <Field
                    label="Venue / Meeting point"
                    hint="Where travelers should go for the event"
                    error={errors.meetupPoint}
                  >
                    <input
                      type="text"
                      placeholder="e.g. Aer Lounge, Mumbai"
                      className={inputClass(errors.meetupPoint)}
                      {...register("meetupPoint", { required: "Enter the venue or meeting point" })}
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
                        placeholder="e.g. Bandra Station, Mumbai"
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
                        placeholder="e.g. Bandra Station, Mumbai"
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

            {/* Audience */}
            <Card icon={Users} title="Audience">
              <div className="space-y-4">
                <Field label="Age group" error={errors.ageGroup}>
                  <select
                    className={inputClass(errors.ageGroup)}
                    {...register("ageGroup", { required: "Select the age group" })}
                  >
                    <option value="">Select age group</option>
                    {ageGroups.map((group) => (
                      <option key={group.value} value={group.value}>{group.label}</option>
                    ))}
                  </select>
                </Field>

                {ageGroup === "custom" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Minimum age" error={errors.minimumAge}>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="e.g. 18"
                        className={inputClass(errors.minimumAge)}
                        {...register("minimumAge", {
                          required: "Enter minimum age",
                          valueAsNumber: true,
                        })}
                      />
                    </Field>

                    <Field label="Maximum age" error={errors.maximumAge}>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="e.g. 35"
                        className={inputClass(errors.maximumAge)}
                        {...register("maximumAge", {
                          required: "Enter maximum age",
                          valueAsNumber: true,
                        })}
                      />
                    </Field>
                  </div>
                )}
              </div>
            </Card>

            {/* Event atmosphere */}
            <Card icon={Music} title="Event Atmosphere">
              <Field label="Atmosphere" error={errors.atmosphere}>
                <select
                  className={inputClass(errors.atmosphere)}
                  {...register("atmosphere", { required: "Select the atmosphere" })}
                >
                  <option value="">Select atmosphere</option>
                  {atmospheres.map((atm) => (
                    <option key={atm.value} value={atm.value}>{atm.label}</option>
                  ))}
                </select>
              </Field>
            </Card>

            {/* Dress Code */}
            <Card icon={GlassWater} title="Dress Code">
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

            {/* Food & Drinks */}
            <Card icon={Coffee} title="Food & Drinks">
              <Field label="Food & drinks" error={errors.foodAndDrinks}>
                <select
                  className={inputClass(errors.foodAndDrinks)}
                  {...register("foodAndDrinks", { required: "Select food & drinks option" })}
                >
                  <option value="">Select option</option>
                  {foodDrinksOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </Field>
            </Card>

            {/* What's Included / Additional Information */}
            <Card icon={Utensils} title="What's Included / Additional Information">
              <div className="space-y-4">
                <Field label="What's included (optional)" error={errors.whatsIncluded}>
                  <textarea
                    rows={3}
                    placeholder="e.g. Entry, welcome drink, snacks, DJ, games"
                    className={`${inputClass(errors.whatsIncluded)} resize-y`}
                    {...register("whatsIncluded")}
                  />
                </Field>

                <Field label="Special instructions (optional)" error={errors.specialInstructions}>
                  <textarea
                    rows={3}
                    placeholder="e.g. ID proof required, couples entry only, no outside food/drinks"
                    className={`${inputClass(errors.specialInstructions)} resize-y`}
                    {...register("specialInstructions")}
                  />
                </Field>
              </div>
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