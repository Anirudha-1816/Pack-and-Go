import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import SessionsModal from "../Settings/components/SessionsModal";
import "./SettingsPageModule.css";

const sections = [
  "Profile",
  "Notifications",
  "Availability",
  "Security",
  "Payments",
  "Documents",
  "Danger Zone",
];

// one place for "save" so every section works the same way
const save = (name, data) => {
  console.log(name, data);
  toast.success(name + " saved");
};

// ---------- small reusable pieces ----------

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      className={checked ? "sm-toggle on" : "sm-toggle"}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span />
    </button>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="sm-field">
      {label}
      <input {...props} />
    </label>
  );
}

function Heading({ title, hint }) {
  return (
    <div className="sm-heading">
      <h2>{title}</h2>
      <p>{hint}</p>
    </div>
  );
}

// a line with text on the left and a control (toggle / button) on the right
function Row({ title, hint, children }) {
  return (
    <div className="sm-row">
      <div>
        <strong>{title}</strong>
        {hint && <p>{hint}</p>}
      </div>
      {children}
    </div>
  );
}


// ---------- sections ----------

function Profile() {
  const [form, setForm] = useState({
    name: "Tanuu Shree",
    company: "Null ",
    email: "shreetanu@gmail.com",
    phone: "+91 98765 43210",
    city: "Jaipur",
    bio: "We run small group trips across Rajasthan.",
  });

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div>
      <Heading title="Profile" hint="This is what travellers see on your trips." />
      <div className="sm-avatar-row">
        <div className="sm-avatar">TS</div>
        <button className="sm-btn-outline">Change photo</button>
      </div>
      <div className="sm-grid">
        <Field label="Full name" name="name" value={form.name} onChange={change} />
        <Field label="Company name" name="company" value={form.company} onChange={change} />
        <Field label="Email" name="email" value={form.email} onChange={change} />
        <Field label="Phone" name="phone" value={form.phone} onChange={change} />
        <Field label="City" name="city" value={form.city} onChange={change} />
      </div>
      <label className="sm-field">
        About you
        <textarea name="bio" rows="3" value={form.bio} onChange={change} />
      </label>
      <button className="sm-btn" onClick={() => save("Profile", form)}>Save changes</button>
    </div>
  );
}

function Notifications() {
  const [options, setOptions] = useState({
    newBooking: true,
    cancelled: true,
    payment: true,
    message: true,
    reminder: false,
    offers: false,
  });

  const items = [
    { key: "newBooking", label: "New booking", hint: "When someone books a seat on your trip" },
    { key: "cancelled", label: "Booking cancelled", hint: "When a traveller cancels" },
    { key: "payment", label: "Payment received", hint: "When a payment reaches your account" },
    { key: "message", label: "Traveller messages", hint: "When a traveller sends you a message" },
    { key: "reminder", label: "Trip reminders", hint: "A day before each trip starts" },
    { key: "offers", label: "Tips and offers", hint: "Updates from Pack&Go" },
  ];

  return (
    <div>
      <Heading title="Notifications" hint="Choose what you want to hear about." />
      {items.map((item) => (
        <Row key={item.key} title={item.label} hint={item.hint}>
          <Toggle
            checked={options[item.key]}
            onChange={(value) => setOptions({ ...options, [item.key]: value })}
          />
        </Row>
      ))}
      <button className="sm-btn" onClick={() => save("Notifications", options)}>Save changes</button>
    </div>
  );
}

function Availability() {
  const [available, setAvailable] = useState(true);
  const [days, setDays] = useState([
    { day: "Monday", on: true, from: "09:00", to: "18:00" },
    { day: "Tuesday", on: true, from: "09:00", to: "18:00" },
    { day: "Wednesday", on: true, from: "09:00", to: "18:00" },
    { day: "Thursday", on: true, from: "09:00", to: "18:00" },
    { day: "Friday", on: true, from: "09:00", to: "18:00" },
    { day: "Saturday", on: true, from: "08:00", to: "14:00" },
    { day: "Sunday", on: false, from: "09:00", to: "18:00" },
  ]);

  const updateDay = (index, key, value) => {
    const copy = [...days];
    copy[index] = { ...copy[index], [key]: value };
    setDays(copy);
  };

  return (
    <div>
      <Heading title="Availability" hint="Set the days and hours travellers can reach you." />
      <Row title="Available for new bookings" hint="Turn this off to pause bookings on all your trips.">
        <Toggle checked={available} onChange={setAvailable} />
      </Row>

      {days.map((item, index) => (
        <div className="sm-row" key={item.day}>
          <div className="sm-day-name">
            <Toggle checked={item.on} onChange={(v) => updateDay(index, "on", v)} />
            <strong>{item.day}</strong>
          </div>
          {item.on ? (
            <div className="sm-times">
              <input type="time" value={item.from} onChange={(e) => updateDay(index, "from", e.target.value)} />
              <span>to</span>
              <input type="time" value={item.to} onChange={(e) => updateDay(index, "to", e.target.value)} />
            </div>
          ) : (
            <span className="sm-muted">Unavailable</span>
          )}
        </div>
      ))}
      <button className="sm-btn" onClick={() => save("Availability", { available, days })}>Save changes</button>
    </div>
  );
}

function Security({ sessionCount, onViewSessions }) {
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [twoStep, setTwoStep] = useState(false);

  const change = (e) => setPw({ ...pw, [e.target.name]: e.target.value });

  const updatePassword = () => {
    if (pw.next.length < 8) return toast.error("New password must be at least 8 characters");
    if (pw.next !== pw.confirm) return toast.error("Passwords do not match");
    console.log("Password updated");
    toast.success("Password updated");
    setPw({ current: "", next: "", confirm: "" });
  };

  return (
    <div>
      <Heading title="Security" hint="Keep your operator account safe." />

      <h3>Change password</h3>
      <div className="sm-grid">
        <Field label="Current password" type="password" name="current" value={pw.current} onChange={change} />
        <span />
        <Field label="New password" type="password" name="next" value={pw.next} onChange={change} />
        <Field label="Confirm new password" type="password" name="confirm" value={pw.confirm} onChange={change} />
      </div>
      <button className="sm-btn" onClick={updatePassword}>Update password</button>

      <h3>Two-step login</h3>
      <Row title="Ask for a code at login" hint="We send a one-time code to your email each time you log in.">
        <Toggle checked={twoStep} onChange={setTwoStep} />
      </Row>

      <h3>Where you are logged in</h3>
      <Row
        title="Devices and sessions"
        hint={sessionCount + " active " + (sessionCount === 1 ? "session" : "sessions")}
      >
        <button className="sm-btn-outline" onClick={onViewSessions}>View devices</button>
      </Row>
    </div>
  );
}

function Payments() {
  const [form, setForm] = useState({
    holder: "Tanuu Singh",
    bank: "HDFC Bank",
    account: "",
    ifsc: "",
    upi: "",
    schedule: "weekly",
  });

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div>
      <Heading title="Payments" hint="Where we send the money from your bookings." />
      <div className="sm-grid">
        <Field label="Account holder name" name="holder" value={form.holder} onChange={change} />
        <Field label="Bank name" name="bank" value={form.bank} onChange={change} />
        <Field label="Account number" name="account" value={form.account} onChange={change} />
        <Field label="IFSC code" name="ifsc" value={form.ifsc} onChange={change} />
        <Field label="UPI ID" name="upi" value={form.upi} onChange={change} />
        <label className="sm-field">
          Payout schedule
          <select name="schedule" value={form.schedule} onChange={change}>
            <option value="weekly">Every week</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Every month</option>
          </select>
        </label>
      </div>
      <button className="sm-btn" onClick={() => save("Payment details", form)}>Save changes</button>
    </div>
  );
}

function Documents() {
  const [docs, setDocs] = useState([
    { name: "Government ID", status: "Verified", file: "aadhaar.pdf" },
    { name: "Business licence", status: "Pending", file: "licence.pdf" },
    { name: "GST certificate", status: "Missing", file: "" },
    { name: "Insurance papers", status: "Missing", file: "" },
  ]);

  const upload = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const copy = [...docs];
    copy[index] = { ...copy[index], file: file.name, status: "Pending" };
    setDocs(copy);
    console.log("Uploaded", docs[index].name, file);
    toast.success(docs[index].name + " uploaded");
  };

  const badgeColor = { Verified: "green", Pending: "amber", Missing: "grey" };

  return (
    <div>
      <Heading title="Documents" hint="We check these before your trips go live." />
      {docs.map((doc, index) => (
        <Row key={doc.name} title={doc.name} hint={doc.file || "Nothing uploaded yet"}>
          <div className="sm-doc-actions">
            <span className={"sm-badge " + badgeColor[doc.status]}>{doc.status}</span>
            <label className="sm-btn-outline">
              {doc.file ? "Replace" : "Upload"}
              <input type="file" hidden onChange={(e) => upload(index, e)} />
            </label>
          </div>
        </Row>
      ))}
    </div>
  );
}

function DangerZone() {
  const [confirmText, setConfirmText] = useState("");

  return (
    <div>
      <Heading title="Danger Zone" hint="These actions are serious. Read before you click." />
      <div className="sm-danger-box">
        <Row title="Deactivate account" hint="Hide all your trips and pause bookings. You can come back any time.">
          <button className="sm-btn-danger-outline" onClick={() => console.log("Deactivate account")}>
            Deactivate
          </button>
        </Row>
        <Row title="Delete account" hint="This removes your profile, trips and documents for good. Type DELETE to confirm.">
          <div className="sm-delete-box">
            <input
              placeholder="DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
            <button
              className="sm-btn-danger"
              disabled={confirmText !== "DELETE"}
              onClick={() => console.log("Delete account")}
            >
              Delete account
            </button>
          </div>
        </Row>
      </div>
    </div>
  );
}

// ---------- the pop-up ----------

// sample data, replace with your API later
const SAMPLE_SESSIONS = [
  { id: 1, device: "Windows PC", type: "desktop", browser: "Chrome", place: "Jaipur, India", lastActive: "now", current: true },
  { id: 2, device: "Android Phone", type: "phone", browser: "Chrome", place: "Jaipur, India", lastActive: "15 minutes ago", current: false },
  { id: 3, device: "MacBook", type: "laptop", browser: "Safari", place: "Delhi, India", lastActive: "2 days ago", current: false },
];

export default function SettingsModal({ open, onClose }) {
  const [active, setActive] = useState("Profile");
  const [sessions, setSessions] = useState(SAMPLE_SESSIONS);
  const [sessionsOpen, setSessionsOpen] = useState(false);

  const logoutOne = (id) => {
    console.log("Logout session", id);
    setSessions(sessions.filter((s) => s.id !== id));
    toast.success("Device logged out");
  };

  const logoutOthers = () => {
    console.log("Logout all other sessions");
    setSessions(sessions.filter((s) => s.current));
    toast.success("Logged out of all other devices");
  };

  // close with the Esc key
  // (not while the devices pop-up is open, it closes itself first)
  useEffect(() => {
    if (!open || sessionsOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, sessionsOpen, onClose]);

  if (!open) return null;

 

  return (
    <>
      {/* clicking the dark area closes the pop-up */}
      <div className="sm-overlay" onClick={onClose}>
        {/* stopPropagation so clicking inside does not close it */}
        <div className="sm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <aside className="sm-nav">
            <h1>Settings</h1>
            {sections.map((name) => (
              <button
                key={name}
                className={
                  (active === name ? "sm-nav-item active" : "sm-nav-item") +
                  (name === "Danger Zone" ? " danger" : "")
                }
                onClick={() => setActive(name)}
              >
                {name}
              </button>
            ))}
          </aside>

          <section className="sm-body">
            <button className="sm-close" onClick={onClose} aria-label="Close settings">
              ✕
            </button>
            {active === "Profile" && <Profile />}
            {active === "Notifications" && <Notifications />}
            {active === "Availability" && <Availability />}
            {active === "Security" && (
              <Security
                sessionCount={sessions.length}
                onViewSessions={() => setSessionsOpen(true)}
              />
            )}
            {active === "Payments" && <Payments />}
            {active === "Documents" && <Documents />}
            {active === "Danger Zone" && <DangerZone />}
          </section>

        </div>
      </div>

      {/* second pop-up, opens on top of the settings pop-up */}
      <SessionsModal
        open={sessionsOpen}
        onClose={() => setSessionsOpen(false)}
        sessions={sessions}
        onLogoutOne={logoutOne}
        onLogoutOthers={logoutOthers}
      />
    </>
  );
}