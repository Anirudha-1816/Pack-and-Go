import { useEffect, useMemo, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import {
  FaBell,
  FaCreditCard,
  FaHistory,
  FaServer,
  FaShieldAlt,
  FaSlidersH,
  FaUser,
  FaUsersCog,
} from "react-icons/fa";
import {
  getCurrentUser,
  updatePassword,
  getPolicies,
  updatePolicies,
  getActivityLogs,
} from "../x/adminSettingsApi";

const STORAGE_KEY = "packgo-admin-settings-demo-v1";
const PAGE_SIZE = 8;
const LOGS_PAGE_SIZE = 10;

const DEFAULT_SETTINGS = {
  profile: {
    name: "Pack&Go Admin",
    email: "admin@packandgo.com",
    phone: "+91 98765 43210",
    photo: "",
  },
  notifications: {
    newBookings: true,
    operatorRequests: true,
    newFeedback: true,
    newEvents: false,
    payments: true,
    emailAlerts: true,
    inAppAlerts: true,
  },
  platform: {
    name: "Pack&Go",
    logo: "",
    supportEmail: "support@packandgo.com",
    supportPhone: "+91 98765 43210",
    currency: "INR",
    maintenance: false,
  },
  payments: {
    serviceFee: "5",
    tax: "5",
    refundDays: "7",
    refundPolicy:
      "Full refund if the customer cancels within the free cancellation window.",
  },
  policies: {
    userSignup: true,
    operatorSignup: true,
    operatorApproval: true,
    cancellation: "moderate",
    reviews: "flagged",
    suspension: "reports",
  },
};

const DEMO_SESSIONS = [
  { id: 1, device: "Chrome on Windows", location: "Jaipur", lastActive: "Active now", current: true },
  { id: 2, device: "Safari on iPhone", location: "Jaipur", lastActive: "2 hours ago", current: false },
  { id: 3, device: "Firefox on Ubuntu", location: "Delhi", lastActive: "Yesterday", current: false },
];

const DEMO_LOGINS = [
  { id: 1, device: "Chrome on Windows", date: "23 Nov 2026, 09:12", status: "Success" },
  { id: 2, device: "Safari on iPhone", date: "23 Nov 2026, 07:40", status: "Success" },
  { id: 3, device: "Unknown browser", date: "21 Nov 2026, 23:05", status: "Failed" },
  { id: 4, device: "Chrome on Windows", date: "20 Nov 2026, 18:30", status: "Success" },
];

const DEMO_LOGS = [
  { id: 1, admin: "Pack&Go Admin", action: "Approved operator", resource: "Operator: Rahul Sharma", date: "23 Nov 2026, 10:30", status: "Success" },
  { id: 2, admin: "Pack&Go Admin", action: "Updated trip", resource: "Trip: Jaipur Weekend Escape", date: "23 Nov 2026, 09:45", status: "Success" },
  { id: 3, admin: "Pack&Go Admin", action: "Rejected feedback", resource: "Review #FB-1042", date: "22 Nov 2026, 16:20", status: "Warning" },
  { id: 4, admin: "Pack&Go Admin", action: "Cancelled booking", resource: "Booking #BK-2091", date: "22 Nov 2026, 14:05", status: "Success" },
  { id: 5, admin: "Pack&Go Admin", action: "Failed login attempt", resource: "Admin account", date: "21 Nov 2026, 23:05", status: "Failed" },
  { id: 6, admin: "Pack&Go Admin", action: "Created event", resource: "Event: Desert Music Night", date: "21 Nov 2026, 12:10", status: "Success" },
  { id: 7, admin: "Pack&Go Admin", action: "Changed platform policy", resource: "Review moderation", date: "20 Nov 2026, 11:40", status: "Warning" },
  { id: 8, admin: "Pack&Go Admin", action: "Updated trip", resource: "Trip: Udaipur City Tour", date: "19 Nov 2026, 17:25", status: "Success" },
  { id: 9, admin: "Pack&Go Admin", action: "Approved operator", resource: "Operator: Neha Verma", date: "18 Nov 2026, 13:15", status: "Success" },
  { id: 10, admin: "Pack&Go Admin", action: "Deleted event", resource: "Event: Sample Event", date: "17 Nov 2026, 10:00", status: "Warning" },
];

// Which sections have backend endpoints
const CONNECTED_SECTIONS = ["policies", "logs"];
const PARTIAL_SECTIONS = ["profile"]; // fetch only
const DEMO_SECTIONS = ["notifications", "platform", "payments", "security", "system"];

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

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15";
const buttonPrimary =
  "rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50";
const buttonSecondary =
  "rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

function readInitialSettings() {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored);
    return {
      profile: { ...DEFAULT_SETTINGS.profile, ...parsed.profile },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
      platform: { ...DEFAULT_SETTINGS.platform, ...parsed.platform },
      payments: { ...DEFAULT_SETTINGS.payments, ...parsed.payments },
      policies: { ...DEFAULT_SETTINGS.policies, ...parsed.policies },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function Card({ title, description, children, action }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, error, hint, children }) {
  return (
    <div className="min-w-0">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Badge({ children, tone = "neutral" }) {
  const tones = {
    success: "bg-emerald-50 text-emerald-700",
    danger: "bg-red-50 text-red-700",
    warning: "bg-amber-50 text-amber-700",
    neutral: "bg-slate-100 text-slate-600",
    info: "bg-sky-50 text-sky-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone] || tones.neutral}`}>{children}</span>;
}

function DemoNotice({ children = "Demo preview — changes are saved only in this browser." }) {
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {children}
    </div>
  );
}

function Toggle({ title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-teal-700" : "bg-slate-300"}`}
      >
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function ImagePicker({ value, onChange, fallback, rounded = false, onError }) {
  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError("Please select a valid image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onError("Please select an image smaller than 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ""));
    reader.onerror = () => onError("Could not read the selected image.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden bg-teal-50 text-2xl font-semibold text-teal-800 ${rounded ? "rounded-full" : "rounded-xl"}`}>
        {value ? <img src={value} alt="Selected preview" className="h-full w-full object-cover" /> : fallback}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Choose image
          <input type="file" accept="image/*" onChange={handleFile} className="sr-only" />
        </label>
        {value && (
          <button type="button" onClick={() => onChange("")} className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
            Remove
          </button>
        )}
      </div>
      <p className="w-full text-xs text-slate-500">Image preview only. Maximum file size: 2 MB.</p>
    </div>
  );
}

function ConfirmModal({ title, description, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="confirm-title" className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button type="button" onClick={onConfirm} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700">Continue</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState(readInitialSettings);
  const [savedSettings, setSavedSettings] = useState(readInitialSettings);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [errors, setErrors] = useState({});
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessions, setSessions] = useState(DEMO_SESSIONS);
  const [logSearch, setLogSearch] = useState("");
  const [logStatus, setLogStatus] = useState("All");
  const [logPage, setLogPage] = useState(1);

  // Profile loading
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  // Policies loading
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [policiesError, setPoliciesError] = useState(null);
  const [policiesSaving, setPoliciesSaving] = useState(false);

  // Activity logs
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);
  const activeTabLabel = TABS.find((item) => item.id === activeTab)?.label || "Settings";

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Load profile on mount
  useEffect(() => {
    let mounted = true;
    setProfileLoading(true);
    getCurrentUser()
      .then((res) => {
        if (!mounted) return;
        if (res.success && res.data) {
          const user = res.data;
          setSettings((s) => ({
            ...s,
            profile: {
              ...s.profile,
              name: user.fullName || user.name || "",
              email: user.email || "",
            },
          }));
          setSavedSettings((s) => ({
            ...s,
            profile: {
              ...s.profile,
              name: user.fullName || user.name || "",
              email: user.email || "",
            },
          }));
        }
        setProfileError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setProfileError(err.response?.data?.message || "Failed to load profile");
      })
      .finally(() => {
        if (mounted) setProfileLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // Load policies on mount
  useEffect(() => {
    let mounted = true;
    setPoliciesLoading(true);
    getPolicies()
      .then((res) => {
        if (!mounted) return;
        if (res.success && res.data) {
          const p = res.data;
          setSettings((s) => ({
            ...s,
            policies: {
              ...s.policies,
              userSignup: p.userSignup ?? true,
              operatorSignup: p.operatorSignup ?? true,
              operatorApproval: p.operatorApproval ?? true,
              cancellation: p.cancellation ?? "moderate",
              reviews: p.reviews ?? "flagged",
              suspension: p.suspension ?? "reports",
            },
          }));
          setSavedSettings((s) => ({
            ...s,
            policies: {
              ...s.policies,
              userSignup: p.userSignup ?? true,
              operatorSignup: p.operatorSignup ?? true,
              operatorApproval: p.operatorApproval ?? true,
              cancellation: p.cancellation ?? "moderate",
              reviews: p.reviews ?? "flagged",
              suspension: p.suspension ?? "reports",
            },
          }));
        }
        setPoliciesError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setPoliciesError(err.response?.data?.message || "Failed to load policies");
      })
      .finally(() => {
        if (mounted) setPoliciesLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // Load activity logs when tab changes to logs or filters change
  useEffect(() => {
    if (activeTab !== "logs") return;
    let mounted = true;
    setLogsLoading(true);
    getActivityLogs({ search: logSearch, status: logStatus, page: logPage, limit: LOGS_PAGE_SIZE })
      .then((res) => {
        if (!mounted) return;
        if (res.success) {
          setLogs(res.data || []);
          setLogsTotal(res.total || 0);
          setLogsTotalPages(res.totalPages || 1);
        }
        setLogsError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setLogsError(err.response?.data?.message || "Failed to load activity logs");
      })
      .finally(() => {
        if (mounted) setLogsLoading(false);
      });
    return () => { mounted = false; };
  }, [activeTab, logSearch, logStatus, logPage]);

  const notify = (message, type = "success") => setToast({ message, type });

  const updateSection = (section, key, value) => {
    setSettings((current) => ({
      ...current,
      [section]: { ...current[section], [key]: value },
    }));
  };

  const saveSettings = (section) => {
    // Policies - save to backend
    if (section === "policies") {
      const policyData = {
        userSignup: settings.policies.userSignup,
        operatorSignup: settings.policies.operatorSignup,
        operatorApproval: settings.policies.operatorApproval,
        cancellation: settings.policies.cancellation,
        reviews: settings.policies.reviews,
        suspension: settings.policies.suspension,
      };
      setPoliciesSaving(true);
      updatePolicies(policyData)
        .then((res) => {
          setSavedSettings((s) => ({ ...s, policies: policyData }));
          notify(res.message || "Policies updated successfully", "success");
        })
        .catch((err) => {
          notify(err.response?.data?.message || "Failed to update policies", "error");
        })
        .finally(() => {
          setPoliciesSaving(false);
        });
      return;
    }

    // Demo sections - save to localStorage
    if (section === "profile") {
      const nextErrors = {};
      if (!settings.profile.name.trim()) nextErrors.name = "Name is required.";
      if (!/^\S+@\S+\.\S+$/.test(settings.profile.email)) nextErrors.email = "Enter a valid email address.";
      if (settings.profile.phone && !/^[+\d\s()-]{7,20}$/.test(settings.profile.phone)) nextErrors.phone = "Enter a valid phone number.";
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
    }

    if (section === "platform") {
      const nextErrors = {};
      if (!settings.platform.name.trim()) nextErrors.platformName = "Platform name is required.";
      if (!/^\S+@\S+\.\S+$/.test(settings.platform.supportEmail)) nextErrors.supportEmail = "Enter a valid support email.";
      if (settings.platform.supportPhone && !/^[+\d\s()-]{7,20}$/.test(settings.platform.supportPhone)) nextErrors.supportPhone = "Enter a valid phone number.";
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
    }

    if (section === "payments") {
      const nextErrors = {};
      const serviceFee = Number(settings.payments.serviceFee);
      const tax = Number(settings.payments.tax);
      const refundDays = Number(settings.payments.refundDays);
      if (settings.payments.serviceFee === "" || !Number.isFinite(serviceFee) || serviceFee < 0 || serviceFee > 100) nextErrors.serviceFee = "Enter a value between 0 and 100.";
      if (settings.payments.tax === "" || !Number.isFinite(tax) || tax < 0 || tax > 100) nextErrors.tax = "Enter a value between 0 and 100.";
      if (settings.payments.refundDays === "" || !Number.isInteger(refundDays) || refundDays < 0 || refundDays > 365) nextErrors.refundDays = "Enter a whole number from 0 to 365.";
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
    }

    setSavedSettings(settings);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      notify("Changes applied for this session, but browser storage is unavailable.", "info");
      setErrors({});
      return;
    }
    setErrors({});
    notify(`${activeTabLabel} saved in this browser.`);
  };

  const cancelChanges = () => {
    setSettings(savedSettings);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSettings));
    } catch {
      // Keep the restored values in React state for this session.
    }
    setErrors({});
    notify("Unsaved changes discarded.", "info");
  };

  const changePassword = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!password.current) nextErrors.current = "Enter your current password.";
    if (password.next.length < 8) nextErrors.next = "Use at least 8 characters.";
    if (password.next !== password.confirm) nextErrors.confirm = "Passwords do not match.";
    if (password.current && password.current === password.next) nextErrors.next = "Choose a password different from the current one.";
    setPasswordErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setPasswordLoading(true);
    updatePassword({ currentPassword: password.current, newPassword: password.next, confirmPassword: password.confirm })
      .then((res) => {
        setPassword({ current: "", next: "", confirm: "" });
        setPasswordErrors({});
        notify(res.message || "Password updated successfully", "success");
      })
      .catch((err) => {
        notify(err.response?.data?.message || "Failed to update password", "error");
      })
      .finally(() => {
        setPasswordLoading(false);
      });
  };

  const filteredLogs = useMemo(() => {
    const query = logSearch.trim().toLowerCase();
    return DEMO_LOGS.filter((log) => {
      const matchesStatus = logStatus === "All" || log.status === logStatus;
      const matchesSearch = !query || [log.admin, log.action, log.resource, log.date].some((value) => value.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [logSearch, logStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const visibleLogs = filteredLogs.slice((logPage - 1) * PAGE_SIZE, logPage * PAGE_SIZE);

  useEffect(() => {
    if (logPage > totalPages) setLogPage(totalPages);
  }, [logPage, totalPages]);

  // Use backend logs when connected, demo logs otherwise
  const useBackendLogs = CONNECTED_SECTIONS.includes("logs");
  const currentLogs = useBackendLogs ? logs : visibleLogs;
  const currentTotalPages = useBackendLogs ? logsTotalPages : totalPages;
  const currentTotal = useBackendLogs ? logsTotal : filteredLogs.length;

  const handleMaintenanceToggle = (checked) => {
    if (checked) {
      setConfirm({
        title: "Enable maintenance mode?",
        description: "This is a visual demo only. It will not place the live Pack&Go website into maintenance mode.",
        onConfirm: () => {
          updateSection("platform", "maintenance", true);
          setConfirm(null);
          notify("Maintenance mode enabled in the demo settings.", "info");
        },
      });
    } else {
      updateSection("platform", "maintenance", false);
    }
  };

  const renderSaveActions = (section) => (
    <div className="flex flex-wrap justify-end gap-3">
      <button type="button" onClick={cancelChanges} disabled={!isDirty} className={buttonSecondary}>Discard changes</button>
      <button type="button" onClick={() => saveSettings(section)} disabled={!isDirty} className={buttonPrimary}>Save changes</button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your Pack&Go admin preferences and platform configuration.</p>
        </div>
        <Badge tone="warning">Frontend demo</Badge>
      </div>

      <DemoNotice>
        Profile (fetch), Change password, Policies, and Activity logs are connected to the backend.
        Other sections use local demo data only.
      </DemoNotice>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto pb-1 lg:w-64 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${activeTab === id ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
            >
              <Icon className="shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <main className="min-w-0 flex-1 space-y-6">
          {activeTab === "profile" && (
            <>
              <Card title="Admin profile" description="Update the profile details shown in this demo.">
                {profileLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <FaSpinner className="animate-spin text-2xl text-teal-700" />
                    <span className="ml-2 text-sm text-slate-500">Loading profile...</span>
                  </div>
                ) : profileError ? (
                  <p className="text-sm text-red-600">{profileError}</p>
                ) : (
                  <>
                    <p className="text-sm text-teal-700 font-medium mb-4">Name and email loaded from backend. Phone and photo are local demo values.</p>
                    <ImagePicker value={settings.profile.photo} onChange={(value) => updateSection("profile", "photo", value)} fallback={(settings.profile.name.trim()[0] || "A").toUpperCase()} rounded onError={(message) => notify(message, "error")} />
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <Field label="Full name" error={errors.name}>
                        <input className={inputClass} value={settings.profile.name} onChange={(e) => updateSection("profile", "name", e.target.value)} placeholder="Enter admin name" disabled />
                      </Field>
                      <Field label="Email address" error={errors.email}>
                        <input type="email" className={inputClass} value={settings.profile.email} onChange={(e) => updateSection("profile", "email", e.target.value)} placeholder="admin@example.com" disabled />
                      </Field>
                      <Field label="Contact number" error={errors.phone}>
                        <input type="tel" className={inputClass} value={settings.profile.phone} onChange={(e) => updateSection("profile", "phone", e.target.value)} placeholder="Enter phone number" />
                      </Field>
                    </div>
                    <div className="mt-5">{renderSaveActions("profile")}</div>
                  </>
                )}
              </Card>

              <Card title="Account preview" description="Preview of the profile information currently entered above.">
                <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-teal-100 font-semibold text-teal-800">
                    {settings.profile.photo ? <img src={settings.profile.photo} alt="Admin profile" className="h-full w-full object-cover" /> : (settings.profile.name.trim()[0] || "A").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{settings.profile.name || "Admin name"}</p>
                    <p className="truncate text-sm text-slate-500">{settings.profile.email || "admin@example.com"}</p>
                    <p className="truncate text-sm text-slate-500">{settings.profile.phone || "No contact number"}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                  <p>Account created: <span className="font-medium text-slate-800">Demo information</span></p>
                  <p>Last login: <span className="font-medium text-slate-800">Demo information</span></p>
                </div>
              </Card>

              <Card title="Change password" description="Connected to backend.">
                <form onSubmit={changePassword} className="max-w-xl space-y-4">
                  <Field label="Current password" error={passwordErrors.current}>
                    <input type="password" autoComplete="current-password" className={inputClass} value={password.current} onChange={(e) => setPassword((p) => ({ ...p, current: e.target.value }))} disabled={passwordLoading} />
                  </Field>
                  <Field label="New password" error={passwordErrors.next}>
                    <input type="password" autoComplete="new-password" className={inputClass} value={password.next} onChange={(e) => setPassword((p) => ({ ...p, next: e.target.value }))} disabled={passwordLoading} />
                  </Field>
                  <Field label="Confirm new password" error={passwordErrors.confirm}>
                    <input type="password" autoComplete="new-password" className={inputClass} value={password.confirm} onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))} disabled={passwordLoading} />
                  </Field>
                  <button type="submit" disabled={passwordLoading} className={buttonPrimary}>{passwordLoading ? "Updating..." : "Update password"}</button>
                </form>
              </Card>
            </>
          )}

          {activeTab === "notifications" && (
            <Card title="Notification preferences" description="Choose which demo notifications you would like to receive.">
              <DemoNotice />
              <div className="divide-y divide-slate-100">
                <Toggle title="New bookings" description="When a customer makes a booking." checked={settings.notifications.newBookings} onChange={(v) => updateSection("notifications", "newBookings", v)} />
                <Toggle title="Operator registration requests" description="When an operator submits a registration request." checked={settings.notifications.operatorRequests} onChange={(v) => updateSection("notifications", "operatorRequests", v)} />
                <Toggle title="New feedback" description="When a customer submits feedback or a review." checked={settings.notifications.newFeedback} onChange={(v) => updateSection("notifications", "newFeedback", v)} />
                <Toggle title="New event submissions" description="When an operator creates or submits an event." checked={settings.notifications.newEvents} onChange={(v) => updateSection("notifications", "newEvents", v)} />
                <Toggle title="Payment notifications" description="Demo alerts for payment-related activity." checked={settings.notifications.payments} onChange={(v) => updateSection("notifications", "payments", v)} />
                <Toggle title="Email notifications" description="Preference preview for email alerts." checked={settings.notifications.emailAlerts} onChange={(v) => updateSection("notifications", "emailAlerts", v)} />
                <Toggle title="In-app notifications" description="Preference preview for notifications inside the admin portal." checked={settings.notifications.inAppAlerts} onChange={(v) => updateSection("notifications", "inAppAlerts", v)} />
              </div>
              <div className="mt-5">{renderSaveActions("notifications")}</div>
            </Card>
          )}

          {activeTab === "platform" && (
            <Card title="Platform configuration" description="Edit the sample public-facing Pack&Go information.">
              <DemoNotice>These values are saved locally for preview and do not change the live website.</DemoNotice>
              <ImagePicker value={settings.platform.logo} onChange={(value) => updateSection("platform", "logo", value)} fallback={(settings.platform.name.trim()[0] || "P").toUpperCase()} onError={(message) => notify(message, "error")} />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Platform name" error={errors.platformName}>
                  <input className={inputClass} value={settings.platform.name} onChange={(e) => updateSection("platform", "name", e.target.value)} />
                </Field>
                <Field label="Default currency" hint="Currency is fixed to INR in this demo.">
                  <select className={inputClass} value={settings.platform.currency} disabled>
                    <option value="INR">INR (₹) – Indian Rupee</option>
                  </select>
                </Field>
                <Field label="Support email" error={errors.supportEmail}>
                  <input type="email" className={inputClass} value={settings.platform.supportEmail} onChange={(e) => updateSection("platform", "supportEmail", e.target.value)} />
                </Field>
                <Field label="Support phone" error={errors.supportPhone}>
                  <input type="tel" className={inputClass} value={settings.platform.supportPhone} onChange={(e) => updateSection("platform", "supportPhone", e.target.value)} />
                </Field>
              </div>
              <div className="mt-5 border-t border-slate-100">
                <Toggle title="Maintenance mode" description="Visual preview only. This will not affect the live user website." checked={settings.platform.maintenance} onChange={handleMaintenanceToggle} />
              </div>
              <div className="mt-5">{renderSaveActions("platform")}</div>
            </Card>
          )}

          {activeTab === "payments" && (
            <>
              <Card title="Payment gateway status" description="Illustrative payment configuration; no gateway connection is made.">
                <DemoNotice>Payment gateway status below is not live and does not verify your Stripe account.</DemoNotice>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">Stripe</p><div className="mt-2"><Badge tone="warning">Demo status</Badge></div></div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">Payment gateway</p><div className="mt-2"><Badge>Not checked</Badge></div></div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">Currency</p><p className="mt-2 font-semibold text-slate-900">INR (₹)</p></div>
                </div>
              </Card>
              <Card title="Fees, tax and refunds" description="Edit sample values to preview how payment settings could look.">
                <DemoNotice>Changing these values here does not affect checkout prices, taxes, or refunds.</DemoNotice>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Service fee (%)" error={errors.serviceFee}><input type="number" min="0" max="100" step="0.1" className={inputClass} value={settings.payments.serviceFee} onChange={(e) => updateSection("payments", "serviceFee", e.target.value)} /></Field>
                  <Field label="Tax / GST (%)" error={errors.tax}><input type="number" min="0" max="100" step="0.1" className={inputClass} value={settings.payments.tax} onChange={(e) => updateSection("payments", "tax", e.target.value)} /></Field>
                  <Field label="Refund window (days)" error={errors.refundDays}><input type="number" min="0" max="365" step="1" className={inputClass} value={settings.payments.refundDays} onChange={(e) => updateSection("payments", "refundDays", e.target.value)} /></Field>
                </div>
                <div className="mt-4">
                  <Field label="Refund policy"><textarea rows={4} className={inputClass} value={settings.payments.refundPolicy} onChange={(e) => updateSection("payments", "refundPolicy", e.target.value)} /></Field>
                </div>
                <div className="mt-5">{renderSaveActions("payments")}</div>
              </Card>
            </>
          )}

          {activeTab === "policies" && (
            <>
              {policiesLoading ? (
                <Card title="Loading policies...">
                  <div className="flex items-center justify-center py-8">
                    <FaSpinner className="animate-spin text-2xl text-teal-700" />
                    <span className="ml-2 text-sm text-slate-500">Loading...</span>
                  </div>
                </Card>
              ) : policiesError ? (
                <Card title="Error">
                  <p className="text-sm text-red-600">{policiesError}</p>
                </Card>
              ) : (
                <>
                  <Card title="Registration and approval" description="Backend-connected policy controls.">
                    <div className="divide-y divide-slate-100">
                      <Toggle title="User registration" description="Allow new users to create accounts." checked={settings.policies.userSignup} onChange={(v) => updateSection("policies", "userSignup", v)} />
                      <Toggle title="Operator registration" description="Allow new operators to register." checked={settings.policies.operatorSignup} onChange={(v) => updateSection("policies", "operatorSignup", v)} />
                      <Toggle title="Operator approval required" description="Require admin approval before an operator can publish trips or events." checked={settings.policies.operatorApproval} onChange={(v) => updateSection("policies", "operatorApproval", v)} />
                    </div>
                  </Card>
                  <Card title="Platform policies" description="Sample policy choices for bookings, reviews, and account moderation.">
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Booking cancellation"><select className={inputClass} value={settings.policies.cancellation} onChange={(e) => updateSection("policies", "cancellation", e.target.value)}><option value="flexible">Flexible</option><option value="moderate">Moderate</option><option value="strict">Strict</option></select></Field>
                      <Field label="Review moderation"><select className={inputClass} value={settings.policies.reviews} onChange={(e) => updateSection("policies", "reviews", e.target.value)}><option value="auto">Publish immediately</option><option value="flagged">Hold flagged reviews</option><option value="all">Approve every review</option></select></Field>
                      <Field label="Account suspension"><select className={inputClass} value={settings.policies.suspension} onChange={(e) => updateSection("policies", "suspension", e.target.value)}><option value="manual">Manual review only</option><option value="reports">After multiple reports</option><option value="strict">After a serious report</option></select></Field>
                    </div>
                    <div className="mt-5">
                      <div className="flex flex-wrap justify-end gap-3">
                        <button type="button" onClick={cancelChanges} disabled={!isDirty || policiesSaving} className={buttonSecondary}>Discard changes</button>
                        <button type="button" onClick={() => saveSettings("policies")} disabled={!isDirty || policiesSaving} className={buttonPrimary}>{policiesSaving ? "Saving..." : "Save policies"}</button>
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </>
          )}

          {activeTab === "security" && (
            <>
              <Card title="Two-factor authentication" description="Interactive demonstration of a security preference.">
                <DemoNotice>This switch does not enable real two-factor authentication.</DemoNotice>
                <Toggle title={twoFactor ? "Two-factor authentication enabled (demo)" : "Two-factor authentication disabled (demo)"} description="No verification method is configured." checked={twoFactor} onChange={setTwoFactor} />
              </Card>
              <Card title="Active sessions" description="Sample devices signed in to the admin account.">
                <DemoNotice>These are sample sessions, not real devices connected to your account.</DemoNotice>
                <ul className="divide-y divide-slate-100">
                  {sessions.map((session) => (
                    <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div><p className="text-sm font-semibold text-slate-900">{session.device}</p><p className="mt-1 text-sm text-slate-500">{session.location} · {session.lastActive}</p></div>
                      <div className="flex items-center gap-2">{session.current ? <Badge tone="success">This device</Badge> : <Badge>Other session</Badge>}</div>
                    </li>
                  ))}
                </ul>
                <button type="button" disabled={sessions.every((session) => session.current)} onClick={() => setConfirm({ title: "End all other sessions?", description: "This only removes sample sessions from this page. It will not log out any real device.", onConfirm: () => { setSessions((current) => current.filter((session) => session.current)); setConfirm(null); notify("Demo sessions cleared.", "info"); } })} className="mt-4 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">Log out other sessions (demo)</button>
              </Card>
              <Card title="Recent login activity" description="Illustrative login history.">
                <DemoNotice>Login records shown here are sample data.</DemoNotice>
                <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="text-xs uppercase text-slate-400"><tr><th className="pb-3 font-medium">Device</th><th className="pb-3 font-medium">Date</th><th className="pb-3 font-medium">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{DEMO_LOGINS.map((login) => <tr key={login.id}><td className="py-3 font-medium text-slate-900">{login.device}</td><td className="py-3 text-slate-500">{login.date}</td><td className="py-3"><Badge tone={login.status === "Success" ? "success" : "danger"}>{login.status}</Badge></td></tr>)}</tbody></table></div>
              </Card>
            </>
          )}

          {activeTab === "logs" && (
            <Card title="Activity logs" description="Admin activity from the backend.">
              <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                <input className={inputClass + " !mt-0"} value={logSearch} onChange={(e) => { setLogSearch(e.target.value); setLogPage(1); }} placeholder="Search admin, action, or resource" aria-label="Search activity logs" disabled={logsLoading} />
                <select className={inputClass + " !mt-0"} value={logStatus} onChange={(e) => { setLogStatus(e.target.value); setLogPage(1); }} aria-label="Filter by status" disabled={logsLoading}><option value="All">All statuses</option><option value="Success">Success</option><option value="Failed">Failed</option><option value="Warning">Warning</option></select>
              </div>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="animate-spin text-2xl text-teal-700" />
                  <span className="ml-2 text-sm text-slate-500">Loading activity logs...</span>
                </div>
              ) : logsError ? (
                <p className="py-4 text-center text-sm text-red-600">{logsError}</p>
              ) : currentLogs.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">No activity found.</p>
              ) : (
                <>
                  <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs uppercase text-slate-400"><tr><th className="pb-3 font-medium">Admin</th><th className="pb-3 font-medium">Action</th><th className="pb-3 font-medium">Resource</th><th className="pb-3 font-medium">Date & time</th><th className="pb-3 font-medium">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{currentLogs.map((log) => <tr key={log._id}><td className="py-3 font-medium text-slate-900">{log.adminName}</td><td className="py-3 text-slate-700">{log.action}</td><td className="py-3 text-slate-500">{log.resource}</td><td className="whitespace-nowrap py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td><td className="py-3"><Badge tone={log.status === "Success" ? "success" : log.status === "Failed" ? "danger" : "warning"}>{log.status}</Badge></td></tr>)}</tbody></table></div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm"><p className="text-slate-500">{currentTotal} entries</p><div className="flex items-center gap-3"><button type="button" className={buttonSecondary} disabled={logPage <= 1 || logsLoading} onClick={() => setLogPage((page) => Math.max(1, page - 1))}>Previous</button><span className="text-slate-500">Page {logPage} of {currentTotalPages}</span><button type="button" className={buttonSecondary} disabled={logPage >= currentTotalPages || logsLoading} onClick={() => setLogPage((page) => Math.min(currentTotalPages, page + 1))}>Next</button></div></div>
                </>
              )}
            </Card>
          )}

          {activeTab === "system" && (
            <Card title="System information" description="Static example values to demonstrate the system information layout.">
              <DemoNotice>These values are placeholders. This page does not check the actual server, database, deployment, or backup status.</DemoNotice>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: "Backend / API", value: "Not checked", tone: "neutral" },
                  { label: "Database", value: "Not checked", tone: "neutral" },
                  { label: "Application version", value: "v1.0.0 (sample)", tone: "info" },
                  { label: "Environment", value: "Development (sample)", tone: "info" },
                  { label: "Last backup", value: "Not available", tone: "neutral" },
                  { label: "System health", value: "Not monitored", tone: "neutral" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 p-4"><p className="text-sm text-slate-500">{item.label}</p><div className="mt-3"><Badge tone={item.tone}>{item.value}</Badge></div></div>
                ))}
              </div>
            </Card>
          )}
        </main>
      </div>

      {confirm && <ConfirmModal title={confirm.title} description={confirm.description} onClose={() => setConfirm(null)} onConfirm={confirm.onConfirm} />}
      {toast && <div role="status" aria-live="polite" className={`fixed bottom-5 right-5 z-[120] max-w-sm rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === "error" ? "bg-red-600" : toast.type === "info" ? "bg-slate-800" : "bg-teal-800"}`}>{toast.message}</div>}
    </div>
  );
}
