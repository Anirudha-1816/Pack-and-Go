import { useEffect, useRef, useState } from "react";
import FeedbackStage from "./FeedbackComponents/FeedbackStage";
import { getFeedbackTrips } from "./services/feedbackService";
import "./FeedbackSectionModule.css";

const AUTO_SLIDE_MS = 12000; // how long one trip stays before the next trip comes
const TRIP_LEAVE_MS = 350; // time the current trip needs to fade out
const DRAG_LIMIT = 80; // how many px you must drag to change the trip

// Review cards on screen: 4 on bigger screens, 2 on phones
function getMaxReviewSlots() {
  return window.innerWidth < 640 ? 2 : 4;
}

function useMaxReviewSlots() {
  const [maxSlots, setMaxSlots] = useState(getMaxReviewSlots);

  useEffect(() => {
    const handleResize = () => setMaxSlots(getMaxReviewSlots());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return maxSlots;
}

// Props (all optional):
//   onAddFeedback()   -> open your "add feedback" form
//   onSeeAll()        -> go to the all feedbacks page
//   onTripClick(id)   -> go to the trip page
export default function FeedbackSection({ onAddFeedback, onSeeAll, onTripClick }) {
  // ----- data -----
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // ----- which trip is on screen -----
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState("next"); // decides which side the trip slides from
  const [isSwitching, setIsSwitching] = useState(false); // true while the old trip fades out
  const switchTimer = useRef(null);

  // ----- hold and slide -----
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);

  const maxSlots = useMaxReviewSlots();

  // Load feedbacks (sample data now, real API later in feedbackService.js)
  useEffect(() => {
    async function loadFeedbacks() {
      try {
        const data = await getFeedbackTrips();
        setTrips(data);
      } catch (err) {
        console.log(err)
        setError("We could not load the feedback right now. Please try again in a moment.");
      } finally {
        setIsLoading(false);
      }
    }

    loadFeedbacks();
  }, []);

  // Clear the timer if the component is removed
  useEffect(() => () => clearTimeout(switchTimer.current), []);

  // Change the trip: first the old one fades out, then the new one slides in
  function changeTrip(nextIndex, nextDirection) {
    if (isSwitching || trips.length < 2 || nextIndex === currentIndex) return;

    setDirection(nextDirection);
    setIsSwitching(true);

    switchTimer.current = setTimeout(() => {
      setCurrentIndex(nextIndex);
      setIsSwitching(false);
    }, TRIP_LEAVE_MS);
  }

  function goNext() {
    changeTrip((currentIndex + 1) % trips.length, "next");
  }

  function goPrev() {
    changeTrip((currentIndex - 1 + trips.length) % trips.length, "prev");
  }

  function goTo(index) {
    changeTrip(index, index > currentIndex ? "next" : "prev");
  }

  // ----- hold and slide (works with mouse and touch) -----
  function handlePointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return; // left click only
    dragStartX.current = event.clientX;
    setIsDragging(true);
  }

  function handlePointerMove(event) {
    if (!isDragging) return;
    const distance = event.clientX - dragStartX.current;

    // Capture the pointer only after a real drag, so a simple click still opens the trip
    if (Math.abs(distance) > 5 && !event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    setDragOffset(distance);
  }

  function handlePointerEnd() {
    if (!isDragging) return;

    setIsDragging(false);
    setDragOffset(0);

    if (dragOffset < -DRAG_LIMIT) goNext(); // dragged left -> next trip
    else if (dragOffset > DRAG_LIMIT) goPrev(); // dragged right -> previous trip
  }

  // ----- what to show -----
  const trip = trips[currentIndex];
  const hasManyTrips = trips.length > 1;
  const message =
    error || (!isLoading && trips.length === 0 ? "No feedback yet. Be the first to share your trip!" : "");

  return (
    <section id="feedback" className={`fb-section ${isDragging ? "is-dragging" : ""}`}>
      {/* Top row: title + actions */}
      <header className="fb-header">
        <h2 className="fb-title">Travelers feedback</h2>

        <div className="fb-header-actions">
          {hasManyTrips && (
            <>
              <button className="fb-arrow" onClick={goPrev} aria-label="Previous trip">
                ‹
              </button>
              <button className="fb-arrow" onClick={goNext} aria-label="Next trip">
                ›
              </button>
            </>
          )}
          <button className="fb-add-btn" onClick={onAddFeedback}>
            + Add your feedback
          </button>
        </div>
      </header>

      {/* Middle: loading placeholders, a message, or the trip with its reviews */}
      {isLoading && (
        <div className="fb-slider">
          <div className="fb-drag">
            <div className="fb-stage">
              <div className="fb-column">
                <div className="fb-skeleton fb-skeleton-review" />
                <div className="fb-skeleton fb-skeleton-review" />
              </div>
              <div className="fb-skeleton fb-skeleton-trip" />
              <div className="fb-column">
                <div className="fb-skeleton fb-skeleton-review" />
                <div className="fb-skeleton fb-skeleton-review" />
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && message && <p className="fb-message">{message}</p>}

      {!isLoading && !message && trip && (
        <div
          className="fb-slider"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <div
            className={`fb-drag ${isDragging ? "is-dragging" : ""}`}
            style={{ transform: `translateX(${dragOffset * 0.5}px)` }}
          >
            {/* The key makes a fresh stage (and a fresh animation) for every trip */}
            <FeedbackStage
              key={`${trip.id}-${maxSlots}`}
              trip={trip}
              maxSlots={maxSlots}
              direction={direction}
              isLeaving={isSwitching}
              onTripClick={onTripClick}
            />
          </div>
        </div>
      )}

      {/* Bottom: the line is also the autoplay timer. When it fills up, the next trip comes. */}
      <footer className="fb-footer">
        <div className="fb-progress">
          {hasManyTrips && !message && (
            <span
              key={currentIndex}
              className="fb-progress-fill"
              style={{ animationDuration: `${AUTO_SLIDE_MS}ms` }}
              onAnimationEnd={goNext}
            />
          )}
        </div>

        <div className="fb-footer-row">
          <div className="fb-dots">
            {hasManyTrips &&
              trips.map((item, index) => (
                <button
                  key={item.id}
                  className={index === currentIndex ? "fb-dot is-active" : "fb-dot"}
                  onClick={() => goTo(index)}
                  aria-label={`Show feedback for ${item.destination}`}
                />
              ))}
          </div>

          <button className="fb-see-all" onClick={onSeeAll}>
            See all
          </button>
        </div>
      </footer>
    </section>
  );
}