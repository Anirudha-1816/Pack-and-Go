import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  MapPin,
  Calendar,
  MessageSquare,
  CheckCircle,
  Sparkles,
  Shield,
  Heart,
} from "lucide-react";
import {
  SAMPLE_FEEDBACK,
  STAR_DISTRIBUTION,
  AVERAGE_RATING,
  TOTAL_REVIEWS,
} from "./feedbackMockData";

// Colors used on this page:
// ink #243746 | muted #61717b | border #e4e6e3 | paper #fafaf7 | sea mist #e8eff1
// blue #2f6b8a (dark #24566f) | gold #c49a55 | success #14633c

// Heading font used for titles
const serifFont = "font-normal [font-family:'Instrument_Serif',Georgia,serif]";

// ---------- helpers ----------
const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const getInitials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getCategoryColor = (category) => {
  const colors = {
    "Curated Trips": "bg-[#dff1e6] text-[#14633c]",
    "Adventure & Outdoors": "bg-[#ffedd5] text-[#8a3f00]",
    "Festivals & Celebrations": "bg-[#fbe3e0] text-[#8f1d17]",
    "Networking & Learning Meetups": "bg-[#dbeafe] text-[#1e40af]",
    "Social Gatherings & Parties": "bg-[#f0e6ff] text-[#5b21b6]",
    "Customer Support": "bg-[#dff1e6] text-[#14633c]",
  };
  return colors[category] || "bg-[#ececea] text-[#4a4f4b]";
};

const renderStars = (rating, size = "md") => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`shrink-0 ${sizeClasses[size]} ${
            i < rating ? "fill-[#c49a55] text-[#c49a55]" : "fill-none text-[#cfcac0]"
          }`}
        />
      ))}
    </span>
  );
};

// ---------- small components ----------
function ReviewCard({ review }) {
  return (
    <article className="flex flex-col rounded-2xl border border-[#e4e6e3] bg-white p-6 shadow-[0_2px_8px_rgba(20,43,59,0.04)] transition duration-200 hover:-translate-y-1 hover:border-[#2f6b8a]/30 hover:shadow-[0_12px_24px_-8px_rgba(47,107,138,0.15)] motion-reduce:transition-none">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8eff1] font-bold text-[#2f6b8a]">
            {review.reviewer.avatar ? (
              <img src={review.reviewer.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              getInitials(review.reviewer.name)
            )}
          </div>

          <div className="min-w-0">
            <p className="mb-0.5 font-semibold text-[#243746]">{review.reviewer.name}</p>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.8125rem] text-[#61717b]">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {review.reviewer.location}
              <span aria-hidden="true">·</span>
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {formatDate(review.date)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <span className="text-lg font-semibold text-[#2f6b8a]">{review.rating.toFixed(1)}</span>
          {renderStars(review.rating, "sm")}
        </div>
      </div>

      {review.title && (
        <h3 className={`${serifFont} mb-3 text-lg leading-snug text-[#243746]`}>{review.title}</h3>
      )}

      <p className="mb-5 flex-1 leading-[1.7] text-[#243746]">{review.description}</p>

      <div className="flex flex-col items-start justify-between gap-3 border-t border-[#e4e6e3] pt-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getCategoryColor(
              review.category
            )}`}
          >
            {review.category}
          </span>

          {review.verified && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-[#14633c] px-2.5 py-1 text-xs font-semibold text-white"
              title="Verified booking"
            >
              <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Verified
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-[#61717b]">
          <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{review.helpful} helpful</span>
        </div>
      </div>
    </article>
  );
}

function StarBar({ stars, count, percentage }) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-center gap-3 sm:grid-cols-[88px_80px_1fr]">
      {renderStars(stars, "sm")}

      <span className="hidden whitespace-nowrap text-sm text-[#61717b] sm:block">{count} reviews</span>

      <div className="h-2 min-w-0 overflow-hidden rounded-full bg-[#e4e6e3]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2f6b8a] to-[#c49a55] transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

function FilterChips({ activeFilter, setActiveFilter, filters }) {
  return (
    <div
      className="flex flex-wrap justify-center gap-2.5"
      role="tablist"
      aria-label="Filter reviews by category"
    >
      {filters.map((filter) => (
        <button
          key={filter}
          role="tab"
          aria-selected={activeFilter === filter}
          onClick={() => setActiveFilter(filter)}
          className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 sm:px-5 sm:py-2.5 sm:text-base ${
            activeFilter === filter
              ? "border-[#2f6b8a] bg-[#2f6b8a] text-white"
              : "border-[#e4e6e3] bg-white text-[#243746] hover:border-[#2f6b8a] hover:bg-[#e8eff1]"
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ message = "No reviews found for this category." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#e4e6e3] bg-white px-5 py-[60px] text-center">
      <Sparkles className="h-8 w-8 text-[#61717b] opacity-50" aria-hidden="true" />
      <p className="max-w-[300px] text-[#61717b]">{message}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div
          key={n}
          className="min-h-[300px] animate-pulse rounded-2xl border border-[#e4e6e3] bg-[#e8eff1]"
        />
      ))}
    </div>
  );
}

// ---------- page ----------
export default function FeedbackPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading] = useState(false);

  // Available filter categories
  const filterCategories = [
    "All",
    "Curated Trips",
    "Adventure & Outdoors",
    "Festivals & Celebrations",
    "Networking & Learning Meetups",
    "Social Gatherings & Parties",
    "Customer Support",
  ];

  // Filter feedback based on active filter
  const filteredFeedback = useMemo(() => {
    if (activeFilter === "All") return SAMPLE_FEEDBACK;
    return SAMPLE_FEEDBACK.filter((f) => f.category === activeFilter);
  }, [activeFilter]);

  return (
    <div className="mx-auto max-w-[1200px] bg-[#fafaf7] px-6 pb-20 pt-20 text-[#243746] [font-family:'Figtree',system-ui,-apple-system,'Segoe_UI',sans-serif] sm:pt-12">
      {/* Hero */}
      <section className="mb-6 sm:mb-10">
        <div className="mx-auto max-w-[900px] text-center">
          <div className="mb-8">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e4e6e3] bg-[#e8eff1] px-4 py-2 text-sm font-semibold text-[#2f6b8a]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Traveler Reviews
            </span>

            <h1 className={`${serifFont} mb-3 text-[clamp(2rem,4vw,3rem)] leading-[1.1]`}>
              What travelers say about Pack&Go
            </h1>

            <p className="mx-auto max-w-[600px] text-lg leading-relaxed text-[#61717b]">
              Real experiences from real travelers. Read verified reviews from our community of explorers.
            </p>
          </div>

          {/* Rating Summary */}
          <div
            className="mb-4 flex flex-col items-center gap-6 rounded-[20px] border border-[#e4e6e3] bg-white p-6 shadow-[0_4px_16px_rgba(20,43,59,0.06)] sm:p-8"
            aria-label="Overall rating summary"
          >
            <div className="flex flex-col items-center gap-3">
              <span className={`${serifFont} text-5xl leading-none sm:text-[4rem]`}>{AVERAGE_RATING}</span>
              {renderStars(Math.round(AVERAGE_RATING), "lg")}
              <p className="text-base text-[#61717b]">Based on {TOTAL_REVIEWS} verified reviews</p>
            </div>

            <div
              className="flex w-full max-w-[400px] flex-col gap-2"
              role="img"
              aria-label="Star rating distribution"
            >
              {[5, 4, 3, 2, 1].map((star) => (
                <StarBar
                  key={star}
                  stars={star}
                  count={STAR_DISTRIBUTION[star] || 0}
                  percentage={
                    TOTAL_REVIEWS > 0 ? ((STAR_DISTRIBUTION[star] || 0) / TOTAL_REVIEWS) * 100 : 0
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* Demo notice */}
        <div className="mx-auto flex w-fit max-w-full items-start gap-2.5 rounded-xl border border-[#e4e6e3] bg-[#e8eff1] px-5 py-3 text-sm text-[#61717b]">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#2f6b8a]" aria-hidden="true" />
          <span>
            <strong className="text-[#243746]">Demo mode:</strong> These are sample reviews to
            demonstrate the feedback page. Real reviews will appear here once travelers start sharing
            their experiences.
          </span>
        </div>
      </section>

      {/* Filters */}
      <section className="mb-8" aria-labelledby="filter-heading">
        <h2 id="filter-heading" className="sr-only">
          Filter reviews by category
        </h2>
        <FilterChips
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          filters={filterCategories}
        />
      </section>

      {/* Reviews Grid */}
      <section className="mb-10" aria-labelledby="reviews-heading">
        <h2
          id="reviews-heading"
          className={`${serifFont} mb-6 flex flex-wrap items-baseline gap-3 text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1]`}
        >
          {activeFilter === "All" ? "All Reviews" : `${activeFilter} Reviews`}
          <span className="text-base text-[#61717b]">({filteredFeedback.length})</span>
        </h2>

        {loading ? (
          <LoadingState />
        ) : filteredFeedback.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            className="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]"
            role="list"
          >
            {filteredFeedback.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-[600px]">
        <div className="rounded-[20px] border border-[#e4e6e3] bg-white p-10 text-center shadow-[0_4px_16px_rgba(20,43,59,0.06)]">
          <Heart className="mx-auto mb-4 h-8 w-8 text-[#c49a55]" aria-hidden="true" />

          <h3 className={`${serifFont} mb-3 text-[clamp(1.5rem,3vw,2rem)]`}>
            Had a great experience with Pack&Go?
          </h3>

          <p className="mx-auto mb-6 max-w-[400px] leading-relaxed text-[#61717b]">
            Share your journey and help fellow travelers make informed decisions.
          </p>

          <Link
            to="/contact-us"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#2f6b8a] px-7 py-3.5 font-bold text-white no-underline shadow-[0_4px_12px_rgba(47,107,138,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#24566f] hover:shadow-[0_8px_20px_rgba(47,107,138,0.3)] motion-reduce:transition-none"
          >
            Write a Review
          </Link>
        </div>
      </section>
    </div>
  );
}