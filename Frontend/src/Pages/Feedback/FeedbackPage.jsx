import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Star,
  MapPin,
  Calendar,
  MessageSquare,
  CheckCircle,
  Sparkles,
  Shield,
  Heart,
  Pen,
  Trash2,
  X,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import useAuthStore from "../../Stores/authStore";
import apiFeedback from "../../apis/apiFeedback";
import styles from "./FeedbackPage.module.css";

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
    "Curated Trips": "bg-teal-100 text-teal-800",
    "Adventure & Outdoors": "bg-orange-100 text-orange-800",
    "Festivals & Celebrations": "bg-pink-100 text-pink-800",
    "Networking & Learning Meetups": "bg-blue-100 text-blue-800",
    "Social Gatherings & Parties": "bg-purple-100 text-purple-800",
    "Customer Support": "bg-green-100 text-green-800",
  };
  return colors[category] || "bg-slate-100 text-slate-800";
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
          className={`${sizeClasses[size]} ${
            i < rating ? "text-amber-400 fill-amber-400" : "text-slate-300"
          }`}
        />
      ))}
    </span>
  );
};

// ---------- small components ----------

function ReviewCard({ review, isMyReview, onEdit, onDelete }) {
  return (
    <article className={styles.reviewCard}>
      <div className={styles.reviewHeader}>
        <div className="flex items-center gap-3">
          <div className={styles.avatar}>
            {review.user?.profileImage ? (
              <img src={review.user.profileImage} alt="" />
            ) : (
              getInitials(review.user?.fullName || review.reviewer?.name || "User")
            )}
          </div>
          <div>
            <p className={styles.reviewerName}>
              {review.user?.fullName || review.reviewer?.name || "Traveler"}
            </p>
            <p className={styles.reviewerMeta}>
              <MapPin className={styles.metaIcon} aria-hidden="true" />
              {review.user?.city || review.reviewer?.location || "Unknown"}
              <span className="mx-2" aria-hidden="true">·</span>
              <Calendar className={styles.metaIcon} aria-hidden="true" />
              {formatDate(review.createdAt || review.date)}
            </p>
          </div>
        </div>
        <div className={styles.ratingRow}>
          <span className={styles.ratingValue}>{review.rating.toFixed(1)}</span>
          {renderStars(review.rating, "sm")}
        </div>
      </div>

      {review.title && (
        <h3 className={styles.reviewTitle}>{review.title}</h3>
      )}

      <p className={styles.reviewText}>{review.description}</p>

      {review.trip && (
        <div className={styles.tripInfo}>
          <span className={styles.tripBadge}>
            Trip: {review.trip.title || `${review.trip.from} → ${review.trip.to}`}
          </span>
        </div>
      )}

      <div className={styles.reviewFooter}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getCategoryColor(review.category)}`}>
            {review.category}
          </span>
          {review.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 px-2.5 py-1 text-xs font-semibold" title="Verified booking">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Verified
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
          <MessageSquare className={styles.helpfulIcon} aria-hidden="true" />
          <span>{review.helpful || 0} helpful</span>
        </div>
      </div>

      {isMyReview && (
        <div className={styles.myReviewActions}>
          <button
            type="button"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            onClick={() => onEdit(review)}
          >
            Edit
          </button>
          <button
            type="button"
            className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline ml-4"
            onClick={() => onDelete(review)}
          >
            Delete
          </button>
        </div>
      )}
    </article>
  );
}

function StarBar({ stars, count, total, percentage }) {
  return (
    <div className={styles.starBar}>
      <div className={styles.starBarLeft}>
        {renderStars(stars, "sm")}
        <span className={styles.starBarCount}>{count} reviews</span>
      </div>
      <div className={styles.starBarProgress}>
        <div
          className={styles.starBarFill}
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
    <div className={styles.filterChips} role="tablist" aria-label="Filter reviews by category">
      {filters.map((filter) => (
        <button
          key={filter}
          role="tab"
          aria-selected={activeFilter === filter}
          onClick={() => setActiveFilter(filter)}
          className={`${styles.filterChip} ${activeFilter === filter ? styles.active : ""}`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ message = "No reviews found for this category." }) {
  return (
    <div className={styles.emptyState}>
      <Sparkles className={styles.emptyIcon} aria-hidden="true" />
      <p className={styles.emptyText}>{message}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className={styles.grid}>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div key={n} className={`${styles.reviewCard} ${styles.skeleton}`} />
      ))}
    </div>
  );
}

function WriteReviewModal({ open, onClose, onSubmit, userReviews, loading }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { rating: 0, title: "", description: "", category: "Curated Trips" },
  });

  const selectedRating = watch("rating");
  const isEditing = watch("editing");
  const editingId = watch("editingId");

  const onCloseHandler = () => {
    reset({
      rating: 0,
      title: "",
      description: "",
      category: "Curated Trips",
      editing: false,
      editingId: null,
    });
    onClose();
  };

  const onFormSubmit = async (data) => {
    try {
      await onSubmit(data);
      onCloseHandler();
    } catch (err) {
      // Error handled in onSubmit
    }
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => e.key === "Escape" && onCloseHandler();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCloseHandler]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="absolute inset-0" onClick={onCloseHandler} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onCloseHandler}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={24} />
        </button>

        <h2 className="mb-6 text-xl font-semibold text-slate-900">
          {isEditing ? "Edit Your Review" : "Write a Review"}
        </h2>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Your Rating <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-2" role="radiogroup" aria-label="Select rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={selectedRating === star}
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  onClick={() => register("rating").onChange({ target: { value: star } })}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all
                    ${selectedRating === star
                      ? "border-amber-400 bg-amber-50"
                      : "border-slate-200 hover:border-amber-300"}
                  `}
                >
                  <Star
                    className={`h-8 w-8 ${selectedRating >= star ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium text-slate-600">{star}</span>
                </button>
              ))}
            </div>
            {errors.rating && (
              <p className="mt-1 text-xs text-red-600">{errors.rating.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title (optional)</label>
            <input
              {...register("title", { maxLength: 200 })}
              type="text"
              placeholder="Summarize your experience in a few words"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Your Experience <span className="text-red-500">*</span></label>
            <textarea
              {...register("description", {
                required: "Please share your experience",
                minLength: { value: 10, message: "Review must be at least 10 characters" },
                maxLength: 5000,
              })}
              rows={5}
              placeholder="Tell others about your experience... What did you like? What could be improved?"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm resize-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
            <p className="mt-1 text-xs text-slate-400 text-right">
              {watch("description")?.length || 0} / 5000 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <select
              {...register("category")}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              <option value="Curated Trips">Curated Trips</option>
              <option value="Adventure & Outdoors">Adventure & Outdoors</option>
              <option value="Festivals & Celebrations">Festivals & Celebrations</option>
              <option value="Networking & Learning Meetups">Networking & Learning Meetups</option>
              <option value="Social Gatherings & Parties">Social Gatherings & Parties</option>
              <option value="Customer Support">Customer Support</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCloseHandler}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- page ----------
export default function FeedbackPage() {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { user: authUser, isAuthenticated } = useAuthStore();

  const filterCategories = [
    "All",
    "Curated Trips",
    "Adventure & Outdoors",
    "Festivals & Celebrations",
    "Networking & Learning Meetups",
    "Social Gatherings & Parties",
    "Customer Support",
  ];

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await apiFeedback.get("/stats");
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        sortBy,
      });
      if (activeFilter !== "All") params.append("category", activeFilter);
      const res = await apiFeedback.get(`/?${params.toString()}`);
      if (res.data.success) {
        setReviews(res.data.data);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reviews");
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter, sortBy]);

  useEffect(() => {
    fetchStats();
    fetchReviews();
  }, [fetchStats, fetchReviews]);

  // Handle write review submit
  const handleWriteReview = async (data) => {
    setSubmitting(true);
    try {
      if (editingReview) {
        await apiFeedback.put(`/${editingReview._id}`, data);
        toast.success("Review updated successfully! It will be re-reviewed by admin.");
      } else {
        await apiFeedback.post("/", data);
        toast.success("Review submitted successfully! It will appear after admin approval.");
      }
      setWriteModalOpen(false);
      setEditingReview(null);
      fetchReviews();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
      throw err; // Re-throw to prevent modal close
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setWriteModalOpen(true);
  };

  const handleDelete = async (review) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    setDeletingId(review._id);
    try {
      await apiFeedback.delete(`/${review._id}`);
      toast.success("Review deleted successfully");
      fetchReviews();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete review");
    } finally {
      setDeletingId(null);
    }
  };

  // Pre-fill form when editing
  useEffect(() => {
    // This would need to be handled via the form's reset or defaultValues
    // For simplicity, we'll use the editingReview state in the modal
  }, [editingReview]);

  const filteredReviews = reviews.filter((r) => {
    if (activeFilter === "All") return true;
    return r.category === activeFilter;
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f7fbfa]">
        <section className="mx-auto max-w-[1200px] bg-[#f7fbfa] px-6 pb-20 pt-20 text-[#0b2530] [font-family:'Figtree',system-ui,-apple-system,'Segoe_UI',sans-serif] sm:pt-12">
          {/* Hero */}
          <section className="mb-6 sm:mb-10">
            <div className="mx-auto max-w-[900px] text-center">
              <div className="mb-8">
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-blue-600">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Traveler Reviews
                </span>

                <h1 className="font-serif font-normal mb-3 text-[clamp(2rem,4vw,3rem)] leading-[1.1] text-slate-900">
                  What travelers say about Pack&Go
                </h1>

                <p className="mx-auto max-w-[600px] text-lg leading-relaxed text-slate-500">
                  Real experiences from real travelers. Read verified reviews from our community of explorers.
                </p>
              </div>

              {/* Rating Summary */}
              <div className="mb-4 flex flex-col items-center gap-6 rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-label="Overall rating summary">
                <div className="flex flex-col items-center gap-3">
                  <span className="font-serif font-normal text-5xl leading-none text-slate-900 sm:text-[4rem]">
                    {stats.averageRating || 0}
                  </span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-8 w-8 ${i < Math.round((stats?.averageRating || 0)) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                      />
                    ))}
                  </div>
                  <p className="text-base text-slate-500">
                    Based on {stats?.totalReviews || 0} verified reviews
                  </p>
                </div>

                <div className="flex w-full max-w-[400px] flex-col gap-2" role="img" aria-label="Star rating distribution">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = (stats?.distribution?.[star] || 0);
                    const percentage = stats.totalReviews > 0 ? ((stats.distribution?.[star] || 0) / stats.totalReviews) * 100 : 0;
                    return (
                      <div
                        key={star}
                        className="grid grid-cols-[88px_1fr] items-center gap-3 sm:grid-cols-[88px_80px_1fr]"
                      >
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 shrink-0 ${i < star ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                          />
                        ))}
                        <span className="hidden whitespace-nowrap text-sm text-slate-500 sm:block">
                          {stats?.distribution?.[star] || 0} reviews
                        </span>
                        <div className="h-2 min-w-0 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-amber-500 transition-[width] duration-500 ease-out motion-reduce:transition-none"
                            style={{ width: `${percentage}%` }}
                            role="progressbar"
                            aria-valuenow={percentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Demo notice */}
            {false && (
              <div className="mx-auto flex w-fit max-w-full items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-500">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                <span>
                  <strong className="text-slate-900">Demo mode:</strong> These are sample reviews to
                  demonstrate the feedback page. Real reviews will appear here once travelers start sharing
                  their experiences.
                </span>
              </div>
            )}
          </section>

          {/* Filters */}
          <section className="mb-8" aria-labelledby="filter-heading">
            <h2 id="filter-heading" className="sr-only">
              Filter reviews by category
            </h2>
            <div className="flex flex-wrap justify-center gap-2.5" role="tablist" aria-label="Filter reviews by category">
              {[
                "All",
                "Curated Trips",
                "Adventure & Outdoors",
                "Festivals & Celebrations",
                "Networking & Learning Meetups",
                "Social Gatherings & Parties",
                "Customer Support",
              ].map((filter) => (
                <button
                  key={filter}
                  role="tab"
                  aria-selected={activeFilter === filter}
                  onClick={() => {
                    setActiveFilter(filter);
                    setPage(1);
                  }}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 sm:px-5 sm:py-2.5 sm:text-base ${
                    activeFilter === filter
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </section>

          {/* Sort */}
          <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
            <label className="text-sm font-medium text-slate-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </select>
          </div>

          {/* Reviews Grid */}
          <section aria-labelledby="reviews-heading">
            <h2 className="flex flex-wrap items-baseline gap-3 text-2xl font-bold text-slate-900 mb-6">
              {activeFilter === "All" ? "All Reviews" : `${activeFilter} Reviews`}
              <span className="text-base text-slate-500">({reviews.length})</span>
            </h2>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="min-h-[300px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-16 text-center">
                <Sparkles className="h-8 w-8 text-slate-400 opacity-50" aria-hidden="true" />
                <p className="max-w-[300px] text-slate-500">
                  No reviews found for this category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]" role="list">
                {reviews.map((review) => (
                  <article
                    key={review._id}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-600/30 hover:shadow-lg motion-reduce:transition-none"
                  >
                    <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 font-bold text-blue-600">
                          {review.user?.profileImage ? (
                            <img src={review.user?.profileImage} alt="" className="h-full w-full object-cover" />
                          ) : (
                            review.user?.fullName
                              ? review.user.fullName
                                  .split(" ")
                                  .map((w) => w[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()
                              : review.reviewer?.name
                              ? review.reviewer.name
                                  .split(" ")
                                  .map((w) => w[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()
                              : "U"
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="mb-0.5 font-semibold text-slate-900">
                            {review.user?.fullName || review.reviewer?.name || "Traveler"}
                          </p>
                          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-slate-500">
                            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {review.user?.city || review.reviewer?.location || "Unknown"}
                            <span aria-hidden="true">·</span>
                            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {new Date(review.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                        <span className="text-lg font-semibold text-blue-600">{review.rating.toFixed(1)}</span>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 shrink-0 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                          />
                        ))}
                      </div>
                    </div>

                    {review.title && (
                      <h3 className="mb-3 text-lg font-semibold text-slate-900">{review.title}</h3>
                    )}

                    <p className="mb-5 leading-[1.7] text-slate-700">{review.description}</p>

                    {review.trip && (
                      <div className="mb-4 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
                        <p className="text-sm font-medium text-blue-800">
                          Trip: {review.trip.title || `${review.trip.from} → ${review.trip.to}`}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          review.category === "Curated Trips" ? "bg-teal-100 text-teal-800" :
                          review.category === "Adventure & Outdoors" ? "bg-orange-100 text-orange-800" :
                          review.category === "Festivals & Celebrations" ? "bg-pink-100 text-pink-800" :
                          review.category === "Networking & Learning Meetups" ? "bg-blue-100 text-blue-800" :
                          review.category === "Social Gatherings & Parties" ? "bg-purple-100 text-purple-800" :
                          review.category === "Customer Support" ? "bg-green-100 text-green-800" :
                          "bg-slate-100 text-slate-800"
                        }`}>
                          {review.category}
                        </span>

                        {review.verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 px-2.5 py-1 text-xs font-semibold" title="Verified booking">
                            <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            Verified
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                        <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{review.helpful || 0} helpful</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            page === pageNum
                              ? "bg-blue-600 text-white"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* CTA Section */}
          <section className="mx-auto max-w-[600px] mt-16">
            <div className="rounded-[20px] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Heart className="mx-auto mb-4 h-8 w-8 text-amber-500" aria-hidden="true" />
              <h3 className="font-serif font-normal mb-3 text-[clamp(1.5rem,3vw,2rem)] text-slate-900">
                Had a great experience with Pack&Go?
              </h3>
              <p className="mx-auto mb-6 max-w-[400px] leading-relaxed text-slate-500">
                Share your journey and help fellow travelers make informed decisions.
              </p>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate("/login", { state: { from: "/feedback" } });
                  } else {
                    setWriteModalOpen(true);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-blue-600 px-7 py-3.5 font-bold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
              >
                Write a Review
              </button>
            </div>
          </section>
        </section>
      </main>
      <Footer />

      {/* Write Review Modal */}
      <WriteReviewModal
        open={!!writeModalOpen || !!editingReview}
        onClose={() => {
          setWriteModalOpen(false);
          setEditingReview(null);
        }}
        onSubmit={async (data) => {
          // This will be handled by the parent
        }}
        userReviews={reviews}
        loading={submitting}
      />

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="absolute inset-0" onClick={() => setEditingReview(null)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setEditingReview(null)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={24} />
            </button>

            <h2 className="mb-6 text-xl font-semibold text-slate-900">Edit Your Review</h2>

            <form className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Your Rating <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2" role="radiogroup" aria-label="Select rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={editingReview.rating === star}
                      aria-label={`${star} star${star > 1 ? "s" : ""}`}
                      onClick={() => {
                        // Would need form state management here
                        // For simplicity, we'll use the main modal
                      }}
                      className={`
                        flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all
                        ${editingReview.rating === star
                          ? "border-amber-400 bg-amber-50"
                          : "border-slate-200 hover:border-amber-300"}
                      `}
                    >
                      <Star
                        className={`h-8 w-8 ${editingReview.rating >= star ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                        aria-hidden="true"
                      />
                      <span className="text-xs font-medium text-slate-600">{star}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default FeedbackPage;