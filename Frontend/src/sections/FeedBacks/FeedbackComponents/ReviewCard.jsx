function Stars({ rating }) {
  return (
    <span className="fb-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((number) => (
        <span key={number} className={number <= rating ? "fb-star on" : "fb-star"}>
          ★
        </span>
      ))}
    </span>
  );
}

// One review. "side" decides if it flies in from the left or the right.
// "isLeaving" plays the fade-out animation before the next review comes in.
export default function ReviewCard({ review, side, isLeaving, floatDelay }) {
  return (
    <article
      className={`fb-review fb-review-${side} ${isLeaving ? "is-leaving" : ""}`}
      style={{ "--float-delay": `${floatDelay}s` }}
    >
      <div className="fb-review-head">
        {review.avatar ? (
          <img className="fb-avatar" src={review.avatar} alt={review.name} draggable={false} />
        ) : (
          // No photo? Show the first letter of the name
          <span className="fb-avatar fb-avatar-letter">{review.name.charAt(0)}</span>
        )}
        <div>
          <p className="fb-review-name">{review.name}</p>
          <Stars rating={review.rating} />
        </div>
      </div>

      <p className="fb-review-text">{review.text}</p>
    </article>
  );
}