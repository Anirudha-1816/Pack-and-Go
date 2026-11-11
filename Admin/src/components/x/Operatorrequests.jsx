import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import baseApi from "../../api/baseApi";

// The reason must be at least this long, so admins write something useful
const MIN_REASON = 10;

async function fetchOperatorRequests() {
  const { data } = await baseApi.get("/operator/all");
  return Array.isArray(data.data) ? data.data : [];
}

// Quick reasons the admin can tap to fill the box
const QUICK_REASONS = [
  "Some of your details are incomplete.",
  "We could not verify your experience.",
  "We are not onboarding operators from your location right now.",
];

// ---------- Helpers ----------

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// "3 days ago"
function timeAgo(date) {
  const days = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// Ask Cloudinary for a smaller picture (other image links stay as they are)
const small = (url, width) =>
  url && url.includes("/upload/") ? url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`) : url;

// ---------- Styles used in many places ----------

const smallBtn =
  "inline-flex h-9 items-center justify-center rounded-lg border px-3.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a1a] disabled:cursor-not-allowed disabled:opacity-50";
const btnNormal = `${smallBtn} border-[#cfd8cb] bg-white text-[#0f3d2a] hover:bg-[#f1f5ee]`;
const btnApprove = `${smallBtn} border-[#0f3d2a] bg-[#0f3d2a] text-white hover:bg-[#0a2b1e]`;
const btnDanger = `${smallBtn} border-[#e6c4c0] bg-white text-[#b3261e] hover:bg-[#fdf0ee]`;

const STATUS_STYLE = {
  pending: "bg-[#fff1d6] text-[#8a5a00]",
  approved: "bg-[#dff1e6] text-[#14633c]",
  rejected: "bg-[#fbe3e0] text-[#8f1d17]",
};

const TABS = [
  ["pending", "Pending"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["all", "All"],
];

// ---------- Small pieces ----------

// Photo, or the first letters of the name if there is no photo
function Avatar({ operator }) {
  const [failed, setFailed] = useState(false);

  if (operator.profileImage && !failed) {
    return (
      <img
        src={small(operator.profileImage, 120)}
        alt=""
        onError={() => setFailed(true)}
        className="h-12 w-12 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e4efe8] font-semibold text-[#0f3d2a]">
      {initials(operator.name)}
    </div>
  );
}

// A small label and value (used on phones, where there is no table header)
function Info({ label, children }) {
  return (
    <div>
      <span className="mb-0.5 block text-xs text-[#7a877f]">{label}</span>
      <span className="text-sm text-[#14211a]">{children}</span>
    </div>
  );
}

// Pop-up that asks for the rejection reason
function RejectDialog({ operator, busy, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  // Esc closes the pop-up
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const tooShort = reason.trim().length < MIN_REASON;

  function submit(e) {
    e.preventDefault();
    setTouched(true);
    if (tooShort) return;
    onConfirm(reason.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#0a2b1e]/60 p-4"
      onClick={onCancel}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-title"
        className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        noValidate
      >
        <h2 id="reject-title" className="text-xl font-bold text-[#14211a]">
          Reject {operator.name}&apos;s application?
        </h2>
        <p className="mt-2 text-sm text-[#55655b]">
          Write a reason. The operator will see it, so keep it clear and polite.
        </p>

        {/* Quick reasons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_REASONS.map((text) => (
            <button
              type="button"
              key={text}
              onClick={() => setReason(text)}
              className="rounded-full border border-[#d9ddd4] bg-[#f5f7f2] px-3 py-1.5 text-left text-xs font-medium text-[#2b3a31] transition hover:border-[#0f3d2a]"
            >
              {text}
            </button>
          ))}
        </div>

        <label htmlFor="reason" className="mb-2 mt-5 block text-sm font-medium text-[#2b3a31]">
          Reason for rejection
        </label>
        <textarea
          id="reason"
          rows="4"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Tell the operator why the application was not approved"
          aria-invalid={touched && tooShort ? "true" : "false"}
          className={`w-full resize-none rounded-[10px] border bg-white px-4 py-3 text-[15px] placeholder:text-[#9aa59d] focus:outline-none focus:ring-4 ${
            touched && tooShort
              ? "border-[#b3261e] focus:ring-[#b3261e]/10"
              : "border-[#d9ddd4] focus:border-[#0f3d2a] focus:ring-[#0f3d2a]/10"
          }`}
        />
        <div className="mt-1.5 flex justify-between text-[13px]">
          <span className={touched && tooShort ? "text-[#b3261e]" : "text-transparent"} role="alert">
            Please write at least {MIN_REASON} characters.
          </span>
          <span className="text-[#7a877f]">{reason.trim().length} characters</span>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className={btnNormal} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-9 items-center rounded-lg bg-[#b3261e] px-4 text-sm font-semibold text-white transition hover:bg-[#8f1d17] disabled:opacity-50"
          >
            {busy ? "Rejecting..." : "Reject application"}
          </button>
        </div>
      </form>
    </div>
  );
}

// One operator
function OperatorCard({ operator, busy, onApprove, onReject, onPending }) {
  const { status } = operator;

  return (
    <article className="rounded-2xl border border-[#e3e8de] bg-white p-5">
      <div className="grid gap-5 lg:grid-cols-[2fr_1.6fr_1fr_auto] lg:items-center">
        {/* Who */}
        <div className="flex items-center gap-4">
          <Avatar operator={operator} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-[#14211a]">{operator.name}</p>
            <p className="truncate text-sm text-[#55655b]">{operator.email}</p>
            <p className="text-sm text-[#55655b]">{operator.phone}</p>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4">
          <Info label="Location">{operator.location}</Info>
          <Info label="Experience">
            {operator.experience} {operator.experience === 1 ? "year" : "years"}
          </Info>
        </div>

        {/* Status */}
        <div>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[status]}`}
          >
            {status}
          </span>
          <p className="mt-1.5 text-xs text-[#7a877f]">
            Applied {timeAgo(operator.createdAt)}
          </p>
        </div>

        {/* Actions: every button except the one for the current status */}
        <div className="flex flex-wrap gap-2 lg:w-[230px] lg:justify-end">
          {status !== "approved" && (
            <button className={btnApprove} onClick={() => onApprove(operator)} disabled={busy}>
              Approve
            </button>
          )}
          {status !== "rejected" && (
            <button className={btnDanger} onClick={() => onReject(operator)} disabled={busy}>
              Reject
            </button>
          )}
          {status !== "pending" && (
            <button className={btnNormal} onClick={() => onPending(operator)} disabled={busy}>
              Mark pending
            </button>
          )}
        </div>
      </div>

      {/* Extra line for rejected and approved operators */}
      {status === "rejected" && (
        <p className="mt-4 rounded-xl bg-[#fdf0ee] px-4 py-3 text-sm text-[#8f1d17]">
          <span className="font-semibold">Reason given: </span>
          {operator.rejectionReason || "No reason was saved."}
        </p>
      )}
      {status === "approved" && operator.approvedAt && (
        <p className="mt-4 rounded-xl bg-[#eef7f1] px-4 py-3 text-sm text-[#14633c]">
          Approved on {formatDate(operator.approvedAt)}
        </p>
      )}
    </article>
  );
}

// ---------- The page ----------

export default function OperatorRequests() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [busyId, setBusyId] = useState(null); // the operator we are changing right now
  const [toReject, setToReject] = useState(null); // the operator waiting for a rejection reason

  // 1. Get all operators
  async function loadOperators({ refresh = false } = {}) {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      setOperators(await fetchOperatorRequests());
    } catch (err) {
      console.error("Could not load operator requests:", err);
      setError("We could not load the operator requests. Please try again.");
    } finally {
      if (refresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    let active = true;

    fetchOperatorRequests()
      .then((list) => {
        if (active) setOperators(list);
      })
      .catch((err) => {
        console.error("Could not load operator requests:", err);
        if (active) setError("We could not load the operator requests. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // 2. Change the status of one operator (approved, rejected or pending)
  async function changeStatus(operator, status, rejectionReason = "") {
    try {
      setBusyId(operator._id);
      const res = await baseApi.patch(
        `/operator/status/${operator._id}`,
        { status, rejectionReason }
      );

      // Use what the server sends back, or work it out here if it sends nothing
      const fromServer = res.data?.data || res.data?.operator;
      const updated = fromServer || {
        status,
        rejectionReason: status === "rejected" ? rejectionReason : "",
        approvedAt: status === "approved" ? new Date().toISOString() : null,
      };

      setOperators((list) => list.map((o) => (o._id === operator._id ? { ...o, ...updated } : o)));

      const messages = {
        approved: `${operator.name} is approved`,
        rejected: `${operator.name} was rejected`,
        pending: `${operator.name} is back to pending`,
      };
      toast.success(messages[status]);
      return true;
    } catch (err) {
      console.error("Could not update operator request:", err);
      toast.error(err.response?.data?.message || "Could not update the operator");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject(reason) {
    const ok = await changeStatus(toReject, "rejected", reason);
    if (ok) setToReject(null);
  }

  // 3. Count for each tab
  const counts = {
    pending: operators.filter((o) => o.status === "pending").length,
    approved: operators.filter((o) => o.status === "approved").length,
    rejected: operators.filter((o) => o.status === "rejected").length,
    all: operators.length,
  };

  // 4. Apply tab, search and sorting
  const shown = operators
    .filter((o) => tab === "all" || o.status === tab)
    .filter((o) =>
      `${o.name} ${o.email} ${o.phone} ${o.location}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sortBy === "oldest"
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt)
    );

  return (
    <div className="min-h-screen bg-[#f5f7f2] px-5 py-8 font-['Figtree',system-ui,sans-serif] text-[#14211a] sm:px-8">
      <div className="mx-auto max-w-[1200px]">
        {/* Top */}
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-['Instrument_Serif',Georgia,serif] text-[40px] font-normal leading-none text-[#0f3d2a]">
              Operator requests
            </h1>
            <p className="mt-2 text-[#55655b]">
              {loading
                ? "Loading requests..."
                : counts.pending === 0
                  ? "No requests are waiting for review."
                  : `${counts.pending} ${counts.pending === 1 ? "request is" : "requests are"} waiting for your review.`}
            </p>
          </div>
          <button
            type="button"
            className={btnNormal}
            onClick={() => loadOperators({ refresh: true })}
            disabled={loading || refreshing}
            aria-label={refreshing ? "Refreshing operator requests" : "Refresh operator requests"}
          >
            <svg
              aria-hidden="true"
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7v5h-5M4 17v-5h5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3" />
            </svg>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {/* Tabs, search and sorting */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  tab === key
                    ? "border-[#0f3d2a] bg-[#0f3d2a] text-white"
                    : "border-[#d9ddd4] bg-white text-[#2b3a31] hover:border-[#1b7a4b]"
                }`}
              >
                {label}{" "}
                <span
                  className={
                    key === "pending" && counts.pending > 0 && tab !== key
                      ? "rounded-full bg-[#ff7a1a] px-1.5 text-xs font-semibold text-[#17261e]"
                      : "opacity-70"
                  }
                >
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search by name, email, phone or place"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#d9ddd4] bg-white px-4 text-sm placeholder:text-[#9aa59d] focus:border-[#0f3d2a] focus:outline-none focus:ring-4 focus:ring-[#0f3d2a]/10 sm:w-80"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 rounded-[10px] border border-[#d9ddd4] bg-white px-3 text-sm focus:border-[#0f3d2a] focus:outline-none focus:ring-4 focus:ring-[#0f3d2a]/10"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-[96px] animate-pulse rounded-2xl bg-[#e6ece2]" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-[#e3e8de] bg-white px-6 py-12 text-center">
            <p className="mb-4 text-[#55655b]">{error}</p>
            <button className={btnNormal} onClick={loadOperators}>
              Try again
            </button>
          </div>
        )}

        {/* Nothing to show */}
        {!loading && !error && shown.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#bcc8b9] bg-white px-6 py-14 text-center">
            <h2 className="text-xl font-bold">
              {search
                ? "No operators match your search"
                : tab === "pending"
                  ? "You are all caught up"
                  : "Nothing here yet"}
            </h2>
            <p className="mt-2 text-[#55655b]">
              {search
                ? "Try a different name, email or place."
                : tab === "pending"
                  ? "New operator applications will show up here."
                  : "Operators with this status will show up here."}
            </p>
            {search && (
              <button className={`${btnNormal} mt-5`} onClick={() => setSearch("")}>
                Clear search
              </button>
            )}
          </div>
        )}

        {/* The list */}
        {!loading && !error && shown.length > 0 && (
          <div className="flex flex-col gap-3">
            {shown.map((operator) => (
              <OperatorCard
                key={operator._id}
                operator={operator}
                busy={busyId === operator._id}
                onApprove={(o) => changeStatus(o, "approved")}
                onReject={setToReject}
                onPending={(o) => changeStatus(o, "pending")}
              />
            ))}
          </div>
        )}
      </div>

      {/* Rejection reason pop-up */}
      {toReject && (
        <RejectDialog
          operator={toReject}
          busy={busyId === toReject._id}
          onCancel={() => setToReject(null)}
          onConfirm={confirmReject}
        />
      )}
    </div>
  );
}