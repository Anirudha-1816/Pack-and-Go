import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form"; // NEW: useFieldArray
import styles from "./AddPackage.module.css";
import axios from 'axios'
import {toast} from 'react-toastify'

// ---------- Dropdown options (later you can load these from your API) ----------
const cities = ["Jaipur", "Delhi", "Mumbai", "Goa", "Manali", "Leh", "Kerala", "Udaipur", "Varanasi", "Kashmir" ,"Spiti"];
const guides = ["Rahul Sharma", "Priya Verma", "Amit Singh" , 'Raj']; // sample names
const tripTypes = ["Solo travelers only", "Couples only", "Mixed group", "Friends group", "Family"];
const mealOptions = ["Breakfast", "Lunch", "Dinner", "Snacks", "Tea / Coffee"];
const tierOptions = ["Not included", "Budget", "Deluxe", "Premium"];

// Duration: 2 days / 1 night up to 15 days / 14 nights
const durations = [];
for (let days = 2; days <= 15; days++) {
  durations.push({ value: days, label: `${days} Days / ${days - 1} Nights` });
}

// Today's date in YYYY-MM-DD (local time), used to block past dates
const today = new Date().toLocaleDateString("en-CA");

// ---------- Small helper: a label + input + error message ----------
function Field({ label, error, children }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {error && <small className={styles.error}>{error.message}</small>}
    </label>
  );
}

// ---------- Small helper: image box with preview + select ----------
function ImagePicker({ name, label, shape, register, error }) {
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
      <label className={`${styles.picker} ${shape}`}>
        <input type="file" accept="image/*" hidden {...field} onChange={handleChange} />

        {preview ? (
          <>
            <img src={preview} alt="Preview" className={styles.previewImg} />
            <span className={styles.change}>Change</span>
          </>
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.plus}>+</span>
            <p>{label}</p>
            <small>Click to select</small>
          </div>
        )}
      </label>
      {error && <small className={styles.error}>{error.message}</small>}
    </div>
  );
}

// ---------- Small helper: pick one of Budget / Deluxe / Premium ----------
function TierPicker({ name, register, error }) {
  return (
    <>
      <div className={styles.pills}>
        {tierOptions.map((option) => (
          <label key={option} className={styles.pill}>
            <input type="radio" value={option} {...register(name, { required: "Please choose one" })} />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {error && <small className={styles.error}>{error.message}</small>}
    </>
  );
}

// ---------- The page ----------
export default function AddPackage() {
  const {
    register,
    handleSubmit,
    watch,
    getValues,
    control, // NEW: needed for the roadmap list
    trigger, // NEW: checks the roadmap when the pop-up is closed
    formState: { errors },
  } = useForm({
    defaultValues: { termsType: "regular", meals: [], roadmap: [] }, // NEW: roadmap starts empty
  });

  // NEW: the list of roadmap stops (add / remove places)
  const { fields, append, remove } = useFieldArray({
    control,
    name: "roadmap",
    rules: { required: "Add at least one place to the roadmap" },
  });

  const [showRoadmap, setShowRoadmap] = useState(false); // NEW: pop-up open or closed

  // Show the terms text box only when "Add new terms" is selected
  const termsType = watch("termsType");

  // NEW: roadmap values, total days, and the "Day 1-2" label of each stop
  const roadmap = watch("roadmap");
  const totalDays = roadmap.reduce((sum, stop) => sum + (stop.days || 0), 0);

  const dayLabel = (index) => {
    let start = 1;
    for (let i = 0; i < index; i++) start += roadmap[i]?.days || 0;
    const end = start + (roadmap[index]?.days || 1) - 1;
    return start === end ? `Day ${start}` : `Day ${start}-${end}`;
  };

  // NEW: open the pop-up (with one empty place ready to fill)
  const openRoadmap = () => {
    if (fields.length === 0) append({ place: "", days: 1, note: "" });
    setShowRoadmap(true);
  };

  // NEW: close the pop-up only if every place is filled correctly
  const closeRoadmap = async () => {
    if (fields.length === 0) {
      setShowRoadmap(false);
      return;
    }
    const isValid = await trigger("roadmap");
    if (isValid) setShowRoadmap(false);
  };

  const onSubmit = async(data) => {
    // 1. The plain form data (images show up as FileList)
    console.log("Form data:", data);

    // 2. The same data as multipart/form-data, ready for your backend
    const { banner, thumbnail, meals, roadmap, ...rest } = data; // NEW: roadmap
    if (rest.termsType === "regular") delete rest.customTerms;

    const formData = new FormData();
    formData.append("banner", banner[0]);
    formData.append("thumbnail", thumbnail[0]);
    formData.append("meals", JSON.stringify(meals)); // array sent as a JSON string
    formData.append("roadmap", JSON.stringify(roadmap)); // NEW: same for the roadmap
    Object.keys(rest).forEach((key) => formData.append(key, rest[key]));

    console.log("FormData (what the backend will receive):", Object.fromEntries(formData));
    

    try {
  const res = await axios.post("http://localhost:8080/trip/create", formData ,
    {withCredentials : true}
  ); 
  toast.success(res.data.message);
} catch (error) {
  toast.error(error.response?.data?.message || "Something went wrong.");
}
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Add package</h1>

      <form className={styles.box} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.layout}>
          {/* ================= LEFT SIDE ================= */}
          <div className={styles.left}>
            {/* Banner image */}
            <ImagePicker
              name="banner"
              label="Banner image"
              shape={styles.bannerShape}
              register={register}
              error={errors.banner}
            />

            <div className={styles.lower}>
              {/* Small image + roadmap card under it */}
              <div className={styles.leftCol}>
                <ImagePicker
                  name="thumbnail"
                  label="Small image"
                  shape={styles.thumbShape}
                  register={register}
                  error={errors.thumbnail}
                />

                {/* NEW: Roadmap card */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Roadmap</h3>

                  {roadmap.length > 0 && (
                    <p className={styles.summary}>
                      {roadmap.map((stop) => stop.place || "?").join(" → ")}
                      <br />
                      <strong>{roadmap.length} places, {totalDays} days</strong>
                    </p>
                  )}

                  <button type="button" className={styles.roadmapBtn} onClick={openRoadmap}>
                    {roadmap.length > 0 ? "Edit roadmap" : "Add roadmap"}
                  </button>

                  {errors.roadmap?.root && <small className={styles.error}>{errors.roadmap.root.message}</small>}
                </div>
              </div>

              <div className={styles.stack}>
                {/* Meals (checkboxes) */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Meals</h3>
                  <div className={styles.pills}>
                    {mealOptions.map((meal) => (
                      <label key={meal} className={styles.pill}>
                        <input type="checkbox" value={meal} {...register("meals")} />
                        <span>{meal}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Stays */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Stays</h3>
                  <TierPicker name="stays" register={register} error={errors.stays} />
                </div>

                {/* Travel */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Travel</h3>
                  <TierPicker name="travel" register={register} error={errors.travel} />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Terms</h3>
              <div className={styles.pills}>
                <label className={styles.pill}>
                  <input type="radio" value="regular" {...register("termsType")} />
                  <span>Regular terms</span>
                </label>
                <label className={styles.pill}>
                  <input type="radio" value="custom" {...register("termsType")} />
                  <span>Add new terms</span>
                </label>
              </div>

              {termsType === "custom" && (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    className={`${styles.input} ${styles.textarea}`}
                    placeholder="Write the new terms here..."
                    {...register("customTerms", { required: "Please write the terms" })}
                  />
                  {errors.customTerms && <small className={styles.error}>{errors.customTerms.message}</small>}
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT SIDE ================= */}
          <div className={`${styles.card} ${styles.right}`}>
            {/* From and to */}
            <div className={styles.row}>
              <Field label="From" error={errors.from}>
                <select className={styles.input} {...register("from", { required: "Select a city" })}>
                  <option value="">Select city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </Field>

              <Field label="To" error={errors.to}>
                <select
                  className={styles.input}
                  {...register("to", {
                    required: "Select a city",
                    validate: (value) => value !== getValues("from") || "Must be different from 'From'",
                  })}
                >
                  <option value="">Select city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Guide */}
            <Field label="Assigned guide / instructor" error={errors.guide}>
              <select className={styles.input} {...register("guide", { required: "Select a guide" })}>
                <option value="">Select guide</option>
                {guides.map((guide) => (
                  <option key={guide} value={guide}>{guide}</option>
                ))}
              </select>
            </Field>

            {/* Date */}
            <Field label="Trip date" error={errors.date}>
              <input
                type="date"
                min={today}
                className={styles.input}
                {...register("date", {
                  required: "Select a date",
                  validate: (value) => value >= today || "Date can't be in the past",
                })}
              />
            </Field>

            {/* Timings */}
            <div className={styles.row}>
              <Field label="Pickup time" error={errors.pickupTime}>
                <input type="time" className={styles.input} {...register("pickupTime", { required: "Required" })} />
              </Field>
              <Field label="Pickup location" error={errors.pickupLocation}>
                <input
                  type="text"
                  placeholder="e.g. Sindhi Camp, Jaipur"
                  className={styles.input}
                  {...register("pickupLocation", { required: "Required" })}
                />
              </Field>
            </div>

            <div className={styles.row}>
              <Field label="Drop time" error={errors.dropTime}>
                <input type="time" className={styles.input} {...register("dropTime", { required: "Required" })} />
              </Field>
              <Field label="Drop location" error={errors.dropLocation}>
                <input
                  type="text"
                  placeholder="e.g. Sindhi Camp, Jaipur"
                  className={styles.input}
                  {...register("dropLocation", { required: "Required" })}
                />
              </Field>
            </div>

            {/* Duration */}
            <Field label="Duration of trip" error={errors.duration}>
              <select className={styles.input} {...register("duration", { required: "Select duration" })}>
                <option value="">Select duration</option>
                {durations.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </Field>

            {/* Pricing */}
            <Field label="Price per head (₹)" error={errors.pricePerHead}>
              <input
                type="number"
                placeholder="e.g. 6499"
                className={styles.input}
                {...register("pricePerHead", { required: "Enter a price", min: { value: 1, message: "Must be more than 0" } })}
              />
            </Field>

            <div className={styles.row}>
              <Field label="Group of 2, per person (₹)" error={errors.priceGroup2}>
                <input
                  type="number"
                  className={styles.input}
                  {...register("priceGroup2", { required: "Enter a price", min: { value: 1, message: "Must be more than 0" } })}
                />
              </Field>
              <Field label="Group of 4, per person (₹)" error={errors.priceGroup4}>
                <input
                  type="number"
                  className={styles.input}
                  {...register("priceGroup4", { required: "Enter a price", min: { value: 1, message: "Must be more than 0" } })}
                />
              </Field>
            </div>

            {/* Trip type */}
            <Field label="Trip type" error={errors.tripType}>
              <select className={styles.input} {...register("tripType", { required: "Select trip type" })}>
                <option value="">Select trip type</option>
                {tripTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </Field>

            <button type="submit" className={styles.submit}>Add package</button>
          </div>
        </div>

        {/* ================= NEW: ROADMAP POP-UP ================= */}
        {/* It's a plain div (not another form), so it's safe inside the main form */}
        {showRoadmap && (
          <div className={styles.overlay}>
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="roadmap-title">
              <div className={styles.modalHead}>
                <h2 id="roadmap-title" className={styles.modalTitle}>Trip roadmap</h2>
                <p className={styles.modalSub}>Add every place in order, and how many days the group stays there.</p>
              </div>

              <div className={styles.modalBody}>
                {fields.map((field, index) => (
                  <div key={field.id} className={styles.stop}>
                    <div className={styles.stopTop}>
                      <span className={styles.dayBadge}>{dayLabel(index)}</span>
                      <button
                        type="button"
                        className={styles.remove}
                        onClick={() => remove(index)}
                        aria-label={`Remove place ${index + 1}`}
                      >
                        ✕
                      </button>
                    </div>

                    <div className={styles.stopRow}>
                      <Field label="Place" error={errors.roadmap?.[index]?.place}>
                        <input
                          type="text"
                          placeholder="e.g. Manali"
                          className={styles.input}
                          {...register(`roadmap.${index}.place`, { required: "Enter a place" })}
                        />
                      </Field>

                      <Field label="Days stayed" error={errors.roadmap?.[index]?.days}>
                        <input
                          type="number"
                          min="1"
                          className={styles.input}
                          {...register(`roadmap.${index}.days`, {
                            valueAsNumber: true,
                            required: "Enter days",
                            min: { value: 1, message: "Min 1" },
                          })}
                        />
                      </Field>
                    </div>

                    <Field label="What we do here (optional)">
                      <input
                        type="text"
                        placeholder="e.g. Snow point, local market, bonfire night"
                        className={styles.input}
                        {...register(`roadmap.${index}.note`)}
                      />
                    </Field>
                  </div>
                ))}

                <button
                  type="button"
                  className={styles.addPlace}
                  onClick={() => append({ place: "", days: 1, note: "" })}
                >
                  + Add place
                </button>
              </div>

              <div className={styles.modalFoot}>
                <span className={styles.total}>
                  {fields.length} places, {totalDays} days
                </span>
                <button type="button" className={styles.done} onClick={closeRoadmap}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}