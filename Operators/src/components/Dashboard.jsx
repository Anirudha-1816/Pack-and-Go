import { useState, useEffect, useCallback } from "react";
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
  FaThLarge,
  FaClipboardList,
  FaPlusCircle,
  FaEnvelope,
  FaCommentDots,
  FaCog,
  FaBars,
  FaTimes,
  FaHourglassHalf,
} from "react-icons/fa";
import axios from "axios";
import useAuthStore from "../Stores/authStore";
import styles from "./Dashboard.module.css";
import AuthLoading from "../utils/AuthLoading";
import NextTripCard from "./NextTripCard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const DAY = 86400000;

// =====================================================================
// Sidebar links
// `key` links switch a tab on this page, `to` links go to another page.
// Change the `to` paths to match your router.
// =====================================================================

const NAV_MAIN = [
  { key: "overview", label: "Overview", icon: FaThLarge },
  { key: "trips", label: "My trips", icon: FaSuitcaseRolling },
  { key: "bookings", label: "My bookings", icon: FaClipboardList },
];

const NAV_MORE = [
  { id: "add", to: "/operator/add-package", label: "Add Events", icon: FaPlusCircle },
  { id: "messages", to: "/operator/messages", label: "Messages", icon: FaEnvelope },
  { id: "feedbacks", to: "/operator/feedbacks", label: "Feedbacks", icon: FaCommentDots },
  { id: "settings", to: "/operator/settings", label: "Settings", icon: FaCog },
];

// pending / rejected come from admin approval.
// upcoming / running / completed are worked out from the trip date (approved trips only).
const STATUS_LABEL = {
  pending: "Pending approval",
  rejected: "Rejected",
  upcoming: "Upcoming",
  running: "Running now",
  completed: "Completed",
};

// Only approved trips can have bookings
const LIVE_STATUSES = ["upcoming", "running", "completed"];

// =====================================================================
// Helpers
// =====================================================================

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatTime = (time = "00:00") => {
  const [hour, minute] = time.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};

const formatPrice = (price) => `₹${Number(price || 0).toLocaleString("en-IN")}`;

const durationLabel = (days) => `${days} ${days === 1 ? "day" : "days"}`;

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

// Self drop & pickup trips only have a meetup point.
// Pickup & drop service trips have pickup time + location.
function pickupInfo(trip) {
  if (trip.pickupDropType === "self") {
    return ["Meetup point", trip.meetupPoint || "Not added"];
  }

  return ["Pickup", `${formatTime(trip.pickupTime)}, ${trip.pickupLocation}`];
}

function dropInfo(trip) {
  if (trip.pickupDropType === "self") return null;

  return ["Drop", `${formatTime(trip.dropTime)}, ${trip.dropLocation}`];
}

// The id that bookings use for this trip.
// Once approved, travelers book the public copy (approvedTrip), not the operator trip.
const bookingTripId = (trip) => String(trip.approvedTrip?._id || trip.approvedTrip || trip._id);

// Approval status first, then the date based status for approved trips
function getTripStatus(trip) {
  if (trip.status === "pending" || trip.status === "rejected") return trip.status;

  const start = new Date(trip.date);
  const end = new Date(start.getTime() + trip.duration * DAY);
  const now = new Date();

  if (now < start) return "upcoming";
  if (now < end) return "running";

  return "completed";
}

function sortTrips(a, b) {
  const order = { running: 0, upcoming: 1, pending: 2, rejected: 3, completed: 4 };

  if (order[a.status] !== order[b.status]) {
    return order[a.status] - order[b.status];
  }

  const diff = new Date(a.date) - new Date(b.date);

  return a.status === "completed" ? -diff : diff;
}

// =====================================================================
// Small UI components
// =====================================================================

function Switch({ on, onChange, label }) {
  return (
    <button
      type="button"
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
    <span
      className={`${styles.statusPill} ${
        styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]
      }`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function Avatar({ user, large }) {
  return (
    <span className={`${styles.avatar} ${large ? styles.avatarLg : ""}`}>
      {user?.profileImage ? (
        <img src={user.profileImage} alt={user.name} />
      ) : (
        initials(user?.name)
      )}
    </span>
  );
}

function Logo() {
  return (
    <div className={styles.logo}>
      <span className={styles.logoText}>
        Pack<span className={styles.logoAmp}>&</span>Go
      </span>
      <span className={styles.logoBadge}>Operator</span>
    </div>
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

function TripCard({ trip, travelers, onPassengers }) {
  const [pickupLabel, pickupValue] = pickupInfo(trip);
  const drop = dropInfo(trip);
  const isLive = LIVE_STATUSES.includes(trip.status);
  const liveTripId = trip.approvedTrip?._id || trip.approvedTrip;

  const details = [
    ["Starts on", formatDate(trip.date)],
    ["Duration", durationLabel(trip.duration)],
    ["Travelers", `${travelers} / ${trip.maxTravelers}`],
    ["Price per head", formatPrice(trip.pricePerHead)],
    [pickupLabel, pickupValue],
    ...(drop ? [drop] : []),
  ];

  // Small tags: stays, travel and meals
  const tags = [`Stays: ${trip.stays}`, `Travel: ${trip.travel}`, ...(trip.meals || [])];

  return (
    <article className={styles.tripCard}>
      {/* Photo with the status on top */}
      <div className={styles.tripMedia}>
        {trip.thumbnail?.url ? (
          <img src={trip.thumbnail.url} alt={trip.title} className={styles.tripThumb} />
        ) : (
          <div className={styles.tripMediaEmpty}>
            <FaSuitcaseRolling />
          </div>
        )}

        <span className={styles.tripMediaStatus}>
          <StatusPill status={trip.status} />
        </span>
      </div>

      <div className={styles.tripBody}>
        <div>
          <h3 className={styles.tripTitle}>{trip.title}</h3>
          <p className={styles.tripType}>
            <FaMapMarkerAlt /> {trip.destination} · {trip.tripType}
          </p>
        </div>

        <div className={styles.tripDetails}>
          {details.map(([label, value]) => (
            <div key={label} className={styles.detailItem}>
              <p className={styles.detailLabel}>{label}</p>
              <p className={styles.detailValue}>{value}</p>
            </div>
          ))}
        </div>

        <div className={styles.tagRow}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        {trip.status === "rejected" && (
          <p className={styles.rejectNote}>
            <b>Reason:</b> {trip.rejectionReason || "No reason was given."}
          </p>
        )}

        {trip.status === "pending" && (
          <p className={styles.pendingNote}>
            Waiting for admin approval. Travelers can book it once it is approved.
          </p>
        )}

        {isLive && (
          <div className={styles.tripFooter}>
            <button className={styles.btnSecondary} onClick={onPassengers}>
              Passenger list
            </button>

            {liveTripId && (
              <a
                href={`/trip/${liveTripId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnSecondary}
              >
                View live trip
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// ---------- Sidebar ----------

function SidebarItem({ icon: Icon, label, active, badge = 0, to, onClick }) {
  const className = `${styles.navItem} ${active ? styles.navItemActive : ""}`;

  const content = (
    <>
      <Icon className={styles.navIcon} />
      <span className={styles.navLabel}>{label}</span>
      {badge > 0 && <span className={styles.navBadge}>{badge}</span>}
    </>
  );

  // Links go to another page, buttons switch the tab on this page
  if (to) {
    return (
      <Link to={to} onClick={onClick} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {content}
    </button>
  );
}

function Sidebar({ open, tab, user, unreadMessages, onTab, onClose, onLogout }) {
  return (
    <>
      {/* Dark backdrop behind the sidebar on mobile */}
      {open && <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHead}>
          <Logo />
          <button onClick={onClose} aria-label="Close menu" className={styles.closeBtn}>
            <FaTimes />
          </button>
        </div>

        <nav aria-label="Operator" className={styles.sidebarNav}>
          {NAV_MAIN.map((item) => (
            <SidebarItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              active={tab === item.key}
              onClick={() => onTab(item.key)}
            />
          ))}

          <hr className={styles.navDivider} />

          {NAV_MORE.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              to={item.to}
              badge={item.id === "messages" ? unreadMessages : 0}
              onClick={onClose}
            />
          ))}
        </nav>

        {/* Account + logout */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userRow}>
            <Avatar user={user} />
            <div className={styles.userText}>
              <p className={styles.userName}>{user.name}</p>
              <p className={styles.userEmail}>{user.email}</p>
            </div>
          </div>

          <button onClick={onLogout} className={styles.logoutBtn}>
            <FaSignOutAlt /> Log out
          </button>
        </div>
      </aside>
    </>
  );
}

// =====================================================================
// Dashboard
// =====================================================================

export default function OperatorDashboard() {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    fetchUser,
  } = useAuthStore();

  const navigate = useNavigate();

  const [tab, setTab] = useState("overview");
  const [available, setAvailable] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tripFilter, setTripFilter] = useState("upcoming");
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [checkedIn, setCheckedIn] = useState({});

  // Dashboard data
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Prevent duplicate authentication initialization
  const [authInitialized, setAuthInitialized] = useState(Boolean(user || isAuthenticated));

  // ---------------------------------------------------------------
  // Authentication initialization
  // ---------------------------------------------------------------

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      if (user && isAuthenticated) {
        if (active) setAuthInitialized(true);
        return;
      }

      if (!authLoading) {
        try {
          await fetchUser();
        } catch (err) {
          console.error("Authentication verification failed:", err);
        } finally {
          if (active) setAuthInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      active = false;
    };
  }, [isAuthenticated, user?._id, authLoading, fetchUser]);

  // ---------------------------------------------------------------
  // Fetch operator dashboard data
  // ---------------------------------------------------------------

  const fetchOperatorData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [tripsRes, bookingsRes] = await Promise.all([
        axios.get(`${API_URL}/operator/trips`, { withCredentials: true }),
        axios.get(`${API_URL}/operator/bookings`, { withCredentials: true }),
      ]);

      const tripsData = tripsRes.data?.data || [];
      const bookingsData = bookingsRes.data?.data || [];

      // trip.status from the server (pending / approved / rejected)
      // becomes pending / rejected / upcoming / running / completed
      const tripsWithStatus = tripsData
        .map((trip) => ({ ...trip, status: getTripStatus(trip) }))
        .sort(sortTrips);

      setTrips(tripsWithStatus);
      setBookings(bookingsData);

      if (user?.availability) {
        setAvailable(user.availability === "available");
      }
    } catch (err) {
      console.error("Failed to fetch operator data:", err);

      if (err.response?.status === 401) {
        // The server says the authentication session is invalid.
        useAuthStore.getState().logout();
        navigate("/operator/login", { replace: true });
        return;
      }

      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?._id, user?.availability, navigate]);

  // ---------------------------------------------------------------
  // Load data only after authentication is initialized
  // ---------------------------------------------------------------

  useEffect(() => {
    if (!authInitialized) return;

    if (user?._id && isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchOperatorData();
    } else {
      setLoading(false);
    }
  }, [authInitialized, user?._id, isAuthenticated, fetchOperatorData]);

  // ---------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------

  const handleLogout = async () => {
    setSidebarOpen(false);

    try {
      await axios.post(`${API_URL}/operator/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Server logout failed:", err);
    } finally {
      useAuthStore.getState().logout();
      navigate("/operator/login", { replace: true });
    }
  };

  // ---------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------

  // Bookings are matched with the id travelers booked (the approved copy of the trip)
  const bookingsOf = (trip) =>
    bookings.filter(
      (booking) => String(booking.trip?._id || booking.trip) === bookingTripId(trip)
    );

  const travelersOn = (trip) =>
    bookingsOf(trip).reduce((sum, booking) => sum + (booking.travelers || 0), 0);

  const count = (status) => trips.filter((trip) => trip.status === status).length;

  // Approved trips only (they are the ones that can have bookings)
  const liveTrips = trips.filter((trip) => LIVE_STATUSES.includes(trip.status));

  // Trips that are still to come or running right now
  const activeTrips = trips.filter((trip) => trip.status === "upcoming" || trip.status === "running");

  const travelersBooked = activeTrips.reduce((sum, trip) => sum + travelersOn(trip), 0);

  const nextTrip = activeTrips[0];

  const pendingCount = count("pending");
  const rejectedCount = count("rejected");

  const selectedTrip = liveTrips.find((trip) => trip._id === selectedTripId) || nextTrip || liveTrips[0];

  const openPassengers = (tripId) => {
    setSelectedTripId(tripId);
    setTab("bookings");
  };

  const goToTab = (key) => {
    setTab(key);
    setSidebarOpen(false); // close the sidebar on mobile
  };

  const tripBookings = selectedTrip ? bookingsOf(selectedTrip) : [];

  const totalTravelers = tripBookings.reduce((sum, booking) => sum + (booking.travelers || 0), 0);

  const paidCount = tripBookings.filter((booking) => booking.payment === "paid").length;

  const checkedCount = tripBookings.filter((booking) => checkedIn[booking._id]).length;

  const shownTrips =
    tripFilter === "all" ? trips : trips.filter((trip) => trip.status === tripFilter);

  const nextStart = nextTrip && new Date(nextTrip.date);

  const dayNumber = nextTrip && Math.floor((new Date() - nextStart) / DAY) + 1;

  const daysToGo = nextTrip && Math.ceil((nextStart - new Date()) / DAY);

  // Text shown on the next trip card image
  const nextTripBadge =
    nextTrip &&
    (nextTrip.status === "running"
      ? `Running now, day ${dayNumber} of ${nextTrip.duration}`
      : daysToGo <= 1
        ? "Leaves tomorrow"
        : `Leaves in ${daysToGo} days`);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // TODO: replace with the real unread count from your API
  const unreadMessages = user?.unreadMessages ?? 0;

  // ---------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------

  if (!authInitialized || authLoading || loading) {
    return <AuthLoading />;
  }

  // ---------------------------------------------------------------
  // Not authenticated
  // ---------------------------------------------------------------

  if (!user || !isAuthenticated) {
    return (
      <div className={`${styles.page} ${styles.centerScreen}`}>
        <div>
          <p className={styles.errorText}>Please log in to access your dashboard.</p>
          <Link to="/operator/login" className={styles.btnSolid}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Error
  // ---------------------------------------------------------------

  if (error) {
    return (
      <div className={`${styles.page} ${styles.centerScreen}`}>
        <div>
          <p className={styles.errorText}>{error}</p>
          <button onClick={fetchOperatorData} className={styles.btnSolid}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Dashboard UI
  // ---------------------------------------------------------------

  const currentLabel = NAV_MAIN.find((item) => item.key === tab)?.label;

  return (
    <div className={styles.page}>
      <Sidebar
        open={sidebarOpen}
        tab={tab}
        user={user}
        unreadMessages={unreadMessages}
        onTab={goToTab}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Everything to the right of the sidebar */}
      <div className={styles.content}>
        {/* ---------- Top bar ---------- */}
        <header className={styles.topbar}>
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" className={styles.menuBtn}>
            <FaBars />
          </button>

          <div className={styles.mobileLogo}>
            <Logo />
          </div>

          <p className={styles.breadcrumb}>
            Operator /<span className={styles.breadcrumbCurrent}>{currentLabel}</span>
          </p>

          <div className={styles.availabilityRow}>
            <span className={styles.availabilityLabel}>
              {available ? "Available" : "Unavailable"}
            </span>

            <Switch
              on={available}
              onChange={() => setAvailable((prev) => !prev)}
              label="Available for new trips"
            />
          </div>
        </header>

        <main className={styles.main}>
          {/* =========================================================
              OVERVIEW
          ========================================================= */}

          {tab === "overview" && (
            <div className={styles.stack}>
              <div>
                <h1 className={styles.sectionTitle}>
                  {greeting()}, {user.name?.split(" ")[0] || "Operator"}
                </h1>

                <p className={styles.sectionSubtitle}>
                  {today}
                  {nextTrip?.status === "running" &&
                    `. Your ${nextTrip.title} trip is on, day ${dayNumber} of ${nextTrip.duration}.`}
                </p>
              </div>

              {/* Packages waiting for approval, or rejected */}
              {(pendingCount > 0 || rejectedCount > 0) && (
                <section className={styles.noticeCard}>
                  <span className={styles.noticeIcon}>
                    <FaHourglassHalf />
                  </span>

                  <div className={styles.noticeText}>
                    {pendingCount > 0 && (
                      <p>
                        {pendingCount} {pendingCount === 1 ? "package is" : "packages are"} waiting for
                        admin approval.
                      </p>
                    )}
                    {rejectedCount > 0 && (
                      <p>
                        {rejectedCount} {rejectedCount === 1 ? "package was" : "packages were"} rejected.
                        Open My trips to see the reason.
                      </p>
                    )}
                  </div>

                  <button
                    className={styles.btnSecondary}
                    onClick={() => {
                      setTripFilter(pendingCount > 0 ? "pending" : "rejected");
                      setTab("trips");
                    }}
                  >
                    View
                  </button>
                </section>
              )}

              {/* Next trip */}
              {nextTrip ? (
                <NextTripCard
                  trip={nextTrip}
                  bookedCount={travelersOn(nextTrip)}
                  badge={nextTripBadge}
                  pickup={pickupInfo(nextTrip)}
                  onViewPassengers={() => openPassengers(nextTrip._id)}
                  onAllTrips={() => setTab("trips")}
                />
              ) : (
                <section className={styles.emptyCard}>
                  <span className={styles.emptyIcon}>
                    <FaSuitcaseRolling />
                  </span>
                  <h2 className={styles.emptyTitle}>No approved trips yet</h2>
                  <p>
                    Add a package and it will show up here with its passenger list once the admin
                    approves it.
                  </p>
                  <Link to="/operator/add-package" className={styles.btnSolid}>
                    Add package
                  </Link>
                </section>
              )}

              {/* Statistics */}
              <section className={styles.kpiGrid}>
                <Kpi
                  icon={<FaSuitcaseRolling />}
                  value={count("upcoming") + count("running")}
                  label="Active trips"
                  note="Upcoming and running"
                />
                <Kpi
                  icon={<FaUsers />}
                  value={travelersBooked}
                  label="Travelers booked"
                  note="On your active trips"
                />
                <Kpi icon={<FaCalendarCheck />} value={count("completed")} label="Trips completed" />
                <Kpi
                  icon={<FaStar />}
                  value={user?.rating?.average || 4.8}
                  label="Traveler rating"
                  note={`From ${user?.rating?.reviews || 24} reviews`}
                />
              </section>

              {/* Trips and profile */}
              <div className={styles.gridSection}>
                <section className={styles.cardSection}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionHeaderTitle}>Your next trips</h2>

                    <button className={styles.sectionHeaderLink} onClick={() => setTab("trips")}>
                      See all
                    </button>
                  </div>

                  {activeTrips.length === 0 ? (
                    <p className={styles.mutedText} style={{ padding: "1.5rem 0", textAlign: "center" }}>
                      No upcoming trips.
                    </p>
                  ) : (
                    <ul className={styles.tripList}>
                      {activeTrips.slice(0, 4).map((t) => (
                        <li key={t._id} className={styles.tripListItem}>
                          <div className={styles.tripListDate}>
                            <b className={styles.tripListDateStrong}>{new Date(t.date).getDate()}</b>
                            <span>
                              {new Date(t.date).toLocaleDateString("en-IN", { month: "short" })}
                            </span>
                          </div>

                          <div className={styles.tripListInfo}>
                            <p className={styles.tripListName}>{t.title}</p>
                            <p className={styles.tripListMeta}>
                              {formatDate(t.date)}, {durationLabel(t.duration)}
                            </p>
                          </div>

                          <div className={styles.tripListTravelers}>{travelersOn(t)} travelers</div>

                          <StatusPill status={t.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <div className={styles.stack}>
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
                        onChange={() => setAvailable((prev) => !prev)}
                        label="Available for new trips"
                      />
                    </div>
                  </section>

                  <section className={styles.profileCard}>
                    <div className={styles.profileHeader}>
                      <Avatar user={user} large />

                      <div>
                        <p className={styles.profileName}>{user.name}</p>
                        <span className={styles.profileStatus}>{user.status}</span>
                      </div>
                    </div>

                    <ul className={styles.profileDetails}>
                      <li className={styles.profileDetailItem}>
                        <FaMapMarkerAlt className={styles.profileDetailIcon} />
                        {user.location}
                      </li>
                      <li className={styles.profileDetailItem}>
                        <FaPhoneAlt className={styles.profileDetailIcon} />
                        {user.phone}
                      </li>
                      <li className={styles.profileDetailItem}>
                        <FaStar className={styles.profileDetailIcon} />
                        {user.experience} years of experience
                      </li>
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              MY TRIPS
          ========================================================= */}

          {tab === "trips" && (
            <div className={styles.stack}>
              <div>
                <h1 className={styles.sectionTitle}>My trips</h1>
                <p className={styles.sectionSubtitle}>
                  Events you created. New packages go live after admin approval.
                </p>
              </div>

              <div className={styles.tabsFilter}>
                {[
                  ["upcoming", "Upcoming", count("upcoming")],
                  ["running", "Running", count("running")],
                  ["completed", "Completed", count("completed")],
                  ["pending", "Pending", pendingCount],
                  ["rejected", "Rejected", rejectedCount],
                  ["all", "All", trips.length],
                ].map(([key, label, n]) => (
                  <button
                    key={key}
                    onClick={() => setTripFilter(key)}
                    className={`${styles.tabFilterBtn} ${
                      tripFilter === key ? styles.tabFilterActive : ""
                    }`}
                  >
                    {label} <span className={styles.tabFilterCount}>{n}</span>
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
                      travelers={travelersOn(t)}
                      onPassengers={() => openPassengers(t._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              MY BOOKINGS
          ========================================================= */}

          {tab === "bookings" && (
            <div className={styles.stack}>
              <div className={styles.bookingHeader}>
                <div>
                  <h1 className={styles.sectionTitle}>My bookings</h1>
                  <p className={styles.sectionSubtitle}>Travelers who booked your trips.</p>
                </div>

                {liveTrips.length > 0 && (
                  <div>
                    <label htmlFor="trip" className={styles.tripSelectLabel}>
                      Choose a trip
                    </label>

                    <select
                      id="trip"
                      value={selectedTrip?._id || ""}
                      onChange={(e) => setSelectedTripId(e.target.value)}
                      className={styles.tripSelect}
                    >
                      {liveTrips.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.title}, {formatDate(t.date)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {!selectedTrip ? (
                <div className={styles.emptyCard}>
                  You have no approved trips yet, so there are no bookings to show.
                </div>
              ) : (
                <>
                  <section className={styles.bookingSummaryGrid}>
                    {[
                      ["Trip status", <StatusPill key="s" status={selectedTrip.status} />],
                      ["Travelers", `${totalTravelers} / ${selectedTrip.maxTravelers}`],
                      ["Payments", `${paidCount} paid, ${tripBookings.length - paidCount} pending`],
                      [
                        "Checked in",
                        selectedTrip.status === "completed"
                          ? "Trip is over"
                          : `${checkedCount} of ${tripBookings.length}`,
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className={styles.bookingSummaryItem}>
                        <p className={styles.bookingSummaryLabel}>{label}</p>
                        <div className={styles.bookingSummaryValue}>{value}</div>
                      </div>
                    ))}
                  </section>

                  {tripBookings.length === 0 ? (
                    <div className={styles.emptyCard}>No one has booked this trip yet.</div>
                  ) : (
                    <section className={styles.bookingTable}>
                      {/* Column titles (desktop only) */}
                      <div className={styles.bookingTableHeader}>
                        <span>Traveler</span>
                        <span>Seats</span>
                        <span>Payment</span>
                        <span>Booked on</span>
                        <span style={{ textAlign: "right" }}>Check-in</span>
                      </div>

                      <div>
                        {tripBookings.map((b) => {
                          const done = checkedIn[b._id];

                          return (
                            <div key={b._id} className={styles.bookingRow}>
                              <div className={styles.travelerInfo}>
                                <p className={styles.travelerName}>{b.traveler}</p>

                                <a
                                  href={`tel:${(b.phone || "").replace(/\s/g, "")}`}
                                  className={styles.travelerPhone}
                                >
                                  <FaPhoneAlt style={{ fontSize: "0.75rem" }} />
                                  {b.phone}
                                </a>
                              </div>

                              <p className={styles.seatsCell}>
                                <span className={styles.mobileLabel}>Seats: </span>
                                {b.travelers}
                              </p>

                              <div>
                                <span
                                  className={`${styles.paymentBadge} ${
                                    b.payment === "paid" ? styles.paymentPaid : styles.paymentPending
                                  }`}
                                >
                                  {b.payment}
                                </span>
                              </div>

                              <p className={styles.bookedDate}>
                                <span className={styles.mobileLabel}>Booked on: </span>
                                {formatDate(b.bookedOn)}
                              </p>

                              <div className={styles.checkInCell}>
                                {selectedTrip.status === "completed" ? (
                                  "Completed"
                                ) : (
                                  <button
                                    onClick={() =>
                                      setCheckedIn((prev) => ({ ...prev, [b._id]: !prev[b._id] }))
                                    }
                                    aria-pressed={!!done}
                                    className={`${styles.checkInBtn} ${
                                      done ? styles.checkInBtnChecked : styles.checkInBtnUnchecked
                                    }`}
                                  >
                                    {done ? (
                                      <>
                                        <FaCheck style={{ fontSize: "0.75rem" }} />
                                        Checked in
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

          <p className={styles.helpText}>
            Need help? Contact the Pack&Go team from your{" "}
            <Link to="/" style={{ textDecoration: "underline" }}>
              account
            </Link>
            .
          </p>
        </main>
      </div>
    </div>
  );
}