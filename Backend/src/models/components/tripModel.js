import mongoose from "mongoose";

// Allowed values. Keep these the same as the lists in your AddPackage form.
const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks", "Tea / Coffee"];
const TIERS = ["Not included", "Budget", "Deluxe", "Premium"];
const TRIP_TYPES = ["Solo travelers only", "Couples only", "Mixed group", "Friends group", "Family"];

// An uploaded image (what your uploadMedia function returns)
const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // needed later to delete it from Cloudinary
  },
  { _id: false }
);

// One place in the roadmap
const roadmapStopSchema = new mongoose.Schema(
  {
    place: { type: String, required: [true, "Place name is required."], trim: true },
    days: { type: Number, required: [true, "Days are required."], min: 1 },
    note: { type: String, trim: true, default: "" }, // "What we do here" (optional)
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    // Unique code for this trip, e.g. PG-JAI-GOA-20260105-4821.
    // If you don't send one, it is created automatically (see the hook below).
    tripIdentifier: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      immutable: true, // can't be changed after the trip is created
    },

    // Operator who created this trip (for operator-created trips)
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Operator",
      default: null,
    },

    // ----- Images -----
    banner: { type: imageSchema, required: [true, "Banner image is required."] },
    thumbnail: { type: imageSchema, required: [true, "Small image is required."] },

    // ----- Route -----
    from: { type: String, required: [true, "From city is required."], trim: true },
    to: { type: String, required: [true, "To city is required."], trim: true },

    // Name of the guide / instructor (the form sends a name for now)
    guide: { type: String, required: [true, "Guide is required."], trim: true },

    // Trip start date
    date: { type: Date, required: [true, "Trip date is required."] },

    // ----- Timings (24 hour "HH:MM", like the time input sends) -----
    pickupTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Pickup time must be HH:MM."],
    },
    pickupLocation: { type: String, required: true, trim: true },
    dropTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Drop time must be HH:MM."],
    },
    dropLocation: { type: String, required: true, trim: true },

    // Number of days (nights = days - 1, see the virtual below)
    duration: { type: Number, required: true, min: 2, max: 15 },

    // ----- Pricing in rupees -----
    pricePerHead: { type: Number, required: true, min: 1 },

    tripType: { type: String, required: true, enum: TRIP_TYPES },

    // ----- Includes -----
    meals: { type: [{ type: String, enum: MEALS }], default: [] },
    stays: { type: String, required: true, enum: TIERS },
    travel: { type: String, required: true, enum: TIERS },

    // ----- Terms -----
    termsType: { type: String, enum: ["regular", "custom"], default: "regular" },
    customTerms: {
      type: String,
      trim: true,
      // only required when the admin chose "Add new terms"
      required: [
        function () {
          return this.termsType === "custom";
        },
        "Please write the terms.",
      ],
    },

    // ----- Roadmap (list of places in order) -----
    roadmap: {
      type: [roadmapStopSchema],
      validate: [(stops) => stops.length > 0, "Add at least one place to the roadmap."],
    },

    // Admin can hide a trip without deleting it
    isActive: { type: Boolean, default: true },

    // For operator-created trips: pending | approved | rejected
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved", // admin-created trips are approved by default
    },
    rejectionReason: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Creates the tripIdentifier if it was not sent
tripSchema.pre("validate", function () {
  if (!this.tripIdentifier && this.from && this.to && this.date) {
    const code = (text) => text.slice(0, 3).toUpperCase(); // "Jaipur" -> "JAI"
    const day = this.date.toISOString().slice(0, 10).replaceAll("-", ""); // 20260105
    const random = Math.floor(1000 + Math.random() * 9000); // 4 digit number

    this.tripIdentifier = `PG-${code(this.from)}-${code(this.to)}-${day}-${random}`;
  }
});

// Nights are worked out from days, so we don't store them twice
tripSchema.virtual("nights").get(function () {
  return this.duration - 1;
});

// Common query: active trips sorted by date
tripSchema.index({ isActive: 1, date: 1 });

const Trip = mongoose.model("Trip", tripSchema);

export default Trip;