import { useState } from "react";

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

// The trip in the center: big banner image + trip name below it.
// Nothing is placed on top of the image, so the photo stays fully visible.
export default function TripCard({ trip, onClick }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className={`fb-trip ${onClick ? "is-clickable" : ""}`} onClick={onClick}>
      <div className="fb-trip-photo">
        {!imageFailed && (
          <img
            src={trip.bannerImage}
            alt={trip.destination}
            draggable={false}
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      <div className="fb-trip-info">
        <h3 className="fb-trip-destination">{trip.destination}</h3>
        <p className="fb-trip-location">
          <PinIcon /> {trip.location}
        </p>
        <p className="fb-trip-subtitle">{trip.subtitle}</p>

        <p className="fb-trip-rating">
          <span className="fb-star on">★</span>
          {trip.averageRating}
          <span className="fb-trip-count">from {trip.totalReviews} travellers</span>
        </p>
      </div>
    </article>
  );
}