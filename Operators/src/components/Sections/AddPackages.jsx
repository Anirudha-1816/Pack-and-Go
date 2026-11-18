// Operator "Add package" page
// Needs:  npm i react-hook-form lucide-react react-hot-toast
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Camera,
  CalendarDays,
  Bus,
  FileText,
  ImagePlus,
  Loader2,
  PackagePlus,
  ScrollText,
  Utensils,
} from "lucide-react";

// ---------- Dropdown / choice options (change these anytime) ----------
const tripTypes = ["Solo travelers only", "Couples only", "Mixed group", "Friends group", "Family"];

const mealOptions = [
  { value: "Breakfast", label: "Breakfast" },
  { value: "Lunch", label: "Lunch" },
  { value: "Dinner", label: "Dinner" },
  { value: "Snacks", label: "Snacks" },
  { value: "Tea / Coffee", label: "Tea / Coffee" },
];

const travelOptions = [
  { value: "self", label: "Self travel to the decided place" },
  { value: "pickup", label: "Pickup from a meeting point" },
];

const termsOptions = [
  { value: "regular", label: "Regular terms" },
  { value: "custom", label: "Add new terms" },
];

// Today's date as YYYY-MM-DD (local time), used to block past dates
const today = new Date().toLocaleDateString("en-CA");

// ---------- Shared input style ----------
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 " +
  "placeholder:text-slate-400 outline-none transition " +
  "focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10";

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

// ---------- Small helper: label + input + error message ----------
function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && !error && <small className="mt-1 block text-xs text-slate-500">{hint}</small>}
      {error && <small className="mt-1 block text-xs text-red-600">{error.message}</small>}
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
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>

      <label
        className={`group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl
                    border-2 border-dashed border-slate-300 bg-slate-50 transition
                    hover:border-teal-700 hover:bg-teal-50/50 ${className}`}
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
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-800">
              <ImagePlus size={22} />
            </span>
            <p className="text-sm font-medium text-slate-700">Click to select</p>
            <small className="text-xs text-slate-500">{hint}</small>
          </div>
        )}
      </label>

      {error && <small className="mt-1 block text-xs text-red-600">{error.message}</small>}
    </div>
  );
}

export default function OperatorAddPackage() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { termsType: "regular", meals: [] },
  });

  // Used to clear the image previews after the form is reset
  const [formKey, setFormKey] = useState(0);

  // Show extra inputs only when needed
  const travel = watch("travel");
  const termsType = watch("termsType");

  const onSubmit = async (data) => {
    // 1. The plain form data (images show up as FileList)
    console.log("Form data:", data);

    // 2. The same data as multipart/form-data, ready for your backend
    const { banner, thumbnail, meals, ...rest } = data;
    if (rest.termsType === "regular") delete rest.customTerms;
    if (rest.travel !== "pickup") delete rest.meetingPoint;

    const formData = new FormData();
    formData.append("banner", banner[0]);
    formData.append("thumbnail", thumbnail[0]);
    formData.append("meals", JSON.stringify(meals)); // array sent as a JSON string
    Object.keys(rest).forEach((key) => formData.append(key, rest[key]));

    console.log("FormData (what the backend will receive):", Object.fromEntries(formData));

    // TODO: add your API call here, e.g.
    // await tripsBaseUrlApi.post("/create", formData, { withCredentials: true });

    toast.success("Package added (check the console)");
    reset();
    setFormKey((key) => key + 1);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f5]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        {/* ---------- Page heading ---------- */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Add package</h1>
          <p className="mt-2 text-slate-500">Create a trip for travelers to book.</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 lg:grid-cols-3">
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
            <Card icon={FileText} title="Package details">
              <div className="space-y-4">
                <Field label="Package title" error={errors.title}>
                  <input
                    type="text"
                    placeholder="e.g. Spiti valley road trip"
                    className={inputClass}
                    {...register("title", { required: "Enter a title" })}
                  />
                </Field>

                <Field
                  label="Trip location"
                  hint="One place, or a route like Jaipur to Manali"
                  error={errors.location}
                >
                  <input
                    type="text"
                    placeholder="e.g. Manali, Himachal Pradesh"
                    className={inputClass}
                    {...register("location", { required: "Enter the trip location" })}
                  />
                </Field>

                <Field label="Description" error={errors.description}>
                  <textarea
                    rows={4}
                    placeholder="Tell travelers what to expect on this trip..."
                    className={`${inputClass} resize-y`}
                    {...register("description", { required: "Write a short description" })}
                  />
                </Field>
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

                <Field label="Travel" error={errors.travel}>
                  <select className={inputClass} {...register("travel", { required: "Select a travel option" })}>
                    <option value="">Select travel option</option>
                    {travelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Only shown when pickup is selected */}
                {travel === "pickup" && (
                  <Field label="Meeting point" error={errors.meetingPoint}>
                    <input
                      type="text"
                      placeholder="e.g. Sindhi Camp bus stand, Jaipur"
                      className={inputClass}
                      {...register("meetingPoint", { required: "Enter the meeting point" })}
                    />
                  </Field>
                )}
              </div>
            </Card>

            {/* Terms */}
            <Card icon={ScrollText} title="Terms">
              <Choice type="radio" name="termsType" options={termsOptions} register={register} />

              {termsType === "custom" && (
                <div className="mt-4">
                  <textarea
                    rows={4}
                    placeholder="Write the new terms here..."
                    className={`${inputClass} resize-y`}
                    {...register("customTerms", { required: "Please write the terms" })}
                  />
                  {errors.customTerms && (
                    <small className="mt-1 block text-xs text-red-600">{errors.customTerms.message}</small>
                  )}
                </div>
              )}
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
                    className={inputClass}
                    {...register("date", {
                      required: "Select a date",
                      validate: (value) => value >= today || "Date can't be in the past",
                    })}
                  />
                </Field>

                <Field label="Trip type" error={errors.tripType}>
                  <select className={inputClass} {...register("tripType", { required: "Select trip type" })}>
                    <option value="">Select trip type</option>
                    {tripTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Max travelers" error={errors.maxTravelers}>
                  <input
                    type="number"
                    placeholder="e.g. 12"
                    className={inputClass}
                    {...register("maxTravelers", {
                      required: "Enter the group size",
                      min: { value: 1, message: "Must be at least 1" },
                    })}
                  />
                </Field>

                <Field label="Price per head (₹)" error={errors.pricePerHead}>
                  <input
                    type="number"
                    placeholder="e.g. 6499"
                    className={inputClass}
                    {...register("pricePerHead", {
                      required: "Enter a price",
                      min: { value: 1, message: "Must be more than 0" },
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
      </div>
    </div>
  );
}