import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../Stores/authStore";
import { useEffect ,useState} from "react";

const defaultMessages = [
  "Checking your details…",
  "Securing your session…",
  "Getting your trips ready…",
];

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=DM+Sans:wght@400;500&display=swap');

.al-page {
  position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 24px; text-align: center; overflow: hidden; color: #0B3B3C;
  font-family: 'DM Sans', system-ui, sans-serif;
  background:
    radial-gradient(520px 520px at 50% 38%, #CDF1EC 0%, rgba(205,241,236,0) 70%),
    linear-gradient(180deg, #F3FBFA 0%, #FFFFFF 100%);
}
.al-page * { box-sizing: border-box; }
.al-display { font-family: 'Bricolage Grotesque', system-ui, sans-serif; }

@keyframes al-spin    { to { transform: rotate(360deg); } }
@keyframes al-spin-r  { to { transform: rotate(-360deg); } }
@keyframes al-float   { from { transform: translateY(0); } to { transform: translateY(-7px); } }
@keyframes al-fade    { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes al-dot     { 0%,80%,100% { transform: translateY(0); opacity: .35; } 40% { transform: translateY(-7px); opacity: 1; } }
@keyframes al-draw    { from { stroke-dashoffset: 553; } to { stroke-dashoffset: 0; } }
@keyframes al-pop     { 0% { transform: scale(0); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }
@keyframes al-burst   { 0% { transform: scale(.7); opacity: .6; } 100% { transform: scale(1.7); opacity: 0; } }
@keyframes al-sweep   { from { transform: translateX(-100%); } to { transform: translateX(260%); } }

.al-stage { position: relative; width: 200px; height: 200px; }
.al-ring { position: absolute; inset: 0; width: 100%; height: 100%; }
.al-spin   { transform-origin: 100px 100px; animation: al-spin 1.3s linear infinite; }
.al-orbit  { transform-origin: 100px 100px; animation: al-spin-r 2.6s linear infinite; }
.al-full   { stroke-dasharray: 553; animation: al-draw .7s cubic-bezier(.65,0,.35,1) forwards; }
.al-burst  { transform-origin: 100px 100px; animation: al-burst .8s ease-out .6s both; }

.al-logo { position: absolute; inset: 0; display: grid; place-items: center; }
.al-logo > div { animation: al-float 1.8s ease-in-out infinite alternate; filter: drop-shadow(0 14px 18px rgba(11,127,125,.35)); }

.al-check {
  position: absolute; right: 22px; bottom: 22px; width: 44px; height: 44px; border-radius: 50%;
  background: #0F9D9A; color: #fff; display: grid; place-items: center; border: 4px solid #fff;
  animation: al-pop .5s cubic-bezier(.2,.9,.3,1.3) .5s both;
}

.al-title { margin: 30px 0 0; font-size: clamp(1.7rem, 5vw, 2.2rem); font-weight: 800; letter-spacing: -.01em; }
.al-status { margin: 10px 0 0; min-height: 1.6em; font-size: 1.05rem; color: #3D6B6A; }
.al-status span { display: inline-block; animation: al-fade .45s ease both; }

.al-dots { display: flex; gap: 7px; justify-content: center; margin-top: 22px; height: 16px; }
.al-dots i { width: 9px; height: 9px; border-radius: 50%; background: #0F9D9A; animation: al-dot 1.1s infinite; }
.al-dots i:nth-child(2) { animation-delay: .15s; background: #FFC857; }
.al-dots i:nth-child(3) { animation-delay: .3s; background: #FF5D73; }

.al-bar { position: relative; width: 180px; height: 5px; margin: 26px auto 0; border-radius: 999px; background: #D6ECE9; overflow: hidden; }
.al-bar::after { content: ""; position: absolute; top: 0; left: 0; height: 100%; width: 40%; border-radius: 999px;
  background: linear-gradient(90deg, #0F9D9A, #FFC857); animation: al-sweep 1.4s ease-in-out infinite; }

.al-secure { position: absolute; bottom: 26px; left: 0; right: 0; display: flex; align-items: center; justify-content: center; gap: 7px;
  font-size: .85rem; color: #6C9190; }


 @keyframes al-key { from { transform: scale(1); opacity: 1; } to { transform: scale(1.18); opacity: .75; } }
.al-shackle { transition: transform .55s cubic-bezier(.3,1.4,.5,1) .35s; }
.al-shackle.is-open { transform: translateY(-16px) rotate(-16deg); }
.al-keyglow { transform-box: fill-box; transform-origin: center; animation: al-key 1.1s ease-in-out infinite alternate; }

@media (prefers-reduced-motion: reduce) {
  .al-keyglow { animation: none !important; }
  .al-spin, .al-orbit, .al-logo > div, .al-bar::after { animation: none !important; }
  .al-bar::after { width: 100%; }
}
`;

function LockMark({ open = false, size = 104 }) {
  return (
    <svg viewBox="0 0 256 256" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="al-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1CBDB6" />
          <stop offset="1" stopColor="#0A7F7F" />
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="58" fill="url(#al-bg)" />

      {/* shackle: lifts and swings open when sign-in is done */}
      <g className={`al-shackle ${open ? "is-open" : ""}`} style={{ transformOrigin: "164px 116px" }}>
        <path d="M92 116 V90 a36 36 0 0 1 72 0 V116" fill="none" stroke="#fff" strokeWidth="16" strokeLinecap="round" />
      </g>

      {/* lock body */}
      <rect x="60" y="112" width="136" height="106" rx="28" fill="#fff" />
      <path d="M60 170 H196 V190 a28 28 0 0 1 -28 28 H88 a28 28 0 0 1 -28 -28 Z" fill="#D3F1ED" />

      {/* keyhole */}
      <circle className="al-keyglow" cx="128" cy="158" r="22" fill="#FFC857" />
      <circle cx="128" cy="153" r="9" fill="#0B3B3C" />
      <rect x="123" y="157" width="10" height="22" rx="5" fill="#0B3B3C" />
    </svg>
  );
}

function AuthLoading({
  title = "Signing you in",
  messages = defaultMessages,
  done = false,
  name = "",
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (done || messages.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 1800);
    return () => clearInterval(t);
  }, [done, messages.length]);

  return (
    <div className="al-page" role="status" aria-live="polite">
      <style>{css}</style>

      <div className="al-stage">
        <svg className="al-ring" viewBox="0 0 200 200" aria-hidden="true">
          {/* track */}
          <circle cx="100" cy="100" r="88" fill="none" stroke="#CFE9E6" strokeWidth="8" />

          {done ? (
            <>
              <circle
                className="al-full"
                cx="100" cy="100" r="88" fill="none" stroke="#0F9D9A" strokeWidth="8"
                strokeLinecap="round" transform="rotate(-90 100 100)"
              />
              <circle className="al-burst" cx="100" cy="100" r="88" fill="none" stroke="#0F9D9A" strokeWidth="3" />
            </>
          ) : (
            <>
              <g className="al-spin">
                <circle
                  cx="100" cy="100" r="88" fill="none" stroke="#0F9D9A" strokeWidth="8"
                  strokeLinecap="round" strokeDasharray="150 403" transform="rotate(-90 100 100)"
                />
              </g>
              <g className="al-orbit">
                <circle cx="100" cy="12" r="7" fill="#FFC857" stroke="#0B3B3C" strokeWidth="2.5" />
              </g>
            </>
          )}
        </svg>

        <div className="al-logo"><div><LockMark open={done} /></div></div>

        {done && (
          <div className="al-check" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5 9-10" />
            </svg>
          </div>
        )}
      </div>

      <h1 className="al-title al-display">
        {done ? (name ? `Welcome back, ${name}` : "Welcome back") : title}
      </h1>

      <p className="al-status">
        <span key={done ? "done" : i}>{done ? "You're signed in. Taking you to your trips…" : messages[i]}</span>
      </p>

      {done ? (
        <div style={{ height: 41 }} />
      ) : (
        <>
          <div className="al-dots" aria-hidden="true"><i /><i /><i /></div>
          <div className="al-bar" aria-hidden="true" />
        </>
      )}

      <div className="al-secure">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="9" rx="2.5" />
          <path d="M8 11V8a4 4 0 018 0v3" />
        </svg>
        Your connection is secure
      </div>
    </div>
  );
}


export default function OperatorProtectedRoute({ children }) {
  const {
    user,
    isAuthenticated,
    isLoading,
    fetchUser,
  } = useAuthStore();

  const location = useLocation();

  // Check authentication when needed
  useEffect(() => {
    if (isLoading && !isAuthenticated) {
      fetchUser();
    }
  }, [isLoading, isAuthenticated, fetchUser]);

  // Wait until authentication check completes
  if (isLoading) {
    return <AuthLoading />;
  }

  // Not logged in
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/operator/register"
        state={{ from: location }}
        replace
      />
    );
  }
 
  return children;                                              
 }