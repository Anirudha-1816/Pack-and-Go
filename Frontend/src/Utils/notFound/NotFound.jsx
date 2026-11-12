import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Pack & Go – 404 page (v2)                                          */
/*  Needs: React only. All colours, layout and animation are plain CSS */
/*  in the <style> block, so it looks the same on any Tailwind         */
/*  version (or with Tailwind not set up at all).                      */
/*                                                                     */
/*  The "0" is a compass: it spins, wobbles like it's lost, then       */
/*  points at your cursor / finger.                                    */
/* ------------------------------------------------------------------ */

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=DM+Sans:wght@400;500&display=swap');

.nf-page {
  position: relative; min-height: 100vh; overflow: hidden;
  font-family: 'DM Sans', system-ui, sans-serif;
  background: linear-gradient(180deg, #1FA7D4 0%, #6FD6C5 38%, #FFE08A 72%, #FF9E7A 100%);
}
.nf-display { font-family: 'Bricolage Grotesque', system-ui, sans-serif; }

/* ---------- keyframes ---------- */
@keyframes nf-drop {
  0%   { opacity: 0; transform: translateY(-140%) rotate(-8deg); }
  100% { opacity: 1; transform: translateY(0) rotate(0); }
}
@keyframes nf-float  { from { transform: translateY(0); } to { transform: translateY(-14px); } }
@keyframes nf-spin   { from { transform: rotate(0deg); } to { transform: rotate(900deg); } }
@keyframes nf-wobble { from { transform: rotate(-32deg); } to { transform: rotate(48deg); } }
@keyframes nf-fade   { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes nf-drift  { from { transform: translateX(-30vw); } to { transform: translateX(130vw); } }
@keyframes nf-sway   { from { transform: translateX(0); } to { transform: translateX(-4%); } }
@keyframes nf-bob    { from { transform: translateY(0); } to { transform: translateY(-12px); } }
@keyframes nf-glow   { from { transform: scale(1); opacity: .7; } to { transform: scale(1.2); opacity: .3; } }
@keyframes nf-rays   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes nf-balloon {
  0%   { transform: translate(0, 0) rotate(-3deg); }
  50%  { transform: translate(14px, -26px) rotate(3deg); }
  100% { transform: translate(0, 0) rotate(-3deg); }
}

/* ---------- sun ---------- */
.nf-sun { position: absolute; right: 10%; top: 8%; width: 110px; height: 110px; }
.nf-sun-rays {
  position: absolute; inset: -60px; border-radius: 50%;
  background: repeating-conic-gradient(rgba(255,255,255,.55) 0 7deg, transparent 7deg 20deg);
  -webkit-mask-image: radial-gradient(circle, #000 28%, transparent 68%);
          mask-image: radial-gradient(circle, #000 28%, transparent 68%);
  animation: nf-rays 30s linear infinite;
}
.nf-sun-glow {
  position: absolute; inset: -22px; border-radius: 50%;
  background: #FFC857; filter: blur(22px);
  animation: nf-glow 3s ease-in-out infinite alternate;
}
.nf-sun-disc {
  position: absolute; inset: 0; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #FFE79A, #FFC857 60%, #FFA93B);
}

/* ---------- clouds, plane, balloon ---------- */
.nf-cloud {
  position: absolute; left: 0;
  animation: nf-drift linear infinite;
  animation-duration: var(--t); animation-delay: var(--d);
}
.nf-plane-svg {
  position: absolute; left: 0; right: 0; top: 0; width: 100%; height: 55%;
  pointer-events: none;
}
.nf-balloon-wrap { position: absolute; left: 7%; top: 24%; animation: nf-balloon 7s ease-in-out infinite; transform-origin: 50% 0; }

/* ---------- hills ---------- */
.nf-hills { position: absolute; left: 0; right: 0; bottom: 0; height: 30vh; min-height: 170px; overflow: hidden; pointer-events: none; }
.nf-hills svg { position: absolute; bottom: 0; left: 0; }
.nf-hill-back  { width: 108%; height: 100%; animation: nf-sway 9s ease-in-out infinite alternate; }
.nf-hill-mid   { width: 100%; height: 76%; }
.nf-hill-front { width: 100%; height: 48%; }
.nf-pin { position: absolute; bottom: 34%; right: 14%; animation: nf-bob 1.4s ease-in-out infinite alternate; }

/* ---------- content ---------- */
.nf-content {
  position: relative; z-index: 10; min-height: 100vh; max-width: 780px; margin: 0 auto;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 64px 24px 26vh;
}
.nf-title {
  display: flex; align-items: center; justify-content: center; gap: .03em;
  margin: 0; font-size: clamp(7rem, 22vw, 13rem); line-height: .85; font-weight: 800;
  letter-spacing: -0.02em; color: #0B3B3C;
}
.nf-digit-float { display: inline-block; animation: nf-float 2.4s ease-in-out infinite alternate; animation-delay: var(--f); }
.nf-digit {
  display: inline-block; opacity: 0;
  animation: nf-drop .9s cubic-bezier(.2,1.4,.4,1) forwards; animation-delay: var(--d);
  text-shadow: 6px 6px 0 #FF5D73;
}
.nf-compass { display: inline-block; width: .78em; height: .78em; opacity: 0;
  animation: nf-drop .9s cubic-bezier(.2,1.4,.4,1) .15s forwards; }
.nf-compass svg { width: 100%; height: 100%; display: block; filter: drop-shadow(6px 6px 0 #FF5D73); }

.nf-needle { transform-box: fill-box; transform-origin: center; }
.nf-needle--spin { animation: nf-spin 1.8s cubic-bezier(.15,.7,.2,1) .6s both; }
.nf-needle--idle { animation: nf-wobble 1.6s ease-in-out infinite alternate; }

.nf-heading { margin: 32px 0 0; font-size: clamp(1.9rem, 5vw, 2.6rem); font-weight: 800; color: #0B3B3C; }
.nf-text { margin: 12px 0 0; max-width: 460px; font-size: 1.125rem; line-height: 1.6; color: #174F52; }
.nf-rise { opacity: 0; animation: nf-fade .7s ease forwards; animation-delay: var(--d); }

.nf-actions { margin-top: 36px; display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
.nf-btn {
  display: inline-block; border-radius: 999px; padding: 14px 28px; font-weight: 500; font-size: 1rem;
  text-decoration: none; transition: transform .2s ease, box-shadow .2s ease;
}
.nf-btn:hover { transform: translateY(-2px) scale(1.04); }
.nf-btn:focus-visible { outline: 4px solid rgba(11,59,60,.45); outline-offset: 3px; }
.nf-btn--dark { background: #0B3B3C; color: #fff; box-shadow: 0 6px 0 #062324; }
.nf-btn--sun  { background: #FFC857; color: #0B3B3C; box-shadow: 0 6px 0 #D99A1F; }

/* ---------- reduced motion: keep it gentle, stop the big travel ---------- */
@media (prefers-reduced-motion: reduce) {
  .nf-cloud, .nf-hill-back, .nf-sun-rays, .nf-balloon-wrap { animation: none !important; }
  .nf-cloud { display: none; }
  .nf-needle--spin { animation: none !important; }
  .nf-digit-float { animation-duration: 4s; }
}
`;

/* ---------- compass "0" ---------- */

function Compass() {
  const wrapRef = useRef(null);
  const [phase, setPhase] = useState("spin"); // spin -> idle -> track
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    // if the intro spin is skipped (reduced motion), go straight to idle
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPhase("idle");

    const onMove = (e) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      setAngle((Math.atan2(dy, dx) * 180) / Math.PI + 90);
      setPhase((p) => (p === "spin" ? p : "track"));
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const needleClass =
    phase === "spin" ? "nf-needle nf-needle--spin" : phase === "idle" ? "nf-needle nf-needle--idle" : "nf-needle";

  return (
    <span ref={wrapRef} className="nf-compass" role="img" aria-label="0">
      <svg viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="92" fill="#FFFFFF" stroke="#0B3B3C" strokeWidth="12" />
        <circle cx="100" cy="100" r="70" fill="#BFF0E6" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="#0F9D9A" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />

        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="100" y1="16" x2="100" y2={i % 3 === 0 ? 30 : 24}
            stroke="#0B3B3C" strokeWidth={i % 3 === 0 ? 5 : 3} strokeLinecap="round"
            transform={`rotate(${i * 30} 100 100)`}
          />
        ))}

        <g transform="translate(100 100)">
          <g
            className={needleClass}
            style={phase === "track" ? { transform: `rotate(${angle}deg)`, transition: "transform .3s ease-out" } : undefined}
            onAnimationEnd={(e) => {
              if (e.animationName === "nf-spin") setPhase("idle");
            }}
          >
            <polygon points="0,-62 10,0 -10,0" fill="#FF5D73" />
            <polygon points="0,62 10,0 -10,0" fill="#0B3B3C" />
          </g>
        </g>
        <circle cx="100" cy="100" r="9" fill="#FFC857" stroke="#0B3B3C" strokeWidth="4" />
      </svg>
    </span>
  );
}

/* ---------- scenery ---------- */

function Cloud({ top, w, t, d, o = 1 }) {
  return (
    <svg viewBox="0 0 120 50" className="nf-cloud" style={{ top, width: w, opacity: o, "--t": t, "--d": d }} aria-hidden="true">
      <path d="M22 44 C8 44 4 28 18 24 C18 10 38 6 46 18 C54 4 82 8 82 24 C98 20 112 34 100 44 Z" fill="#FFFFFF" />
    </svg>
  );
}

function Balloon() {
  return (
    <div className="nf-balloon-wrap" aria-hidden="true">
      <svg width="84" height="118" viewBox="0 0 80 112">
        <path d="M40 0 C8 0 0 30 12 52 C20 66 30 72 40 72 C50 72 60 66 68 52 C80 30 72 0 40 0Z" fill="#FF5D73" />
        <path d="M40 0 C22 10 22 60 40 72 C58 60 58 10 40 0Z" fill="#FFC857" />
        <path d="M40 0 C32 14 32 58 40 72 C48 58 48 14 40 0Z" fill="#0F9D9A" />
        <line x1="26" y1="68" x2="33" y2="92" stroke="#0B3B3C" strokeWidth="2" />
        <line x1="54" y1="68" x2="47" y2="92" stroke="#0B3B3C" strokeWidth="2" />
        <rect x="31" y="92" width="18" height="14" rx="3" fill="#0B3B3C" />
      </svg>
    </div>
  );
}

function PaperPlane() {
  const path =
    "M-60 320 C150 300, 250 120, 420 160 C540 190, 500 290, 410 240 C330 190, 480 60, 700 90 C900 120, 1050 80, 1260 40";
  return (
    <svg viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" className="nf-plane-svg" aria-hidden="true">
      <path d={path} fill="none" stroke="#FFFFFF" strokeOpacity=".9" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" />
      <g>
        <polygon points="18,0 -16,-11 -8,0 -16,11" fill="#FFFFFF" stroke="#0B3B3C" strokeWidth="2.5" strokeLinejoin="round" />
        <animateMotion path={path} dur="11s" repeatCount="indefinite" rotate="auto" />
      </g>
    </svg>
  );
}

function Hills() {
  return (
    <div className="nf-hills" aria-hidden="true">
      <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className="nf-hill-back">
        <path d="M0 140 C 200 60, 380 180, 620 110 S 1020 40, 1440 130 V260 H0Z" fill="#8EE0B8" />
      </svg>
      <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className="nf-hill-mid">
        <path d="M0 120 C 260 40, 460 190, 760 120 S 1180 60, 1440 140 V260 H0Z" fill="#1FB5A6" />
      </svg>
      <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className="nf-hill-front">
        <path d="M0 90 C 300 20, 600 140, 900 80 S 1300 30, 1440 90 V260 H0Z" fill="#0B3B3C" />
      </svg>

      <div className="nf-pin">
        <svg width="46" height="60" viewBox="0 0 44 58">
          <path d="M22 56 C22 56 4 34 4 22 a18 18 0 0 1 36 0 C40 34 22 56 22 56Z" fill="#FF5D73" />
          <circle cx="22" cy="22" r="12" fill="#FFFFFF" />
          <text x="22" y="29" textAnchor="middle" fontSize="19" fontWeight="800" fill="#FF5D73" className="nf-display">?</text>
        </svg>
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function NotFound() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(mq.matches);
    const on = (e) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  return (
    <main className="nf-page">
      <style>{css}</style>

      {/* sun */}
      <div className="nf-sun" aria-hidden="true">
        <div className="nf-sun-rays" />
        <div className="nf-sun-glow" />
        <div className="nf-sun-disc" />
      </div>

      {/* clouds */}
      <div aria-hidden="true">
        <Cloud top="12%" w="150px" t="40s" d="-10s" />
        <Cloud top="32%" w="110px" t="55s" d="-35s" o={0.85} />
        <Cloud top="50%" w="180px" t="68s" d="-22s" o={0.9} />
      </div>

      {!reduced && <PaperPlane />}
      <Balloon />
      <Hills />

      {/* content */}
      <div className="nf-content">
        <h1 className="nf-title nf-display" aria-label="404 – page not found">
          <span className="nf-digit-float" style={{ "--f": "0s" }} aria-hidden="true">
            <span className="nf-digit" style={{ "--d": "0s" }}>4</span>
          </span>
          <span className="nf-digit-float" style={{ "--f": "0.4s" }}>
            <Compass />
          </span>
          <span className="nf-digit-float" style={{ "--f": "0.8s" }} aria-hidden="true">
            <span className="nf-digit" style={{ "--d": "0.3s" }}>4</span>
          </span>
        </h1>

        <h2 className="nf-heading nf-display nf-rise" style={{ "--d": "1.1s" }}>
          This page took a different route.
        </h2>
        <p className="nf-text nf-rise" style={{ "--d": "1.3s" }}>
          The link may be broken, or the trip has been removed. Head back and pick another way.
        </p>

        <div className="nf-actions nf-rise" style={{ "--d": "1.5s" }}>
          <a href="/" className="nf-btn nf-btn--dark">Back to home</a>
          <a href="/trips" className="nf-btn nf-btn--sun">Browse trips</a>
        </div>
      </div>
    </main>
  );
}