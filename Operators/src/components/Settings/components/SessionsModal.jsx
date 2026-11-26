import { useEffect } from "react";
import { FaDesktop, FaMobileAlt, FaLaptop, FaTimes } from "react-icons/fa";

// which icon to show for which device type
const ICONS = {
  desktop: FaDesktop,
  phone: FaMobileAlt,
  laptop: FaLaptop,
};

// A session looks like this:
// { id, device, type: "desktop" | "phone" | "laptop", browser, place, lastActive, current }
export default function SessionsModal({
  open,
  onClose,
  sessions = [],
  onLogoutOne,
  onLogoutOthers,
}) {
  // close with the Esc key
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const otherCount = sessions.filter((s) => !s.current).length;

  return (
    // z-[1100] keeps this above the settings pop-up (which is z-index 1000)
    // clicking the dark area closes this pop-up only
    <div
      className="fixed inset-0 z-[1100] grid place-items-center bg-[#10272a]/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* stopPropagation so clicking inside does not close it */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Where you are logged in"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-3xl bg-white p-6 text-[#10272a] shadow-2xl"
      >
        {/* ---------- header ---------- */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Where you&apos;re logged in</h2>

          <div className="flex items-center gap-3">
            <span className="whitespace-nowrap rounded-full bg-[#e3eeea] px-3 py-1 text-sm font-semibold text-[#0f5c58]">
              {sessions.length} Active {sessions.length === 1 ? "session" : "sessions"}
            </span>

            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 place-items-center rounded-full bg-[#f4f6f4] text-sm hover:bg-[#e3eeea]"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* ---------- list of devices ---------- */}
        <ul className="mt-4 overflow-y-auto">
          {sessions.map((s) => {
            const Icon = ICONS[s.type] || FaDesktop;

            return (
              <li
                key={s.id}
                className="flex items-center gap-4 border-b border-[#e2e8e5] py-4 last:border-b-0"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e3eeea] text-[#0f5c58]">
                  <Icon />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{s.device}</p>
                  <p className="text-sm text-[#5f7270]">
                    {s.browser} · {s.place}
                  </p>

                  {s.current ? (
                    <span className="mt-1 inline-block rounded-full bg-[#e3eeea] px-2.5 py-0.5 text-xs font-semibold text-[#0f5c58]">
                      This device
                    </span>
                  ) : (
                    <p className="text-sm text-[#5f7270]">Last active {s.lastActive}</p>
                  )}
                </div>

                {/* you cannot log out the device you are using right now */}
                {!s.current && (
                  <button
                    onClick={() => onLogoutOne(s.id)}
                    className="rounded-full border border-[#d93a4a] px-5 py-2 text-sm font-semibold text-[#d93a4a] hover:bg-[#fdeaec]"
                  >
                    Logout
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {/* ---------- log out everywhere else ---------- */}
        <button
          onClick={onLogoutOthers}
          disabled={otherCount === 0}
          className="mt-4 w-full rounded-full border border-[#d93a4a] py-3 font-semibold text-[#d93a4a] hover:bg-[#fdeaec] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Log out of all other devices
        </button>

     
      </div>
    </div>
  );
}