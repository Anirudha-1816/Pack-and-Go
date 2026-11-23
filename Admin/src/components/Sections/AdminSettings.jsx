import { useState } from "react";
import { FaUser, FaBell, FaSlidersH, FaCreditCard, FaUsersCog, FaShieldAlt, FaHistory, FaServer } from "react-icons/fa";

// ---------- Demo data (replace later) ----------

const START = {
  // profile
  name: "Aarav Singh",
  email: "admin@packandgo.com",
  phone: "+91 98765 43210",
  photo: "",
  // notifications
  newBookings: true,
  operatorRequests: true,
  newFeedback: true,
  newEvents: false,
  payments: true,
  emailAlerts: true,
  inAppAlerts: true,
  // platform
  platformName: "Pack&Go",
  logo: "",
  supportEmail: "support@packandgo.com",
  supportPhone: "+91 98765 43210",
  maintenance: false,
  // payments
  serviceFee: "5",
  tax: "5",
  refundDays: "7",
  refundPolicy: "Full refund if the customer cancels inside the free cancellation window.",
  // policies
  userSignup: true,
  operatorSignup: true,
  operatorApproval: true,
  cancellation: "moderate",
  reviews: "flagged",
  suspension: "reports",
};

const SESSIONS = [
  { id: 1, device: "Chrome on Windows", place: "Jaipur", active: "Active now", current: true },
  { id: 2, device: "Safari on iPhone", place: "Jaipur", active: "2 hours ago", current: false },
  { id: 3, device: "Firefox on Ubuntu", place: "Delhi", active: "Yesterday", current: false },
];

const LOGINS = [
  { id: 1, device: "Chrome on Windows", date: "23 Nov 2026, 09:12", status: "Success" },
  { id: 2, device: "Safari on iPhone", date: "23 Nov 2026, 07:40", status: "Success" },
  { id: 3, device: "Unknown browser", date: "21 Nov 2026, 23:05", status: "Failed" },
];

const LOGS = [
  { id: 1, admin: "Aarav Singh", action: "Approved operator", resource: "Himalayan Trails", date: "22 Nov 2026, 18:42", status: "Success" },
  { id: 2, admin: "Priya Nair", action: "Deleted category", resource: "Night Safari", date: "22 Nov 2026, 16:10", status: "Success" },
  { id: 3, admin: "Aarav Singh", action: "Changed service fee", resource: "Payment settings", date: "22 Nov 2026, 11:25", status: "Success" },
  { id: 4, admin: "Rohan Mehta", action: "Rejected event", resource: "Desert Rave 2026", date: "21 Nov 2026, 20:03", status: "Success" },
  { id: 5, admin: "Priya Nair", action: "Failed login", resource: "Admin account", date: "21 Nov 2026, 23:05", status: "Failed" },
  { id: 6, admin: "Aarav Singh", action: "Suspended user", resource: "neha.k@mail.com", date: "21 Nov 2026, 14:48", status: "Success" },
  { id: 7, admin: "Rohan Mehta", action: "Approved refund", resource: "Booking #PG-10482", date: "21 Nov 2026, 10:30", status: "Success" },
  { id: 8, admin: "Aarav Singh", action: "Enabled maintenance", resource: "Platform settings", date: "20 Nov 2026, 02:00", status: "Warning" },
  { id: 9, admin: "Rohan Mehta", action: "Refund failed", resource: "Booking #PG-10377", date: "18 Nov 2026, 21:17", status: "Failed" },
  { id: 10, admin: "Priya Nair", action: "Approved operator", resource: "Blue Wave Tours", date: "18 Nov 2026, 13:34", status: "Success" },
  { id: 11, admin: "Aarav Singh", action: "Added category", resource: "Heritage Walks", date: "17 Nov 2026, 18:20", status: "Success" },
  { id: 12, admin: "Rohan Mehta", action: "Flagged booking", resource: "Booking #PG-10291", date: "17 Nov 2026, 09:50", status: "Warning" },
];

const SYSTEM = [
  { label: "Backend / API", value: "Operational" },
  { label: "Database", value: "Healthy" },
  { label: "App version", value: "v1.0.0" },
  { label: "Environment", value: "Development" },
  { label: "Last backup", value: "22 Nov 2026, 02:00 AM" },
  { label: "System health", value: "Good" },
];

const TABS = [
  { id: "profile", label: "Profile & account", Icon: FaUser },
  { id: "notifications", label: "Notifications", Icon: FaBell },
  { id: "platform", label: "Platform", Icon: FaSlidersH },
  { id: "payments", label: "Payments", Icon: FaCreditCard },
  { id: "policies", label: "Users & operators", Icon: FaUsersCog },
  { id: "security", label: "Security & privacy", Icon: FaShieldAlt },
  { id: "logs", label: "Activity logs", Icon: FaHistory },
  { id: "system", label: "System info", Icon: FaServer },
];

// ---------- Small components ----------

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 disabled:bg-slate-50";

const badgeColor = {
  Success: "bg-emerald-50 text-emerald-700",
  Failed: "bg-red-50 text-red-700",
  Warning: "bg-amber-50 text-amber-700",
  Demo: "bg-amber-50 text-amber-700",
  Grey: "bg-slate-100 text-slate-600",
};

function Badge({ type, children }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${badgeColor[type]}`}>
      {children}
    </span>
  );
}

function Card({ title, text, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {text && <p className="mt-1 text-sm text-slate-500">{text}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Toggle({ title, text, on, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {text && <p className="text-sm text-slate-500">{text}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={title}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-teal-700" : "bg-slate-300"}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}

function ImagePicker({ value, onPick, fallback, round, showToast }) {
  const choose = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("Please choose an image", "error");
    onPick(URL.createObjectURL(file)); // local preview only, no upload
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-20 w-20 items-center justify-center overflow-hidden bg-teal-50 text-2xl font-semibold text-teal-800 ${
          round ? "rounded-full" : "rounded-xl"
        }`}
      >
        {value ? <img src={value} alt="Preview" className="h-full w-full object-cover" /> : fallback}
      </div>

      <div className="flex gap-2">
        <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Upload
          <input type="file" accept="image/*" onChange={choose} className="hidden" />
        </label>
        {value && (
          <button type="button" onClick={() => onPick("")} className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

function ConfirmModal({ title, text, onYes, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">{text}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onYes();
              onClose();
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Yes, continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Page ----------

export default function AdminSettings() {
  const [tab, setTab] = useState("profile");
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null); // { title, text, onYes }

  // form = what you are typing, saved = last saved values
  const [form, setForm] = useState(START);
  const [saved, setSaved] = useState(START);
  const [errors, setErrors] = useState({});
  const changed = JSON.stringify(form) !== JSON.stringify(saved);

  // password (demo)
  const [pass, setPass] = useState({ current: "", next: "", again: "" });
  const [passErrors, setPassErrors] = useState({});

  // security demo
  const [sessions, setSessions] = useState(SESSIONS);
  const [twoFA, setTwoFA] = useState(false);

  // logs filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const set = (name, value) => setForm({ ...form, [name]: value });
  const flip = (name) => set(name, !form[name]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.platformName.trim()) e.platformName = "Platform name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.supportEmail)) e.supportEmail = "Enter a valid email";
    if (form.serviceFee === "" || form.serviceFee < 0 || form.serviceFee > 100) e.serviceFee = "0 to 100";
    if (form.tax === "" || form.tax < 0 || form.tax > 100) e.tax = "0 to 100";
    if (form.refundDays === "" || form.refundDays < 0) e.refundDays = "0 or more";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) return showToast("Please fix the errors first", "error");
    setSaved(form);
    showToast("Settings saved");
  };

  const cancel = () => {
    setForm(saved);
    setErrors({});
  };

  const changePassword = (e) => {
    e.preventDefault();
    const err = {};
    if (!pass.current) err.current = "Required";
    if (pass.next.length < 8) err.next = "At least 8 characters";
    if (pass.next !== pass.again) err.again = "Passwords do not match";
    setPassErrors(err);
    if (Object.keys(err).length > 0) return;

    setPass({ current: "", next: "", again: "" });
    showToast("Demo only, password was not changed");
  };

  const toggleMaintenance = () => {
    if (form.maintenance) return set("maintenance", false);
    setConfirm({
      title: "Turn on maintenance mode?",
      text: "Users will see a maintenance page. You still need to press Save changes.",
      onYes: () => set("maintenance", true),
    });
  };

  // logs
  const PAGE_SIZE = 5;
  const filteredLogs = LOGS.filter(
    (log) =>
      `${log.admin} ${log.action} ${log.resource}`.toLowerCase().includes(search.toLowerCase()) &&
      (status === "All" || log.status === status)
  );
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const logRows = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const showSaveBar = ["profile", "notifications", "platform", "payments", "policies"].includes(tab);
  const initial = form.name.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">Everything on this page uses demo data.</p>

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        {/* Menu */}
        <nav className="flex gap-1 overflow-x-auto md:w-60 md:shrink-0 md:flex-col">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                tab === id ? "bg-teal-50 text-teal-800" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <Icon className="text-sm" /> {label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1 space-y-6">
          {/* A. Profile */}
          {tab === "profile" && (
            <>
              <Card title="Admin profile" text="Your name and contact details.">
                <ImagePicker value={form.photo} onPick={(v) => set("photo", v)} fallback={initial} round showToast={showToast} />

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field label="Name" error={errors.name}>
                    <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Email" error={errors.email}>
                    <input value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Contact number">
                    <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} />
                  </Field>
                </div>
              </Card>

              <Card title="Preview" text="How your details look right now.">
                <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-teal-100 font-semibold text-teal-800">
                    {form.photo ? <img src={form.photo} alt="" className="h-full w-full object-cover" /> : initial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{form.name || "Your name"}</p>
                    <p className="truncate text-sm text-slate-500">{form.email}</p>
                    <p className="truncate text-sm text-slate-500">{form.phone}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                  <p>Account created: <span className="font-medium text-slate-900">15 Jan 2026</span></p>
                  <p>Last login: <span className="font-medium text-slate-900">23 Nov 2026, 09:12 (Jaipur)</span></p>
                </div>
              </Card>

              <Card title="Change password" text="Demo only, nothing is sent anywhere.">
                <form onSubmit={changePassword} className="max-w-md space-y-4">
                  <Field label="Current password" error={passErrors.current}>
                    <input type="password" value={pass.current} onChange={(e) => setPass({ ...pass, current: e.target.value })} className={inputClass} />
                  </Field>
                  <Field label="New password" error={passErrors.next}>
                    <input type="password" value={pass.next} onChange={(e) => setPass({ ...pass, next: e.target.value })} className={inputClass} />
                  </Field>
                  <Field label="Confirm new password" error={passErrors.again}>
                    <input type="password" value={pass.again} onChange={(e) => setPass({ ...pass, again: e.target.value })} className={inputClass} />
                  </Field>
                  <button type="submit" className="rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-900">
                    Update password
                  </button>
                </form>
              </Card>
            </>
          )}

          {/* B. Notifications */}
          {tab === "notifications" && (
            <Card title="Notification preferences">
              <div className="divide-y divide-slate-100">
                <Toggle title="New bookings" on={form.newBookings} onChange={() => flip("newBookings")} />
                <Toggle title="Operator registration requests" on={form.operatorRequests} onChange={() => flip("operatorRequests")} />
                <Toggle title="New feedback" on={form.newFeedback} onChange={() => flip("newFeedback")} />
                <Toggle title="New event submissions" on={form.newEvents} onChange={() => flip("newEvents")} />
                <Toggle title="Payments" on={form.payments} onChange={() => flip("payments")} />
                <Toggle title="Email notifications" on={form.emailAlerts} onChange={() => flip("emailAlerts")} />
                <Toggle title="In-app notifications" on={form.inAppAlerts} onChange={() => flip("inAppAlerts")} />
              </div>
            </Card>
          )}

          {/* C. Platform */}
          {tab === "platform" && (
            <Card title="Platform configuration">
              <ImagePicker value={form.logo} onPick={(v) => set("logo", v)} fallback={form.platformName.charAt(0) || "P"} showToast={showToast} />

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Platform name" error={errors.platformName}>
                  <input value={form.platformName} onChange={(e) => set("platformName", e.target.value)} className={inputClass} />
                </Field>
                <Field label="Default currency">
                  <select disabled className={inputClass}>
                    <option>INR (₹)</option>
                  </select>
                </Field>
                <Field label="Support email" error={errors.supportEmail}>
                  <input value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} className={inputClass} />
                </Field>
                <Field label="Contact phone">
                  <input value={form.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} className={inputClass} />
                </Field>
              </div>

              <div className="mt-4 border-t border-slate-100">
                <Toggle
                  title="Maintenance mode"
                  text="Users will see a maintenance page. Admins can still log in."
                  on={form.maintenance}
                  onChange={toggleMaintenance}
                />
              </div>
            </Card>
          )}

          {/* D. Payments */}
          {tab === "payments" && (
            <>
              <Card title="Payment status" text="Demo UI only. No payment gateway is connected.">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Stripe</p>
                    <div className="mt-2"><Badge type="Demo">Demo only</Badge></div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Payment gateway</p>
                    <div className="mt-2"><Badge type="Grey">Not connected</Badge></div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Currency</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">INR (₹)</p>
                  </div>
                </div>
              </Card>

              <Card title="Fees, tax and refunds">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Service fee (%)" error={errors.serviceFee}>
                    <input type="number" value={form.serviceFee} onChange={(e) => set("serviceFee", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Tax / GST (%)" error={errors.tax}>
                    <input type="number" value={form.tax} onChange={(e) => set("tax", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Refund window (days)" error={errors.refundDays}>
                    <input type="number" value={form.refundDays} onChange={(e) => set("refundDays", e.target.value)} className={inputClass} />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="Refund policy">
                    <textarea rows={4} value={form.refundPolicy} onChange={(e) => set("refundPolicy", e.target.value)} className={inputClass} />
                  </Field>
                </div>
              </Card>
            </>
          )}

          {/* E. Policies */}
          {tab === "policies" && (
            <>
              <Card title="Registration and approval">
                <div className="divide-y divide-slate-100">
                  <Toggle title="User registration" text="Allow new users to sign up." on={form.userSignup} onChange={() => flip("userSignup")} />
                  <Toggle title="Operator registration" text="Allow new operators to sign up." on={form.operatorSignup} onChange={() => flip("operatorSignup")} />
                  <Toggle title="Operator approval required" text="Admin must approve new operators." on={form.operatorApproval} onChange={() => flip("operatorApproval")} />
                </div>
              </Card>

              <Card title="Platform policies">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Booking cancellation">
                    <select value={form.cancellation} onChange={(e) => set("cancellation", e.target.value)} className={inputClass}>
                      <option value="flexible">Flexible (full refund 7 days before)</option>
                      <option value="moderate">Moderate (full refund 14 days before)</option>
                      <option value="strict">Strict (50% refund 30 days before)</option>
                    </select>
                  </Field>
                  <Field label="Review moderation">
                    <select value={form.reviews} onChange={(e) => set("reviews", e.target.value)} className={inputClass}>
                      <option value="auto">Publish immediately</option>
                      <option value="flagged">Hold flagged reviews</option>
                      <option value="all">Approve every review</option>
                    </select>
                  </Field>
                  <Field label="Account suspension">
                    <select value={form.suspension} onChange={(e) => set("suspension", e.target.value)} className={inputClass}>
                      <option value="manual">Manual only</option>
                      <option value="reports">After 3 valid reports</option>
                      <option value="strict">After 1 serious report</option>
                    </select>
                  </Field>
                </div>
              </Card>
            </>
          )}

          {/* Save / Cancel (only for the tabs that edit settings) */}
          {showSaveBar && (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={!changed}
                onClick={cancel}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!changed}
                onClick={save}
                className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
              >
                Save changes
              </button>
            </div>
          )}

          {/* F. Security */}
          {tab === "security" && (
            <>
              <Card title="Two-factor authentication" text="Visual demo only. It does not protect your account.">
                <Toggle
                  title={twoFA ? "Enabled (demo)" : "Not enabled"}
                  on={twoFA}
                  onChange={() => {
                    setTwoFA(!twoFA);
                    showToast(twoFA ? "2FA off (demo)" : "2FA on (demo)");
                  }}
                />
              </Card>

              <Card title="Active sessions" text="Sample sessions.">
                <ul className="divide-y divide-slate-100">
                  {sessions.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{s.device}</p>
                        <p className="text-sm text-slate-500">{s.place} · {s.active}</p>
                      </div>
                      {s.current && <Badge type="Success">This device</Badge>}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={sessions.length === 1}
                  onClick={() =>
                    setConfirm({
                      title: "Log out from all other devices?",
                      text: "Demo only, nothing is sent to a server.",
                      onYes: () => {
                        setSessions(sessions.filter((s) => s.current));
                        showToast("Other devices logged out (demo)");
                      },
                    })
                  }
                  className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Log out from all other devices
                </button>
              </Card>

              <Card title="Recent login activity" text="Sample data.">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="text-xs uppercase text-slate-400">
                      <tr>
                        <th className="pb-3 font-medium">Device</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {LOGINS.map((l) => (
                        <tr key={l.id}>
                          <td className="py-3 font-medium text-slate-900">{l.device}</td>
                          <td className="py-3 text-slate-500">{l.date}</td>
                          <td className="py-3"><Badge type={l.status}>{l.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* G. Activity logs */}
          {tab === "logs" && (
            <Card title="Activity logs" text="Sample entries of what admins did.">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search admin, action or resource"
                  className={`${inputClass} !mt-0`}
                />
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className={`${inputClass} !mt-0`}
                >
                  <option value="All">All statuses</option>
                  <option value="Success">Success</option>
                  <option value="Failed">Failed</option>
                  <option value="Warning">Warning</option>
                </select>
              </div>

              {logRows.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">No activity found.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="text-xs uppercase text-slate-400">
                      <tr>
                        <th className="pb-3 font-medium">Admin</th>
                        <th className="pb-3 font-medium">Action</th>
                        <th className="pb-3 font-medium">Resource</th>
                        <th className="pb-3 font-medium">Date and time</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logRows.map((log) => (
                        <tr key={log.id}>
                          <td className="py-3 font-medium text-slate-900">{log.admin}</td>
                          <td className="py-3 text-slate-700">{log.action}</td>
                          <td className="py-3 text-slate-500">{log.resource}</td>
                          <td className="whitespace-nowrap py-3 text-slate-500">{log.date}</td>
                          <td className="py-3"><Badge type={log.status}>{log.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                <p className="text-slate-500">{filteredLogs.length} entries</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-slate-500">Page {page} of {totalPages}</span>
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* H. System info */}
          {tab === "system" && (
            <Card title="System information">
              <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                These are demo values. This is not live system monitoring.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {SYSTEM.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="mt-2 font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Confirm popup */}
      {confirm && <ConfirmModal {...confirm} onClose={() => setConfirm(null)} />}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[110] rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === "success" ? "bg-teal-800" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}