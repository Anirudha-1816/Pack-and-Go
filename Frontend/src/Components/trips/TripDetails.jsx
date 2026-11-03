import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CheckoutModal from "./CheckoutModal";
import useAuthStore from "../../Stores/authStore";
// import Navbar from '../Navbar/Navbar'

const API_URL = `${import.meta.env.VITE_API_URL}/trip/get`;

// Used in the "Includes" pop-up to show what is included and what is not
const ALL_MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks", "Tea / Coffee"];

// SAMPLE regular terms. Replace these with the real terms your super admin sets.
const REGULAR_TERMS = [
  "Your seat is confirmed only after the payment is complete.",
  "Carry a valid government ID proof on the trip.",
  "Reach the pickup point 15 minutes before the pickup time.",
  "Cancellation and refund follow the Pack&Go cancellation policy.",
  "The plan can change because of weather or road conditions.",
];

// 6499 -> ₹6,499
const money = (amount) => `₹${amount.toLocaleString("en-IN")}`;

// "06:30" -> "6:30 AM"
const formatTime = (time) => {
  const [hour, minute] = time.split(":");
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute} ${suffix}`;
};

// ---------- Styles used in many places ----------

const headingFont = "font-['Bricolage_Grotesque',sans-serif]";
const card = "rounded-2xl border border-[#e3e8de] bg-white";
const sectionTitle = `${headingFont} mb-4 text-lg font-bold text-[#0f3d2a]`;

// ---------- Small icons ----------
function Icon({ children }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const BedIcon = () => (
  <Icon>
    <path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 00-3-3h-7v5" />
    <circle cx="7" cy="11" r="1.5" />
  </Icon>
);

const BusIcon = () => (
  <Icon>
    <rect x="4" y="4" width="16" height="13" rx="3" />
    <path d="M4 11h16M7 17v3M17 17v3" />
    <circle cx="8" cy="14" r=".6" />
    <circle cx="16" cy="14" r=".6" />
  </Icon>
);

const MealIcon = () => (
  <Icon>
    <path d="M7 3v8M4 3v5a3 3 0 006 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10" />
  </Icon>
);

const ChevronIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

// ---------- Pop-up box (closes with the X, a click outside, or the Esc key) ----------
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a2b1e]/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()} // clicks inside should not close it
      >
        <div className="flex items-center justify-between border-b border-[#e3e8de] px-6 py-4">
          <h2 className={`${headingFont} text-xl font-bold text-[#0f3d2a]`}>{title}</h2>
          <button
            className="grid h-9 w-9 place-items-center rounded-full bg-[#f1f5ee] text-sm text-[#0f3d2a] transition hover:bg-[#b3261e] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff7a1a]"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto px-6 pb-6 pt-5">{children}</div>
      </div>
    </div>
  );
}

// One small fact (label on top, value below)
function Fact({ label, children, className = "" }) {
  return (
    <div className={`bg-white px-5 py-4 ${className}`}>
      <p className="mb-1 text-xs text-[#6b7a72]">{label}</p>
      <p className="break-words text-sm font-semibold text-[#14211a]">{children}</p>
    </div>
  );
}

// ---------- The page ----------
export default function TripDetails() {
  const { id } = useParams(); // the trip id from the URL: /trips/:id
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const checkoutQuery = new URLSearchParams(location.search);
  const checkoutOutcome = checkoutQuery.get("checkout");
  const checkoutBookingId = checkoutQuery.get("bookingId");

  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");
  const [checkoutReturn] = useState(() =>
    ["success", "cancelled"].includes(checkoutOutcome) && checkoutBookingId
      ? { bookingId: checkoutBookingId, outcome: checkoutOutcome }
      : null
  );
  const [modal, setModal] = useState(() =>
    location.state?.openCheckout || checkoutReturn ? "checkout" : null
  );

  // Get this trip from the API
  useEffect(() => {
    axios
      .get(`${API_URL}/${id}`)
      .then((res) => setTrip(res.data.data))
      .catch((err) => {
  console.error("Trip failed to load:", err.response?.status, err.response?.data || err.message);
  setError(err.response?.data?.message || "We couldn't load this trip.");
});
  }, [id]);

  useEffect(() => {
    if (location.state?.openCheckout || ["success", "cancelled"].includes(checkoutOutcome)) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [checkoutOutcome, location.key, location.pathname, location.state, navigate]);

  const closeModal = () => setModal(null);
  const startBooking = () => {
    if (!user) {
      navigate("/login", { state: { from: location, openCheckout: true } });
      return;
    }

    setModal("checkout");
  };

  // ----- Loading and error screens -----
  if (error) {
    return (
      <div className="mx-auto w-[min(1120px,92%)] pb-16 pt-6 font-['Figtree',system-ui,sans-serif] text-[#14211a]">
        <button
          className="mb-4 inline-flex h-10 items-center rounded-full border border-[#d9ddd4] bg-white px-4 text-sm font-semibold text-[#0f3d2a] transition hover:bg-[#f1f5ee]"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <p className={`${card} px-6 py-14 text-center text-[#55655b]`}>{error}</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mx-auto w-[min(1120px,92%)] pb-16 pt-6 font-['Figtree',system-ui,sans-serif] text-[#14211a]">
        <p className="sr-only">Loading trip...</p>
        <div className="h-10 w-32 animate-pulse rounded-full bg-[#e6ece2]" />
        <div className="mt-4 h-[300px] animate-pulse rounded-[28px] bg-[#e6ece2]" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="h-72 animate-pulse rounded-2xl bg-[#e6ece2]" />
          <div className="h-72 animate-pulse rounded-2xl bg-[#e6ece2]" />
        </div>
      </div>
    );
  }

  // ----- Values we show -----
  const nights = trip.duration - 1;
  const totalDays = trip.roadmap.reduce((sum, stop) => sum + stop.days, 0);

  // Ask Cloudinary for a smaller copy of the banner so the page loads fast
  const bannerUrl = trip.banner.url.replace("/upload/", "/upload/w_1600,q_auto,f_auto/");

  const startDate = new Date(trip.date);
  const longDate = startDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const shortDate = startDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  // "Day 1-2", "Day 3" ... for each place in the roadmap
  const dayLabel = (index) => {
    let start = 1;
    for (let i = 0; i < index; i++) start += trip.roadmap[i].days;
    const end = start + trip.roadmap[index].days - 1;
    return start === end ? `Day ${start}` : `Day ${start}-${end}`;
  };

  // One row in the booking card that opens a pop-up
  const sideRows = [
    { key: "roadmap", title: "Roadmap", note: `${trip.roadmap.length} places, ${totalDays} days` },
    { key: "includes", title: "Includes", note: "Meals, stay and travel" },
    { key: "terms", title: "Terms", note: "Must read this", important: true },
  ];

  return (
    <>
    <div className="mx-auto w-[min(1120px,92%)] pb-16 pt-6 font-['Figtree',system-ui,sans-serif] text-[#14211a]">
      {/* Back link */}
      <button
        className="mb-4 inline-flex h-10 items-center rounded-full border border-[#d9ddd4] bg-white px-4 text-sm font-semibold text-[#0f3d2a] transition hover:bg-[#f1f5ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff7a1a]"
        onClick={() => navigate(-1)}
      >
        ← Back to trips
      </button>

      {/* ================= BANNER ================= */}
      <div
        className="relative flex h-[260px] items-end overflow-hidden rounded-[28px] bg-[#0b2a22] bg-cover bg-center sm:h-[320px]"
        style={{ backgroundImage: `url(${bannerUrl})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,43,30,0)_30%,rgba(10,43,30,0.85))]" />
        <div className="relative p-6 text-white sm:p-8">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              {shortDate}
            </span>
            <span className="rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              {trip.duration} Days / {nights} Nights
            </span>
            <span className="rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              {trip.tripType}
            </span>
          </div>
          <h1 className={`${headingFont} text-[clamp(1.9rem,4.5vw,3rem)] font-extrabold leading-none`}>
            {trip.from} → {trip.to}
          </h1>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* ================= MAIN DISPLAY ================= */}
        <main className="flex min-w-0 flex-col gap-6">
          {/* Quick facts */}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#e3e8de] bg-[#e3e8de] lg:grid-cols-[1.5fr_1.2fr_1.1fr_1fr_1.5fr]">
            <Fact label="Starts on">{longDate}</Fact>
            <Fact label="Duration">
              {trip.duration} Days / {nights} Nights
            </Fact>
            <Fact label="Trip type">{trip.tripType}</Fact>
            <Fact label="Your guide">{trip.guide}</Fact>
            <Fact label="Trip ID" className="col-span-2 lg:col-span-1">
              {trip.tripIdentifier}
            </Fact>
          </div>

          {/* Route at a glance */}
          <section className={`${card} p-6`}>
            <h3 className={sectionTitle}>Where we are going</h3>
            <div className="flex flex-wrap items-center gap-2">
              {trip.roadmap.map((stop, index) => (
                <span key={index} className="inline-flex items-center gap-2">
                  {index > 0 && <span className="font-bold text-[#ff7a1a]">→</span>}
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#f1f5ee] py-1.5 pl-1.5 pr-4 text-sm font-semibold">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0f3d2a] text-xs text-white">
                      {index + 1}
                    </span>
                    {stop.place} · {stop.days} {stop.days === 1 ? "day" : "days"}
                  </span>
                </span>
              ))}
            </div>
            <button
              className="mt-4 text-sm font-semibold text-[#0f3d2a] underline underline-offset-4 hover:text-[#ff7a1a]"
              onClick={() => setModal("roadmap")}
            >
              View full roadmap
            </button>
          </section>

          {/* Stay, travel and meals */}
          <section className={`${card} p-6`}>
            <h3 className={sectionTitle}>Stay, travel and meals</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-[#f1f5ee] p-4">
                <span className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-white text-[#0f3d2a]">
                  <BedIcon />
                </span>
                <p className="text-xs text-[#6b7a72]">Where we stay</p>
                <p className="mt-0.5 font-semibold">
                  {trip.stays === "Not included" ? "Not included" : `${trip.stays} stay`}
                </p>
              </div>

              <div className="rounded-xl bg-[#f1f5ee] p-4">
                <span className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-white text-[#0f3d2a]">
                  <BusIcon />
                </span>
                <p className="text-xs text-[#6b7a72]">How we travel</p>
                <p className="mt-0.5 font-semibold">
                  {trip.travel === "Not included" ? "Not included" : `${trip.travel} travel`}
                </p>
              </div>

              <div className="rounded-xl bg-[#f1f5ee] p-4">
                <span className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-white text-[#0f3d2a]">
                  <MealIcon />
                </span>
                <p className="text-xs text-[#6b7a72]">Meals</p>
                {trip.meals.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {trip.meals.map((meal) => (
                      <span
                        key={meal}
                        className="rounded-full bg-[#0f3d2a] px-2.5 py-0.5 text-xs font-semibold text-white"
                      >
                        {meal}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-0.5 font-semibold">Not included</p>
                )}
              </div>
            </div>
          </section>
        </main>

        {/* ================= BOOKING CARD ================= */}
        <aside className={`${card} order-first p-6 shadow-[0_18px_40px_-28px_rgba(15,61,42,0.5)] lg:sticky lg:top-28 lg:order-last`}>
          <p className="text-sm text-[#6b7a72]">Starting from</p>
          <p className="mt-1">
            <span className={`${headingFont} text-[34px] font-extrabold leading-none text-[#0f3d2a]`}>
              {money(trip.pricePerHead)}
            </span>
            <span className="text-sm text-[#6b7a72]"> per person</span>
          </p>

          <button
            className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#ff7a1a] text-base font-bold text-[#17261e] transition hover:bg-[#e8660a] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#0f3d2a]"
            onClick={startBooking}
          >
            Book this trip
          </button>
          <p className="mt-2.5 text-center text-xs text-[#6b7a72]">
            Your seat is confirmed after the payment is complete.
          </p>

          <div className="mt-5 divide-y divide-[#e3e8de] border-t border-[#e3e8de]">
            {sideRows.map((row) => (
              <button
                key={row.key}
                className="group flex w-full items-center justify-between py-3.5 text-left"
                onClick={() => setModal(row.key)}
              >
                <span>
                  <span className="block font-semibold text-[#14211a] group-hover:text-[#0f3d2a]">
                    {row.title}
                  </span>
                  <span
                    className={`block text-xs ${
                      row.important ? "font-semibold text-[#d9620d]" : "text-[#6b7a72]"
                    }`}
                  >
                    {row.note}
                  </span>
                </span>
                <span className="text-[#9aa59d] transition group-hover:translate-x-0.5 group-hover:text-[#0f3d2a]">
                  <ChevronIcon />
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      {/* ================= POP-UPS ================= */}

      {/* Roadmap */}
      {modal === "roadmap" && (
        <Modal title="Trip roadmap" onClose={closeModal}>
          <div className="flex flex-col gap-3">
            {trip.roadmap.map((stop, index) => (
              <div key={index} className="rounded-2xl border border-[#e3e8de] p-4">
                <span className="inline-block rounded-full bg-[#0f3d2a] px-3 py-1 text-xs font-bold text-white">
                  {dayLabel(index)}
                </span>
                <h3 className={`${headingFont} mt-2 text-lg font-bold`}>{stop.place}</h3>
                <p className="mt-0.5 text-sm text-[#6b7a72]">
                  {stop.days} {stop.days === 1 ? "day" : "days"} here
                </p>
                {stop.note && <p className="mt-2 text-sm leading-relaxed text-[#2b3a31]">{stop.note}</p>}
              </div>
            ))}
          </div>
          <p className="text-center text-sm font-semibold text-[#0f3d2a]">
            {trip.roadmap.length} places, {totalDays} days in total
          </p>
        </Modal>
      )}

      {/* Includes */}
      {modal === "includes" && (
        <Modal title="What's included" onClose={closeModal}>
          <h3 className="text-sm font-bold text-[#0f3d2a]">Meals</h3>
          <ul className="grid gap-2">
            {ALL_MEALS.map((meal) => {
              const included = trip.meals.includes(meal);
              return (
                <li
                  key={meal}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${
                    included ? "bg-[#e8f6ee] text-[#0f6b3a]" : "bg-[#f4f4f2] text-[#8a8f8c]"
                  }`}
                >
                  <span className="w-4 font-bold">{included ? "✓" : "✕"}</span> {meal}
                </li>
              );
            })}
          </ul>

          <h3 className="mt-2 text-sm font-bold text-[#0f3d2a]">Stay and travel</h3>
          <ul className="grid gap-2">
            {[["Stay", trip.stays], ["Travel", trip.travel]].map(([name, tier]) => (
              <li
                key={name}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  tier === "Not included" ? "bg-[#f4f4f2] text-[#8a8f8c]" : "bg-[#e8f6ee] text-[#0f6b3a]"
                }`}
              >
                <span className="w-4 font-bold">{tier === "Not included" ? "✕" : "✓"}</span> {name}: {tier}
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {/* Terms and timings */}
      {modal === "terms" && (
        <Modal title="Terms and timings" onClose={closeModal}>
          <h3 className="text-sm font-bold text-[#0f3d2a]">Pickup and drop</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[#f1f5ee] p-4">
              <p className="text-xs text-[#6b7a72]">Pickup</p>
              <p className={`${headingFont} text-2xl font-bold text-[#0f3d2a]`}>{formatTime(trip.pickupTime)}</p>
              <p className="text-sm">{trip.pickupLocation}</p>
            </div>
            <div className="rounded-xl bg-[#f1f5ee] p-4">
              <p className="text-xs text-[#6b7a72]">Drop</p>
              <p className={`${headingFont} text-2xl font-bold text-[#0f3d2a]`}>{formatTime(trip.dropTime)}</p>
              <p className="text-sm">{trip.dropLocation}</p>
            </div>
          </div>

          <h3 className="mt-2 text-sm font-bold text-[#0f3d2a]">Terms</h3>
          {trip.termsType === "custom" ? (
            <p className="whitespace-pre-line text-sm leading-relaxed">{trip.customTerms}</p>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
              {REGULAR_TERMS.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ol>
          )}

          <button
            className="mt-2 h-12 rounded-xl bg-[#0f3d2a] font-bold text-white transition hover:bg-[#0a2b1e] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#ff7a1a]"
            onClick={closeModal}
          >
            I have read this
          </button>
        </Modal>
      )}
      {modal === "checkout" && (
        <CheckoutModal
          trip={trip}
          user={user}
          onClose={closeModal}
          checkoutReturn={checkoutReturn}
        />
      )}
    </div>
    </>
  );
}