import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaSuitcaseRolling,
  FaCalendarCheck,
  FaUsers,
  FaStar,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCheck,
  FaSignOutAlt,
} from "react-icons/fa";
import axios from "axios";
import useAuthStore from "../Stores/authStore";
import ThemeSwitcher from "../Sources/ThemeSwitcher";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// =====================================================================
// Helpers
// =====================================================================

const DAY = 86400000;

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// "06:30" -> "6:30 AM"
const formatTime = (time) => {
  const [hour, minute] = time.split(":");
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
};

const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// upcoming, running or completed
function getTripStatus(trip) {
  const start = new Date(trip.date);
  const end = new Date(start.getTime() + trip.duration * DAY);
  const now = new Date();
  if (now < start) return "upcoming";
  if (now < end) return "running";
  return "completed";
}

const STATUS_LABEL = { upcoming: "Upcoming", running: "Running now", completed: "Completed" };
const STATUS_STYLE = {
  upcoming: "bg-[#f6ead0] text-[#7a5a14]",
  running: "bg-[#dff1e6] text-[#14633c]",
  completed: "bg-[#e8edf1] text-[#46586a]",
};

// Running first, then upcoming (soonest first), then completed (latest first)
function sortTrips(a, b) {
  const order = { running: 0, upcoming: 1, completed: 2 };
  if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
  const diff = new Date(a.date) - new Date(b.date);
  return a.status === "completed" ? -diff : diff;
}

// ---------- Styles used in many places ----------
const card = "rounded-2xl border border-[#e6e0d0] bg-white";
const serif = "font-['Instrument_Serif',Georgia,serif]";
const goldBtn =
  "inline-flex h-11 items-center justify-center rounded-full bg-[#d9b36a] px-6 text-sm font-bold text-[#13293d] transition hover:bg-[#e6c987] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white";
const blueBtn =
  "inline-flex h-9 items-center justify-center rounded-lg border border-[#cfd9e0] bg-white px-3.5 text-sm font-semibold text-[#2b6382] transition hover:bg-[#eef4f8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8913f]";

// =====================================================================
// Small pieces
// =====================================================================

// On / off switch
function Switch({ on, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8913f] ${
        on ? "bg-[#2e8b57]" : "bg-[#b7c2cb]"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          on ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function StatusPill({ status }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function Kpi({ icon, value, label, note }) {
  return (
    <div className={`${card} p-5`}>
      <span className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-[#f6ead0] text-[#a07a2c]">
        {icon}
      </span>
      <p className={`${serif} text-[40px] leading-none text-[#17384f]`}>{value}</p>
      <p className="mt-1.5 text-sm font-medium text-[#2b3d4d]">{label}</p>
      {note && <p className="text-xs text-[#7a8894]">{note}</p>}
    </div>
  );
}

// One trip as a card (used on the My trips tab)
function TripCard({ trip, travelers, onPassengers }) {
  return (
    <article className={`${card} flex flex-col p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={`${serif} text-[28px] leading-none text-[#17384f]`}>
            {trip.from} to {trip.to}
          </h3>
          <p className="mt-1.5 text-sm text-[#5b6b78]">{trip.tripType}</p>
        </div>
        <StatusPill status={trip.status} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-[#7a8894]">Starts on</p>
          <p className="font-semibold">{formatDate(trip.date)}</p>
        </div>
        <div>
          <p className="text-xs text-[#7a8894]">Duration</p>
          <p className="font-semibold">{trip.duration} days</p>
        </div>
        <div>
          <p className="text-xs text-[#7a8894]">Pickup</p>
          <p className="font-semibold">
            {formatTime(trip.pickupTime)}, {trip.pickupLocation}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#7a8894]">Travelers</p>
          <p className="font-semibold">{travelers}</p>
        </div>
      </div>

      <button className={`${blueBtn} mt-5 self-start`} onClick={onPassengers}>
        View passenger list
      </button>
    </article>
  );
}

// =====================================================================
// The page
// =====================================================================

export default function OperatorDashboard() {
  // eslint-disable-next-line no-unused-vars
  const { user, isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview");
  const [available, setAvailable] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tripFilter, setTripFilter] = useState("upcoming");
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [checkedIn, setCheckedIn] = useState({});

  // Data state
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch operator data on mount
  useEffect(() => {
    if (!isAuthenticated || !user) {
      fetchUser();
    }
  }, [isAuthenticated, user, fetchUser]);

  // Fetch trips and bookings when user is available
  useEffect(() => {
    if (user?._id) {
      // eslint-disable-next-line react-hooks/immutability
      fetchOperatorData();
    }
  }, [user]);

  const fetchOperatorData = async () => {
    try {
      setLoading(true);
      const [tripsRes, bookingsRes] = await Promise.all([
        axios.get(`${API_URL}/operator/trips`, { withCredentials: true }),
        axios.get(`${API_URL}/operator/bookings`, { withCredentials: true }),
      ]);

      const tripsData = tripsRes.data?.data || [];
      const bookingsData = bookingsRes.data?.data || [];

      // Add computed status to trips
      const tripsWithStatus = tripsData.map((t) => ({ ...t, status: getTripStatus(t) })).sort(sortTrips);
      setTrips(tripsWithStatus);
      setBookings(bookingsData);

      // Set availability from operator data
      if (user?.availability) {
        setAvailable(user.availability === "available");
      }
    } catch (err) {
      console.error("Failed to fetch operator data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const travelersOn = (tripId) =>
    bookings.filter((b) => b.trip === tripId).reduce((sum, b) => sum + b.travelers, 0);

  const count = (status) => trips.filter((t) => t.status === status).length;
  const activeTrips = trips.filter((t) => t.status !== "completed");
  const travelersBooked = activeTrips.reduce((sum, t) => sum + travelersOn(t._id), 0);

  const nextTrip = activeTrips[0];
  const selectedTrip = trips.find((t) => t._id === selectedTripId) || nextTrip || trips[0];

  const openPassengers = (tripId) => {
    setSelectedTripId(tripId);
    setTab("bookings");
  };

  // ----- Bookings of the selected trip -----
  const tripBookings = selectedTrip ? bookings.filter((b) => b.trip === selectedTrip._id) : [];
  const totalTravelers = tripBookings.reduce((sum, b) => sum + b.travelers, 0);
  const paidCount = tripBookings.filter((b) => b.payment === "paid").length;
  const checkedCount = tripBookings.filter((b) => checkedIn[b._id]).length;

  const shownTrips = tripFilter === "all" ? trips : trips.filter((t) => t.status === tripFilter);

  const nextStart = nextTrip && new Date(nextTrip.date);
  const dayNumber = nextTrip && Math.floor((new Date() - nextStart) / DAY) + 1;
  const daysToGo = nextTrip && Math.ceil((nextStart - new Date()) / DAY);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  const TABS = [
    ["overview", "Overview"],
    ["trips", "My trips"],
    ["bookings", "My bookings"],
  ];

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/operator/logout`, {}, { withCredentials: true });
      setMenuOpen(false);
      // Reset auth store
      useAuthStore.getState().logout();
      navigate("/operator/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4ec] flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-[#b8913f] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[#5b6b78]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f4ec] flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-[#b3261e]">{error}</p>
          <button
            onClick={fetchOperatorData}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#2f6b8a] px-6 text-sm font-bold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f7f4ec] flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-[#b3261e]">Please log in to access your dashboard.</p>
          <Link
            to="/operator/login"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#2f6b8a] px-6 text-sm font-bold text-white"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] font-['Figtree',system-ui,sans-serif] text-[#13293d] animate-fade-in">
      {/* ================= TOP BAR ================= */}
      <header className="sticky top-0 z-30 border-b border-[#e6e0d0] bg-[#f7f4ec]/90 backdrop-blur animate-slide-down">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 animate-slide-up">
            <span className="text-xl font-extrabold tracking-tight text-[#17384f]">
              Pack<span className="text-[#b8913f]">&</span>Go
            </span>
            <span className="rounded-full bg-[#17384f] px-2.5 py-0.5 text-xs font-semibold text-white">
              Operator
            </span>
          </div>

          {/* Tabs */}
          <nav
            aria-label="Operator"
            className="order-last flex w-full gap-1 overflow-x-auto md:order-none md:w-auto"
          >
            {TABS.map(([key, label], i) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-current={tab === key ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition animate-slide-up ${
                  tab === key ? "bg-[#17384f] text-white" : "text-[#46586a] hover:bg-[#ece6d6]"
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Availability and account */}
          <div className="ml-auto flex items-center gap-4 animate-slide-up">
            <div className="flex items-center gap-2.5">
              <span className="hidden text-sm font-medium text-[#46586a] sm:block">
                {available ? "Available" : "Unavailable"}
              </span>
              <Switch
                on={available}
                onChange={() => setAvailable(!available)}
                label="Available for new trips"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ThemeSwitcher showLabels={false} variant="dropdown" />
              <div className="relative">
                <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-label="Account menu"
                className="grid h-10 w-10 place-items-center rounded-full bg-[#b8913f] text-sm font-bold text-[#13293d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17384f]"
              >
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover animate-fade-in"
                  />
                ) : (
                  initials(user.name)
                )}
              </button>

              {menuOpen && (
                <div className={`${card} absolute right-0 top-12 w-60 p-4 shadow-xl animate-scale-in`}>
                  <p className="font-semibold">{user.name}</p>
                  <p className="truncate text-sm text-[#5b6b78]">{user.email}</p>
                  <button
                    className="mt-3 w-full rounded-lg border border-[#e6c4c0] py-2 text-sm font-semibold text-[#b3261e] hover:bg-[#fdf0ee] flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt className="text-sm" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-5 py-8 animate-slide-up">
        {/* ================= OVERVIEW ================= */}
        {tab === "overview" && (
          <div className="flex flex-col gap-6 animate-slide-up">
            <div>
              <h1 className={`${serif} text-[44px] leading-none text-[#17384f]`}>
                {greeting()}, {user.name?.split(" ")[0] || "Operator"}
              </h1>
              <p className="mt-2 text-[#5b6b78]">
                {today}
                {nextTrip?.status === "running" &&
                  `. Your ${nextTrip.to} trip is on, day ${dayNumber} of ${nextTrip.duration}.`}
              </p>
            </div>

            {/* Next trip */}
            {nextTrip ? (
              <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#14354b,#2b6382)] p-7 text-white sm:p-9">
                <svg
                  className="pointer-events-none absolute -right-10 top-0 hidden h-full w-[55%] md:block"
                  viewBox="0 0 400 260"
                  preserveAspectRatio="xMaxYMid slice"
                  aria-hidden="true"
                >
                  <circle cx="300" cy="140" r="150" fill="none" stroke="#fff" strokeOpacity="0.08" />
                  <circle cx="300" cy="140" r="100" fill="none" stroke="#fff" strokeOpacity="0.08" />
                  <path d="M40 220 C120 215 150 140 230 138 C310 136 340 80 390 40" fill="none" stroke="#d9b36a" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="40" cy="220" r="7" fill="#13293d" stroke="#fff" strokeWidth="2" />
                  <circle cx="230" cy="138" r="7" fill="#13293d" stroke="#fff" strokeWidth="2" />
                  <circle cx="390" cy="40" r="7" fill="#13293d" stroke="#fff" strokeWidth="2" />
                </svg>

                <div className="relative max-w-[560px]">
                  <span className="inline-block rounded-full bg-[#d9b36a] px-3.5 py-1 text-xs font-bold text-[#13293d]">
                    {nextTrip.status === "running"
                      ? `Running now, day ${dayNumber} of ${nextTrip.duration}`
                      : daysToGo <= 1
                        ? "Leaves tomorrow"
                        : `Leaves in ${daysToGo} days`}
                  </span>
                  <h2 className={`${serif} mt-4 text-[48px] leading-none`}>
                    {nextTrip.from} to {nextTrip.to}
                  </h2>

                  <div className="mt-6 grid gap-5 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-[#b9d0df]">Starts on</p>
                      <p className="font-semibold">{formatDate(nextTrip.date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#b9d0df]">Pickup</p>
                      <p className="font-semibold">
                        {formatTime(nextTrip.pickupTime)}, {nextTrip.pickupLocation}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#b9d0df]">Travelers booked</p>
                      <p className="font-semibold">{travelersOn(nextTrip._id)}</p>
                    </div>
                  </div>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <button className={goldBtn} onClick={() => openPassengers(nextTrip._id)}>
                      View passenger list
                    </button>
                    <button
                      onClick={() => setTab("trips")}
                      className="inline-flex h-11 items-center rounded-full border border-white/40 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      All my trips
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <section className={`${card} px-6 py-14 text-center`}>
                <h2 className={`${serif} text-[32px] text-[#17384f]`}>No trips assigned yet</h2>
                <p className="mx-auto mt-2 max-w-md text-[#5b6b78]">
                  When the Pack&Go team assigns you a trip, it will show up here with its passenger list.
                </p>
              </section>
            )}

            {/* Numbers */}
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Kpi icon={<FaSuitcaseRolling />} value={count("upcoming") + count("running")} label="Active trips" note="Upcoming and running" />
              <Kpi icon={<FaUsers />} value={travelersBooked} label="Travelers booked" note="On your active trips" />
              <Kpi icon={<FaCalendarCheck />} value={count("completed")} label="Trips completed" />
              <Kpi icon={<FaStar />} value={user?.rating?.average || 4.8} label="Traveler rating" note={`From ${user?.rating?.reviews || 24} reviews`} />
            </section>

            {/* Upcoming list and profile */}
            <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
              <section className={`${card} p-6`}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className={`${serif} text-[28px] text-[#17384f]`}>Your next trips</h2>
                  <button className="text-sm font-semibold text-[#2b6382] underline underline-offset-4" onClick={() => setTab("trips")}>
                    See all
                  </button>
                </div>

                {activeTrips.length === 0 ? (
                  <p className="py-6 text-center text-[#5b6b78]">No upcoming trips.</p>
                ) : (
                  <ul className="divide-y divide-[#eee8d8]">
                    {activeTrips.slice(0, 4).map((t) => (
                      <li key={t._id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                        <div>
                          <p className="font-semibold">
                            {t.from} to {t.to}
                          </p>
                          <p className="text-sm text-[#5b6b78]">
                            {formatDate(t.date)}, {t.duration} days
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-[#5b6b78]">{travelersOn(t._id)} travelers</span>
                          <StatusPill status={t.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="flex flex-col gap-6">
                {/* Availability */}
                <section className={`${card} p-6`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">Availability</h3>
                      <p className="mt-1 text-sm text-[#5b6b78]">
                        {available
                          ? "You can take new trips."
                          : "You are not taking new trips right now."}
                      </p>
                    </div>
                    <Switch
                      on={available}
                      onChange={() => setAvailable(!available)}
                      label="Available for new trips"
                    />
                  </div>
                </section>

                {/* Profile */}
                <section className={`${card} p-6`}>
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-[#b8913f] text-lg font-bold text-[#13293d]">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        initials(user.name)
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <span className="inline-block rounded-full bg-[#dff1e6] px-2.5 py-0.5 text-xs font-semibold capitalize text-[#14633c]">
                        {user.status}
                      </span>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-3 text-sm text-[#2b3d4d]">
                    <li className="flex items-center gap-3">
                      <FaMapMarkerAlt className="text-[#b8913f]" /> {user.location}
                    </li>
                    <li className="flex items-center gap-3">
                      <FaPhoneAlt className="text-[#b8913f]" /> {user.phone}
                    </li>
                    <li className="flex items-center gap-3">
                      <FaStar className="text-[#b8913f]" /> {user.experience} years of experience
                    </li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* ================= MY TRIPS ================= */}
        {tab === "trips" && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className={`${serif} text-[44px] leading-none text-[#17384f]`}>My trips</h1>
              <p className="mt-2 text-[#5b6b78]">Only the trips assigned to you.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ["upcoming", "Upcoming", count("upcoming")],
                ["running", "Running", count("running")],
                ["completed", "Completed", count("completed")],
                ["all", "All", trips.length],
              ].map(([key, label, n]) => (
                <button
                  key={key}
                  onClick={() => setTripFilter(key)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    tripFilter === key
                      ? "border-[#17384f] bg-[#17384f] text-white"
                      : "border-[#d9d3c2] bg-white text-[#2b3d4d] hover:border-[#2b6382]"
                  }`}
                >
                  {label} <span className="opacity-70">{n}</span>
                </button>
              ))}
            </div>

            {shownTrips.length === 0 ? (
              <div className={`${card} px-6 py-14 text-center text-[#5b6b78]`}>
                No {tripFilter === "all" ? "" : tripFilter} trips to show.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {shownTrips.map((t) => (
                  <TripCard
                    key={t._id}
                    trip={t}
                    travelers={travelersOn(t._id)}
                    onPassengers={() => openPassengers(t._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= MY BOOKINGS ================= */}
        {tab === "bookings" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className={`${serif} text-[44px] leading-none text-[#17384f]`}>My bookings</h1>
                <p className="mt-2 text-[#5b6b78]">Travelers who booked your trips.</p>
              </div>

              {trips.length > 0 && (
                <div>
                  <label htmlFor="trip" className="mb-1.5 block text-xs font-medium text-[#5b6b78]">
                    Choose a trip
                  </label>
                  <select
                    id="trip"
                    value={selectedTrip._id}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                    className="h-11 min-w-[260px] rounded-[10px] border border-[#d9d3c2] bg-white px-3 text-sm font-medium focus:border-[#2b6382] focus:outline-none focus:ring-4 focus:ring-[#2b6382]/15"
                  >
                    {trips.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.from} to {t.to}, {formatDate(t.date)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {!selectedTrip ? (
              <div className={`${card} px-6 py-14 text-center text-[#5b6b78]`}>
                You have no trips yet, so there are no bookings to show.
              </div>
            ) : (
              <>
                {/* Summary of the chosen trip */}
                <section className={`${card} grid grid-cols-2 gap-px overflow-hidden bg-[#e6e0d0] lg:grid-cols-4`}>
                  {[
                    ["Trip status", <StatusPill key="s" status={selectedTrip.status} />],
                    ["Travelers", totalTravelers],
                    ["Payments", `${paidCount} paid, ${tripBookings.length - paidCount} pending`],
                    [
                      "Checked in",
                      selectedTrip.status === "completed" ? "Trip is over" : `${checkedCount} of ${tripBookings.length}`,
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-white px-5 py-4">
                      <p className="mb-1 text-xs text-[#7a8894]">{label}</p>
                      <div className="font-semibold">{value}</div>
                    </div>
                  ))}
                </section>

                {/* Passenger list */}
                {tripBookings.length === 0 ? (
                  <div className={`${card} px-6 py-14 text-center text-[#5b6b78]`}>
                    No one has booked this trip yet.
                  </div>
                ) : (
                  <section className={`${card} overflow-hidden`}>
                    <div className="hidden grid-cols-[2fr_0.8fr_1fr_1fr_150px] gap-4 border-b border-[#e6e0d0] bg-[#faf8f2] px-5 py-3 text-sm font-medium text-[#5b6b78] md:grid">
                      <span>Traveler</span>
                      <span>Seats</span>
                      <span>Payment</span>
                      <span>Booked on</span>
                      <span className="text-right">Check-in</span>
                    </div>

                    {tripBookings.map((b) => {
                      const done = checkedIn[b._id];
                      return (
                        <div
                          key={b._id}
                          className="grid gap-3 border-b border-[#eee8d8] px-5 py-4 last:border-b-0 md:grid-cols-[2fr_0.8fr_1fr_1fr_150px] md:items-center md:gap-4"
                        >
                          <div>
                            <p className="font-semibold">{b.traveler}</p>
                            <a
                              href={`tel:${b.phone.replace(/\s/g, "")}`}
                              className="inline-flex items-center gap-2 text-sm text-[#2b6382] hover:underline"
                            >
                              <FaPhoneAlt className="text-xs" /> {b.phone}
                            </a>
                          </div>

                          <p className="text-sm">
                            <span className="text-xs text-[#7a8894] md:hidden">Seats: </span>
                            {b.travelers}
                          </p>

                          <div>
                            <span
                              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                b.payment === "paid" ? "bg-[#dff1e6] text-[#14633c]" : "bg-[#fff1d6] text-[#8a5a00]"
                              }`}
                            >
                              {b.payment}
                            </span>
                          </div>

                          <p className="text-sm text-[#5b6b78]">{formatDate(b.bookedOn)}</p>

                          <div className="md:text-right">
                            {selectedTrip.status === "completed" ? (
                              <span className="text-sm text-[#7a8894]">Completed</span>
                            ) : (
                              <button
                                onClick={() => setCheckedIn({ ...checkedIn, [b._id]: !done })}
                                aria-pressed={!!done}
                                className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition ${
                                  done
                                    ? "border-[#2e8b57] bg-[#2e8b57] text-white"
                                    : "border-[#cfd9e0] bg-white text-[#2b6382] hover:bg-[#eef4f8]"
                                }`}
                              >
                                {done ? (
                                  <>
                                    <FaCheck className="text-xs" /> Checked in
                                  </>
                                ) : (
                                  "Check in"
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </section>
                )}
              </>
            )}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-[#8a98a4]">
          Need help? Contact the Pack&Go team from your <Link to="/" className="underline">account</Link>.
        </p>
      </main>
    </div>
  );
}