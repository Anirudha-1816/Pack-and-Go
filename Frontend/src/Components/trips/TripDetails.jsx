import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./TripDetails.module.css";
// import Navbar from '../Navbar/Navbar'

const API_URL = "http://localhost:8080/trip/get";

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

// ---------- Pop-up box (closes with the X, a click outside, or the Esc key) ----------
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()} // clicks inside should not close it
      >
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

// ---------- The page ----------
export default function TripDetails() {
  const { id } = useParams(); // the trip id from the URL: /trips/:id
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null, "roadmap", "includes" or "terms"

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

  const closeModal = () => setModal(null);

  // ----- Loading and error screens -----
  if (error) {
    return (
      <div className={styles.page}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <p className={styles.message}>{error}</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className={styles.page}>
        <p className={styles.message}>Loading trip...</p>
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

  return (
    <>
    <div className={styles.page}>
      {/* Back link */}
      <button className={styles.back} onClick={() => navigate(-1)}>
        ← Back to trips
      </button>

      <div className={styles.box}>
        <div className={styles.layout}>
          {/* ================= SIDEBAR ================= */}
          <aside className={styles.sidebar}>
            <button className={styles.sideBtn} onClick={() => setModal("roadmap")}>
              <strong>Roadmap</strong>
              <span>{trip.roadmap.length} places, {totalDays} days</span>
            </button>

            <button className={styles.sideBtn} onClick={() => setModal("includes")}>
              <strong>Includes</strong>
              <span>Meals, stay and travel</span>
            </button>

            <button className={`${styles.sideBtn} ${styles.mustRead}`} onClick={() => setModal("terms")}>
              <strong>Terms</strong>
              <span>Must read this</span>
            </button>

            {/* Change this route to your real booking page */}
            <button className={styles.bookBtn} onClick={() => navigate(`/trips/${trip._id}/book`)}>
              <strong>Book this trip</strong>
              <span>from {money(trip.pricePerHead)} per person</span>
            </button>
          </aside>

          {/* ================= MAIN DISPLAY ================= */}
          <main className={styles.main}>
            {/* Banner with the route */}
            <div className={styles.banner} style={{ backgroundImage: `url(${bannerUrl})` }}>
              <div className={styles.bannerShade} />
              <div className={styles.bannerText}>
                <h1 className={styles.route}>
                  {trip.from} → {trip.to}
                </h1>
                <div className={styles.chips}>
                  <span className={styles.chip}>{shortDate}</span>
                  <span className={styles.chip}>{trip.duration} Days / {nights} Nights</span>
                  <span className={styles.chip}>{trip.tripType}</span>
                </div>
              </div>
            </div>

            {/* Quick facts */}
            <div className={styles.facts}>
              <div className={styles.fact}>
                <small>Starts on</small>
                <strong>{longDate}</strong>
              </div>
              <div className={styles.fact}>
                <small>Duration</small>
                <strong>{trip.duration} Days / {nights} Nights</strong>
              </div>
              <div className={styles.fact}>
                <small>Trip type</small>
                <strong>{trip.tripType}</strong>
              </div>
              <div className={styles.fact}>
                <small>Your guide</small>
                <strong>{trip.guide}</strong>
              </div>
              <div className={styles.fact}>
                <small>Trip ID</small>
                <strong>{trip.tripIdentifier}</strong>
              </div>
            </div>

            {/* Route at a glance */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Where we are going</h3>
              <div className={styles.routeChips}>
                {trip.roadmap.map((stop, index) => (
                  <span key={index} className={styles.routeItem}>
                    {index > 0 && <span className={styles.arrow}>→</span>}
                    <span className={styles.stopChip}>
                      {stop.place} · {stop.days} {stop.days === 1 ? "day" : "days"}
                    </span>
                  </span>
                ))}
              </div>
              <button className={styles.linkBtn} onClick={() => setModal("roadmap")}>
                View full roadmap
              </button>
            </section>

            {/* Stay, travel and meals */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Stay, travel and meals</h3>
              <div className={styles.threeCols}>
                <div className={styles.fact}>
                  <small>Where we stay</small>
                  <strong>{trip.stays === "Not included" ? "Not included" : `${trip.stays} stay`}</strong>
                </div>
                <div className={styles.fact}>
                  <small>How we travel</small>
                  <strong>{trip.travel === "Not included" ? "Not included" : `${trip.travel} travel`}</strong>
                </div>
                <div className={styles.fact}>
                  <small>Meals</small>
                  {trip.meals.length > 0 ? (
                    <div className={styles.mealPills}>
                      {trip.meals.map((meal) => (
                        <span key={meal} className={styles.mealPill}>{meal}</span>
                      ))}
                    </div>
                  ) : (
                    <strong>Not included</strong>
                  )}
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Price per person</h3>
              <div className={styles.priceGrid}>
                <div className={styles.price}>
                  <strong>{money(trip.pricePerHead)}</strong>
                  <span>Solo / per head</span>
                </div>
                <div className={styles.price}>
                  <strong>{money(trip.priceGroup2)}</strong>
                  <span>Group of 2</span>
                </div>
                <div className={styles.price}>
                  <strong>{money(trip.priceGroup4)}</strong>
                  <span>Group of 4</span>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* ================= POP-UPS ================= */}

      {/* Roadmap */}
      {modal === "roadmap" && (
        <Modal title="Trip roadmap" onClose={closeModal}>
          {trip.roadmap.map((stop, index) => (
            <div key={index} className={styles.stop}>
              <span className={styles.dayBadge}>{dayLabel(index)}</span>
              <h3 className={styles.stopPlace}>{stop.place}</h3>
              <p className={styles.stopDays}>
                {stop.days} {stop.days === 1 ? "day" : "days"} here
              </p>
              {stop.note && <p className={styles.stopNote}>{stop.note}</p>}
            </div>
          ))}
          <p className={styles.total}>{trip.roadmap.length} places, {totalDays} days in total</p>
        </Modal>
      )}

      {/* Includes */}
      {modal === "includes" && (
        <Modal title="What's included" onClose={closeModal}>
          <h3 className={styles.popTitle}>Meals</h3>
          <ul className={styles.checkList}>
            {ALL_MEALS.map((meal) => {
              const included = trip.meals.includes(meal);
              return (
                <li key={meal} className={included ? styles.yes : styles.no}>
                  <span>{included ? "✓" : "✕"}</span> {meal}
                </li>
              );
            })}
          </ul>

          <h3 className={styles.popTitle}>Stay and travel</h3>
          <ul className={styles.checkList}>
            {[["Stay", trip.stays], ["Travel", trip.travel]].map(([name, tier]) => (
              <li key={name} className={tier === "Not included" ? styles.no : styles.yes}>
                <span>{tier === "Not included" ? "✕" : "✓"}</span> {name}: {tier}
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {/* Terms and timings */}
      {modal === "terms" && (
        <Modal title="Terms and timings" onClose={closeModal}>
          <h3 className={styles.popTitle}>Pickup and drop</h3>
          <div className={styles.timeGrid}>
            <div className={styles.timeCard}>
              <small>Pickup</small>
              <strong>{formatTime(trip.pickupTime)}</strong>
              <span>{trip.pickupLocation}</span>
            </div>
            <div className={styles.timeCard}>
              <small>Drop</small>
              <strong>{formatTime(trip.dropTime)}</strong>
              <span>{trip.dropLocation}</span>
            </div>
          </div>

          <h3 className={styles.popTitle}>Terms</h3>
          {trip.termsType === "custom" ? (
            <p className={styles.customTerms}>{trip.customTerms}</p>
          ) : (
            <ol className={styles.terms}>
              {REGULAR_TERMS.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ol>
          )}

          <button className={styles.gotIt} onClick={closeModal}>
            I have read this
          </button>
        </Modal>
      )}
    </div>
    </>
  );
}