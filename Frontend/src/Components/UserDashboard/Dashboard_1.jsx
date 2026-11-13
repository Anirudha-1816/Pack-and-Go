// Flow: booking API returns integer paise -> dashboard formats rupees for display.

import { useEffect,  useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Navbar from "../Navbar/Navbar";
import useAuthStore from "../../Stores/authStore";
import styles from "./Dashboard.module.css";
// ---------- Settings ----------

const BOOKINGS_API = `${import.meta.env.VITE_API_URL}/booking/get`;

// These two are my guesses. Change them to your real routes.
const LOGOUT_API =`${import.meta.env.VITE_API_URL}/users/logout`;
const UPDATE_PASSWORD_API = `${import.meta.env.VITE_API_URL}/users/update-password`;

const LOGIN_PAGE = "/login";

// Feedback upload limits
// const MAX_FILES = 6;
// const MAX_PHOTO_MB = 5;
// const MAX_VIDEO_MB = 50;

// ---------- Helpers ----------

const DAY = 86400000;

// Show a saved integer paise amount as a rupee price.
const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0) / 100);

// Format a trip date for the booking details.
const formatDate = (date, long = false) =>
  new Date(date).toLocaleDateString("en-IN", {
    weekday: long ? "long" : undefined,
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// Convert a 24-hour pickup or drop time into a readable clock time.
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

// upcoming, running or completed
function getTripStatus(trip) {
  const start = new Date(trip.date);
  const end = new Date(start.getTime() + trip.duration * DAY);
  const now = new Date();
  if (now < start) return "upcoming";
  if (now < end) return "running";
  return "completed";
}

const STATUS_LABEL = {
  upcoming: "Upcoming",
  running: "Running now",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Running trips first, then upcoming (soonest first), then completed (latest first)
function sortBookings(a, b) {
  const order = { running: 0, upcoming: 1, completed: 2, cancelled: 3 };
  if (order[a.tripStatus] !== order[b.tripStatus]) {
    return order[a.tripStatus] - order[b.tripStatus];
  }
  const diff = new Date(a.trip.date) - new Date(b.trip.date);
  return a.tripStatus === "completed" ? -diff : diff;
}

// A trip counts as "successful" when it is over and the booking was not pending or cancelled
// const isSuccessful = (b) =>
//   b.tripStatus === "completed" && !["pending", "cancelled", "failed"].includes(b.status);

// ---------- Small pieces ----------

// Show one named detail in the trip summary.
function Fact({ label, value }) {
  return (
    <div className={styles.fact}>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

// function Star({ filled }) {
//   return (
//     <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
//       <path
//         d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"
//         fill={filled ? "#c49a55" : "none"}
//         stroke={filled ? "#c49a55" : "#e8eff1"}
//         strokeWidth="1.6"
//         strokeLinejoin="round"
//       />
//     </svg>
//   );
// }

// Shown when the user has no bookings
function EmptyState() {
  const steps = [
    ["Pick a trip", "Browse upcoming group trips by date and price."],
    ["Book your seat", "Choose your group size and pay online."],
    ["Meet at pickup", "Your guide takes it from there."],
  ];

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
          <h1>No trips booked yet</h1>
          <p>
            Your next adventure is one booking away. Once you book, your trips,
            pickup details and guide will show up right here.
          </p>
          <Link to="/package" className={styles.btn}>
            Browse upcoming trips
          </Link>
        </div>
      </section>

      <h2 className={styles.howTitle}>How it works</h2>
      <div className={styles.steps}>
        {steps.map(([title, text], index) => (
          <div key={title} className={styles.step}>
            <span>{index + 1}</span>
            <strong>{title}</strong>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </>
  );
}

// ---------- Trip details (right side) ----------

// Show trip dates, payment state, and the saved paise amount for one booking.
function TripDetails({ booking }) {
  const { trip } = booking;

  const start = new Date(trip.date);
  const lastDay = new Date(start.getTime() + (trip.duration - 1) * DAY);

  // "Day 3 of 6" for a running trip
  const dayNumber = Math.floor((new Date() - start) / DAY) + 1;
  const daysToGo = Math.ceil((start - new Date()) / DAY);

  const banner = small(trip.banner?.url, 1400);

  return (
    <section className={styles.details}>
      {/* Big picture with the route */}
      <div
        className={styles.hero}
        style={banner ? { backgroundImage: `url(${banner})` } : undefined}
      >
        <div className={styles.heroShade} />
        <div className={styles.heroText}>
          <span className={`${styles.pill} ${styles[booking.tripStatus]}`}>
            {STATUS_LABEL[booking.tripStatus]}
          </span>
          <h1>
            {trip.from} to {trip.to}
          </h1>
          <p>
            {formatDate(start)} to {formatDate(lastDay)}
          </p>
        </div>
      </div>

      <div className={styles.detailsBody}>
        {/* Payment notice */}
        {booking.paymentStatus === "pending" && (
          <div className={styles.notice}>
            <strong>Payment pending</strong>
            <span>Your seat is confirmed only after the payment is complete.</span>
          </div>
        )}

        {/* Progress or countdown */}
        {booking.tripStatus === "running" && (
          <div className={styles.progress}>
            <div className={styles.progressText}>
              <strong>
                Day {dayNumber} of {trip.duration}
              </strong>
              <span>Enjoy the trip!</span>
            </div>
            <div className={styles.bar}>
              <div style={{ width: `${(dayNumber / trip.duration) * 100}%` }} />
            </div>
          </div>
        )}

        {booking.tripStatus === "upcoming" && (
          <p className={styles.countdown}>
            {daysToGo <= 1 ? "Leaves tomorrow" : `Leaves in ${daysToGo} days`}
          </p>
        )}

        {/* All the facts */}
        <div className={styles.facts}>
          <Fact label="Starts on" value={formatDate(start, true)} />
          <Fact label="Duration" value={`${trip.duration} days / ${trip.duration - 1} nights`} />
          <Fact label="Travelers" value={booking.travelers} />
          <Fact label="Total price" value={money(booking.amount)} />
          <Fact label="Pickup" value={`${formatTime(trip.pickupTime)}, ${trip.pickupLocation}`} />
          <Fact label="Drop" value={`${formatTime(trip.dropTime)}, ${trip.dropLocation}`} />
          <Fact label="Trip type" value={trip.tripType} />
          <Fact label="Booking status" value={booking.status} />
          <Fact label="Trip ID" value={trip.tripIdentifier} />
        </div>

        <Link to={`/trips/${trip._id}`} className={styles.btn}>
          View full trip details
        </Link>
        {booking.cancelledLocally && (
          <div className={styles.localNotice} role="status">
            This trip is marked cancelled in this dashboard only. Your actual booking has not been
            changed.
          </div>
        )}
      </div>
    </section>
  );
}



// ---------- The page ----------

// Load the signed-in user's bookings and show their trip details.
export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [bookings, setBookings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profilePreviewName, setProfilePreviewName] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: profileErrors, isSubmitting: isSavingProfile },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      fullName: user?.fullName || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // 1. Get the logged in user's bookings
  useEffect(() => {
    // Load only bookings that still have a trip to display.
    async function loadBookings() {
      try {
        const res = await axios.get(BOOKINGS_API, { withCredentials: true });

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
        if (err.response?.status === 401) setNeedsLogin(true);
        else setError("We could not load your trips. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  useEffect(() => {
    if (!settingsOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen]);

  // 2. Log out
  // Sign the user out and return them to the login page.
  async function handleLogout() {
    try {
      await axios.post(LOGOUT_API, {}, { withCredentials: true });
      navigate(LOGIN_PAGE);
    } catch (err) {
      console.log(err);
      setLogoutError("We could not log you out. Please try again.");
    }
  }

  function handleCancelTrip(booking) {
    const confirmed = window.confirm(
      `Mark your trip from ${booking.trip.from} to ${booking.trip.to} as cancelled in this dashboard? This will not cancel your actual booking.`
    );

    if (!confirmed) return;

    setBookings((currentBookings) =>
      currentBookings.map((item) =>
        item._id === booking._id
          ? { ...item, status: "cancelled", tripStatus: "cancelled", cancelledLocally: true }
          : item
      )
    );
  }

  function openSettings() {
    reset({
      fullName: profilePreviewName || user?.fullName || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setProfileNotice("");
    setPasswordError("");
    setPasswordSuccess("");
    setSettingsOpen(true);
  }

  async function handlePasswordChange({ currentPassword, newPassword, confirmPassword }) {
    setPasswordError("");
    setPasswordSuccess("");
    setIsChangingPassword(true);

    try {
      const res = await axios.put(UPDATE_PASSWORD_API, { currentPassword, newPassword, confirmPassword }, { withCredentials: true });
      if (res.data.success) {
        toast.success("Password updated successfully!");
        reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPasswordError(res.data.message || "Failed to update password");
        toast.error(res.data.message || "Failed to update password");
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        setPasswordError(err.response.data.message);
        toast.error(err.response.data.message);
      } else if (err.response?.data?.extraDetails) {
        setPasswordError(err.response.data.extraDetails);
        toast.error(err.response.data.extraDetails);
      } else {
        setPasswordError("Failed to update password. Please try again.");
        toast.error("Failed to update password. Please try again.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  }

  function handleProfilePreview({ fullName }) {
    const updatedName = fullName.trim();
    setProfilePreviewName(updatedName);
    setProfileNotice(
      "Name preview updated for this dashboard session. Password changes are not saved or sent anywhere."
    );
    reset({ fullName: updatedName, newPassword: "", confirmPassword: "" });
  }

  const selected = bookings.find((b) => b._id === selectedId);
  const ready = !loading && !needsLogin && !error;
  const displayName = profilePreviewName || user?.fullName?.trim() || "Traveler";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const activeTrips = bookings.filter((booking) =>
    ["upcoming", "running"].includes(booking.tripStatus)
  ).length;
  const upcomingTrips = bookings.filter((booking) => booking.tripStatus === "upcoming").length;
  const completedTrips = bookings.filter((booking) => booking.tripStatus === "completed").length;

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        {!needsLogin && (
          <section className={styles.welcome} aria-label="Your account overview">
            <div className={styles.welcomeIntro}>
              <span className={styles.eyebrow}>YOUR PACK&amp;GO ACCOUNT</span>
              <h1>Welcome back, {displayName.split(/\s+/)[0]}</h1>
              <p>Your trips, travel details and account at a glance.</p>
              <button
                type="button"
                className={styles.settingsButton}
                onClick={openSettings}
                aria-expanded={settingsOpen}
                aria-controls="settings-drawer"
              >
                <span aria-hidden="true">⚙</span>
                Account settings
              </button>
            </div>
            <div className={styles.stats} aria-label="Trip summary">
              <div className={styles.stat}>
                <strong>{loading ? "—" : bookings.length}</strong>
                <span>Total trips</span>
              </div>
              <div className={styles.stat}>
                <strong>{loading ? "—" : activeTrips}</strong>
                <span>Active</span>
              </div>
              <div className={styles.stat}>
                <strong>{loading ? "—" : upcomingTrips}</strong>
                <span>Upcoming</span>
              </div>
              <div className={styles.stat}>
                <strong>{loading ? "—" : completedTrips}</strong>
                <span>Completed</span>
              </div>
            </div>
          </section>
        )}

        {settingsOpen && (
          <div className={styles.drawerLayer} onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSettingsOpen(false);
          }}>
            <aside
              className={styles.settingsDrawer}
              id="settings-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-title"
            >
              <div className={styles.drawerHeader}>
                <div>
                  <span className={styles.editorEyebrow}>PACK&amp;GO ACCOUNT</span>
                  <h2 id="settings-title">Settings</h2>
                </div>
                <button
                  type="button"
                  className={styles.drawerClose}
                  onClick={() => setSettingsOpen(false)}
                  aria-label="Close settings"
                  autoFocus
                >
                  ×
                </button>
              </div>

              <div className={styles.drawerContent}>
                <section className={styles.drawerProfile} aria-label="Profile information">
                  <span className={styles.avatar} aria-hidden="true">{initials || "T"}</span>
                  <div className={styles.drawerIdentity}>
                    <strong>{displayName}</strong>
                    <span>{user?.email || "Email unavailable"}</span>
                  </div>
                </section>

                <div className={styles.accountFacts}>
                  <div>
                    <span>Account type</span>
                    <strong>{user?.role || "Traveler"}</strong>
                  </div>
                  <div>
                    <span>Member since</span>
                    <strong>
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric",
                          })
                        : "Pack&Go member"}
                    </strong>
                  </div>
                  <div>
                    <span>Trips booked</span>
                    <strong>{loading ? "Loading" : bookings.length}</strong>
                  </div>
                </div>

                <section className={styles.drawerSection} aria-labelledby="edit-profile-title">
                  <div className={styles.drawerSectionTitle}>
                    <h3 id="edit-profile-title">Edit profile</h3>
                    <span className={styles.previewBadge}>Preview only</span>
                  </div>
                  <form
                    className={styles.drawerForm}
                    onSubmit={handleSubmit(handleProfilePreview)}
                    noValidate
                  >
                    <label className={styles.profileField}>
                      <span>Full name</span>
                      <input
                        autoComplete="name"
                        {...register("fullName", {
                          required: "Please enter your name.",
                          minLength: { value: 2, message: "Name must be at least 2 characters." },
                          maxLength: { value: 60, message: "Name must be 60 characters or fewer." },
                        })}
                        aria-invalid={Boolean(profileErrors.fullName)}
                      />
                      {profileErrors.fullName && (
                        <small role="alert">{profileErrors.fullName.message}</small>
                      )}
                    </label>
                    <p className={styles.drawerHint}>
                      Name changes are previews only and are not saved to your account.
                    </p>
                    <button
                      type="submit"
                      className={styles.saveProfileButton}
                      disabled={isSavingProfile}
                    >
                      Preview name change
                    </button>
                    {profileNotice && (
                      <p className={styles.profileNotice} role="status">{profileNotice}</p>
                    )}
                  </form>

                  <section className={styles.drawerSection} aria-labelledby="change-password-title">
                    <div className={styles.drawerSectionTitle}>
                      <h3 id="change-password-title">Change password</h3>
                    </div>
                    <form
                      className={styles.drawerForm}
                      onSubmit={handleSubmit(handlePasswordChange)}
                      noValidate
                    >
                      <label className={styles.profileField}>
                        <span>Current password</span>
                        <input
                          type="password"
                          autoComplete="current-password"
                          placeholder="Enter your current password"
                          {...register("currentPassword", {
                            required: "Please enter your current password.",
                          })}
                          aria-invalid={Boolean(passwordError)}
                        />
                      </label>
                      <label className={styles.profileField}>
                        <span>New password</span>
                        <input
                          type="password"
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                          {...register("newPassword", {
                            required: "Please enter a new password.",
                            minLength: {
                              value: 8,
                              message: "Password must be at least 8 characters.",
                            },
                          })}
                          aria-invalid={Boolean(profileErrors.newPassword)}
                        />
                        {profileErrors.newPassword && (
                          <small role="alert">{profileErrors.newPassword.message}</small>
                        )}
                      </label>
                      <label className={styles.profileField}>
                        <span>Confirm new password</span>
                        <input
                          type="password"
                          autoComplete="new-password"
                          placeholder="Re-enter the new password"
                          {...register("confirmPassword", {
                            required: "Please confirm your new password.",
                            deps: ["newPassword"],
                            validate: (value, formValues) =>
                              (!value && !formValues.newPassword) ||
                              value === formValues.newPassword ||
                              "Passwords do not match.",
                          })}
                          aria-invalid={Boolean(profileErrors.confirmPassword)}
                        />
                        {profileErrors.confirmPassword && (
                          <small role="alert">{profileErrors.confirmPassword.message}</small>
                        )}
                      </label>
                      {passwordError && <p className={styles.errorText} role="alert">{passwordError}</p>}
                      {passwordSuccess && <p className={styles.profileNotice} role="status">{passwordSuccess}</p>}
                      <button
                        type="submit"
                        className={styles.saveProfileButton}
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? "Updating..." : "Change password"}
                      </button>
                    </form>
                  </section>
                </section>

                <section className={styles.drawerSection} aria-labelledby="trip-actions-title">
                  <div className={styles.drawerSectionTitle}>
                    <h3 id="trip-actions-title">Trip actions</h3>
                  </div>
                  {selected?.tripStatus === "upcoming" && selected.status !== "cancelled" ? (
                    <>
                      <div className={styles.selectedTrip}>
                        <span>Selected upcoming trip</span>
                        <strong>{selected.trip.from} to {selected.trip.to}</strong>
                        <small>{formatDate(selected.trip.date)}</small>
                      </div>
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => handleCancelTrip(selected)}
                      >
                        Cancel this trip
                      </button>
                      <p className={styles.drawerHint}>
                        This only marks the trip as cancelled in this dashboard. Your actual
                        booking is not changed.
                      </p>
                    </>
                  ) : (
                    <p className={styles.drawerHint}>
                      {selected
                        ? "Cancellation is only available here for upcoming trips."
                        : "Select an upcoming trip from My trips to see its available actions."}
                    </p>
                  )}
                  {logoutError && <p className={styles.errorText}>{logoutError}</p>}
                  <button type="button" className={styles.drawerLogout} onClick={handleLogout}>
                    Log out
                  </button>
                </section>
              </div>
            </aside>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className={styles.top}>
            <div className={`${styles.skeleton} ${styles.skeletonSide}`} />
            <div className={`${styles.skeleton} ${styles.skeletonMain}`} />
          </div>
        )}

        {/* Not logged in */}
        {needsLogin && (
          <div className={styles.message}>
            <h1>Please log in</h1>
            <p>Log in to see your booked trips.</p>
            <Link to={LOGIN_PAGE} className={styles.btn}>
              Go to login
            </Link>
          </div>
        )}

        {/* Error */}
        {error && <div className={styles.message}>{error}</div>}

        {/* No trips yet */}
        {ready && bookings.length === 0 && <EmptyState />}

        {/* Trips */}
        {ready && selected && (
          <>
            <div className={styles.top}>
              {/* Left: trip list and logout */}
              <aside className={styles.sidebar}>
                <div className={styles.sideHead}>
                  <h2>My trips</h2>
                  <span>{bookings.length}</span>
                </div>

                <div className={styles.list}>
                  {bookings.map((b) => (
                    <button
                      key={b._id}
                      className={
                        b._id === selectedId ? `${styles.item} ${styles.itemActive}` : styles.item
                      }
                      onClick={() => setSelectedId(b._id)}
                      aria-current={b._id === selectedId}
                    >
                      <div
                        className={styles.thumb}
                        style={
                          b.trip.thumbnail?.url || b.trip.banner?.url
                            ? {
                                backgroundImage: `url(${small(
                                  b.trip.thumbnail?.url || b.trip.banner?.url,
                                  160
                                )})`,
                              }
                            : undefined
                        }
                      />
                      <div className={styles.itemText}>
                        <strong>
                          {b.trip.from} to {b.trip.to}
                        </strong>
                        <span>{formatDate(b.trip.date)}</span>
                        <em className={`${styles.pill} ${styles.small} ${styles[b.tripStatus]}`}>
                          {STATUS_LABEL[b.tripStatus]}
                        </em>
                      </div>
                    </button>
                  ))}
                </div>

              </aside>

              {/* Right: the selected trip */}
              <TripDetails booking={selected} />
            </div>

            {/* Bottom: feedback, only after a successful trip */}
            {/* {isSuccessful(selected) && <FeedbackForm key={selected._id} booking={selected} />} */}
          </>
        )}
      </main>
    </>
  );
}
