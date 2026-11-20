import {
  FaMapMarkerAlt,
  FaRegCalendarAlt,
  FaMapPin,
  FaUsers,
  FaArrowRight,
} from "react-icons/fa";
import styles from "./NextTripCard.module.css";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// trip:             the operator's next trip
// bookedCount:      how many travelers have booked so far
// badge:            text on the image, e.g. "Leaves in 8 days"
// pickup:           [label, value], e.g. ["Meetup point", "Nahargarh Fort"]
// onViewPassengers: opens the passenger list
// onAllTrips:       opens the My trips tab
export default function NextTripCard({
  trip,
  bookedCount = 0,
  badge,
  pickup,
  onViewPassengers,
  onAllTrips,
}) {
  const image = trip.thumbnail?.url || trip.banner?.url;
  const spotsLeft = Math.max(trip.maxTravelers - bookedCount, 0);
  const percent = Math.min((bookedCount / trip.maxTravelers) * 100, 100);

  const details = [
    { icon: FaMapMarkerAlt, label: "Destination", value: trip.destination },
    { icon: FaRegCalendarAlt, label: "Starts on", value: formatDate(trip.date) },
    pickup && { icon: FaMapPin, label: pickup[0], value: pickup[1] },
  ].filter(Boolean);

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        {image && <img src={image} alt="" className={styles.image} />}
        {badge && <span className={styles.pill}>{badge}</span>}
      </div>

      <div className={styles.body}>
        <p className={styles.eyebrow}>Your next trip</p>
        <h3 className={styles.title}>{trip.title}</h3>

        <ul className={styles.details}>
          {details.map(({ icon: Icon, label, value }) => (
            <li key={label} className={styles.detail}>
              <span className={styles.icon}>
                <Icon aria-hidden="true" />
              </span>
              <span>
                <span className={styles.label}>{label}</span>
                <span className={styles.value}>{value}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className={styles.travelers}>
          <div className={styles.travelersTop}>
            <span className={styles.travelersCount}>
              <FaUsers aria-hidden="true" /> {bookedCount} of {trip.maxTravelers} travelers booked
            </span>
            <span className={styles.spots}>
              {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left
            </span>
          </div>
          <div
            className={styles.track}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={trip.maxTravelers}
            aria-valuenow={bookedCount}
          >
            <div className={styles.fill} style={{ width: `${percent}%` }} />
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={onViewPassengers}>
            View passenger list <FaArrowRight aria-hidden="true" />
          </button>
          <button type="button" className={styles.secondary} onClick={onAllTrips}>
            All my trips
          </button>
        </div>
      </div>
    </article>
  );
}