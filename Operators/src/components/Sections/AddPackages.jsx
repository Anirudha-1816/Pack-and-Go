// Operator "Add package" page
// Needs:  npm i react-hook-form lucide-react react-hot-toast
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import tripsBaseUrlApi from "../../apis/tripsApi";
import {
  AlertCircle,
  Camera,
  CalendarDays,
  Bus,
  FileText,
  ImagePlus,
  Loader2,
  PackagePlus,
  ScrollText,
  Utensils,
  MapPin,
  Plus,
  Trash2,
  X,
} from "lucide-react";

// ---------- Dropdown / choice options (change these anytime) ----------
const tripTypes = ["Solo travelers only", "Couples only", "Mixed group", "Friends group", "Family"];
// const MAX_TRAVELERS = 20;

const mealOptions = [
  { value: "Breakfast", label: "Breakfast" },
  { value: "Lunch", label: "Lunch" },
  { value: "Dinner", label: "Dinner" },
  { value: "Snacks", label: "Snacks" },
  { value: "Tea / Coffee", label: "Tea / Coffee" },
];

// These values must match the enum on the Trip models (stays / travel):
//   ["Not included", "Budget", "Deluxe", "Premium", "Not needed"]
const tierOptions = ["Not included", "Budget", "Deluxe", "Premium", "Not needed"];

const termsOptions = [
  { value: "regular", label: "Regular terms" },
  { value: "custom", label: "Add new terms" },
];

// Pickup & drop service = we pick up and drop the group. Self = travelers come and go on their own.
const pickupDropOptions = [
  { value: "group", label: "Pickup & drop service" },
  { value: "self", label: "Self drop & pickup" },
];

// Today's date as YYYY-MM-DD (local time). A function, so it is fresh on every render.
const getToday = () => new Date().toLocaleDateString("en-CA");

// ---------- Toast style (clean and simple) ----------
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

// ---------- Shared input style (turns red when there is an error) ----------
const inputClass = (error) =>
  "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 " +
  "placeholder:text-slate-400 outline-none transition focus:ring-4 " +
  (error
    ? "border-red-500 bg-red-50/40 focus:border-red-600 focus:ring-red-500/15"
    : "border-slate-200 focus:border-teal-700 focus:ring-teal-700/10");

// ---------- Small helper: white card with an icon + title ----------
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

// ---------- Small helper: red error message with an icon ----------
function ErrorText({ error }) {
  if (!error) return null;
  return (
    <small role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
      <AlertCircle size={13} className="shrink-0" />
      {error.message}
    </small>
  );
}

// ---------- Small helper: label + input + error message ----------
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

// ---------- Small helper: pill buttons (type = "radio" or "checkbox") ----------
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

// ---------- Small helper: image box with preview ----------
function ImagePicker({ name, label, hint, register, error, className = "" }) {
  const [preview, setPreview] = useState(null);

  // Free the old preview URL whenever it changes or the component goes away
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Tell react-hook-form about the field
  const field = register(name, {
    required: `${label} is required`,
    validate: (files) => files[0]?.size <= 5 * 1024 * 1024 || "Image must be under 5 MB",
  });

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file)); // show the preview
    field.onChange(e); // let react-hook-form save the file too
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

// ---------- Tier picker for stays and travel ----------
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

// ---------- Full screen loader shown while the package is being added ----------
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

        <h3 className="mt-4 text-lg font-semibold text-slate-900">Adding your package</h3>
        <p className="mt-1 text-sm text-slate-500">
          {progress < 100 ? "Uploading images and details..." : "Almost done, saving your package..."}
        </p>

        {/* Progress bar */}
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

export default function OperatorAddPackage() {
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
    defaultValues: { termsType: "regular", pickupDropType: "group", meals: [], roadmap: [] },
  });

  // Used to clear the image previews after the form is reset
  const [formKey, setFormKey] = useState(0);

  // Roadmap modal open / close
  const [showRoadmap, setShowRoadmap] = useState(false);

  // Upload progress (0 - 100) for the loader
  const [uploadProgress, setUploadProgress] = useState(0);

  // Roadmap field array
  const { fields, append, remove } = useFieldArray({
    control,
    name: "roadmap",
    rules: { required: "Add at least one place to the roadmap" },
  });

  // Show extra inputs only when needed
  const termsType = watch("termsType");
  const pickupDropType = watch("pickupDropType");

  // Self drop & pickup = no pickup / drop details, only a meetup point
  const isSelfService = pickupDropType === "self";

  // Roadmap values
  const roadmap = watch("roadmap");
  const totalDays = roadmap.reduce((sum, stop) => sum + (stop.days || 0), 0);

  const dayLabel = (index) => {
    let start = 1;
    for (let i = 0; i < index; i++) start += roadmap[i]?.days || 0;
    const end = start + (roadmap[index]?.days || 1) - 1;
    return start === end ? `Day ${start}` : `Day ${start}-${end}`;
  };

  // Open the roadmap modal
  const openRoadmap = () => {
    if (fields.length === 0) append({ place: "", days: 1, note: "" });
    setShowRoadmap(true);
  };

  // Close the roadmap modal only if every place is filled correctly
  const closeRoadmap = async () => {
    if (fields.length === 0) {
      setShowRoadmap(false);
      return;
    }
    const isValid = await trigger("roadmap");
    if (isValid) setShowRoadmap(false);
    else showError("Please fill in every place in the roadmap.");
  };

  // Runs when the form has errors (the fields turn red and the first one gets focus)
  const onInvalid = (formErrors) => {
    // If a roadmap place is wrong, open the modal so the operator can see it
    if (formErrors.roadmap?.some?.(Boolean)) setShowRoadmap(true);

    showError("Please fix the highlighted fields and try again.");
  };

  const onSubmit = async (data) => {
    // 1. Roadmap days must match the trip duration
    if (totalDays !== data.duration) {
      const message = `Roadmap adds up to ${totalDays} days, but duration is ${data.duration} days.`;
      setError("duration", { type: "manual", message });
      showError(message);
      return;
    }

    // 2. Take out the fields that need special handling
    const { banner, thumbnail, meals, roadmap: roadmapData, location, ...rest } = data;

    // 3. Map form fields to the backend schema
    const from = (location || "").trim();
    const to = from;

    const payload = {
      ...rest, // already has stays, travel, pickupDropType, maxTravelers, etc.
      destination: location,
      from,
      to,
    };

    if (payload.termsType === "regular") delete payload.customTerms;

    if (isSelfService) {
      // Self drop & pickup: no pickup / drop details, only the meetup point
      delete payload.pickupTime;
      delete payload.pickupLocation;
      delete payload.dropTime;
      delete payload.dropLocation;
    } else {
      // Pickup & drop service: meetup point is not needed
      delete payload.meetupPoint;
    }

    // 4. Build the multipart/form-data payload
    const formData = new FormData();
    formData.append("banner", banner[0]);
    formData.append("thumbnail", thumbnail[0]);
    formData.append("meals", JSON.stringify(meals || []));
    formData.append("roadmap", JSON.stringify(roadmapData || []));

    Object.keys(payload).forEach((key) => {
      const value = payload[key];
      if (value === undefined || value === null) return;
      formData.append(key, String(value));
    });

    console.log("FormData (what the backend will receive):", Object.fromEntries(formData));

    setUploadProgress(0);
    try {
      const res = await tripsBaseUrlApi.post("/trips", formData, {
        withCredentials: true,
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      showSuccess(res.data?.message || "Event added successfully.");
      reset();
      setFormKey((key) => key + 1);
      setShowRoadmap(false);
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

  const today = getToday();

  return (
    <div className="min-h-screen bg-[#f4f6f5]">
      {/* Loader while the package is being added */}
      {isSubmitting && <UploadingOverlay progress={uploadProgress} />}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        {/* ---------- Page heading ---------- */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Add an event</h1>
          <p className="mt-2 text-slate-500">Create an event for travelers to book.</p>
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
            <Card icon={FileText} title="Event details">
              <div className="space-y-4">
                <Field label="Event title" error={errors.title}>
                  <input
                    type="text"
                    placeholder="e.g. Spiti valley road trip"
                    className={inputClass(errors.title)}
                    {...register("title", {
                      required: "Enter an event title",
                      minLength: { value: 5, message: "Title must be at least 5 characters" },
                    })}
                  />
                </Field>

                <Field
                  label="Destination"
                  hint="One place, e.g. Manali, Himachal Pradesh"
                  error={errors.location}
                >
                  <input
                    type="text"
                    placeholder="e.g. Manali, Himachal Pradesh"
                    className={inputClass(errors.location)}
                    {...register("location", { required: "Enter the destination" })}
                  />
                </Field>

                <Field label="Description" error={errors.description}>
                  <textarea
                    rows={4}
                    placeholder="Tell travelers what to expect on this trip..."
                    className={`${inputClass(errors.description)} resize-y`}
                    {...register("description", {
                      required: "Write a short description",
                      minLength: { value: 20, message: "Description must be at least 20 characters" },
                    })}
                  />
                </Field>
              </div>
            </Card>

            {/* Pickup & Drop Details */}
            <Card icon={MapPin} title="Pickup & Drop Details">
              <div className="space-y-5">
                {/* Service type */}
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
                  /* Self drop & pickup: only the meetup point */
                  <Field
                    label="Meetup point"
                    hint="Where travelers should reach on the trip day"
                    error={errors.meetupPoint}
                  >
                    <input
                      type="text"
                      placeholder="e.g. Manali bus stand, Himachal Pradesh"
                      className={inputClass(errors.meetupPoint)}
                      {...register("meetupPoint", { required: "Enter the meetup point" })}
                    />
                  </Field>
                ) : (
                  /* Pickup & drop service: all four fields */
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
              </div>
            </Card>

            {/* Meals + travel */}
            <Card icon={Bus} title="Meals and travel">
              <div className="space-y-5">
                <div>
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Utensils size={15} className="text-teal-800" /> Meals included
                  </span>
                  <Choice type="checkbox" name="meals" options={mealOptions} register={register} />
                </div>

                <TierPicker name="stays" label="Stays" register={register} error={errors.stays} />
                <TierPicker name="travel" label="Travel" register={register} error={errors.travel} />
              </div>
            </Card>

            {/* Terms */}
            <Card icon={ScrollText} title="Terms">
              <Choice type="radio" name="termsType" options={termsOptions} register={register} />

              {termsType === "custom" && (
                <div className="mt-4">
                  <Field label="Your terms" error={errors.customTerms}>
                    <textarea
                      rows={4}
                      placeholder="Write the new terms here..."
                      className={`${inputClass(errors.customTerms)} resize-y`}
                      {...register("customTerms", { required: "Write the terms for this package" })}
                    />
                  </Field>
                </div>
              )}
            </Card>

            {/* Roadmap */}
            <Card icon={FileText} title="Roadmap">
              <div className="space-y-4">
                {roadmap.length > 0 && (
                  <p className="text-sm text-slate-600">
                    {roadmap.map((stop) => stop.place || "?").join(" → ")}
                    <br />
                    <strong>
                      {roadmap.length} places, {totalDays} days
                    </strong>
                  </p>
                )}

                <button
                  type="button"
                  className={`flex items-center gap-2 rounded-full border bg-white px-4 py-2
                             text-sm font-medium text-slate-700 transition hover:bg-teal-50/50 ${
                               errors.roadmap
                                 ? "border-red-400 hover:border-red-500"
                                 : "border-slate-300 hover:border-teal-700"
                             }`}
                  onClick={openRoadmap}
                >
                  <Plus size={16} /> {roadmap.length > 0 ? "Edit roadmap" : "Add roadmap"}
                </button>

                <ErrorText error={errors.roadmap?.root} />
              </div>
            </Card>
          </div>

          {/* ================= RIGHT SIDE ================= */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Card icon={CalendarDays} title="Date and price">
              <div className="space-y-4">
                <Field label="Trip date" error={errors.date}>
                  <input
                    type="date"
                    min={today}
                    className={inputClass(errors.date)}
                    {...register("date", {
                      required: "Select the trip date",
                      validate: (value) => value >= getToday() || "Trip date can't be in the past",
                    })}
                  />
                </Field>

                <Field label="Trip type" error={errors.tripType}>
                  <select
                    className={inputClass(errors.tripType)}
                    {...register("tripType", { required: "Select the trip type" })}
                  >
                    <option value="">Select trip type</option>
                    {tripTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Duration (days)" error={errors.duration}>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    placeholder="e.g. 5"
                    className={inputClass(errors.duration)}
                    {...register("duration", {
                      required: "Enter the duration",
                      valueAsNumber: true,
                      min: { value: 1, message: "Minimum duration is 1 day" },
                      max: { value: 15, message: "Maximum duration is 15 days" },
                    })}
                  />
                </Field>

                <Field label="Max travelers" error={errors.maxTravelers}>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 12"
                    className={inputClass(errors.maxTravelers)}
                    {...register("maxTravelers", {
                      required: "Enter the group size",
                      valueAsNumber: true,
                      min: { value: 1, message: "Group size must be at least 1" },
                    })}
                  />
                </Field>

                <Field label="Price per head (₹)" error={errors.pricePerHead}>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 6499"
                    className={inputClass(errors.pricePerHead)}
                    {...register("pricePerHead", {
                      required: "Enter the price per head",
                      valueAsNumber: true,
                      min: { value: 1, message: "Price must be more than 0" },
                    })}
                  />
                </Field>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-teal-800 px-6 py-3
                             text-sm font-semibold text-white transition hover:bg-teal-700
                             focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-700/30
                             disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <PackagePlus size={18} />}
                  {isSubmitting ? "Adding package..." : "Add package"}
                </button>
              </div>
            </Card>
          </div>
        </form>

        {/* ================= ROADMAP MODAL ================= */}
        {showRoadmap && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Trip roadmap</h2>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600"
                  onClick={closeRoadmap}
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="mb-4 text-sm text-slate-500">
                Add every place in order, and how many days the group stays there.
              </p>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
                        {dayLabel(index)}
                      </span>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-red-600"
                        onClick={() => remove(index)}
                        aria-label={`Remove place ${index + 1}`}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Place" error={errors.roadmap?.[index]?.place}>
                        <input
                          type="text"
                          placeholder="e.g. Manali"
                          className={inputClass(errors.roadmap?.[index]?.place)}
                          {...register(`roadmap.${index}.place`, { required: "Enter the place name" })}
                        />
                      </Field>

                      <Field label="Days stayed" error={errors.roadmap?.[index]?.days}>
                        <input
                          type="number"
                          min="1"
                          className={inputClass(errors.roadmap?.[index]?.days)}
                          {...register(`roadmap.${index}.days`, {
                            valueAsNumber: true,
                            required: "Enter the number of days",
                            min: { value: 1, message: "Minimum 1 day" },
                          })}
                        />
                      </Field>
                    </div>

                    <div className="mt-4">
                      <Field label="What we do here (optional)">
                        <input
                          type="text"
                          placeholder="e.g. Snow point, local market, bonfire night"
                          className={inputClass(false)}
                          {...register(`roadmap.${index}.note`)}
                        />
                      </Field>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3
                             text-sm font-medium text-slate-700 transition
                             hover:border-teal-700 hover:bg-teal-50/50"
                  onClick={() => append({ place: "", days: 1, note: "" })}
                >
                  <Plus size={16} /> Add place
                </button>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  {fields.length} places, {totalDays} days
                </span>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full bg-teal-800 px-6 py-2.5
                             text-sm font-semibold text-white transition hover:bg-teal-700"
                  onClick={closeRoadmap}
                >
                  <PackagePlus size={16} /> Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}