import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaPlane, FaMountain, FaUmbrellaBeach, FaLandmark,
  FaCalendarAlt, FaUsers, FaStar, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import styles from "./successStories.module.css";

const icons = { mountain: <FaMountain />, beach: <FaUmbrellaBeach />, heritage: <FaLandmark /> };



const trips = [
  {
    id: "manali-adventure",
    name: "Manali Adventure",
    type: "mountain",
    month: "Nov",
    year: 2025,
    joined: 25,
    days: 6,
    cost: "₹18,500",
    rating: 4.9,
    quote: "Loved the trek!",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "goa-beach-week",
    name: "Goa Beach Week",
    type: "beach",
    month: "Dec",
    year: 2025,
    joined: 32,
    days: 5,
    cost: "₹14,000",
    rating: 4.8,
    quote: "Best week of my year.",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "jaipur-heritage",
    name: "Jaipur Heritage Trail",
    type: "heritage",
    month: "Feb",
    year: 2026,
    joined: 28,
    days: 4,
    cost: "₹12,000",
    rating: 4.7,
    quote: "Every street had a story.",
    image:
      "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "kerala-backwaters",
    name: "Kerala Backwaters",
    type: "beach",
    month: "Mar",
    year: 2026,
    joined: 20,
    days: 5,
    cost: "₹16,500",
    rating: 4.9,
    quote: "Pure calm on the water.",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80"
  },


];





const stats = [
  { to: 50, suffix: "+", label: "Trips completed" },
  { to: 1200, suffix: "+", label: "Happy travelers" },
  { to: 98, suffix: "%", label: "Would travel again" },
];

function Counter({ to, suffix }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setN(to);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min((t - start) / 1500, 1);
        setN(Math.round(to * p));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [to]);

  return <span ref={ref}>{n}{suffix}</span>;
}

export default function SuccessFullTrips() {
  const [year, setYear] = useState("All");
  const rail = useRef(null);
  const shown = year === "All" ? trips : trips.filter((t) => t.year === year);
  const scroll = (dir) => rail.current.scrollBy({ left: dir * 320, behavior: "smooth" });

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <div>
          <p className={styles.kicker}><FaPlane /> Testimonials</p>
          <h2 className={styles.title}>Memories made, journeys completed 🌍✨</h2>
        </div>
        <div className={styles.stats}>
          {stats.map((s) => (
            <div key={s.label}>
              <strong><Counter to={s.to} suffix={s.suffix} /></strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      <div className={styles.bar}>
        <div className={styles.tabs}>
          {["All", 2025, 2026].map((y) => (
            <button
              key={y}
              className={y === year ? styles.tabOn : ""}
              onClick={() => setYear(y)}
            >
              {y}
            </button>
          ))}
        </div>
        <div className={styles.arrows}>
          <button onClick={() => scroll(-1)} aria-label="Previous"><FaChevronLeft /></button>
          <button onClick={() => scroll(1)} aria-label="Next"><FaChevronRight /></button>
        </div>
      </div>

      <div className={styles.rail} ref={rail}>
        {shown.map((t) => (
          <Link key={t.id} to={`/trips/${t.id}`} className={`${styles.card} ${styles[t.type]}`}>
            <img src={t.image} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />
            <span className={styles.badge}>{icons[t.type]}</span>
            <span className={styles.rating}><FaStar /> {t.rating}</span>

            <div className={styles.info}>
              <h3>{t.name}</h3>
              <p className={styles.meta}>
                <FaCalendarAlt /> {t.month} {t.year} <FaUsers /> {t.joined} joined
              </p>
              <p className={styles.quote}>“{t.quote}”</p>
              <div className={styles.panel}>
                <div>
                  <p><span>{t.days} days</span><span>{t.cost}</span><b>View trip →</b></p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}