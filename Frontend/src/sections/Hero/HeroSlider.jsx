import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./heroSlider.module.css";

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
    <section className={`${styles.hero} ${styles.emptyHero}`}>
      <div className={styles.emptyGlow} aria-hidden="true" />
      <div className={styles.emptyContent}>
        <span className={styles.emptyTag}>
          <span className={styles.emptyDot} />
          New trips coming soon
        </span>

        <h2 className={styles.emptyTitle}>
          No trips on the road <span>right now</span>
        </h2>

        <p className={styles.emptyDescription}>
          New group trips will show up here as soon as they are added.
        </p>

        <div className={styles.emptyActions}>
          <button
            onClick={() => navigate("/destinations")}
            className={styles.emptyPrimary}
          >
            Explore destinations
          </button>
          <button
            onClick={() => navigate("/contact")}
            className={styles.emptySecondary}
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
        {upcoming.length > 0 && (
          <div className={styles.cardsSection}>
            <p className={styles.cardsHeading}>
              <span>UP NEXT</span>
              Choose another journey
            </p>
            <div className={styles.cards} key={`cards-${active}`}>
              {upcoming.map(({ slide, index }) => (
                <button
                  key={slide._id}
                  type="button"
                  className={`${styles.card} heroCard`}
                  style={{
                    backgroundImage: `url(${
                      slide.cardImage || slide.backgroundImage
                    })`,
                  }}
                  aria-label={`Show ${slide.title} trip`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActive(index);
                  }}
                >
                  <span className={styles.cardInfo}>
                    {slide.tripType && <span className={styles.cardType}>{slide.tripType}</span>}
                    <span className={styles.cardName}>{slide.title}</span>
                    <span className={styles.cardPrice}>
                      ₹{slide.price.toLocaleString("en-IN")} / person
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
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