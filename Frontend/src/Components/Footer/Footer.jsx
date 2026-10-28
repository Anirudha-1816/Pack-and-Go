       import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaEnvelope,
  FaPhone,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import styles from "./Footer.module.css";

const TRIPS_API = `${import.meta.env.VITE_API_URL}/components/get-trips`;

// ---------- Content (edit the text here) ----------

// Replace these with your real details
const contact = [
  { icon: <FaEnvelope />, text: "singhAnirudha@packandgo.com", href: "mailto:hello@packandgo.com" },
  { icon: <FaPhone />, text: "+91 00000 00000", href: "tel:+91 1816000016" },
  { icon: <FaWhatsapp />, text: "Chat on WhatsApp", href: "https://wa.me/910000000000" },
  { icon: <FaMapMarkerAlt />, text: "123 Travel Street, Your City, India" },
];

const links = [
  { label: "Home", to: "/" },
  { label: "Trips", to: "/package" },
  { label: "About us", to: "/know-us" },
  { label: "Contact", to: "/contact-us" },
  { label: "FAQ", to: "/faq" },
];

// Add your real profile links. Icons with an empty link are hidden automatically.
const socials = [
  { label: "Instagram", icon: <FaInstagram />, href: "" },
  { label: "Facebook", icon: <FaFacebookF />, href: "" },
  { label: "Twitter", icon: <FaTwitter />, href: "" },
  { label: "YouTube", icon: <FaYoutube />, href: "" },
];

// ---------- Footer ----------

export default function Footer() {
  const [trips, setTrips] = useState([]);

  // Show the 3 trips leaving soonest, straight from the backend
  useEffect(() => {
    axios
      .get(TRIPS_API)
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data.trips || res.data.data || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const soonest = list
          .filter((t) => new Date(t.date) >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);

        setTrips(soonest);
      })
      .catch(() => {}); // the footer should never break the page
  }, []);

  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        {/* 1. Brand */}
        <div className={styles.brandBox}>
          <Link to="/" className={styles.brand}>
            <img src="/pwa-192x192.png" alt="" />
            <span>
              Pack<em>&amp;</em>Go
            </span>
          </Link>
          <p className={styles.tagline}>
            Group trips made easy. Pick a trip, book your seat and travel with a
            guide.
          </p>

          <div className={styles.socials}>
            {socials
              .filter((s) => s.href)
              .map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noreferrer">
                  {s.icon}
                </a>
              ))}
          </div>
        </div>

        {/* 2. Quick links */}
        <nav aria-label="Footer">
          <h3>Explore</h3>
          <ul className={styles.list}>
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* 3. Upcoming trips (hidden if there are none) */}
        {trips.length > 0 && (
          <div>
            <h3>Upcoming trips</h3>
            <ul className={styles.list}>
              {trips.map((t) => (
                <li key={t._id} className={styles.trip}>
                  <span className={styles.date}>
                    {new Date(t.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                  <Link to={`/trips/${t._id}`}>{t.title || `${t.from} to ${t.to}`}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 4. Contact */}
        <div>
          <h3>Contact us</h3>
          <ul className={styles.list}>
            {contact.map((c) => (
              <li key={c.text} className={styles.contact}>
                {c.icon}
                {c.href ? (
                  <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                    {c.text}
                  </a>
                ) : (
                  <span>{c.text}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} Pack&amp;Go. All rights reserved.</span>
        <div className={styles.legal}>
          <Link to="/terms">Terms and conditions</Link>
          <Link to="/privacy">Privacy policy</Link>
        </div>
      </div>
    </footer>
  );
}