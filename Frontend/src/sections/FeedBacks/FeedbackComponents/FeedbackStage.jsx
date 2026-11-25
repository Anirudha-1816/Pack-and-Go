import { useEffect, useRef, useState } from "react";
import TripCard from "./TripCard";
import ReviewCard from "./ReviewCard";

const REVIEW_CHANGE_MS = 2600; // a review card changes every 2.6 seconds
const REVIEW_LEAVE_MS = 400; // time the old review needs to fade out

// Shows ONE trip: the trip card in the middle and its reviews on the left and right.
// The review cards keep changing, but they only show reviews of THIS trip.
export default function FeedbackStage({ trip, maxSlots, direction, isLeaving, onTripClick }) {
  const reviews = trip.reviews || [];
  const slotCount = Math.min(maxSlots, reviews.length); // how many review cards are on screen

  // "slots" = the review card places.
  // Slot 0 = left, slot 1 = right, slot 2 = left, slot 3 = right.
  // Each number is the index of the review shown in that place.
  const [slots, setSlots] = useState(() => Array.from({ length: slotCount }, (_, index) => index));
  const [changingSlot, setChangingSlot] = useState(null); // the slot that is fading out now

  const nextSlot = useRef(0); // which slot changes next
  const nextReview = useRef(slotCount); // which review comes next
  const isPaused = useRef(false); // true while the mouse is on the stage

  // Every few seconds: fade out one review card, then bring in the next review
  useEffect(() => {
    if (reviews.length <= slotCount) return; // all reviews are already on screen

    let swapTimer;

    const timer = setInterval(() => {
      if (isPaused.current) return;

      const slot = nextSlot.current;
      const reviewIndex = nextReview.current % reviews.length;
      nextSlot.current = (slot + 1) % slotCount;
      nextReview.current += 1;

      setChangingSlot(slot); // 1. the old review fades out

      swapTimer = setTimeout(() => {
        setSlots((old) => old.map((value, index) => (index === slot ? reviewIndex : value)));
        setChangingSlot(null); // 2. the new review flies in
      }, REVIEW_LEAVE_MS);
    }, REVIEW_CHANGE_MS);

    return () => {
      clearInterval(timer);
      clearTimeout(swapTimer);
    };
  }, [reviews.length, slotCount]);

  // Left column = even slots, right column = odd slots
  function renderColumn(side) {
    return (
      <div className={`fb-column fb-column-${side}`}>
        {slots
          .map((reviewIndex, slot) => ({ reviewIndex, slot }))
          .filter(({ slot }) => (slot % 2 === 0) === (side === "left"))
          .map(({ reviewIndex, slot }) => {
            const review = reviews[reviewIndex];

            return (
              <div className="fb-slot" key={slot}>
                {/* key={review.id} replays the "fly in" animation when the review changes */}
                <ReviewCard
                  key={review.id}
                  review={review}
                  side={side}
                  isLeaving={changingSlot === slot}
                  floatDelay={-slot * 1.5}
                />
              </div>
            );
          })}
      </div>
    );
  }

  return (
    <div
      className={`fb-stage ${isLeaving ? "is-leaving" : ""}`}
      style={{ "--shift": direction === "next" ? "60px" : "-60px" }}
      onMouseEnter={() => {
        isPaused.current = true;
      }}
      onMouseLeave={() => {
        isPaused.current = false;
      }}
    >
      {renderColumn("left")}
      <TripCard trip={trip} onClick={onTripClick ? () => onTripClick(trip.id) : undefined} />
      {renderColumn("right")}
    </div>
  );
}