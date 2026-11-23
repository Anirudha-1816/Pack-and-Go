import mongoose from "mongoose";
import {
  MEALS,
  TIERS,
  TRIP_TYPES,
  PICKUP_DROP_TYPES,
  TIME_REGEX,
  OPERATOR_TRIP_STATUS,
} from "../../constants/tripConstants.js";

// Pickup and drop details are only needed when we provide the service
const needsPickupDrop = function () {
  return this.pickupDropType === "group";
};

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

const operatorTripSchema = new mongoose.Schema(
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

    // Operator who created this trip
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Operator",
      required: [true, "Operator is required."],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Package title is required."],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Description is required."],
      trim: true,
    },

    // Destination (single field used for both from and to in operator form)
    destination: {
      type: String,
      required: [true, "Destination is required."],
      trim: true,
    },

    // ----- Route (derived from destination for operator trips) -----
    from: { type: String, required: [true, "From city is required."], trim: true },
    to: { type: String, required: [true, "To city is required."], trim: true },

    // Name of the guide / instructor (the controller uses the operator's name)
    guide: { type: String, required: [true, "Guide is required."], trim: true },

    // Trip start date
    date: { type: Date, required: [true, "Trip date is required."] },

    // ----- Pickup & drop -----
    // group = operator provides pickup and drop
    // self  = travelers reach the meetup point and go home on their own
    pickupDropType: {
      type: String,
      enum: PICKUP_DROP_TYPES,
      default: "group",
    },

    // Used only when pickupDropType is "self"
    meetupPoint: {
      type: String,
      trim: true,
      required: [
        function () {
          return this.pickupDropType === "self";
        },
        "Meetup point is required.",
      ],
    },

    // Used only when pickupDropType is "group" (24 hour "HH:MM", like the time input sends)
    pickupTime: {
      type: String,
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
    duration: { type: Number, required: true, min: 1, max: 15 },

    maxTravelers: { type: Number, required: true, min: 1 },

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
      // only required when the operator chose "Add new terms"
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

    // ----- Images -----
    banner: { type: imageSchema, required: [true, "Banner image is required."] },
    thumbnail: { type: imageSchema, required: [true, "Small image is required."] },

    // Admin can hide a trip without deleting it
    isActive: { type: Boolean, default: true },

    // Soft delete flag - when true, trip is hidden from all normal queries
    // Default false so existing documents without this field are treated as not deleted
    isDeleted: { type: Boolean, default: false, index: true },

    // For operator-created trips: pending | approved | rejected
    status: {
      type: String,
      enum: OPERATOR_TRIP_STATUS,
      default: "pending", // operator-created trips need admin approval
    },
    rejectionReason: { type: String, default: "" },

    // When the admin approves the trip, a copy is published in the public
    // Trip collection so travelers can discover and book it. This holds that
    // Trip's _id, so the operator can always find the bookings that follow.
    approvedTrip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Creates the tripIdentifier if it was not sent
operatorTripSchema.pre("validate", function () {
  if (!this.tripIdentifier && this.from && this.to && this.date) {
    const code = (text) => text.slice(0, 3).toUpperCase(); // "Jaipur" -> "JAI"
    const day = this.date.toISOString().slice(0, 10).replaceAll("-", ""); // 20260105
    const random = Math.floor(1000 + Math.random() * 9000); // 4 digit number

    this.tripIdentifier = `PG-${code(this.from)}-${code(this.to)}-${day}-${random}`;
  }
});

// Nights are worked out from days, so we don't store them twice
// (a 1 day trip has 0 nights)
operatorTripSchema.virtual("nights").get(function () {
  return Math.max(this.duration - 1, 0);
});

// Common query: active trips sorted by date
operatorTripSchema.index({ isActive: 1, date: 1 });
// Query by operator
operatorTripSchema.index({ operator: 1, createdAt: -1 });

const OperatorTrip = mongoose.model("OperatorTrip", operatorTripSchema);

export default OperatorTrip;