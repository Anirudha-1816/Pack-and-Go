import mongoose from "mongoose";
import {
  MEALS,
  TIERS,
  TRIP_TYPES,
  PICKUP_DROP_TYPES,
  TIME_REGEX,
  TRIP_STATUS,
  MIN_DURATION,
  MAX_DURATION,
} from "../../constants/tripConstants.js";

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

// Pickup and drop details are only needed when we provide the service
const needsPickupDrop = function () {
  return this.pickupDropType === "group";
};

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

    // City from operator's location (for events filtering)
    city: { type: String, trim: true },

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

    // ----- Pickup & drop -----
    // group = operator provides pickup and drop
    // self  = travelers reach the meetup point and go home on their own
    // Optional: old trips don't have this, default to "group" for backward compat
    pickupDropType: {
      type: String,
      enum: PICKUP_DROP_TYPES,
      default: "group",
    },

    // Used only when pickupDropType is "self"
    // Optional: old trips don't have this
    meetupPoint: {
      type: String,
      trim: true,
      // Only required if pickupDropType is explicitly "self"
      required: [
        function () {
          return this.pickupDropType === "self";
        },
        "Meetup point is required.",
      ],
    },

    // Used only when pickupDropType is "group" (24 hour "HH:MM", like the time input sends)
    // Optional: old trips have pickupTime/pickupLocation/dropTime/dropLocation as required
    // We keep them as-is for old documents; new documents will have them
    pickupTime: {
      type: String,
      // Required only when pickupDropType is "group" (default), but old docs may not have pickupDropType
      required: [needsPickupDrop, "Pickup time is required."],
      match: [TIME_REGEX, "Pickup time must be HH:MM."],
    },
    pickupLocation: {
      type: String,
      trim: true,
      required: [needsPickupDrop, "Pickup location is required."],
    },
    dropTime: {
      type: String,
      required: [needsPickupDrop, "Drop time is required."],
      match: [TIME_REGEX, "Drop time must be HH:MM."],
    },
    dropLocation: {
      type: String,
      trim: true,
      required: [needsPickupDrop, "Drop location is required."],
    },

    // Number of days (nights = days - 1, see the virtual below)
    duration: { type: Number, required: true, min: MIN_DURATION, max: MAX_DURATION },

    // Max travelers - optional for old trips, default to a reasonable number
    maxTravelers: { type: Number, default: 20 },

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
    // Optional: old trips have roadmap but as a different structure potentially
    // Make it optional with default empty array, validate only for new documents
    roadmap: {
      type: [roadmapStopSchema],
      default: [],
      // Only validate if the array is explicitly provided (not default empty)
      validate: {
        validator: function (stops) {
          // If roadmap was explicitly set (not default), require at least one stop
          // We can't easily detect "explicitly set" here, so we allow empty for backward compat
          // New trips created via admin form will always send roadmap
          return true;
        },
        message: "Add at least one place to the roadmap.",
      },
    },

    // Admin can hide a trip without deleting it
    // Default true so old documents (missing this field) are treated as active
    isActive: { type: Boolean, default: true },

    // For operator-created trips: pending | approved | rejected
    // Default "approved" so old documents (missing this) are treated as approved
    status: {
      type: String,
      enum: TRIP_STATUS,
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