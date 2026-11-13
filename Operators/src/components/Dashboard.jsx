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
import styles from "./Dashboard.module.css";

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

// Running first, then upcoming (soonest first), then completed (latest first)
function sortTrips(a, b) {
  const order = { running: 0, upcoming: 1, completed: 2 };
  if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
  const diff = new Date(a.date) - new Date(b.date);
  return a.status === "completed" ? -diff : diff;
}

// =====================================================================
// Small pieces - use CSS module for theming
// =====================================================================

function Switch({ on, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={styles.switchToggle}
      data-on={on}
    >
      <span className={styles.switchThumb} />
    </button>
  );
}

function StatusPill({ status }) {
  return (
    <span className={`${styles.statusPill} ${styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function Kpi({ icon, value, label, note }) {
  return (
    <div className={styles.kpiCard}>
      <span className={styles.kpiIcon}>{icon}</span>
      <p className={styles.kpiValue}>{value}</p>
      <p className={styles.kpiLabel}>{label}</p>
      {note && <p className={styles.kpiNote}>{note}</p>}
    </div>
  );
}

// One trip as a card (used on the My trips tab)
function TripCard({ trip, travelers, onPassengers }) {
  return (
    <article className={styles.tripCard}>
      <div className={styles.tripHeader}>
        <div>
          <h3 className={styles.tripTitle}>{trip.from} to {trip.to}</h3>
          <p className={styles.tripType}>{trip.tripType}</p>
        </div>
        <StatusPill status={trip.status} />
      </div>

      <div className={styles.tripDetails}>
        <div className={styles.detailItem}>
          <p className={styles.detailLabel}>Starts on</p>
          <p className={styles.detailValue}>{formatDate(trip.date)}</p>
        </div>
        <div className={styles.detailItem}>
          <p className={styles.detailLabel}>Duration</p>
          <p className={styles.detailValue}>{trip.duration} days</p>
        </div>
        <div className={styles.detailItem}>
          <p className={styles.detailLabel}>Pickup</p>
          <p className={styles.detailValue}>{formatTime(trip.pickupTime)}, {trip.pickupLocation}</p>
        </div>
        <div className={styles.detailItem}>
          <p className={styles.detailLabel}>Travelers</p>
          <p className={styles.detailValue}>{travelers}</p>
        </div>
      </div>

      <button className={styles.btnSecondary} onClick={onPassengers}>
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
      <div className={styles.page}>
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-current border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--brand)' }} />
          <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className="text-center p-8">
          <p style={{ color: 'var(--danger)' }}>{error}</p>
          <button
            onClick={fetchOperatorData}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-bold"
            style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <div className="text-center p-8">
          <p style={{ color: 'var(--danger)' }}>Please log in to access your dashboard.</p>
          <Link
            to="/operator/login"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-bold"
            style={{ background: "var(--primary)", color: "var(--on-primary)" }}
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ================= TOP BAR ================= */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {/* Logo */}
          <div className={styles.logo}>
            <span className={styles.logoText}>
              Pack<span className={styles.logoAmp}>&</span>Go
            </span>
            <span className={styles.logoBadge}>Operator</span>
          </div>

          {/* Tabs */}
          <nav aria-label="Operator" className={styles.tabs}>
            {TABS.map(([key, label], i) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-current={tab === key ? "page" : undefined}
                className={`${styles.tab} ${tab === key ? styles.tabActive : ""}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Availability and account */}
          <div className="ml-auto flex items-center gap-4 animate-slide-up">
            <div className="flex items-center gap-2.5">
              <span className={styles.availabilityLabel}>
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
                  className={styles.accountTrigger}
                >
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    initials(user.name)
                  )}
                </button>

                {menuOpen && (
                  <div className={styles.accountDropdown}>
                    <p className={styles.accountName}>{user.name}</p>
                    <p className={styles.accountEmail}>{user.email}</p>
                    <button className={styles.accountLogoutBtn} onClick={handleLogout}>
                      <FaSignOutAlt className="text-sm" /> Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* ================= OVERVIEW ================= */}
        {tab === "overview" && (
          <div className="flex flex-col gap-6 animate-slide-up">
            <div>
              <h1 className={styles.sectionTitle}>
                {greeting()}, {user.name?.split(" ")[0] || "Operator"}
              </h1>
              <p className={styles.sectionSubtitle}>
                {today}
                {nextTrip?.status === "running" &&
                  `. Your ${nextTrip.to} trip is on, day ${dayNumber} of ${nextTrip.duration}.`}
              </p>
            </div>

            {/* Next trip */}
            {nextTrip ? (
              <section className={styles.nextTripCard}>
                <span className={styles.nextTripBadge}>
                  {nextTrip.status === "running"
                    ? `Running now, day ${dayNumber} of ${nextTrip.duration}`
                    : daysToGo <= 1
                      ? "Leaves tomorrow"
                      : `Leaves in ${daysToGo} days`}
                </span>
                <h2 className={styles.nextTripTitle}>
                  {nextTrip.from} to {nextTrip.to}
                </h2>

                <div className={styles.nextTripDetails}>
                  <div className={styles.nextTripDetailItem}>
                    <p className={styles.nextTripDetailLabel}>Starts on</p>
                    <p className={styles.nextTripDetailValue}>{formatDate(nextTrip.date)}</p>
                  </div>
                  <div className={styles.nextTripDetailItem}>
                    <p className={styles.nextTripDetailLabel}>Pickup</p>
                    <p className={styles.nextTripDetailValue}>
                      {formatTime(nextTrip.pickupTime)}, {nextTrip.pickupLocation}
                    </p>
                  </div>
                  <div className={styles.nextTripDetailItem}>
                    <p className={styles.nextTripDetailLabel}>Travelers booked</p>
                    <p className={styles.nextTripDetailValue}>{travelersOn(nextTrip._id)}</p>
                  </div>
                </div>

                <div className={styles.nextTripActions}>
                  <button className={styles.btnPrimary} onClick={() => openPassengers(nextTrip._id)}>
                    View passenger list
                  </button>
                  <button
                    onClick={() => setTab("trips")}
                    className={styles.btnGhost}
                  >
                    All my trips
                  </button>
                </div>
              </section>
            ) : (
              <section className={styles.emptyCard}>
                <h2 className={styles.emptyTitle}>No trips assigned yet</h2>
                <p>When the Pack&Go team assigns you a trip, it will show up here with its passenger list.</p>
              </section>
            )}

            {/* Numbers */}
            <section className={styles.kpiGrid}>
              <Kpi icon={<FaSuitcaseRolling />} value={count("upcoming") + count("running")} label="Active trips" note="Upcoming and running" />
              <Kpi icon={<FaUsers />} value={travelersBooked} label="Travelers booked" note="On your active trips" />
              <Kpi icon={<FaCalendarCheck />} value={count("completed")} label="Trips completed" />
              <Kpi icon={<FaStar />} value={user?.rating?.average || 4.8} label="Traveler rating" note={`From ${user?.rating?.reviews || 24} reviews`} />
            </section>

            {/* Upcoming list and profile */}
            <div className={styles.gridSection}>
              <section className={styles.cardSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionHeaderTitle}>Your next trips</h2>
                  <button className={styles.sectionHeaderLink} onClick={() => setTab("trips")}>
                    See all
                  </button>
                </div>

                {activeTrips.length === 0 ? (
                  <p className="py-6 text-center" style={{ color: 'var(--text-muted)' }}>No upcoming trips.</p>
                ) : (
                  <ul className={styles.tripList}>
                    {activeTrips.slice(0, 4).map((t) => (
                      <li key={t._id} className={styles.tripListItem}>
                        <div className={styles.tripListDate}>
                          <b className={styles.tripListDateStrong}>{new Date(t.date).getDate()}</b>
                          <span>{new Date(t.date).toLocaleDateString("en-IN", { month: "short" })}</span>
                        </div>
                        <div className={styles.tripListInfo}>
                          <p className={styles.tripListName}>{t.from} to {t.to}</p>
                          <p className={styles.tripListMeta}>
                            {formatDate(t.date)}, {t.duration} days
                          </p>
                        </div>
                        <div className={styles.tripListTravelers}>
                          {travelersOn(t._id)} travelers
                        </div>
                        <div className="flex items-center gap-4">
                          <StatusPill status={t.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="flex flex-col gap-6">
                {/* Availability */}
                <section className={styles.availabilityCard}>
                  <div className={styles.availabilityHeader}>
                    <div>
                      <h3 className={styles.availabilityTitle}>Availability</h3>
                      <p className={styles.availabilityText}>
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
                <section className={styles.profileCard}>
                  <div className={styles.profileHeader}>
                    <div className={styles.profileAvatar}>
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt={user.name} />
                      ) : (
                        initials(user.name)
                      )}
                    </div>
                    <div>
                      <p className={styles.profileName}>{user.name}</p>
                      <span className={styles.profileStatus}>{user.status}</span>
                    </div>
                  </div>
                  <ul className={styles.profileDetails}>
                    <li className={styles.profileDetailItem}>
                      <FaMapMarkerAlt className={styles.profileDetailIcon} /> {user.location}
                    </li>
                    <li className={styles.profileDetailItem}>
                      <FaPhoneAlt className={styles.profileDetailIcon} /> {user.phone}
                    </li>
                    <li className={styles.profileDetailItem}>
                      <FaStar className={styles.profileDetailIcon} /> {user.experience} years of experience
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
              <h1 className={styles.sectionTitle}>My trips</h1>
              <p className={styles.sectionSubtitle}>Only the trips assigned to you.</p>
            </div>

            <div className={styles.tabsFilter}>
              {[
                ["upcoming", "Upcoming", count("upcoming")],
                ["running", "Running", count("running")],
                ["completed", "Completed", count("completed")],
                ["all", "All", trips.length],
              ].map(([key, label, n]) => (
                <button
                  key={key}
                  onClick={() => setTripFilter(key)}
                  className={`${styles.tabFilterBtn} ${tripFilter === key ? styles.tabFilterActive : ""}`}
                >
                  {label} <span className="opacity-70">{n}</span>
                </button>
              ))}
            </div>

            {shownTrips.length === 0 ? (
              <div className={styles.emptyCard}>
                No {tripFilter === "all" ? "" : tripFilter} trips to show.
              </div>
            ) : (
              <div className={styles.tripsGrid}>
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
            <div className={styles.bookingHeader}>
              <div>
                <h1 className={styles.sectionTitle}>My bookings</h1>
                <p className={styles.sectionSubtitle}>Travelers who booked your trips.</p>
              </div>

              {trips.length > 0 && (
                <div>
                  <label htmlFor="trip" className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Choose a trip
                  </label>
                  <select
                    id="trip"
                    value={selectedTrip._id}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                    className={styles.tripSelect}
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
              <div className={styles.emptyCard}>
                You have no trips yet, so there are no bookings to show.
              </div>
            ) : (
              <>
                {/* Summary of the chosen trip */}
                <section className={styles.bookingSummaryGrid}>
                  {[
                    ["Trip status", <StatusPill key="s" status={selectedTrip.status} />],
                    ["Travelers", totalTravelers],
                    ["Payments", `${paidCount} paid, ${tripBookings.length - paidCount} pending`],
                    [
                      "Checked in",
                      selectedTrip.status === "completed" ? "Trip is over" : `${checkedCount} of ${tripBookings.length}`,
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className={styles.bookingSummaryItem}>
                      <p className={styles.bookingSummaryLabel}>{label}</p>
                      <div className={styles.bookingSummaryValue}>{value}</div>
                    </div>
                  ))}
                </section>

                {/* Passenger list */}
                {tripBookings.length === 0 ? (
                  <div className={styles.emptyCard}>
                    No one has booked this trip yet.
                  </div>
                ) : (
                  <section className={styles.bookingTable}>
                    <div className={styles.bookingTableHeader}>
                      <span>Traveler</span>
                      <span>Seats</span>
                      <span>Payment</span>
                      <span>Booked on</span>
                      <span className={styles.checkInHeader}>Check-in</span>
                    </div>

                    <div className={styles.bookingTableBody}>
                      {tripBookings.map((b) => {
                        const done = checkedIn[b._id];
                        return (
                          <div key={b._id} className={styles.bookingRow}>
                            <div className={styles.travelerInfo}>
                              <p className={styles.travelerName}>{b.traveler}</p>
                              <a
                                href={`tel:${b.phone.replace(/\s/g, "")}`}
                                className={styles.travelerPhone}
                              >
                                <FaPhoneAlt className="text-xs" /> {b.phone}
                              </a>
                            </div>

                            <p className={styles.seatsCell}>{b.travelers}</p>

                            <div>
                              <span
                                className={`${styles.paymentBadge} ${b.payment === "paid" ? styles.paymentPaid : styles.paymentPending}`}
                              >
                                {b.payment}
                              </span>
                            </div>

                            <p className={styles.bookedDate}>{formatDate(b.bookedOn)}</p>

                            <div className="md:text-right">
                              {selectedTrip.status === "completed" ? (
                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Completed</span>
                              ) : (
                                <button
                                  onClick={() => setCheckedIn({ ...checkedIn, [b._id]: !done })}
                                  aria-pressed={!!done}
                                  className={`${styles.checkInBtn} ${done ? styles.checkInBtnChecked : styles.checkInBtnUnchecked}`}
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
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}

        <p className="mt-10 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Need help? Contact the Pack&Go team from your <Link to="/" className="underline">account</Link>.
        </p>
      </main>
    </div>
  );
}