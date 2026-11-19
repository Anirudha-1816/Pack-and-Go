/**
 * Shared constants for OperatorTrip and Trip models.
 * Keep these in ONE place so schema, validation, and UI always match.
 */

// Meal options
export const MEALS = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
  "Tea / Coffee",
];

// Tier options for stays and travel
// Both OperatorTrip and Trip must use exactly these values
export const TIERS = [
  "Not included",
  "Budget",
  "Deluxe",
  "Premium",
  "Not needed",
];

// Trip type options
export const TRIP_TYPES = [
  "Solo travelers only",
  "Couples only",
  "Mixed group",
  "Friends group",
  "Family",
];

// Pickup & drop service type
// "group" = operator provides pickup and drop
// "self"  = travelers reach the meetup point and go home on their own
export const PICKUP_DROP_TYPES = ["group", "self"];

// Status values for operator-created trips
export const OPERATOR_TRIP_STATUS = ["pending", "approved", "rejected"];

// Status values for public trips (admin-created default to approved)
export const TRIP_STATUS = ["pending", "approved", "rejected"];

// Time regex for HH:MM 24-hour format
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// Minimum rejection reason length
export const MIN_REJECTION_REASON_LENGTH = 10;

// Duration limits
export const MIN_DURATION = 1;
export const MAX_DURATION = 15;

// Max travelers minimum
export const MIN_MAX_TRAVELERS = 1;

// Price minimum
export const MIN_PRICE_PER_HEAD = 1;

// Default terms type
export const DEFAULT_TERMS_TYPE = "regular";

// Terms type options
export const TERMS_TYPES = ["regular", "custom"];

// Regular terms (shown to travelers when termsType is "regular")
export const REGULAR_TERMS = [
  "Your seat is confirmed only after the payment is complete.",
  "Carry a valid government ID proof on the trip.",
  "Reach the pickup point 15 minutes before the pickup time.",
  "Cancellation and refund follow the Pack&Go cancellation policy.",
  "The plan can change because of weather or road conditions.",
];

// Trip type for the public Trip collection
export const TRIP_COLLECTION_NAME = "Trip";
export const OPERATOR_TRIP_COLLECTION_NAME = "OperatorTrip";

/**
 * Public trip filter - tolerant of old documents that lack status/isActive fields.
 * Old documents (pre-feature) don't have status/isActive, so we use $ne to include them.
 * - status: { $ne: "rejected" } matches "approved", "pending", and missing
 * - isActive: { $ne: false } matches true and missing
 */
export const publicTripFilter = {
  status: { $ne: "rejected" },
  isActive: { $ne: false },
};

/**
 * Helper to build the full public trips query with date filter.
 * @param {Date} [fromDate] - Minimum date (default: now)
 * @returns {Object} MongoDB filter
 */
export const buildPublicTripsQuery = (fromDate = new Date()) => ({
  ...publicTripFilter,
  date: { $gte: fromDate },
});