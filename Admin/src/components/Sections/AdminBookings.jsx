// Flow: admin booking API -> saved paise amount -> formatted booking list.

import { useEffect, useState } from "react";
import baseApi from "../../api/baseApi";
import styles from './AdminBookings.module.css'
const statusTabs = ["All", "Pending", "Confirmed", "Cancelled"];

// Show an integer paise amount as a rupee price.
const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0) / 100);

const bookingAmountLabel = (amount) =>
  Number.isSafeInteger(amount) && amount > 0 ? money(amount) : "Amount not recorded";

// Format the booking date for the admin table.
const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "Not available";

// Capitalize a saved status for display.
const label = (value) => {
  if (!value) {
    return "";
  }
  const normalized = String(value).trim().toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

// Map a database booking into the smaller values shown in the admin screen.
const formatBooking = (booking) => {
  const rawAmount = booking.amount;
  const amount =
    rawAmount === null || rawAmount === undefined || rawAmount === ""
      ? null
      : Number(rawAmount);
  const paymentStatus = String(booking.paymentStatus || "pending").trim().toLowerCase();

  return {
    id: booking._id,
    customer: booking.user?.fullName || "Unknown customer",
    email: booking.user?.email || "No email",
    phone: booking.user?.phone || "Not provided",
    trip: booking.trip ? `${booking.trip.from} → ${booking.trip.to}` : "Trip unavailable",
    tripId: booking.trip?.tripIdentifier || booking.trip?._id || "Not available",
    travelDate: booking.trip?.date,
    seats: booking.travelers,
    amount: Number.isSafeInteger(amount) && amount > 0 ? amount : null,
    payment: label(paymentStatus) || "Pending",
    isPaid: paymentStatus === "paid",
    status: label(booking.status) || "Pending",
    bookedOn: booking.createdAt,
    paymentReference: booking.paymentReference,
    reviewRequired: booking.paymentReviewRequired === true,
  };
};

// Load and display bookings so administrators can review their payment status.
 function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tripFilter, setTripFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(null); // booking open in the pop-up

  useEffect(() => {
    let active = true;

    // Load the latest booking list from the backend.
    const loadBookings = async () => {
      try {
        const { data } = await baseApi.get("/booking/admin/get");
        const apiBookings = data.bookings || [];
        if (active) setBookings(apiBookings.map(formatBooking));
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.message || "Could not load bookings. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
       }
    };

    loadBookings();
    return () => { active = false; };
  }, [reloadKey]);

  // Reload the list after an administrator asks for fresh data.
  const refreshBookings = () => {
    setError("");
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  };

  // The booking shown in the pop-up (null when the pop-up is closed)
  const selected = bookings.find((booking) => booking.id === selectedId);

  // ----- Numbers for the cards -----
  // Count bookings that match one status tab.
  const countOf = (status) =>
    bookings.filter((booking) => booking.status === status).length;

  const paidBookings = bookings.filter((booking) => booking.isPaid);
  const paidBookingsMissingAmount = paidBookings.filter(
    (booking) => !Number.isFinite(booking.amount)
  ).length;
  const revenue = paidBookings.reduce(
    (sum, booking) => sum + (Number.isFinite(booking.amount) ? booking.amount : 0),
    0
  );

  // ----- Filters -----
  const tripNames = [...new Set(bookings.map((booking) => booking.trip))]; // each trip once

  const visibleBookings = bookings.filter((booking) => {
    const text = `${booking.id} ${booking.customer} ${booking.email}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase().trim());
    const matchesStatus = statusFilter === "All" || booking.status === statusFilter;
    const matchesTrip = tripFilter === "All" || booking.trip === tripFilter;
    return matchesSearch && matchesStatus && matchesTrip;
  });

  return (
    <div className={styles.page}>
      {/* ---------- Header ---------- */}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h1 className={styles.title}>Bookings</h1>
        </div>
        <div className={styles.headerActions}>
          <p className={styles.subtitle}>Live bookings and payment status from the database.</p>
          <button type="button" className={styles.refresh} onClick={refreshBookings} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ---------- Number cards ---------- */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <small>Total bookings</small>
          <strong>{bookings.length}</strong>
        </div>
        <div className={styles.stat}>
          <small>Confirmed</small>
          <strong>{countOf("Confirmed")}</strong>
        </div>
        <div className={styles.stat}>
          <small>Pending bookings</small>
          <strong className={styles.warn}>{countOf("Pending")}</strong>
        </div>
        <div className={styles.stat}>
          <small>Revenue (paid)</small>
          <strong>{money(revenue)}</strong>
          <span className={styles.metricHint}>
            {paidBookings.length} paid booking{paidBookings.length === 1 ? "" : "s"}
            {paidBookingsMissingAmount > 0 &&
              ` · ${paidBookingsMissingAmount} missing amount`}
          </span>
        </div>
      </div>

      <div className={styles.panel}>
        {/* ---------- Status tabs ---------- */}
        <div className={styles.tabs}>
          {statusTabs.map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${statusFilter === tab ? styles.tabActive : ""}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab}
              <span>{tab === "All" ? bookings.length : countOf(tab)}</span>
            </button>
          ))}
        </div>

        {/* ---------- Search and trip filter ---------- */}
        <div className={styles.toolbar}>
          <input
            type="text"
            className={styles.input}
            placeholder="Search by name, email or booking ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select className={styles.input} value={tripFilter} onChange={(e) => setTripFilter(e.target.value)}>
            <option value="All">All trips</option>
            {tripNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* ---------- Table ---------- */}
        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.tableWrap}>
          {!loading && !error && <table className={styles.table}>
            <thead>
              <tr>
                <th>Booking</th>
                <th>Customer</th>
                <th>Trip</th>
                <th>Travel date</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {visibleBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <strong>{booking.id}</strong>
                    <small>{formatDate(booking.bookedOn)}</small>
                  </td>

                  <td>
                    <div className={styles.person}>
                      <span className={styles.avatar}>{booking.customer[0] || "?"}</span>
                      <div>
                        <strong>{booking.customer}</strong>
                        <small>{booking.email}</small>
                      </div>
                    </div>
                  </td>

                  <td>{booking.trip}</td>
                  <td>{formatDate(booking.travelDate)}</td>
                  <td>{booking.seats}</td>
                  <td><strong>{bookingAmountLabel(booking.amount)}</strong></td>

                  <td>
                    <span className={`${styles.badge} ${styles[booking.payment.toLowerCase()]}`}>
                      {booking.payment}
                    </span>
                  </td>

                  <td>
                    <span className={`${styles.badge} ${styles[booking.status.toLowerCase()]}`}>
                      {booking.status}
                    </span>
                  </td>

                  <td>
                    <div className={styles.actions}>
                      <button className={`${styles.btn} ${styles.view}`} onClick={() => setSelectedId(booking.id)}>
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}

          {loading && <p className={styles.empty}>Loading bookings...</p>}
          {!loading && !error && visibleBookings.length === 0 && (
            <p className={styles.empty}>No bookings match your search or filters.</p>
          )}
        </div>
      </div>

      {/* ---------- Details pop-up ---------- */}
      {selected && (
        <div className={styles.overlay} onClick={() => setSelectedId(null)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Booking details"
            onClick={(e) => e.stopPropagation()} // clicks inside should not close it
          >
            <div className={styles.modalHead}>
              <div>
                <h2 className={styles.modalTitle}>{selected.id}</h2>
                <p className={styles.modalSub}>Booked on {formatDate(selected.bookedOn)}</p>
              </div>
              <button className={styles.close} onClick={() => setSelectedId(null)} aria-label="Close">
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.details}>
                <div><small>Customer</small><strong>{selected.customer}</strong></div>
                <div><small>Email</small><strong>{selected.email}</strong></div>
                <div><small>Phone</small><strong>{selected.phone}</strong></div>
                <div><small>Trip</small><strong>{selected.trip}</strong></div>
                <div><small>Trip ID</small><strong>{selected.tripId}</strong></div>
                <div><small>Travel date</small><strong>{formatDate(selected.travelDate)}</strong></div>
                <div><small>Seats</small><strong>{selected.seats}</strong></div>
                <div><small>Amount</small><strong>{bookingAmountLabel(selected.amount)}</strong></div>
                {selected.reviewRequired && (
                  <div><small>Payment review</small><strong>Required</strong></div>
                )}
                <div><small>Payment reference</small><strong>{selected.paymentReference || "Not available"}</strong></div>
                <div>
                  <small>Payment</small>
                  <span className={`${styles.badge} ${styles[selected.payment.toLowerCase()]}`}>{selected.payment}</span>
                </div>
                <div>
                  <small>Status</small>
                  <span className={`${styles.badge} ${styles[selected.status.toLowerCase()]}`}>{selected.status}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBookings