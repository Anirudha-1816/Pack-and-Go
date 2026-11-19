import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaSuitcaseRolling,
  FaCalendar,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaRupeeSign,
  FaImage,
  FaRoute,
  FaUtensils,
  FaBed,
  FaBus,
  FaFileAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock as FaClockIcon,
  FaEye,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
} from "react-icons/fa";
import toast from "react-hot-toast";
import {
  fetchOperatorTrips,
  fetchOperatorTripDetail,
  approveOperatorTrip,
  rejectOperatorTrip,
} from "../../api/trips/operatorTripsApi.js";
import styles from "./OperatorTrips.module.css";

// ---------- Constants ----------
const MIN_REJECTION_REASON = 10;

const STATUS_STYLE = {
  pending: "bg-[#fff1d6] text-[#8a5a00]",
  approved: "bg-[#dff1e6] text-[#14633c]",
  rejected: "bg-[#fbe3e0] text-[#8f1d17]",
};

const STATUS_LABEL = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const TABS = [
  ["pending", "Pending"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["all", "All"],
];

const TIERS = ["Not included", "Budget", "Deluxe", "Premium", "Not needed"];
const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks", "Tea / Coffee"];
const TRIP_TYPES = ["Solo travelers only", "Couples only", "Mixed group", "Friends group", "Family"];
const PICKUP_DROP_TYPES = ["group", "self"];

// ---------- Toast styles ----------
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

// ---------- Helpers ----------
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const formatTime = (time) => {
  if (!time) return "";
  const [hour, minute] = time.split(":");
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute} ${suffix}`;
};

const formatPrice = (price) => `₹${Number(price || 0).toLocaleString("en-IN")}`;

const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// Small button variants
const smallBtn =
  "inline-flex h-9 items-center justify-center rounded-lg border px-3.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a1a] disabled:cursor-not-allowed disabled:opacity-50";
const btnNormal = `${smallBtn} border-[#cfd8cb] bg-white text-[#0f3d2a] hover:bg-[#f1f5ee]`;
const btnPrimary = `${smallBtn} border-[#0f3d2a] bg-[#0f3d2a] text-white hover:bg-[#0a2b1e]`;
const btnDanger = `${smallBtn} border-[#e6c4c0] bg-white text-[#b3261e] hover:bg-[#fdf0ee]`;
const btnGhost = `${smallBtn} border-transparent bg-transparent text-[#0f3d2a] hover:bg-[#eef7f1]`;

// Input style for rejection reason
const textareaStyle =
  "w-full resize-none rounded-[10px] border bg-white px-4 py-3 text-[15px] placeholder:text-[#9aa59d] focus:outline-none focus:ring-4";

// ---------- Small UI Components ----------

function StatusPill({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function TierBadge({ label, value }) {
  const isNotIncluded = value === "Not included";
  const isNotNeeded = value === "Not needed";
  const baseStyle =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium";
  const style = isNotIncluded || isNotNeeded
    ? `${baseStyle} bg-[#f4f4f2] text-[#8a8f8c]`
    : `${baseStyle} bg-[#e8eff1] text-[#24566f]`;

  return (
    <span className={style}>
      <span className="w-4 font-bold">{isNotIncluded || isNotNeeded ? "✕" : "✓"}</span>
      {label}: {value}
    </span>
  );
}

function MealTag({ meal }) {
  return (
    <span className="rounded-full bg-[#142b3b] px-2.5 py-0.5 text-xs font-semibold text-white">
      {meal}
    </span>
  );
}

function ModalOverlay({ isOpen, onClose, children, className = "" }) {
  if (!isOpen) return null;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 grid place-items-center bg-[#0d202d]/65 p-4 ${className}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function DetailModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between border-b border-[#e8e5de] px-6 py-4">
      <h2 className="text-xl font-bold text-[#142b3b]">{title}</h2>
      <button
        className="grid h-9 w-9 place-items-center rounded-full bg-[#e8eff1] text-sm text-[#142b3b] transition hover:bg-[#b3261e] hover:text-white"
        onClick={onClose}
        aria-label="Close"
      >
        <FaTimes size={18} />
      </button>
    </div>
  );
}

function DetailSection({ title, icon: Icon, children }) {
  return (
    <div className="px-6 py-4 border-b border-[#e8e5de]">
      <h3 className="flex items-center gap-2 text-sm font-bold text-[#142b3b] mb-3">
        <Icon size={18} className="text-[#2f6b8a]" />
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function FactRow({ label, value, className = "" }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-2 ${className}`}>
      <span className="text-xs text-[#61717b] shrink-0 w-full sm:w-40">{label}</span>
      <span className="text-sm font-semibold text-[#243746] break-words">{value}</span>
    </div>
  );
}

function ImagePreview({ url, alt, className = "" }) {
  if (!url) return null;
  const optimizedUrl = url.includes("/upload/")
    ? url.replace("/upload/", "/upload/w_800,q_auto,f_auto/")
    : url;
  return (
    <img
      src={optimizedUrl}
      alt={alt}
      className={`rounded-xl object-cover ${className}`}
      loading="lazy"
    />
  );
}

// ---------- Rejection Dialog ----------
function RejectDialog({ operatorTrip, onClose, onConfirm, busy }) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const tooShort = reason.trim().length < MIN_REJECTION_REASON;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (tooShort) return;
    onConfirm(reason.trim());
  };

  return (
    <ModalOverlay isOpen onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <DetailModalHeader title={`Reject "${operatorTrip.title}"?`} onClose={onClose} />
        <div className="flex flex-col gap-4 overflow-y-auto px-6 pb-6 pt-2">
          <p className="text-sm text-[#55655b]">
            Write a reason. The operator will see it, so keep it clear and polite.
          </p>

          <label htmlFor="rejection-reason" className="text-sm font-medium text-[#2b3a31]">
            Reason for rejection
          </label>
          <textarea
            id="rejection-reason"
            rows="4"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell the operator why the package was not approved"
            aria-invalid={touched && tooShort ? "true" : "false"}
            className={`${textareaStyle} ${
              touched && tooShort
                ? "border-[#b3261e] focus:ring-[#b3261e]/10"
                : "border-[#d9ddd4] focus:border-[#0f3d2a] focus:ring-[#0f3d2a]/10"
            }`}
            disabled={busy}
          />
          <div className="flex justify-between text-[13px]">
            <span className={touched && tooShort ? "text-[#b3261e]" : "text-transparent"} role="alert">
              Please write at least {MIN_REJECTION_REASON} characters.
            </span>
            <span className="text-[#7a877f]">{reason.trim().length} characters</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className={btnNormal} onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || tooShort}
              className="inline-flex h-9 items-center rounded-lg bg-[#b3261e] px-4 text-sm font-semibold text-white transition hover:bg-[#8f1d17] disabled:opacity-50"
            >
              {busy ? "Rejecting..." : "Reject package"}
            </button>
          </div>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ---------- Approve Confirmation Dialog ----------
function ApproveDialog({ operatorTrip, onClose, onConfirm, busy }) {
  return (
    <ModalOverlay isOpen onClose={onClose}>
      <div>
        <DetailModalHeader title={`Approve "${operatorTrip.title}"?`} onClose={onClose} />
        <div className="flex flex-col gap-4 overflow-y-auto px-6 pb-6 pt-2">
          <p className="text-sm text-[#55655b]">
            This will publish the package to the public trips list where travelers can discover and book it.
            A copy will be created in the public Trip collection, and the operator will be able to see bookings.
          </p>

          <div className="rounded-xl bg-[#eef7f1] p-4">
            <p className="text-sm font-medium text-[#14633c]">
              <FaCheckCircle size={16} className="inline-block mr-1" /> This action cannot be undone.
            </p>
            <p className="mt-1 text-xs text-[#14633c]">
              The operator trip status will change to "Approved" and the public copy will be live immediately.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className={btnNormal} onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className="inline-flex h-9 items-center rounded-lg bg-[#0f3d2a] px-4 text-sm font-semibold text-white transition hover:bg-[#0a2b1e] disabled:opacity-50"
            >
              {busy ? "Approving..." : "Approve and publish"}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ---------- Operator Trip Card (List View) ----------
function OperatorTripCard({ trip, onClick, busyId }) {
  const isBusy = busyId === trip._id;
  const operator = trip.operator || {};

  return (
    <article
      className={`${styles.card} ${styles.cardHover}`}
      onClick={() => !isBusy && onClick(trip)}
    >
      <div className={styles.cardImage}>
        <ImagePreview url={trip.thumbnail?.url} alt={trip.title} className="h-full w-full" />
        <StatusPill status={trip.status} className={styles.cardStatus} />
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{trip.title}</h3>
        <p className={styles.cardDestination}>
          <FaMapMarkerAlt size={14} className="inline-block mr-1" />
          {trip.destination}
        </p>

        <div className={styles.cardMeta}>
          <span className={styles.metaItem}>
            <FaCalendar size={14} className="inline-block mr-1" />
            {formatDate(trip.date)}
          </span>
          <span className={styles.metaItem}>
            <FaRupeeSign size={14} className="inline-block mr-1" />
            {formatPrice(trip.pricePerHead)} / person
          </span>
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.operatorInfo}>
            <span
              className={styles.operatorAvatar}
              style={{ backgroundColor: "#e4efe8", color: "#0f3d2a" }}
            >
              {initials(operator.name)}
            </span>
            <span className={styles.operatorName}>{operator.name || "Unknown"}</span>
          </div>
          <span className={styles.submittedDate}>
            Submitted {formatDate(trip.createdAt)}
          </span>
        </div>
      </div>
    </article>
  );
}

// ---------- Detail View (Full Screen Modal) ----------
function DetailView({ trip, onClose, onApprove, onReject, busyId }) {
  const isBusy = busyId === trip._id;
  const operator = trip.operator || {};
  const totalDays = trip.roadmap?.reduce((sum, stop) => sum + (stop.days || 0), 0) || 0;
  const nights = Math.max(trip.duration - 1, 0);

  // Day labels for roadmap
  const dayLabel = (index) => {
    let start = 1;
    for (let i = 0; i < index; i++) start += trip.roadmap[i]?.days || 0;
    const end = start + (trip.roadmap[index]?.days || 1) - 1;
    return start === end ? `Day ${start}` : `Day ${start}-${end}`;
  };

  return (
    <ModalOverlay isOpen={!!trip} onClose={onClose} className="p-0">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8e5de] px-6 py-4 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <button
              className="grid h-9 w-9 place-items-center rounded-full bg-[#e8eff1] text-sm text-[#142b3b] transition hover:bg-[#b3261e] hover:text-white"
              onClick={onClose}
              aria-label="Close"
            >
              <FaChevronLeft size={18} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#142b3b] truncate max-w-[300px]">{trip.title}</h2>
              <p className="text-sm text-[#55655b]">{trip.destination} • {formatDate(trip.date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusPill status={trip.status} />
            {trip.status === "pending" && (
              <>
                <button
                  className={btnDanger}
                  onClick={() => onReject(trip)}
                  disabled={isBusy}
                >
                  <FaTimesCircle size={14} className="mr-1" /> Reject
                </button>
                <button
                  className={btnPrimary}
                  onClick={() => onApprove(trip)}
                  disabled={isBusy}
                >
                  <FaCheckCircle size={14} className="mr-1" /> Approve
                </button>
              </>
            )}
            <button
              className="grid h-9 w-9 place-items-center rounded-full bg-[#e8eff1] text-sm text-[#142b3b] transition hover:bg-[#b3261e] hover:text-white"
              onClick={onClose}
              aria-label="Close"
            >
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-y-auto">
          <div className="grid gap-0 lg:grid-cols-[1fr_400px]">
            {/* Main content */}
            <div className="p-6 space-y-6">
              {/* Images */}
              <div className="grid gap-4 md:grid-cols-2">
                <ImagePreview
                  url={trip.banner?.url}
                  alt={`${trip.title} banner`}
                  className="h-64 w-full rounded-2xl"
                />
                <ImagePreview
                  url={trip.thumbnail?.url}
                  alt={`${trip.title} thumbnail`}
                  className="h-64 w-full rounded-2xl"
                />
              </div>

              {/* Description */}
              <DetailSection title="Description" icon={FaFileAlt}>
                <p className="text-sm leading-relaxed text-[#2b3a31]">{trip.description}</p>
              </DetailSection>

              {/* Quick facts */}
              <DetailSection title="Quick facts" icon={FaRoute}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <FactRow label="Start date" value={formatDate(trip.date)} />
                  <FactRow label="Duration" value={`${trip.duration} days / ${nights} nights`} />
                  <FactRow label="Trip type" value={trip.tripType} />
                  <FactRow label="Guide" value={trip.guide} />
                  <FactRow label="Max travelers" value={trip.maxTravelers} />
                  <FactRow label="Price per head" value={formatPrice(trip.pricePerHead)} />
                  <FactRow label="Operator" value={operator.name || "Unknown"} />
                  <FactRow label="Submitted" value={formatDate(trip.createdAt)} />
                </div>
              </DetailSection>

              {/* Pickup & Drop */}
              <DetailSection title="Pickup & Drop" icon={FaMapMarkerAlt}>
                {trip.pickupDropType === "self" ? (
                  <FactRow label="Meetup point" value={trip.meetupPoint || "Not specified"} />
                ) : (
                  <>
                    <FactRow label="Pickup time" value={formatTime(trip.pickupTime)} />
                    <FactRow label="Pickup location" value={trip.pickupLocation} />
                    <FactRow label="Drop time" value={formatTime(trip.dropTime)} />
                    <FactRow label="Drop location" value={trip.dropLocation} />
                  </>
                )}
                <FactRow
                  label="Service type"
                  value={
                    trip.pickupDropType === "self"
                      ? "Self drop & pickup (travelers come and go on their own)"
                      : "Pickup & drop service (operator provides transport)"
                  }
                />
              </DetailSection>

              {/* Includes */}
              <DetailSection title="Includes" icon={FaUtensils}>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-[#61717b]">Meals</span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {trip.meals?.length > 0 ? (
                        trip.meals.map((meal) => <MealTag key={meal} meal={meal} />)
                      ) : (
                        <span className="text-sm text-[#8a8f8c]">Not included</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <TierBadge label="Stay" value={trip.stays} />
                    <TierBadge label="Travel" value={trip.travel} />
                  </div>
                </div>
              </DetailSection>

              {/* Roadmap */}
              <DetailSection title="Roadmap" icon={FaRoute}>
                <div className="space-y-3">
                  {trip.roadmap?.map((stop, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-[#e8e5de] p-4"
                    >
                      <span className="inline-block shrink-0 rounded-full bg-[#142b3b] px-3 py-1 text-xs font-bold text-white">
                        {dayLabel(index)}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#142b3b]">{stop.place}</h4>
                        <p className="text-sm text-[#61717b]">
                          {stop.days} {stop.days === 1 ? "day" : "days"} here
                        </p>
                        {stop.note && (
                          <p className="mt-1 text-sm text-[#2b3a31]">{stop.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <p className="text-center text-sm font-semibold text-[#142b3b] pt-2">
                    {trip.roadmap?.length} places, {totalDays} days in total
                  </p>
                </div>
              </DetailSection>

              {/* Terms */}
              <DetailSection title="Terms" icon={FaFileAlt}>
                {trip.termsType === "custom" ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed">{trip.customTerms}</p>
                ) : (
                  <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                    {[
                      "Your seat is confirmed only after the payment is complete.",
                      "Carry a valid government ID proof on the trip.",
                      "Reach the pickup point 15 minutes before the pickup time.",
                      "Cancellation and refund follow the Pack&Go cancellation policy.",
                      "The plan can change because of weather or road conditions.",
                    ].map((term) => (
                      <li key={term}>{term}</li>
                    ))}
                  </ol>
                )}
              </DetailSection>
            </div>

            {/* Sidebar */}
            <aside className="border-l border-[#e8e5de] p-6 bg-[#fafbfa] lg:sticky lg:top-16 lg:max-h-[calc(90vh-80px)] overflow-y-auto">
              <div className="space-y-4">
                {/* Operator info */}
                <div className="rounded-xl border border-[#e3e8de] bg-white p-4">
                  <h4 className="font-semibold text-[#142b3b] mb-3">Operator</h4>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e4efe8] text-[#0f3d2a] font-semibold"
                    >
                      {initials(operator.name)}
                    </span>
                    <div>
                      <p className="font-medium text-[#142b3b]">{operator.name || "Unknown"}</p>
                      <p className="text-sm text-[#55655b]">{operator.email}</p>
                    </div>
                  </div>
                </div>

                {/* Approved trip link */}
                {trip.status === "approved" && trip.approvedTrip && (
                  <div className="rounded-xl border border-[#e3e8de] bg-white p-4">
                    <h4 className="font-semibold text-[#142b3b] mb-3">Live Trip</h4>
                    <p className="text-sm text-[#55655b] mb-3">
                      This package is live and travelers can book it.
                    </p>
                    <button className={btnGhost}>
                      <FaEye size={14} className="mr-1" /> View public trip
                    </button>
                  </div>
                )}

                {/* Rejection reason */}
                {trip.status === "rejected" && (
                  <div className="rounded-xl border border-[#e3e8de] bg-[#fdf0ee] p-4">
                    <h4 className="font-semibold text-[#8f1d17] mb-2 flex items-center gap-1">
                      <FaTimesCircle size={16} /> Rejection reason
                    </h4>
                    <p className="text-sm text-[#8f1d17]">{trip.rejectionReason || "No reason was given."}</p>
                  </div>
                )}

                {/* Pending notice */}
                {trip.status === "pending" && (
                  <div className="rounded-xl border border-[#e3e8de] bg-[#fff1d6] p-4">
                    <h4 className="font-semibold text-[#8a5a00] mb-2 flex items-center gap-1">
                      <FaClockIcon size={16} /> Pending approval
                    </h4>
                    <p className="text-sm text-[#8a5a00]">
                      Waiting for admin review. Once approved, it will be published for travelers.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ---------- Main Page Component ----------
export default function OperatorTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const navigate = useNavigate();

  // 1. Load trips on mount and when tab changes
  const loadTrips = async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const status = tab === "all" ? undefined : tab;
      const data = await fetchOperatorTrips(status);
      setTrips(data);
    } catch (err) {
      console.error("Could not load operator trips:", err);
      setError(err.response?.data?.message || "We could not load the operator trips. Please try again.");
    } finally {
      if (refresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, [tab]);

  // 2. Handle approve
  const handleApprove = async (trip) => {
    setShowApproveDialog(true);
  };

  const confirmApprove = async () => {
    if (!selectedTrip) return;
    try {
      setBusyId(selectedTrip._id);
      await approveOperatorTrip(selectedTrip._id);
      showSuccess(`${selectedTrip.title} approved and published for travelers.`);
      setShowApproveDialog(false);
      setSelectedTrip(null);
      loadTrips({ refresh: true });
    } catch (err) {
      console.error("Could not approve:", err);
      showError(err.response?.data?.message || "Could not approve the package.");
    } finally {
      setBusyId(null);
    }
  };

  // 3. Handle reject
  const handleReject = (trip) => {
    setSelectedTrip(trip);
    setShowRejectDialog(true);
  };

  const confirmReject = async (reason) => {
    if (!selectedTrip) return;
    try {
      setBusyId(selectedTrip._id);
      await rejectOperatorTrip(selectedTrip._id, reason);
      showSuccess(`${selectedTrip.title} was rejected.`);
      setShowRejectDialog(false);
      setSelectedTrip(null);
      loadTrips({ refresh: true });
    } catch (err) {
      console.error("Could not reject:", err);
      showError(err.response?.data?.message || "Could not reject the package.");
    } finally {
      setBusyId(null);
    }
  };

  // 4. Handle detail view
  const openDetail = (trip) => {
    setSelectedTrip(trip);
  };

  const closeDetail = () => {
    setSelectedTrip(null);
  };

  // 5. Counts for tabs
  const counts = {
    pending: trips.filter((t) => t.status === "pending").length,
    approved: trips.filter((t) => t.status === "approved").length,
    rejected: trips.filter((t) => t.status === "rejected").length,
    all: trips.length,
  };

  // 6. Apply search and sort
  const shown = trips
    .filter((t) =>
      `${t.title} ${t.destination} ${t.operator?.name || ""}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sortBy === "oldest"
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt)
    );

  return (
    <div className={`${styles.page} min-h-screen bg-[#f5f7f2] px-5 py-8 font-['Figtree',system-ui,sans-serif] text-[#14211a] sm:px-8`}>
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-['Instrument_Serif',Georgia,serif] text-[40px] font-normal leading-none text-[#0f3d2a]">
              Operator trips
            </h1>
            <p className="mt-2 text-[#55655b]">
              {loading
                ? "Loading trips..."
                : counts.pending === 0
                ? "No pending trips waiting for review."
                : `${counts.pending} ${counts.pending === 1 ? "trip is" : "trips are"} waiting for your review.`}
            </p>
          </div>
          <button
            type="button"
            className={btnNormal}
            onClick={() => loadTrips({ refresh: true })}
            disabled={loading || refreshing}
            aria-label={refreshing ? "Refreshing operator trips" : "Refresh operator trips"}
          >
            <svg
              aria-hidden="true"
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7v5h-5M4 17v-5h5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3" />
            </svg>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {/* Tabs, search, sort */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  tab === key
                    ? "border-[#0f3d2a] bg-[#0f3d2a] text-white"
                    : "border-[#d9ddd4] bg-white text-[#2b3a31] hover:border-[#1b7a4b]"
                }`}
              >
                {label}{" "}
                <span
                  className={
                    key === "pending" && counts.pending > 0 && tab !== key
                      ? "rounded-full bg-[#ff7a1a] px-1.5 text-xs font-semibold text-[#17261e]"
                      : "opacity-70"
                  }
                >
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search by title, destination, operator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#d9ddd4] bg-white px-4 text-sm placeholder:text-[#9aa59d] focus:border-[#0f3d2a] focus:outline-none focus:ring-4 focus:ring-[#0f3d2a]/10 sm:w-80"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 rounded-[10px] border border-[#d9ddd4] bg-white px-3 text-sm focus:border-[#0f3d2a] focus:outline-none focus:ring-4 focus:ring-[#0f3d2a]/10"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-[96px] animate-pulse rounded-2xl bg-[#e6ece2]" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-[#e3e8de] bg-white px-6 py-12 text-center">
            <p className="mb-4 text-[#55655b]">{error}</p>
            <button className={btnNormal} onClick={loadTrips}>
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && shown.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#bcc8b9] bg-white px-6 py-14 text-center">
            <h2 className="text-xl font-bold">
              {search
                ? "No trips match your search"
                : tab === "pending"
                ? "You are all caught up"
                : "Nothing here yet"}
            </h2>
            <p className="mt-2 text-[#55655b]">
              {search
                ? "Try a different title, destination or operator."
                : tab === "pending"
                ? "New operator trip submissions will show up here."
                : "Trips with this status will show up here."}
            </p>
            {search && (
              <button className={`${btnNormal} mt-5`} onClick={() => setSearch("")}>
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Trip list */}
        {!loading && !error && shown.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((trip) => (
              <OperatorTripCard
                key={trip._id}
                trip={trip}
                onClick={openDetail}
                busyId={busyId}
              />
            ))}
          </div>
        )}

        {/* Detail modal */}
        {selectedTrip && (
          <DetailView
            trip={selectedTrip}
            onClose={closeDetail}
            onApprove={handleApprove}
            onReject={handleReject}
            busyId={busyId}
          />
        )}

        {/* Reject dialog */}
        {showRejectDialog && selectedTrip && (
          <RejectDialog
            operatorTrip={selectedTrip}
            onClose={() => setShowRejectDialog(false)}
            onConfirm={confirmReject}
            busy={busyId === selectedTrip._id}
          />
        )}

        {/* Approve dialog */}
        {showApproveDialog && selectedTrip && (
          <ApproveDialog
            operatorTrip={selectedTrip}
            onClose={() => setShowApproveDialog(false)}
            onConfirm={confirmApprove}
            busy={busyId === selectedTrip._id}
          />
        )}
      </div>
    </div>
  );
}