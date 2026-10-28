import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Hero.module.css";

// Fake bookings for the live tag. Later you can fetch these from your API.
const bookings = [
  { name: "Aman", action: "grabbed seat 9A to Manali", time: "2 min ago" },
  { name: "Riya", action: "booked 2 seats to Spiti", time: "5 min ago" },
  { name: "Neha", action: "joined the Leh group", time: "9 min ago" },
  { name: "Karan", action: "got the last seat to Goa", time: "12 min ago" },
];

export default function Hero() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0); // which booking is showing

  // Show the next booking every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % bookings.length);
    }, 3500);
    return () => clearInterval(timer); // stop the timer when the page closes
  }, []);

  const booking = bookings[index];

  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        {/* LEFT: text, buttons and the live booking tag */}
        <div className={styles.text}>
          <h1 className={styles.title}>
            Pick a route.
            <br />
            Grab a seat.
            <br />
            <span className={styles.go}>Go.</span>
          </h1>

          <p className={styles.desc}>
            Jaipur to Leh in one booking, with a group that actually shows up.
          </p>

          <div className={styles.buttons}>
            {/* Change these routes to your real pages */}
            <button className={styles.primary} onClick={() => navigate("/package")}>
              Browse trips
            </button>
            <button className={styles.ghost} onClick={() => navigate("/know-us")}>
              How it works
            </button>
          </div>

          {/* The key makes the tag replay its slide-in animation on every change */}
          <div className={styles.feed} key={index}>
            <span className={styles.avatar}>{booking.name[0]}</span>
            <div>
              <p className={styles.feedText}>
                <strong>{booking.name}</strong> {booking.action}
              </p>
              <p className={styles.feedTime}>
                <span className={styles.liveDot} /> {booking.time}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: the route map */}
        <svg className={styles.map} viewBox="0 0 500 400" aria-hidden="true">
          {/* Light dotted path (always visible) */}
          <path
            id="route"
            d="M40,330 C110,320 130,210 230,205 S380,110 440,70"
            className={styles.dotted}
          />

          {/* Orange path that draws itself */}
          <path
            d="M40,330 C110,320 130,210 230,205 S380,110 440,70"
            pathLength="1"
            className={styles.line}
          />

          {/* Pins */}
          <circle cx="40" cy="330" r="9" className={styles.pin} />
          <circle cx="230" cy="205" r="9" className={styles.pin} />
          <circle cx="440" cy="70" r="9" className={styles.pin} />

          {/* Pulsing ring around Manali */}
          <circle cx="230" cy="205" r="9" className={styles.ring}>
            <animate attributeName="r" values="9;28" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0" dur="1.8s" repeatCount="indefinite" />
          </circle>

          {/* City names */}
          <text x="40" y="362" className={styles.label}>Jaipur</text>
          <text x="230" y="172" className={styles.label} textAnchor="middle">Spiti Valley </text>
          <text x="440" y="46" className={styles.label} textAnchor="end">Leh</text>

          {/* The bus (white dot) that travels along the route */}
          <circle r="8" className={styles.bus}>
            <animateMotion dur="6s" repeatCount="indefinite">
              <mpath href="#route" />
            </animateMotion>
          </circle>
        </svg>
      </div>
    </section>
  );
}