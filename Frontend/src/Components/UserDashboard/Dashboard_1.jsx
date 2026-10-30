import { useEffect,  useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar/Navbar";
import styles from "./Dashboard.module.css";
// ---------- Settings ----------

const BOOKINGS_API = `${import.meta.env.VITE_API_URL}/booking/get`;

// These two are my guesses. Change them to your real routes.
const LOGOUT_API =`${import.meta.env.VITE_API_URL}/users/logout`;

const LOGIN_PAGE = "/login";

// Feedback upload limits
// const MAX_FILES = 6;
// const MAX_PHOTO_MB = 5;
// const MAX_VIDEO_MB = 50;

// ---------- Helpers ----------

const DAY = 86400000;

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const formatDate = (date, long = false) =>
  new Date(date).toLocaleDateString("en-IN", {
    weekday: long ? "long" : undefined,
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// "06:30" -> "6:30 AM"
const formatTime = (time) => {
  if (!time) return "";
  const [hour, minute] = time.split(":");
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
};

// Ask Cloudinary for a smaller picture (other image links stay as they are)
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
};

// Running trips first, then upcoming (soonest first), then completed (latest first)
function sortBookings(a, b) {
  const order = { running: 0, upcoming: 1, completed: 2 };
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
//         fill={filled ? "#ff7a1a" : "none"}
//         stroke={filled ? "#ff7a1a" : "#cfe3d6"}
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
            <polygon points="0,220 0,140 90,70 160,130 250,40 340,130 400,100 400,220" fill="#1b7a4b" />
            <polygon points="250,40 226,72 242,66 252,82 262,66 278,72" fill="#fff" />
            <path d="M0 220 V170 Q200 140 400 175 V220 Z" fill="#0f3d2a" />
            <path d="M160 220 C160 196 250 198 228 170 C214 154 190 160 204 144 L212 144 C196 160 240 158 252 172 C272 196 226 200 238 220 Z" fill="#ff7a1a" />
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
          <Fact label="Total price" value={money(booking.totalPrice)} />
          <Fact label="Pickup" value={`${formatTime(trip.pickupTime)}, ${trip.pickupLocation}`} />
          <Fact label="Drop" value={`${formatTime(trip.dropTime)}, ${trip.dropLocation}`} />
          <Fact label="Trip type" value={trip.tripType} />
          <Fact label="Booking status" value={booking.status} />
          <Fact label="Trip ID" value={trip.tripIdentifier} />
        </div>

        <Link to={`/trips/${trip._id}`} className={styles.btn}>
          View full trip details
        </Link>
      </div>
    </section>
  );
}



// ---------- The page ----------

export default function Dashboard() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");
  const [logoutError, setLogoutError] = useState("");

  // 1. Get the logged in user's bookings
  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await axios.get(BOOKINGS_API, { withCredentials: true });

        const list = (res.data.bookings || [])
          .filter((b) => b.trip) // skip bookings whose trip was deleted
          .map((b) => ({ ...b, tripStatus: getTripStatus(b.trip) }))
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

  // 2. Log out
  async function handleLogout() {
    try {
      await axios.post(LOGOUT_API, {}, { withCredentials: true });
      navigate(LOGIN_PAGE);
    } catch (err) {
      console.log(err);
      setLogoutError("We could not log you out. Please try again.");
    }
  }

  const selected = bookings.find((b) => b._id === selectedId);
  const ready = !loading && !needsLogin && !error;

  return (
    <>
      <Navbar />
      <main className={styles.page}>
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

                <div className={styles.logout}>
                  {logoutError && <p className={styles.errorText}>{logoutError}</p>}
                  <button onClick={handleLogout}>Log out</button>
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
