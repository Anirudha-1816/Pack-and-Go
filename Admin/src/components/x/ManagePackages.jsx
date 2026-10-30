import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

// ---------- Settings ----------

const API = import.meta.env.VITE_API_URL;

const LIST_API = `http://localhost:8080/components/get-trips`;

// These three are my guesses. Change them to your real routes.
const updateApi = (id) => `${API}/trip/update/${id}`;
const deleteApi = (id) => `${API}/trip/delete/${id}`;
const ADD_PAGE = "/admin/add-package";
const editPage = (id) => `/admin/edit-package/${id}`;

// ---------- Helpers ----------

const DAY = 86400000;

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// Ask Cloudinary for a smaller picture (other image links stay as they are)
const small = (url, width) =>
  url && url.includes("/upload/")
    ? url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`)
    : url;

// upcoming, running or completed
function getTripStatus(trip) {
  const start = new Date(trip.date);
  const end = new Date(start.getTime() + trip.duration * DAY);
  const now = new Date();
  if (now < start) return "upcoming";
  if (now < end) return "running";
  return "completed";
}

// If your Trip model uses different field names, change them ONLY here.
function formatTrip(t) {
  return {
    id: t._id,
    code: t.tripIdentifier,
    title: `${t.from} to ${t.to}`,
    guide: t.guide,
    type: t.tripType,
    image: t.thumbnail?.url || t.banner?.url,
    date: t.date,
    duration: t.duration,
    price: t.pricePerHead,
    visible: t.isActive !== false, // hidden trips have isActive: false
    status: getTripStatus(t),
  };
}

// ---------- Styles used in many places ----------

const smallBtn =
  "inline-flex h-9 items-center justify-center rounded-lg border px-3.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a1a] disabled:cursor-not-allowed disabled:opacity-50";
const btnNormal = `${smallBtn} border-[#cfd8cb] bg-white text-[#0f3d2a] hover:bg-[#f1f5ee]`;
const btnDanger = `${smallBtn} border-[#e6c4c0] bg-white text-[#b3261e] hover:bg-[#fdf0ee]`;

const STATUS_STYLE = {
  upcoming: "bg-[#ffe9d6] text-[#8a3f00]",
  running: "bg-[#dff1e6] text-[#14633c]",
  completed: "bg-[#ececea] text-[#4a4f4b]",
};

const FILTERS = [
  ["all", "All"],
  ["upcoming", "Upcoming"],
  ["running", "Running"],
  ["completed", "Completed"],
  ["hidden", "Hidden"],
];

// ---------- Small pieces ----------

// One cell of a row. The label only shows on phones, where there is no table header.
function Cell({ label, children }) {
  return (
    <div>
      <span className="mb-0.5 block text-xs text-[#7a877f] lg:hidden">{label}</span>
      {children}
    </div>
  );
}

function Badge({ className, children }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${className}`}>
      {children}
    </span>
  );
}

// Pop-up that asks before deleting
function DeleteDialog({ trip, busy, onCancel, onConfirm }) {
  // Esc closes the pop-up
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#0a2b1e]/60 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-title" className="text-xl font-bold text-[#14211a]">
          Delete this package?
        </h2>
        <p className="mt-3 leading-relaxed text-[#55655b]">
          <strong className="text-[#14211a]">{trip.title}</strong> ({formatDate(trip.date)}) will be
          removed for good. This cannot be undone.
        </p>
        <p className="mt-3 rounded-lg bg-[#fff1e3] px-3 py-2 text-sm text-[#7a3a00]">
          If travelers have already booked this trip, hide it instead of deleting it.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button className={btnNormal} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            className="inline-flex h-9 items-center rounded-lg bg-[#b3261e] px-4 text-sm font-semibold text-white transition hover:bg-[#8f1d17] disabled:opacity-50"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Deleting..." : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// One trip in the list
function TripRow({ trip, busy, onToggle, onDelete }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-[#e3e8de] bg-white p-4 lg:grid-cols-[2.6fr_1fr_0.8fr_1fr_1.1fr_260px] lg:items-center lg:rounded-none lg:border-0 lg:border-b lg:px-5 lg:py-4 lg:last:border-b-0">
      {/* Trip */}
      <div className="flex items-center gap-4">
        <div
          className="h-16 w-16 shrink-0 rounded-xl bg-[linear-gradient(135deg,#ff9d2e,#1b7a4b)] bg-cover bg-center"
          style={trip.image ? { backgroundImage: `url(${small(trip.image, 160)})` } : undefined}
        />
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#14211a]">{trip.title}</p>
          <p className="truncate text-sm text-[#55655b]">
            {trip.type}, guide {trip.guide}
          </p>
          <p className="truncate text-xs text-[#8a958d]">{trip.code}</p>
        </div>
      </div>

      <Cell label="Start date">
        <span className="text-sm">{formatDate(trip.date)}</span>
      </Cell>

      <Cell label="Duration">
        <span className="text-sm">{trip.duration} days</span>
      </Cell>

      <Cell label="Price">
        <span className="font-semibold text-[#0f3d2a]">{money(trip.price)}</span>
        <span className="text-xs text-[#7a877f]"> / person</span>
      </Cell>

      <Cell label="Status">
        <div className="flex flex-wrap gap-1.5">
          <Badge className={STATUS_STYLE[trip.status]}>{trip.status}</Badge>
          {!trip.visible && <Badge className="border border-[#cfd8cb] bg-white text-[#55655b]">Hidden</Badge>}
        </div>
      </Cell>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Link to={editPage(trip.id)} className={btnNormal}>
          Update
        </Link>
        <button className={btnNormal} onClick={() => onToggle(trip)} disabled={busy}>
          {trip.visible ? "Hide" : "Show"}
        </button>
        <button className={btnDanger} onClick={() => onDelete(trip)} disabled={busy}>
          Delete
        </button>
      </div>
    </div>
  );
}

// ---------- The page ----------

export default function ManagePackages() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("soonest");

  const [busyId, setBusyId] = useState(null); // the trip we are changing right now
  const [toDelete, setToDelete] = useState(null); // the trip waiting for delete confirmation

//  Get all trips
  async function loadTrips() {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(LIST_API, { withCredentials: true });
      const list = Array.isArray(res.data) ? res.data : res.data.trips || res.data.data || [];
      setTrips(list.map(formatTrip));
    } catch (err) {
      console.log(err);
      setError("We could not load the packages. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const fetchTrips = async () => {
      
      await loadTrips();
    }
    fetchTrips()
  }, []);

  // 2. Hide or show a trip on the website
  async function toggleVisible(trip) {
    try {
      setBusyId(trip.id);
      await axios.patch(updateApi(trip.id), { isActive: !trip.visible }, { withCredentials: true });
      setTrips((list) => list.map((t) => (t.id === trip.id ? { ...t, visible: !t.visible } : t)));
      toast.success(trip.visible ? "Package hidden from the website" : "Package is live again");
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || "Could not update the package");
    } finally {
      setBusyId(null);
    }
  }

  // 3. Delete a trip (after the pop-up says yes)
  async function deleteTrip() {
    try {
      setBusyId(toDelete.id);
      await axios.delete(deleteApi(toDelete.id), { withCredentials: true });
      setTrips((list) => list.filter((t) => t.id !== toDelete.id));
      toast.success("Package deleted");
      setToDelete(null);
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || "Could not delete the package");
    } finally {
      setBusyId(null);
    }
  }

  // 4. Count for each filter chip
  const counts = {
    all: trips.length,
    upcoming: trips.filter((t) => t.status === "upcoming").length,
    running: trips.filter((t) => t.status === "running").length,
    completed: trips.filter((t) => t.status === "completed").length,
    hidden: trips.filter((t) => !t.visible).length,
  };

  // 5. Apply filter, search and sorting
  const shown = trips
    .filter((t) => (filter === "hidden" ? !t.visible : filter === "all" || t.status === filter))
    .filter((t) =>
      `${t.title} ${t.code} ${t.guide}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "latest") return new Date(b.date) - new Date(a.date);
      if (sortBy === "low") return a.price - b.price;
      if (sortBy === "high") return b.price - a.price;
      return new Date(a.date) - new Date(b.date); // soonest first
    });

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
  };

  return (
    <div className="min-h-screen bg-[#f5f7f2] px-5 py-8 font-['Figtree',system-ui,sans-serif] text-[#14211a] sm:px-8">
      <div className="mx-auto max-w-[1200px]">
        {/* Top */}
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-['Instrument_Serif',Georgia,serif] text-[40px] font-normal leading-none text-[#0f3d2a]">
              Manage packages
            </h1>
            <p className="mt-2 text-[#55655b]">
              {loading ? "Loading packages..." : `${trips.length} packages in total`}
            </p>
          </div>

          <Link
            to={ADD_PAGE}
            className="inline-flex h-11 items-center rounded-[10px] bg-[#0f3d2a] px-5 text-[15px] font-semibold text-white transition hover:bg-[#0a2b1e] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#ff7a1a]"
          >
            Add new package
          </Link>
        </header>

        {/* Search, filters and sorting */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  filter === key
                    ? "border-[#0f3d2a] bg-[#0f3d2a] text-white"
                    : "border-[#d9ddd4] bg-white text-[#2b3a31] hover:border-[#1b7a4b]"
                }`}
              >
                {label} <span className="opacity-70">{counts[key]}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search by place, guide or trip ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#d9ddd4] bg-white px-4 text-sm placeholder:text-[#9aa59d] focus:border-[#0f3d2a] focus:outline-none focus:ring-4 focus:ring-[#0f3d2a]/10 sm:w-72"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 rounded-[10px] border border-[#d9ddd4] bg-white px-3 text-sm focus:border-[#0f3d2a] focus:outline-none focus:ring-4 focus:ring-[#0f3d2a]/10"
            >
              <option value="soonest">Date: soonest first</option>
              <option value="latest">Date: latest first</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-[92px] animate-pulse rounded-2xl bg-[#e6ece2]" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-[#e3e8de] bg-white px-6 py-12 text-center">
            <p className="mb-4 text-[#55655b]">{error}</p>
            <button className={btnNormal} onClick={loadTrips}>
              Try again
            </button>
          </div>
        )}

        {/* No packages at all */}
        {!loading && !error && trips.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#bcc8b9] bg-white px-6 py-14 text-center">
            <h2 className="text-xl font-bold">No packages yet</h2>
            <p className="mb-5 mt-2 text-[#55655b]">Create your first package and it will show up here.</p>
            <Link to={ADD_PAGE} className={`${btnNormal} h-10`}>
              Add new package
            </Link>
          </div>
        )}

        {/* Nothing matches the filters */}
        {!loading && !error && trips.length > 0 && shown.length === 0 && (
          <div className="rounded-2xl border border-[#e3e8de] bg-white px-6 py-12 text-center">
            <p className="mb-4 text-[#55655b]">No packages match your search.</p>
            <button className={btnNormal} onClick={clearFilters}>
              Clear search and filters
            </button>
          </div>
        )}

        {/* The list */}
        {!loading && !error && shown.length > 0 && (
          <div className="flex flex-col gap-3 lg:gap-0 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-[#e3e8de] lg:bg-white">
            {/* Table header (desktop only) */}
            <div className="hidden grid-cols-[2.6fr_1fr_0.8fr_1fr_1.1fr_260px] gap-4 border-b border-[#e3e8de] bg-[#f5f7f2] px-5 py-3 text-sm font-medium text-[#55655b] lg:grid">
              <span>Package</span>
              <span>Start date</span>
              <span>Duration</span>
              <span>Price</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            {shown.map((trip) => (
              <TripRow
                key={trip.id}
                trip={trip}
                busy={busyId === trip.id}
                onToggle={toggleVisible}
                onDelete={setToDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete pop-up */}
      {toDelete && (
        <DeleteDialog
          trip={toDelete}
          busy={busyId === toDelete.id}
          onCancel={() => setToDelete(null)}
          onConfirm={deleteTrip}
        />
      )}
    </div>
  );
}
