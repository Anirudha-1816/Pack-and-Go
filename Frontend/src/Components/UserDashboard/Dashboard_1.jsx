// Flow: booking API returns integer paise -> dashboard formats rupees for display.

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Navbar from "../Navbar/Navbar";
import useAuthStore from "../../Stores/authStore";
import apiUsers from "../../apis/apiUsers";
import apiBooking from "../../apis/apiBooking";
import styles from "./Dashboard.module.css";

// ---------- Settings ----------

const LOGOUT_API = `/logout`;
const UPDATE_PASSWORD_API = `/update-password`;
const LOGIN_PAGE = "/login";

const DAY = 86400000;

const STATUS_LABEL = {
  upcoming: "Upcoming",
  running: "Running now",
  completed: "Completed",
  cancelled: "Cancelled",
};

// ---------- Helpers ----------

// Show a saved integer paise amount as a rupee price.
const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0) / 100);

const formatDate = (date, long = false) =>
  new Date(date).toLocaleDateString("en-IN", {
    weekday: long ? "long" : undefined,
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// "14:30" -> "2:30 PM"
const formatTime = (time) => {
  if (!time) return "";
  const [hour, minute] = time.split(":");
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
};

// Ask Cloudinary for a smaller picture so the dashboard loads less image data.
const small = (url, width) =>
  url && url.includes("/upload/")
    ? url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`)
    : url;

// "Anirudha Sharma" -> "AS"
const getInitials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

// upcoming, running or completed
function getTripStatus(trip) {
  const start = new Date(trip.date);
  const end = new Date(start.getTime() + trip.duration * DAY);
  const now = new Date();

  if (now < start) return "upcoming";
  if (now < end) return "running";
  return "completed";
}

// Running trips first, then upcoming (soonest first), then completed (latest first)
function sortBookings(a, b) {
  const order = { running: 0, upcoming: 1, completed: 2, cancelled: 3 };

  if (order[a.tripStatus] !== order[b.tripStatus]) {
    return order[a.tripStatus] - order[b.tripStatus];
  }

  const diff = new Date(a.trip.date) - new Date(b.trip.date);
  return a.tripStatus === "completed" ? -diff : diff;
}

// ---------- Data hook ----------

// Loads the signed-in user's bookings and keeps track of the selected one.
function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await apiBooking.get("/get");

        const list = (res.data.bookings || [])
          .filter((b) => b.trip) // skip bookings whose trip was deleted
          .map((b) => ({
            ...b,
            tripStatus: b.status === "cancelled" ? "cancelled" : getTripStatus(b.trip),
          }))
          .sort(sortBookings);

        setBookings(list);
        setSelectedId(list[0]?._id || null);
      } catch (err) {
        console.log(err);
        const status = err.response?.status;
        const isAuthError = status === 401 || status === 403;
        if (isAuthError) setNeedsLogin(true);
        else setError("We could not load your trips. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  // Mark a trip as cancelled in this dashboard only (the real booking is not changed).
  function cancelLocally(booking) {
    const confirmed = window.confirm(
      `Mark your trip from ${booking.trip.from} to ${booking.trip.to} as cancelled in this dashboard? This will not cancel your actual booking.`
    );

    if (!confirmed) return;

    setBookings((current) =>
      current.map((item) =>
        item._id === booking._id
          ? { ...item, status: "cancelled", tripStatus: "cancelled", cancelledLocally: true }
          : item
      )
    );
  }

  return { bookings, selectedId, setSelectedId, loading, needsLogin, error, cancelLocally };
}

// ---------- Small shared pieces ----------

function StatusPill({ status, small: isSmall = false }) {
  return (
    <span className={`${styles.pill} ${isSmall ? styles.pillSmall : ""} ${styles[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

// Label + input + error message. `registration` is the result of react-hook-form's register().
// `aside` is optional small text on the right of the label (like a character counter).
function Field({ label, aside, registration, error, invalid = false, ...inputProps }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {aside && <em aria-hidden="true">{aside}</em>}
      </span>
      <input {...inputProps} {...registration} aria-invalid={Boolean(error) || invalid} />
      {error && <small role="alert">{error}</small>}
    </label>
  );
}

// ---------- Page header ----------

function PageHeader({ firstName, stats, loading, settingsOpen, onOpenSettings }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <div>
          <span className={styles.eyebrow}>YOUR PACK&amp;GO ACCOUNT</span>
          <h1>Welcome back, {firstName}</h1>
          <p>Your trips, travel details and account at a glance.</p>
        </div>
        <button
          type="button"
          className={styles.settingsButton}
          onClick={onOpenSettings}
          aria-expanded={settingsOpen}
          aria-controls="settings-drawer"
        >
          <span aria-hidden="true">⚙</span>
          Account settings
        </button>
      </div>

      <dl className={styles.stats} aria-label="Trip summary">
        {stats.map(({ label, value }) => (
          <div key={label} className={styles.stat}>
            <dt>{label}</dt>
            <dd>{loading ? "—" : value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}

// ---------- Trip list ----------

function TripList({ bookings, selectedId, onSelect }) {
  return (
    <aside className={styles.sidebar} aria-label="My trips">
      <div className={styles.sideHead}>
        <h2>My trips</h2>
        <span>{bookings.length}</span>
      </div>

      <ul className={styles.list}>
        {bookings.map((booking) => {
          const { trip } = booking;
          const isActive = booking._id === selectedId;
          const thumbUrl = trip.thumbnail?.url || trip.banner?.url;

          return (
            <li key={booking._id}>
              <button
                type="button"
                className={isActive ? `${styles.item} ${styles.itemActive}` : styles.item}
                onClick={() => onSelect(booking._id)}
                aria-current={isActive ? "true" : undefined}
              >
                <span
                  className={styles.thumb}
                  style={thumbUrl ? { backgroundImage: `url(${small(thumbUrl, 160)})` } : undefined}
                />
                <span className={styles.itemText}>
                  <strong>
                    {trip.from} to {trip.to}
                  </strong>
                  <span>{formatDate(trip.date)}</span>
                  <StatusPill status={booking.tripStatus} small />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

// ---------- Trip details ----------

// A titled card with label/value rows.
function InfoCard({ title, rows }) {
  return (
    <section className={styles.infoCard}>
      <h3>{title}</h3>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function TripDetails({ booking }) {
  const { trip } = booking;

  const now = new Date();
  const start = new Date(trip.date);
  const lastDay = new Date(start.getTime() + (trip.duration - 1) * DAY);

  // "Day 3 of 6" for a running trip, "Leaves in 5 days" for an upcoming one
  const dayNumber = Math.floor((now - start) / DAY) + 1;
  const daysToGo = Math.ceil((start - now) / DAY);

  const banner = small(trip.banner?.url, 1400);

  const infoCards = [
    {
      title: "Trip",
      rows: [
        ["Starts on", formatDate(start, true)],
        ["Duration", `${trip.duration} days / ${trip.duration - 1} nights`],
        ["Trip type", trip.tripType],
        ["Trip ID", trip.tripIdentifier],
      ],
    },
    {
      title: "Pickup & drop",
      rows: [
        ["Pickup", `${formatTime(trip.pickupTime)}, ${trip.pickupLocation}`],
        ["Drop", `${formatTime(trip.dropTime)}, ${trip.dropLocation}`],
      ],
    },
    {
      title: "Booking",
      rows: [
        ["Travelers", booking.travelers],
        ["Total price", money(booking.amount)],
        ["Booking status", booking.status],
      ],
    },
  ];

  return (
    <section className={styles.details} aria-label="Selected trip">
      <div
        className={styles.hero}
        style={banner ? { backgroundImage: `url(${banner})` } : undefined}
      >
        <div className={styles.heroShade} />
        <div className={styles.heroText}>
          <StatusPill status={booking.tripStatus} />
          <h2>
            {trip.from} to {trip.to}
          </h2>
          <p>
            {formatDate(start)} to {formatDate(lastDay)}
          </p>
        </div>
      </div>

      <div className={styles.detailsBody}>
        {booking.paymentStatus === "pending" && (
          <div className={styles.notice} role="status">
            <strong>Payment pending</strong>
            <span>Your seat is confirmed only after the payment is complete.</span>
          </div>
        )}

        {booking.tripStatus === "running" && (
          <div className={styles.progress}>
            <div className={styles.progressText}>
              <strong>
                Day {dayNumber} of {trip.duration}
              </strong>
              <span>Enjoy the trip!</span>
            </div>
            <div
              className={styles.bar}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={trip.duration}
              aria-valuenow={dayNumber}
              aria-label="Trip progress"
            >
              <div style={{ width: `${(dayNumber / trip.duration) * 100}%` }} />
            </div>
          </div>
        )}

        {booking.tripStatus === "upcoming" && (
          <p className={styles.countdown}>
            {daysToGo <= 1 ? "Leaves tomorrow" : `Leaves in ${daysToGo} days`}
          </p>
        )}

        <div className={styles.infoGrid}>
          {infoCards.map((card) => (
            <InfoCard key={card.title} {...card} />
          ))}
        </div>

        {booking.cancelledLocally && (
          <div className={styles.localNotice} role="status">
            This trip is marked cancelled in this dashboard only. Your actual booking has not been
            changed.
          </div>
        )}

        <Link to={`/trips/${trip._id}`} className={styles.btn}>
          View full trip details
        </Link>
      </div>
    </section>
  );
}

// ---------- Empty state ----------

const EMPTY_STEPS = [
  ["Pick a trip", "Browse upcoming group trips by date and price."],
  ["Book your seat", "Choose your group size and pay online."],
  ["Meet at pickup", "Your guide takes it from there."],
];

function EmptyState() {
  return (
    <>
      <section className={styles.empty}>
        <div className={styles.emptyArt}>
          <div className={styles.emptySun} />
          <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <polygon points="0,220 0,140 90,70 160,130 250,40 340,130 400,100 400,220" fill="#2f6b8a" />
            <polygon points="250,40 226,72 242,66 252,82 262,66 278,72" fill="#fff" />
            <path d="M0 220 V170 Q200 140 400 175 V220 Z" fill="#142b3b" />
            <path d="M160 220 C160 196 250 198 228 170 C214 154 190 160 204 144 L212 144 C196 160 240 158 252 172 C272 196 226 200 238 220 Z" fill="#c49a55" />
          </svg>
        </div>

        <div className={styles.emptyText}>
          <h2>No trips booked yet</h2>
          <p>
            Your next adventure is one booking away. Once you book, your trips, pickup details and
            guide will show up right here.
          </p>
          <Link to="/package" className={styles.btn}>
            Browse upcoming trips
          </Link>
        </div>
      </section>

      <h2 className={styles.howTitle}>How it works</h2>
      <ol className={styles.steps}>
        {EMPTY_STEPS.map(([title, text], index) => (
          <li key={title} className={styles.step}>
            <span>{index + 1}</span>
            <strong>{title}</strong>
            <p>{text}</p>
          </li>
        ))}
      </ol>
    </>
  );
}

// ---------- Settings drawer ----------

// Name preview only. Nothing is sent to the server.
function ProfileForm({ initialName, onPreviewName }) {
  const [notice, setNotice] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ mode: "onTouched", defaultValues: { fullName: initialName } });

  // Live preview of what the user is typing
  const typedName = (watch("fullName") || "").trim();

  function handlePreview({ fullName }) {
    const updatedName = fullName.trim();
    onPreviewName(updatedName);
    setNotice("Name preview updated for this dashboard session.");
    reset({ fullName: updatedName });
  }

  return (
    <section className={styles.drawerSection} aria-labelledby="edit-profile-title">
      <div className={styles.sectionTitle}>
        <h3 id="edit-profile-title">Edit profile</h3>
        <span className={styles.badge}>Preview only</span>
      </div>

      <form className={styles.form} onSubmit={handleSubmit(handlePreview)} noValidate>
        <div className={styles.namePreview} aria-hidden="true">
          <span className={styles.previewAvatar}>{getInitials(typedName) || "T"}</span>
          <div>
            <strong>{typedName || "Your name"}</strong>
            <span>How your name will look on this dashboard</span>
          </div>
        </div>

        <Field
          label="Full name"
          aside={`${typedName.length}/60`}
          autoComplete="name"
          error={errors.fullName?.message}
          registration={register("fullName", {
            required: "Please enter your name.",
            minLength: { value: 2, message: "Name must be at least 2 characters." },
            maxLength: { value: 60, message: "Name must be 60 characters or fewer." },
          })}
        />

        <p className={styles.hint}>
          Name changes are previews only and are not saved to your account.
        </p>

        <button type="submit" className={styles.primaryButton}>
          Preview name change
        </button>

        {notice && (
          <p className={styles.formNotice} role="status">
            {notice}
          </p>
        )}
      </form>
    </section>
  );
}

// Sends the real password change request.
function PasswordForm() {
  const [passwordError, setPasswordError] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function handlePasswordChange({ currentPassword, newPassword, confirmPassword }) {
    setPasswordError("");
    setIsChanging(true);

    try {
      const res = await apiUsers.put(UPDATE_PASSWORD_API, {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.data.success) {
        toast.success("Password updated successfully!");
        reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPasswordError(res.data.message || "Failed to update password");
        toast.error(res.data.message || "Failed to update password");
      }
    } catch (err) {
      console.error(err);
      const data = err.response?.data;
      const message =
        data?.message || data?.extraDetails || "Failed to update password. Please try again.";
      setPasswordError(message);
      toast.error(message);
    } finally {
      setIsChanging(false);
    }
  }

  return (
    <section className={styles.drawerSection} aria-labelledby="change-password-title">
      <div className={styles.sectionTitle}>
        <h3 id="change-password-title">Change password</h3>
      </div>
      <form className={styles.form} onSubmit={handleSubmit(handlePasswordChange)} noValidate>
        <Field
          label="Current password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your current password"
          error={errors.currentPassword?.message}
          invalid={Boolean(passwordError)}
          registration={register("currentPassword", {
            required: "Please enter your current password.",
          })}
        />
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.newPassword?.message}
          registration={register("newPassword", {
            required: "Please enter a new password.",
            minLength: { value: 8, message: "Password must be at least 8 characters." },
          })}
        />
        <Field
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter the new password"
          error={errors.confirmPassword?.message}
          registration={register("confirmPassword", {
            required: "Please confirm your new password.",
            deps: ["newPassword"],
            validate: (value, formValues) =>
              (!value && !formValues.newPassword) ||
              value === formValues.newPassword ||
              "Passwords do not match.",
          })}
        />
        {passwordError && (
          <p className={styles.errorText} role="alert">
            {passwordError}
          </p>
        )}
        <button type="submit" className={styles.primaryButton} disabled={isChanging}>
          {isChanging ? "Updating..." : "Change password"}
        </button>
      </form>
    </section>
  );
}

function SettingsDrawer({
  user,
  displayName,
  previewName,
  tripCount,
  loading,
  selected,
  logoutError,
  onPreviewName,
  onCancelTrip,
  onLogout,
  onClose,
}) {
  // Close on Escape and stop the page behind from scrolling while the drawer is open.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const canCancelTrip = selected?.tripStatus === "upcoming" && selected.status !== "cancelled";

  return (
    <div
      className={styles.drawerLayer}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className={styles.drawer}
        id="settings-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className={styles.drawerHeader}>
          <div>
            <span className={styles.drawerEyebrow}>PACK&amp;GO ACCOUNT</span>
            <h2 id="settings-title">Settings</h2>
          </div>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={onClose}
            aria-label="Close settings"
            autoFocus
          >
            ×
          </button>
        </div>

        <div className={styles.drawerContent}>
          <section className={styles.drawerProfile} aria-label="Profile information">
            <span className={styles.avatar} aria-hidden="true">
              {getInitials(displayName) || "T"}
            </span>
            <div className={styles.identity}>
              <strong>{displayName}</strong>
              <span>{user?.email || "Email unavailable"}</span>
            </div>
          </section>

          <dl className={styles.accountFacts}>
            <div>
              <dt>Account type</dt>
              <dd>{user?.role || "Traveler"}</dd>
            </div>
            <div>
              <dt>Member since</dt>
              <dd>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    })
                  : "Pack&Go member"}
              </dd>
            </div>
            <div>
              <dt>Trips booked</dt>
              <dd>{loading ? "Loading" : tripCount}</dd>
            </div>
          </dl>

          <ProfileForm
            initialName={previewName || user?.fullName || ""}
            onPreviewName={onPreviewName}
          />

          <PasswordForm />

          <section className={styles.drawerSection} aria-labelledby="trip-actions-title">
            <div className={styles.sectionTitle}>
              <h3 id="trip-actions-title">Trip actions</h3>
            </div>

            {canCancelTrip ? (
              <>
                <div className={styles.selectedTrip}>
                  <span>Selected upcoming trip</span>
                  <strong>
                    {selected.trip.from} to {selected.trip.to}
                  </strong>
                  <small>{formatDate(selected.trip.date)}</small>
                </div>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() => onCancelTrip(selected)}
                >
                  Cancel this trip
                </button>
                <p className={styles.hint}>
                  This only marks the trip as cancelled in this dashboard. Your actual booking is
                  not changed.
                </p>
              </>
            ) : (
              <p className={styles.hint}>
                {selected
                  ? "Cancellation is only available here for upcoming trips."
                  : "Select an upcoming trip from My trips to see its available actions."}
              </p>
            )}
          </section>

          {logoutError && <p className={styles.errorText}>{logoutError}</p>}
          <button type="button" className={styles.logoutButton} onClick={onLogout}>
            Log out
          </button>
        </div>
      </aside>
    </div>
  );
}

// ---------- The page ----------

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { bookings, selectedId, setSelectedId, loading, needsLogin, error, cancelLocally } =
    useBookings();

  const [logoutError, setLogoutError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profilePreviewName, setProfilePreviewName] = useState("");

  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  // Log out and return to the login page.
  async function handleLogout() {
    try {
      await apiUsers.post(LOGOUT_API);
      navigate(LOGIN_PAGE);
    } catch (err) {
      console.log(err);
      setLogoutError("We could not log you out. Please try again.");
    }
  }

  const selected = bookings.find((b) => b._id === selectedId);
  const ready = !loading && !needsLogin && !error;
  const displayName = profilePreviewName || user?.fullName?.trim() || "Traveler";

  const countByStatus = (...statuses) =>
    bookings.filter((booking) => statuses.includes(booking.tripStatus)).length;

  const stats = [
    { label: "Total trips", value: bookings.length },
    { label: "Active", value: countByStatus("upcoming", "running") },
    { label: "Upcoming", value: countByStatus("upcoming") },
    { label: "Completed", value: countByStatus("completed") },
  ];

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        {!needsLogin && (
          <PageHeader
            firstName={displayName.split(/\s+/)[0]}
            stats={stats}
            loading={loading}
            settingsOpen={settingsOpen}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}

        {settingsOpen && (
          <SettingsDrawer
            user={user}
            displayName={displayName}
            previewName={profilePreviewName}
            tripCount={bookings.length}
            loading={loading}
            selected={selected}
            logoutError={logoutError}
            onPreviewName={setProfilePreviewName}
            onCancelTrip={cancelLocally}
            onLogout={handleLogout}
            onClose={closeSettings}
          />
        )}

        {loading && (
          <div className={styles.layout} aria-busy="true" aria-label="Loading your trips">
            <div className={`${styles.skeleton} ${styles.skeletonSide}`} />
            <div className={`${styles.skeleton} ${styles.skeletonMain}`} />
          </div>
        )}

        {needsLogin && (
          <div className={styles.message}>
            <h1>Please log in</h1>
            <p>Log in to see your booked trips.</p>
            <Link to={LOGIN_PAGE} className={styles.btn}>
              Go to login
            </Link>
          </div>
        )}

        {error && (
          <div className={styles.message} role="alert">
            {error}
          </div>
        )}

        {ready && bookings.length === 0 && <EmptyState />}

        {ready && selected && (
          <div className={styles.layout}>
            <TripList bookings={bookings} selectedId={selectedId} onSelect={setSelectedId} />
            <TripDetails booking={selected} />
          </div>
        )}
      </main>
    </>
  );
}