import { useState } from "react";
import styles from './AdminBookings.module.css'
// ---------- Hardcoded sample bookings (fake data) ----------
// Later: load this list from your API instead.
const sampleBookings = [
  { id: "BK-1001", customer: "Riya Sharma", email: "riya.sharma@example.com", phone: "+91 98290 11122", trip: "Jaipur → Goa", tripId: "PG-JAI-GOA-20270105-4821", travelDate: "2027-01-05", seats: 2, amount: 12998, payment: "Paid", status: "Confirmed", bookedOn: "2026-10-20" },
  { id: "BK-1002", customer: "Aman Verma", email: "aman.verma@example.com", phone: "+91 98110 22233", trip: "Delhi → Manali", tripId: "PG-DEL-MAN-20270122-3350", travelDate: "2027-01-22", seats: 4, amount: 33996, payment: "Pending", status: "Pending", bookedOn: "2026-10-24" },
  { id: "BK-1003", customer: "Neha Gupta", email: "neha.gupta@example.com", phone: "+91 97720 33344", trip: "Jaipur → Leh", tripId: "PG-JAI-LEH-20270202-7712", travelDate: "2027-02-02", seats: 1, amount: 18999, payment: "Paid", status: "Confirmed", bookedOn: "2026-10-18" },
  { id: "BK-1004", customer: "Karan Singh", email: "karan.singh@example.com", phone: "+91 99280 44455", trip: "Mumbai → Kerala", tripId: "PG-MUM-KER-20270112-1940", travelDate: "2027-01-12", seats: 3, amount: 21897, payment: "Paid", status: "Confirmed", bookedOn: "2026-10-15" },
  { id: "BK-1005", customer: "Priya Nair", email: "priya.nair@example.com", phone: "+91 98760 55566", trip: "Jaipur → Goa", tripId: "PG-JAI-GOA-20270105-4821", travelDate: "2027-01-05", seats: 1, amount: 6499, payment: "Pending", status: "Pending", bookedOn: "2026-10-25" },
  { id: "BK-1006", customer: "Rahul Mehta", email: "rahul.mehta@example.com", phone: "+91 98010 66677", trip: "Delhi → Manali", tripId: "PG-DEL-MAN-20270122-3350", travelDate: "2027-01-22", seats: 2, amount: 16998, payment: "Refunded", status: "Cancelled", bookedOn: "2026-10-10" },
  { id: "BK-1007", customer: "Sneha Joshi", email: "sneha.joshi@example.com", phone: "+91 97990 77788", trip: "Jaipur → Leh", tripId: "PG-JAI-LEH-20270202-7712", travelDate: "2027-02-02", seats: 2, amount: 37998, payment: "Paid", status: "Confirmed", bookedOn: "2026-10-12" },
  { id: "BK-1008", customer: "Vikram Rao", email: "vikram.rao@example.com", phone: "+91 98450 88899", trip: "Mumbai → Kerala", tripId: "PG-MUM-KER-20270112-1940", travelDate: "2027-01-12", seats: 1, amount: 7299, payment: "Pending", status: "Pending", bookedOn: "2026-10-26" },
  { id: "BK-1009", customer: "Anjali Das", email: "anjali.das@example.com", phone: "+91 98300 99900", trip: "Jaipur → Goa", tripId: "PG-JAI-GOA-20270105-4821", travelDate: "2027-01-05", seats: 4, amount: 25996, payment: "Paid", status: "Confirmed", bookedOn: "2026-10-19" },
  { id: "BK-1010", customer: "Deepak Yadav", email: "deepak.yadav@example.com", phone: "+91 97110 12345", trip: "Delhi → Manali", tripId: "PG-DEL-MAN-20270122-3350", travelDate: "2027-01-22", seats: 3, amount: 25497, payment: "Paid", status: "Confirmed", bookedOn: "2026-10-21" },
];

const statusTabs = ["All", "Pending", "Confirmed", "Cancelled"];

// 12998 -> ₹12,998
const money = (amount) => `₹${amount.toLocaleString("en-IN")}`;

// "2027-01-05" -> "05 Jan 2027"
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

 function AdminBookings() {
  const [bookings, setBookings] = useState(sampleBookings);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tripFilter, setTripFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(null); // booking open in the pop-up

  // The booking shown in the pop-up (null when the pop-up is closed)
  const selected = bookings.find((booking) => booking.id === selectedId);

  // Change the status of one booking
  const changeStatus = (id, newStatus) => {
    setBookings(
      bookings.map((booking) => (booking.id === id ? { ...booking, status: newStatus } : booking))
    );
  };

  const confirmBooking = (id) => changeStatus(id, "Confirmed");

  const cancelBooking = (id) => {
    if (window.confirm("Cancel this booking?")) changeStatus(id, "Cancelled");
  };

  // ----- Numbers for the cards -----
  const countOf = (status) => bookings.filter((booking) => booking.status === status).length;

  const revenue = bookings
    .filter((booking) => booking.payment === "Paid" && booking.status !== "Cancelled")
    .reduce((sum, booking) => sum + booking.amount, 0);

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
        <p className={styles.subtitle}>See who booked, and confirm or cancel bookings.</p>
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
          <small>Waiting for you</small>
          <strong className={styles.warn}>{countOf("Pending")}</strong>
        </div>
        <div className={styles.stat}>
          <small>Revenue (paid)</small>
          <strong>{money(revenue)}</strong>
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
        <div className={styles.tableWrap}>
          <table className={styles.table}>
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
                <th>Actions</th>
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
                      <span className={styles.avatar}>{booking.customer[0]}</span>
                      <div>
                        <strong>{booking.customer}</strong>
                        <small>{booking.email}</small>
                      </div>
                    </div>
                  </td>

                  <td>{booking.trip}</td>
                  <td>{formatDate(booking.travelDate)}</td>
                  <td>{booking.seats}</td>
                  <td><strong>{money(booking.amount)}</strong></td>

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

                      {booking.status === "Pending" && (
                        <button className={`${styles.btn} ${styles.confirm}`} onClick={() => confirmBooking(booking.id)}>
                          Confirm
                        </button>
                      )}

                      {booking.status !== "Cancelled" && (
                        <button className={`${styles.btn} ${styles.cancel}`} onClick={() => cancelBooking(booking.id)}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visibleBookings.length === 0 && (
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
                <div><small>Amount</small><strong>{money(selected.amount)}</strong></div>
                <div>
                  <small>Payment</small>
                  <span className={`${styles.badge} ${styles[selected.payment.toLowerCase()]}`}>{selected.payment}</span>
                </div>
                <div>
                  <small>Status</small>
                  <span className={`${styles.badge} ${styles[selected.status.toLowerCase()]}`}>{selected.status}</span>
                </div>
              </div>

              <div className={styles.modalActions}>
                {selected.status === "Pending" && (
                  <button className={`${styles.btn} ${styles.confirm}`} onClick={() => confirmBooking(selected.id)}>
                    Confirm booking
                  </button>
                )}
                {selected.status !== "Cancelled" && (
                  <button className={`${styles.btn} ${styles.cancel}`} onClick={() => cancelBooking(selected.id)}>
                    Cancel booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBookings