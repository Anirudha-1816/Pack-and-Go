import { useCallback, useEffect, useRef, useState } from "react";
import { FaPlay } from "react-icons/fa";
import { getDestinations } from "./destinationApi";
import styles from "./Destinations.module.css";

const DELAY = 3000; // an image stays 3 seconds
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad = (n) => String(n).padStart(2, "0");

// Shows an image, or a muted video that plays only while it is the main item
function Media({ item, active, paused, onDone }) {
  const ref = useRef(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    if (!active) {
      v.pause();
      v.currentTime = 0;
    } else if (paused) {
      v.pause();
    } else {
      v.play().catch((err) => err.name === "NotAllowedError" && onDone()); // blocked: just move on
    }
  }, [active, paused]);

  if (item.type === "video") {
    return (
      <video
        ref={ref}
        src={item.src}
        poster={item.poster}
        muted
        playsInline
        preload="metadata"
        onEnded={active ? onDone : undefined}
        onError={active ? onDone : undefined}
      />
    );
  }
  return (
    <img
      src={item.src}
      alt={item.title}
      loading="lazy"
      onError={(e) => (e.currentTarget.style.display = "none")}
    />
  );
}

export default function Destinations() {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = items.length;

  useEffect(() => {
    getDestinations().then(setItems);
  }, []);

  const next = useCallback(() => setIndex((i) => (i + 1) % n), [n]);
  const prev = () => setIndex((i) => (i - 1 + n) % n);

  // Images move on after 3 seconds. Videos move on when they end (see Media).
  const current = items[index];
  useEffect(() => {
    if (!current || current.type === "video" || paused || reduceMotion) return;
    const t = setTimeout(next, DELAY);
    return () => clearTimeout(t);
  }, [index, current, paused, next]);

  if (!n) return null;

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <div className={styles.headingCopy}>
          <span className={styles.eyebrow}>Find your somewhere</span>
          <h2 className={styles.title}>A little closer to your next escape.</h2>
          <p className={styles.subtitle}>
            Get inspired by the places and moments waiting along the way.
          </p>
        </div>
        <span className={styles.counter} aria-live="polite">
          <b>{pad(index + 1)}</b> / {pad(n)}
        </span>
      </header>

      <div
        className={`${styles.stage} ${paused ? styles.paused : ""}`}
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label="Destinations we have visited"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") prev();
          if (e.key === "ArrowRight") next();
        }}
      >
        {items.map((it, i) => {
          const rel = (i - index + n) % n;
          const pos =
            rel === 0 ? "main" : rel === 1 ? "next" : rel === n - 1 ? "prev"
            : rel <= n / 2 ? "hideRight" : "hideLeft";
          const peek = pos === "next" || pos === "prev";

          return (
            <div
              key={it.id}
              className={`${styles.slide} ${styles[pos]}`}
              aria-hidden={pos !== "main" && !peek}
              {...(peek && {
                role: "button",
                tabIndex: 0,
                "aria-label": `Show ${it.title}`,
                onClick: () => setIndex(i),
                onKeyDown: (e) => e.key === "Enter" && setIndex(i),
              })}
            >
              <Media item={it} active={pos === "main"} paused={paused} onDone={next} />
              {it.type === "video" && <span className={styles.badge}><FaPlay /> Video</span>}
              <div className={styles.caption}>
                <span className={styles.place}>{it.place}</span>
                <h3>{it.title}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`${styles.dots} ${paused ? styles.paused : ""}`}>
        {items.map((it, i) => (
          <button
            key={it.id}
            className={`${styles.dot} ${i === index ? styles.dotOn : ""} ${it.type === "video" ? styles.dotVideo : ""}`}
            onClick={() => setIndex(i)}
            aria-label={`Go to ${it.title}`}
          >
            <span className={styles.track}>{i === index && <i key={index} />}</span>
          </button>
        ))}
      </div>
    </section>
  );
}