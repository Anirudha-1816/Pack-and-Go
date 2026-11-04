// Flow: show the database trip price -> ask the backend to pay -> check signed status.
// The browser return only requests status; it never proves that payment succeeded.

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createStripeCheckoutSession,
  getPaymentStatus,
} from "../../apis/apiPayments";

const REGULAR_TERMS = [
  "Your booking is confirmed only after payment is complete.",
  "Carry a valid government ID proof on the trip.",
  "Reach the pickup point 15 minutes before the pickup time.",
  "Cancellation and refund follow the Pack&Go cancellation policy.",
  "The plan can change because of weather or road conditions.",
];

// Format the trip's rupee price for the review screen.
const money = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// Format an integer paise amount returned by the payment API.
const moneyFromPaise = (amount, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0) / 100);

// Keep checkout state local while Stripe handles the card form on its hosted page.
// The backend remains responsible for creating the amount and proving payment.
export default function CheckoutModal({ trip, user, onClose, checkoutReturn }) {
  const navigate = useNavigate();
  const payRequestInProgress = useRef(false);
  const [travelerInput, setTravelerInput] = useState("1");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [stage, setStage] = useState(checkoutReturn ? "checking" : "review");
  const [order, setOrder] = useState(
    checkoutReturn ? { bookingId: checkoutReturn.bookingId } : null
  );
  const [message, setMessage] = useState("");

  const travelers = Number(travelerInput);
  const validTravelers =
    Number.isInteger(travelers) && travelers >= 1 && travelers <= 10;
  const estimatedTotal = validTravelers ? Number(trip.pricePerHead) * travelers : 0;
  let displayedTotalPrice = money(estimatedTotal);
  if (order?.amount !== undefined) {
    displayedTotalPrice = moneyFromPaise(order.amount, order.currency);
  }
  const busy = ["creating", "checking", "redirecting"].includes(stage);
  const tripName = `${trip.from} to ${trip.to}`;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Let travelers close the dialog unless a request or redirect is in progress.
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [busy, onClose]);

  // Copy the verified server status into the checkout screen.
  const updatePaymentStatus = useCallback((paymentData) => {
    setOrder((current) => ({ ...current, ...paymentData }));
    if (paymentData.travelers) setTravelerInput(String(paymentData.travelers));

    if (paymentData.paymentStatus === "paid" && paymentData.status === "confirmed") {
      setMessage("");
      setStage("success");
      return;
    }

    if (paymentData.paymentStatus === "failed") {
      setStage("failed");
      setMessage("The payment was not completed. You can safely retry.");
    } else if (checkoutReturn?.outcome === "cancelled") {
      setStage("pending");
      setMessage("Checkout was closed. Your payment may still be processing; check again shortly.");
    } else {
      setStage("pending");
      setMessage("Payment is not confirmed yet. Check again in a moment.");
    }
  }, [checkoutReturn?.outcome]);

  // Ask the backend for status; only the backend's webhook can mark it paid.
  const checkStatus = useCallback(async (bookingId) => {
    if (!bookingId) return;

    setStage("checking");
    setMessage("");

    try {
      const { data } = await getPaymentStatus(bookingId);
      updatePaymentStatus(data.data);
    } catch (error) {
      setStage("pending");
      setMessage(error.response?.data?.message || "Could not check payment status.");
    }
  }, [updatePaymentStatus]);

  useEffect(() => {
    if (!checkoutReturn?.bookingId) return;

    let active = true;
    getPaymentStatus(checkoutReturn.bookingId)
      .then(({ data }) => {
        if (active) updatePaymentStatus(data.data);
      })
      .catch((error) => {
        if (!active) return;
        setStage("pending");
        setMessage(error.response?.data?.message || "Could not check payment status.");
      });

    return () => {
      active = false;
    };
  }, [checkoutReturn?.bookingId, updatePaymentStatus]);

  // Create or resume the Stripe session, then send the traveler to Stripe.
  const handlePay = async () => {
    if (!validTravelers || !acceptedTerms || payRequestInProgress.current) return;

    payRequestInProgress.current = true;
    setStage("creating");
    setMessage("");

    try {
      const { data } = await createStripeCheckoutSession(trip._id, travelers);
      const checkout = data.data;
      setOrder(checkout);
      if (!checkout.checkoutUrl) {
        if (checkout.paymentStatus === "paid" && checkout.status === "confirmed") {
          updatePaymentStatus(checkout);
        } else if (checkout.paymentStatus === "failed") {
          setStage("failed");
        } else {
          setStage("pending");
        }
        if (checkout.paymentStatus !== "paid") {
          setMessage("Payment is not confirmed yet. Check its status before retrying.");
        }
        return;
      }

      setStage("redirecting");
      window.location.assign(checkout.checkoutUrl);
    } catch (error) {
      setStage("failed");
      setMessage(error.response?.data?.message || error.message || "Could not start payment.");
    } finally {
      payRequestInProgress.current = false;
    }
  };

  let terms = REGULAR_TERMS;
  if (trip.termsType === "custom" && trip.customTerms) {
    terms = [trip.customTerms];
  }

  let payButtonLabel = "Retry payment";
  if (!order?.bookingId) {
    payButtonLabel = `Pay ${displayedTotalPrice}`;
  }
  let finalPayButtonLabel = payButtonLabel;
  if (stage === "creating") {
    finalPayButtonLabel = "Preparing checkout…";
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#102c25]/70 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        className="relative max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white text-[#173c32] shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-emerald-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Pack & Go checkout</p>
         
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close checkout"
            className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-lg font-semibold text-emerald-900 transition hover:bg-orange-100 disabled:opacity-50"
          >
            ×
          </button>
        </header>

        {stage === "success" ? (
          <div className="p-6 sm:p-9">
            <div className="mx-auto max-w-xl text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl font-bold text-emerald-700">✓</span>
              <p className="mt-5 text-sm font-bold uppercase tracking-wider text-emerald-700">Payment verified</p>
              <h3 className="mt-2 text-3xl font-bold">You’re going to {trip.to}</h3>
              <p className="mt-2 text-emerald-900/70">Your trip booking is confirmed by Pack & Go.</p>
              <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/60 p-5 text-left">
                <p className="font-bold">{tripName}</p>
                <p className="mt-1 text-sm text-emerald-900/70">
                  {travelers} {travelers === 1 ? "traveler" : "travelers"} · {displayedTotalPrice}
                </p>
                <p className="mt-3 break-all text-xs text-emerald-900/60">Booking reference: {order?.bookingId}</p>
                {order?.paymentReference && (
                  <p className="mt-1 break-all text-xs text-emerald-900/60">Payment reference: {order.paymentReference}</p>
                )}
              </div>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate("/user-dashboard")}
                  className="rounded-lg bg-emerald-800 px-5 py-3 font-semibold text-white transition hover:bg-emerald-900"
                >
                  View my bookings
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="rounded-lg border border-emerald-200 px-5 py-3 font-semibold text-emerald-900 transition hover:bg-emerald-50"
                >
                  Return home
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 p-4 sm:p-7 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="min-w-0">
              <div className="overflow-hidden rounded-xl border border-emerald-100">
                <div className="relative h-48 bg-emerald-900 sm:h-56">
                  <img
                    src={trip.banner?.url || trip.thumbnail?.url}
                    alt={`${tripName} trip`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#082b21]/85 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white sm:bottom-5 sm:left-5">
                    
                    <h3 className="mt-1 text-2xl font-bold sm:text-3xl">{tripName}</h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-4 p-4 text-sm sm:grid-cols-4">
                  <div><p className="text-emerald-900/55">Date</p><p className="mt-1 font-semibold">{new Date(trip.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p></div>
                  <div><p className="text-emerald-900/55">Duration</p><p className="mt-1 font-semibold">{trip.duration} days / {trip.duration - 1} nights</p></div>
                  <div><p className="text-emerald-900/55">Pickup</p><p className="mt-1 font-semibold">{trip.pickupTime} · {trip.pickupLocation}</p></div>
                  <div><p className="text-emerald-900/55">Drop</p><p className="mt-1 font-semibold">{trip.dropTime} · {trip.dropLocation}</p></div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-emerald-100 p-4 sm:p-5">
                <h3 className="font-bold">Traveler</h3>
                <p className="mt-2 font-semibold">{user?.fullName || "Signed-in traveler"}</p>
                <p className="text-sm text-emerald-900/65">{user?.email}</p>
              </div>

              {(stage === "pending" || stage === "failed") && (
                <div
                  role="status"
                  className={`mt-5 rounded-xl border p-4 ${stage === "failed" ? "border-red-200 bg-red-50 text-red-900" : "border-orange-200 bg-orange-50 text-orange-950"}`}
                >
                  <p className="font-bold">{stage === "failed" ? "Payment not confirmed" : "Payment pending"}</p>
                  <p className="mt-1 text-sm">{message}</p>
                  {order?.bookingId && (
                    <button type="button" onClick={() => checkStatus(order.bookingId)} className="mt-3 text-sm font-bold underline underline-offset-2">
                      Check payment status
                    </button>
                  )}
                </div>
              )}

              {stage === "creating" && <p className="mt-4 text-sm font-semibold text-emerald-800">Preparing your secure payment order…</p>}
              {stage === "redirecting" && <p className="mt-4 text-sm font-semibold text-emerald-800">Redirecting to secure Stripe Checkout…</p>}
              {stage === "checking" && <p className="mt-4 text-sm font-semibold text-emerald-800">Checking the latest payment status…</p>}
            </div>

            <aside className="rounded-xl bg-[#f2f7f4] p-4 sm:p-5">
              <h3 className="text-lg font-bold">Booking summary</h3>
              <label className="mt-5 block text-sm font-semibold" htmlFor="traveler-count">Number of travelers</label>
              <input
                id="traveler-count"
                type="number"
                min="1"
                max="10"
                step="1"
                inputMode="numeric"
                value={travelerInput}
                onChange={(event) => setTravelerInput(event.target.value)}
                disabled={busy || Boolean(order?.bookingId)}
                className="mt-2 w-full rounded-lg border border-emerald-200 bg-white px-3 py-3 text-base font-semibold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-emerald-50"
              />
              {!validTravelers && <p className="mt-2 text-sm text-red-700">Enter a whole number from 1 to 10.</p>}

              <div className="mt-5 space-y-3 border-t border-emerald-200 pt-4 text-sm">
                <div className="flex justify-between gap-3"><span>Price per person</span><strong>{money(trip.pricePerHead)}</strong></div>
                <div className="flex justify-between gap-3"><span>Travelers</span><strong>{validTravelers ? travelers : "—"}</strong></div>
                <div className="flex justify-between gap-3 border-t border-emerald-200 pt-3 text-base"><span className="font-bold">Total payable</span><strong className="text-xl text-emerald-900">{displayedTotalPrice}</strong></div>
              </div>

              <details className="mt-5 rounded-lg border border-emerald-200 bg-white p-3 text-sm">
                <summary className="cursor-pointer font-semibold">Trip terms</summary>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-emerald-900/75">
                  {terms.map((term) => <li key={term}>{term}</li>)}
                </ul>
              </details>

              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-5">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  disabled={busy}
                  className="mt-1 h-4 w-4 accent-emerald-800"
                />
                <span>I have read and accept the trip terms.</span>
              </label>

              <button
                type="button"
                onClick={handlePay}
                disabled={!validTravelers || !acceptedTerms || busy}
                className="mt-5 w-full rounded-lg bg-orange-600 px-4 py-3.5 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-emerald-900/30"
              >
                {finalPayButtonLabel}
              </button>
              <p className="mt-3 text-center text-xs text-emerald-900/55">
                Secure payment powered by Stripe
              </p>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}