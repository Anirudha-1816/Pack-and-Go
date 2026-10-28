import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import styles from "./Packages.module.css";
import Navbar from "../Navbar/Navbar";

const API_URL = `${import.meta.env.VITE_API_URL}/components/get-trips`;

// If your Trip model uses different field names, change them ONLY here.
function formatTrip(t) {
  return {
    id: t._id,
    from: t.from,
    to: t.to,
    title: t.title || `${t.from} to ${t.to}`,
    image: t.banner?.url, // banner is an object: { url, publicId }
    date: t.date,
    duration: t.duration ? `${t.duration} days` : "", // duration is a number like 6
    price: t.pricePerHead ?? t.price,
    seatsLeft: t.seatsLeft,
    type: t.tripType || "",
  };
}

function Packages() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [sortBy, setSortBy] = useState("soonest");

  // 1. Get trips from the backend
  useEffect(() => {
    async function loadTrips() {
      try {
        const res = await axios.get(API_URL);
        const list = Array.isArray(res.data)
          ? res.data
          : res.data.trips || res.data.data || [];
        setTrips(list.map(formatTrip));
      } catch (err) {
        setError("We could not load the trips. Check your connection and try again.");
        console.log(err)
      } finally {
        setLoading(false);
      }
    }
    loadTrips();
  }, []);

  // 2. Keep only upcoming trips (today or later)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = trips.filter((t) => new Date(t.date) >= today);

  // 3. Filter chips come from the trip types we actually have
  const types = ["All", ...new Set(upcoming.map((t) => t.type).filter(Boolean))];

  // 4. Apply search, type filter and sorting
  const visible = upcoming
    .filter((t) => type === "All" || t.type === type)
    .filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "low") return a.price - b.price;
      if (sortBy === "high") return b.price - a.price;
      return new Date(a.date) - new Date(b.date); // soonest first
    });

  return (
    <>
    <Navbar/>
    <main className={styles.page}>
      {/* Top section */}
      <header className={styles.header}>
        <div>
          <h1>Upcoming trips</h1>
          <p>
            {loading
              ? "Finding trips for you..."
              : `${upcoming.length} group trips are leaving soon. Pick one and grab your seat.`}
          </p>
        </div>

        <input
          className={styles.search}
          type="text"
          placeholder="Search by place"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      {/* Filters */}
      <div className={styles.toolbar}>
        <div className={styles.chips}>
          {types.map((t) => (
            <button
              key={t}
              className={type === t ? `${styles.chip} ${styles.active}` : styles.chip}
              onClick={() => setType(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <select
          className={styles.sort}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="soonest">Leaving soonest</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
      </div>

      {/* Error */}
      {error && <div className={styles.message}>{error}</div>}

      {/* Loading skeletons */}
      {loading && (
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className={`${styles.card} ${styles.skeleton}`} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && visible.length === 0 && (
        <div className={styles.message}>
          No trips match right now. Clear the search or pick another trip type.
        </div>
      )}

      {/* Trip cards */}
      <div className={styles.grid}>
        {visible.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </main>
</>
  );
}

function TripCard({ trip }) {
  const date = new Date(trip.date);
  const day = date.getDate();
  const month = date.toLocaleString("en-IN", { month: "short" });

  const soldOut = trip.seatsLeft === 0;
  const fewSeats = trip.seatsLeft > 0 && trip.seatsLeft <= 5;

  return (
    <article className={styles.card}>
      <div className={styles.image}>
        <img src={trip.image} alt={trip.title} loading="lazy" />

        {/* Date badge */}
        <div className={styles.date}>
          <strong>{day}</strong>
          <span>{month}</span>
        </div>

        {/* Seats badge */}
        {soldOut && <span className={`${styles.seats} ${styles.sold}`}>Sold out</span>}
        {fewSeats && (
          <span className={`${styles.seats} ${styles.few}`}>Only {trip.seatsLeft} seats left</span>
        )}
      </div>

      <div className={styles.body}>
        {trip.type && <span className={styles.type}>{trip.type}</span>}
        <h2>{trip.title}</h2>
        <p className={styles.route}>
          {trip.from} to {trip.to}
        </p>

        <div className={styles.footer}>
          <div>
            <small>{trip.duration}</small>
            <div className={styles.price}>
              {trip.price ? `₹${Number(trip.price).toLocaleString("en-IN")}` : "Price soon"}
              <span> / person</span>
            </div>
          </div>

          <Link to={`/trip/${trip.id}`} className={styles.btn}>
            {soldOut ? "View trip" : "Book a seat"}
          </Link>
        </div>
      </div>
    </article>
  );
}

export default Packages;