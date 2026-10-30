import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import styles from "./Mytripsfloat.module.css";

// ---------- Settings ----------

const BOOKINGS_API = `${import.meta.env.VITE_API_URL}/booking/get`;
const DASHBOARD_PAGE = "/user-dashboard";

// Pages where the button should not show (it is pointless on the dashboard itself)
const HIDE_ON = [DASHBOARD_PAGE, "/login", "/signup"];

const DAY = 86400000;

// ---------- Component ----------

export default function MyTripsFloat() {
  const { pathname } = useLocation();

  const [loggedIn, setLoggedIn] = useState(false);
  const [activeCount, setActiveCount] = useState(0); // trips that are upcoming or running
  const [running, setRunning] = useState(false); // is a trip happening right now?

  // Ask the backend. If the user is logged in we get their bookings back,
  // if not we get an error and the button stays hidden.
  // It runs again when the page changes, so it shows up right after login.
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await axios.get(BOOKINGS_API, { withCredentials: true });
        if (cancelled) return;

        const now = new Date();
        const active = (res.data.bookings || []).filter((b) => {
          if (!b.trip || b.status === "cancelled") return false;
          const end = new Date(new Date(b.trip.date).getTime() + b.trip.duration * DAY);
          return end > now; // the trip is not over yet
        });

        setLoggedIn(true);
        setActiveCount(active.length);
        setRunning(active.some((b) => new Date(b.trip.date) <= now));
      } catch (err) {
        if (!cancelled) setLoggedIn(false);
        console.log(err)
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!loggedIn || HIDE_ON.includes(pathname)) return null;

  return (
    <Link
      to={DASHBOARD_PAGE}
      className={styles.float}
      aria-label={activeCount > 0 ? `Dashboard, ${activeCount} active` : "Dashboard"}
    >
      <span className={running ? `${styles.icon} ${styles.live}` : styles.icon}>
        {/* Suitcase icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="7" width="18" height="13" rx="3" />
          <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />
          <path d="M3 13h18" />
        </svg>
      </span>

      <span className={styles.text}>{running ? "Trip in progress" : "My trips"}</span>

      {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
    </Link>
  );
}
