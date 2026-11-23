// All demo data lives here. Replace these with API calls later.

export const PROFILE_DEFAULTS = {
  name: "Aarav Singh",
  email: "admin@packandgo.com",
  phone: "+91 98765 43210",
  photo: "",
};

export const ACCOUNT_INFO = {
  createdAt: "2026-01-15T10:30",
  lastLogin: "2026-11-23T09:12",
  lastLoginDevice: "Chrome on Windows, Jaipur",
};

export const NOTIFICATION_DEFAULTS = {
  newBookings: true,
  operatorRequests: true,
  newFeedback: true,
  newEvents: false,
  payments: true,
  emailNotifications: true,
  inAppNotifications: true,
};

export const PLATFORM_DEFAULTS = {
  name: "Pack&Go",
  logo: "",
  supportEmail: "support@packandgo.com",
  supportPhone: "+91 98765 43210",
  currency: "INR",
  maintenanceMode: false,
};

export const PAYMENT_DEFAULTS = {
  serviceFee: "5",
  taxPercent: "5",
  refundWindowDays: "7",
  refundPolicy:
    "Customers get a full refund if they cancel inside the free cancellation window. After that, the operator's cancellation policy applies.",
};

export const POLICY_DEFAULTS = {
  userRegistration: true,
  operatorRegistration: true,
  operatorApproval: true,
  cancellationPolicy: "moderate",
  reviewModeration: "flagged",
  suspensionPolicy: "reports",
};

export const CANCELLATION_POLICIES = [
  { value: "flexible", label: "Flexible", text: "Full refund up to 7 days before the trip." },
  { value: "moderate", label: "Moderate", text: "Full refund up to 14 days before, 50% after that." },
  { value: "strict", label: "Strict", text: "50% refund up to 30 days before, none after that." },
];

export const REVIEW_POLICIES = [
  { value: "auto", label: "Publish immediately", text: "Reviews go live as soon as they are submitted." },
  { value: "flagged", label: "Hold flagged reviews", text: "Only reviews with flagged words wait for approval." },
  { value: "all", label: "Approve every review", text: "Every review waits for an admin before it shows." },
];

export const SUSPENSION_POLICIES = [
  { value: "manual", label: "Manual only", text: "Accounts are suspended only by an admin." },
  { value: "reports", label: "After 3 valid reports", text: "Accounts are flagged for suspension after 3 valid reports." },
  { value: "strict", label: "After 1 serious report", text: "Accounts are flagged right after one serious report." },
];

export const SESSIONS = [
  { id: 1, device: "Chrome on Windows", location: "Jaipur, India", lastActive: "Active now", current: true },
  { id: 2, device: "Safari on iPhone", location: "Jaipur, India", lastActive: "2 hours ago", current: false },
  { id: 3, device: "Firefox on Ubuntu", location: "Delhi, India", lastActive: "Yesterday", current: false },
];

export const LOGIN_ACTIVITY = [
  { id: 1, device: "Chrome on Windows", location: "Jaipur, India", date: "2026-11-23T09:12", status: "Success" },
  { id: 2, device: "Safari on iPhone", location: "Jaipur, India", date: "2026-11-23T07:40", status: "Success" },
  { id: 3, device: "Unknown browser", location: "Mumbai, India", date: "2026-11-21T23:05", status: "Failed" },
  { id: 4, device: "Firefox on Ubuntu", location: "Delhi, India", date: "2026-11-20T18:22", status: "Success" },
];

const logRows = [
  ["Aarav Singh", "Approved operator registration", "Operator: Himalayan Trails", "2026-11-22T18:42", "Success"],
  ["Priya Nair", "Deleted event category", "Category: Night Safari", "2026-11-22T16:10", "Success"],
  ["Aarav Singh", "Changed platform service fee", "Platform settings", "2026-11-22T11:25", "Success"],
  ["Rohan Mehta", "Rejected event submission", "Event: Desert Rave 2026", "2026-11-21T20:03", "Success"],
  ["Priya Nair", "Failed login attempt", "Admin account", "2026-11-21T23:05", "Failed"],
  ["Aarav Singh", "Suspended user account", "User: neha.k@mail.com", "2026-11-21T14:48", "Success"],
  ["Rohan Mehta", "Approved refund request", "Booking #PG-10482", "2026-11-21T10:30", "Success"],
  ["Priya Nair", "Edited hero slide", "Hero slide: Monsoon Escapes", "2026-11-20T17:55", "Success"],
  ["Aarav Singh", "Enabled maintenance mode", "Platform settings", "2026-11-20T02:00", "Warning"],
  ["Aarav Singh", "Disabled maintenance mode", "Platform settings", "2026-11-20T02:45", "Success"],
  ["Rohan Mehta", "Removed review", "Review #R-3391", "2026-11-19T19:12", "Success"],
  ["Priya Nair", "Exported bookings report", "Bookings", "2026-11-19T15:40", "Success"],
  ["Aarav Singh", "Updated support email", "Platform settings", "2026-11-19T12:05", "Success"],
  ["Rohan Mehta", "Refund failed to process", "Booking #PG-10377", "2026-11-18T21:17", "Failed"],
  ["Priya Nair", "Approved operator registration", "Operator: Blue Wave Tours", "2026-11-18T13:34", "Success"],
  ["Aarav Singh", "Added event category", "Category: Heritage Walks", "2026-11-17T18:20", "Success"],
  ["Rohan Mehta", "Flagged suspicious booking", "Booking #PG-10291", "2026-11-17T09:50", "Warning"],
  ["Priya Nair", "Changed review moderation policy", "Policy settings", "2026-11-16T16:42", "Success"],
  ["Aarav Singh", "Logged out all devices", "Admin account", "2026-11-15T22:10", "Success"],
  ["Rohan Mehta", "Updated profile photo", "Admin account", "2026-11-15T11:08", "Success"],
];

export const ACTIVITY_LOGS = logRows.map(([admin, action, resource, date, status], i) => ({
  id: i + 1,
  admin,
  action,
  resource,
  date,
  status,
}));

export const SYSTEM_INFO = [
  { id: "api", label: "Backend / API status", value: "Operational", tone: "green" },
  { id: "db", label: "Database status", value: "Healthy", tone: "green" },
  { id: "version", label: "Application version", value: "v1.0.0", tone: "slate" },
  { id: "env", label: "Environment", value: "Development", tone: "amber" },
  { id: "backup", label: "Last backup", value: "22 Nov 2026, 02:00 AM", tone: "slate" },
  { id: "health", label: "System health", value: "Good", tone: "green" },
];