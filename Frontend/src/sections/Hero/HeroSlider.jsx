import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./HeroSlider.module.css";

const API_URL = `${import.meta.env.VITE_API_URL}/components/get-trips`;

// Turns one Trip from the database into the shape this slider uses
const toSlide = (trip) => ({
  _id: trip._id,
  title: trip.to, // big title, e.g. "Goa"
  tag: `From ${trip.from} | ${new Date(trip.date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  })}`, // e.g. "From Jaipur | 05 Jan"
  description: trip.roadmap.map((stop) => stop.place).join(" → "), // e.g. "Jaipur → Udaipur → Goa"

  // Ask Cloudinary for smaller copies so the hero loads fast
  backgroundImage: trip.banner.url.replace("/upload/", "/upload/w_1920,q_auto,f_auto/"),
  cardImage: trip.thumbnail.url.replace("/upload/", "/upload/w_600,h_850,c_fill,q_auto,f_auto/"),

  price: trip.pricePerHead,
  durationDays: trip.duration,
  tripType: trip.tripType,
});

export default function HeroSlider() {
  const navigate = useNavigate();

  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Get trips from the API and convert them into slides
  useEffect(() => {
    axios
      .get(API_URL)
      .then((res) => setSlides(res.data.data.map(toSlide)))
      .catch((err) => console.error("Hero failed to load:", err));
  }, []);

  // Automatically move to the next slide every 3 seconds.
  // Hovering does not affect autoplay; clicking toggles pause/resume.
  useEffect(() => {
    if (slides.length === 0 || paused) return;

    const timer = setTimeout(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 3000);

    return () => clearTimeout(timer);
  }, [active, paused, slides.length]);

  // Render an empty hero while loading
  if (slides.length === 0) {
  return (
    <section
      className={`${styles.hero} flex flex-col items-center justify-center px-5 pt-28 text-center`}
    >
      {/* Soft glowing circles in the background */}
      <div className="absolute -left-20 -top-20 h-96 w-96 animate-pulse rounded-full bg-emerald-600/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-80 w-80 animate-pulse rounded-full bg-orange-500/25 blur-3xl" />

      <div className="relative z-10 max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-orange-500 bg-orange-500/20 px-4 py-1.5 text-sm text-orange-100">
          <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
          New trips coming soon
        </span>

        <h1 className="mt-5 text-5xl font-bold leading-tight text-white md:text-7xl">
          No trips on the road <span className="text-orange-500">right now</span>
        </h1>

        <p className="mx-auto mt-4 max-w-md text-lg text-emerald-100/80">
          New group trips will show up here as soon as they are added.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {/* Change these routes to your real pages */}
          <button
            onClick={() => navigate("/destinations")}
            className="rounded-full bg-orange-500 px-7 py-3.5 font-semibold text-white hover:bg-orange-600"
          >
            Explore destinations
          </button>
          <button
            onClick={() => navigate("/contact")}
            className="rounded-full border border-white px-7 py-3.5 font-semibold text-white hover:bg-white/15"
          >
            Contact us
          </button>
        </div>
      </div>
    </section>
  );
}

  const goNext = () => {
    setActive((current) => (current + 1) % slides.length);
  };

  const goPrev = () => {
    setActive((current) => (current - 1 + slides.length) % slides.length);
  };

  const current = slides[active];

  // Upcoming destination cards
  const upcoming = [];

  for (let i = 1; i <= 4 && i < slides.length; i++) {
    const index = (active + i) % slides.length;
    upcoming.push({ slide: slides[index], index });
  }

  // Pause/resume only when the hero background area is clicked
  const togglePause = (event) => {
    // Ignore clicks on buttons, cards, or other interactive elements
    if (event.target.closest("button, .heroCard")) return;

    setPaused((previous) => !previous);
  };

  return (
    <section
      className={styles.hero}
      id="destinations"
      onClick={togglePause}
      aria-label="Featured trips carousel"
    >
      {/* Background images */}
      {slides.map((slide, index) => (
        <div
          key={slide._id}
          className={`${styles.bg} ${
            index === active ? styles.bgActive : ""
          }`}
          style={{
            backgroundImage: `url(${slide.backgroundImage})`,
          }}
        />
      ))}

      {/* Dark overlay */}
      <div className={styles.overlay} />

      <div className={styles.content}>
        {/* Left: active slide information */}
        <div className={styles.text} key={current._id}>
          <span className={styles.tag}>{current.tag}</span>

          <h1 className={styles.title}>{current.title}</h1>

          <p className={styles.desc}>{current.description}</p>

          <div className={styles.info}>
            <div>
              <strong>{current.tripType}</strong>
              <span>Trip type</span>
            </div>

            <div>
              <strong>
                ₹{current.price.toLocaleString("en-IN")}
              </strong>
              <span>Per person</span>
            </div>

            <div>
              <strong>{current.durationDays} days</strong>
              <span>Duration</span>
            </div>
          </div>

          <div className={styles.buttons}>
            <button
              className={styles.primary}
              onClick={() => navigate(`/trip/${current._id}`)}
            >
              Book a seat
            </button>

            <button
              className={styles.ghost}
              onClick={() => navigate("/package")}
            >
              Explore
            </button>
          </div>
        </div>

        {/* Right: upcoming destination cards */}
        <div className={styles.cards} key={`cards-${active}`}>
          {upcoming.map(({ slide, index }) => (
            <div
              key={slide._id}
              className={`${styles.card} heroCard`}
              style={{
                backgroundImage: `url(${
                  slide.cardImage || slide.backgroundImage
                })`,
              }}
              onClick={(event) => {
                event.stopPropagation();
                setActive(index);
              }}
            >
              <div className={styles.cardInfo}>
                <p className={styles.cardName}>{slide.title}</p>

                <p className={styles.cardPrice}>
                  ₹{slide.price.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Counter and navigation arrows */}
      <div
        className={styles.controls}
        onClick={(event) => event.stopPropagation()}
      >
        <span>
          {String(active + 1).padStart(2, "0")} /{" "}
          {String(slides.length).padStart(2, "0")}
        </span>

        <div className={styles.arrows}>
          <button
            className={styles.arrow}
            onClick={goPrev}
            aria-label="Previous slide"
          >
            ←
          </button>

          <button
            className={styles.arrow}
            onClick={goNext}
            aria-label="Next slide"
          >
            →
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className={styles.barTrack}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          key={`bar-${active}-${paused}`}
          className={styles.bar}
          style={{
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      </div>

      {/* Optional pause indicator */}
      {paused && (
        <span className={styles.pauseIndicator}>
          Paused — click the background to resume
        </span>
      )}
    </section>
  );
}