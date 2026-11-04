// Flow: trip in MongoDB -> booking in MongoDB -> Stripe Checkout -> signed
// webhook -> booking status update. The browser return never proves payment.
//
// A Stripe Checkout session is the hosted payment page for one booking.
// The signed webhook is Stripe's verified server-to-server payment message.
// Metadata is a small label attached to a Stripe session; here it holds bookingId.
// payment_intent is Stripe's ID for the payment itself.
// An idempotency key tells Stripe to return the same result for a repeated call.

import mongoose from "mongoose";
import Bookings from "../models/Bookings/bookingModel.js";
import Trip from "../models/components/tripModel.js";
import { getClientUrl, getStripe, getStripeWebhookSecret } from "../configs/stripe.js";
import paymentError from "../utils/paymentError.js";
import statusCode from "../utils/statusCodes.js";
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  getPaymentPrice,
  isTripDateAvailable,
  validateBookingId,
  validateCreatePayment,
} from "../utils/paymentUtils.js";

// Return the exact small response used by payment-status screens.
const paymentStatusData = (booking) => ({
  bookingId: booking._id,
  status: booking.status,
  paymentStatus: booking.paymentStatus,
  travelers: booking.travelers,
  amount: booking.amount,
  currency: booking.currency,
  paymentReference: booking.paymentReference,
});

// Return the values needed to open the saved Stripe Checkout session.
const checkoutData = (booking, session) => ({
  bookingId: booking._id,
  checkoutSessionId: session.id,
  checkoutUrl: session.url,
  amount: booking.amount,
  currency: booking.currency,
  travelers: booking.travelers,
});

// Find an open booking, reject a duplicate paid booking, or save a new one.
// The database price is used so a browser cannot choose the amount.
const findOrCreateBooking = async (userId, trip, travelers) => {
  const activeQuery = {
    user: userId,
    trip: trip._id,
    travelers,
    status: BOOKING_STATUS.PENDING,
    paymentStatus: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.FAILED] },
  };
  const activeBooking = await Bookings.findOne(activeQuery).sort({ updatedAt: -1 });
  if (activeBooking) {
    return { booking: activeBooking, created: false };
  }

  const paidBooking = await Bookings.findOne({
    user: userId,
    trip: trip._id,
    travelers,
    status: { $ne: BOOKING_STATUS.CANCELLED },
    paymentStatus: PAYMENT_STATUS.PAID,
  });
  if (paidBooking) {
    throw paymentError("This booking has already been paid.", statusCode.CONFLICT);
  }

  const savedPrice = getPaymentPrice(trip.pricePerHead, travelers);
  try {
    const booking = await Bookings.create({
      user: userId,
      trip: trip._id,
      travelers,
      amount: savedPrice.amount,
      currency: savedPrice.currency,
      status: BOOKING_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
    });
    return { booking, created: true };
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    // A second fast request may have created the unique active booking first.
    const booking = await Bookings.findOne(activeQuery).sort({ updatedAt: -1 });
    if (!booking) {
      throw error;
    }
    return { booking, created: false };
  }
};

// Mark an expired or failed session so the next Pay request can start a new try.
// The session ID check makes a repeated old webhook harmless.
const markSessionFailed = async (bookingId, sessionId) => {
  return Bookings.updateOne(
    {
      _id: bookingId,
      stripeSessionId: sessionId,
      paymentStatus: { $ne: PAYMENT_STATUS.PAID },
    },
    {
      $set: { paymentStatus: PAYMENT_STATUS.FAILED },
      $unset: { stripeSessionId: "" },
      $inc: { stripeSessionGeneration: 1 },
    }
  );
};

// "Do we already have a usable Stripe checkout session for this booking, or do we need to create a new one?"
// A complete but unpaid session stays pending until Stripe sends another event.
const getOpenCheckout = async (stripe, booking) => {
  if (!booking.stripeSessionId) {
    return null;
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
  } catch {
    throw paymentError(
      "Could not check the existing Stripe session. Please retry.",
      statusCode.BAD_GATEWAY
    );
  }

  if (session.status === "open" && session.url) {
    return {
      ...checkoutData(booking, session),
      resumed: true,
    };
  }

  if (session.status === "complete") {
    return {
      ...paymentStatusData(booking),
      resumed: true,
      pendingConfirmation: booking.paymentStatus !== PAYMENT_STATUS.PAID,
    };
  }

  await markSessionFailed(booking._id, session.id);
  const latestBooking = await Bookings.findById(booking._id);
  if (latestBooking) {
    if (latestBooking.paymentStatus === PAYMENT_STATUS.PAID) {
      return {
        ...paymentStatusData(latestBooking),
        resumed: true,
        pendingConfirmation: false,
      };
    }
    if (
      latestBooking.stripeSessionId &&
      latestBooking.stripeSessionId !== session.id
    ) {
      return getOpenCheckout(stripe, latestBooking);
    }
    booking.paymentStatus = latestBooking.paymentStatus;
    booking.stripeSessionGeneration = latestBooking.stripeSessionGeneration;
    booking.stripeSessionId = latestBooking.stripeSessionId;
  } else {
    booking.paymentStatus = PAYMENT_STATUS.FAILED;
    booking.stripeSessionGeneration += 1;
    booking.stripeSessionId = undefined;
  }
  return null;
};

// Check the trip and create or resume its Stripe Checkout session.
// Only this service reads the saved trip price and amount from MongoDB.  
export const createStripeCheckoutSession = async (userId, body) => {
  // Step 1: validate the user and the browser-selected trip and traveler count.
  const input = validateCreatePayment(userId, body);
  const trip = await Trip.findById(input.tripId);


  if (!trip) {
    throw paymentError("Trip not found.", statusCode.NOT_FOUND);
  }
  if (trip.isActive === false) {
    throw paymentError("This trip is not available.", statusCode.GONE);
  }
  if (!isTripDateAvailable(trip.date)) {
    throw paymentError("This trip date has passed.", statusCode.GONE);
  }

  // Step 2: reuse an eligible booking or save a new booking.
  const stripe = getStripe();
  const bookingResult = await findOrCreateBooking(
    input.userId,
    trip,
    input.travelers
  );
  const booking = bookingResult.booking;
  const savedSession = await getOpenCheckout(stripe, booking);
  if (savedSession) {
    return savedSession;
  }

  // Step 3: ask Stripe for a session using the saved integer amount.
  const clientUrl = getClientUrl();
  const idempotencyKey =
    `booking-${booking._id}-checkout-${booking.stripeSessionGeneration}`;
  let travelerDescription = `${booking.travelers} travelers`;
  if (booking.travelers === 1) {
    travelerDescription = "1 traveler";
  }
  let session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [{
          price_data: {
            currency: booking.currency.toLowerCase(),
            unit_amount: booking.amount,
            product_data: {
              name: `${trip.from} to ${trip.to}`,
              description: travelerDescription,
            },
          },
          quantity: 1,
        }],
        metadata: { bookingId: booking._id.toString() },
        success_url: `${clientUrl}/trip/${trip._id}?checkout=success&bookingId=${booking._id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/trip/${trip._id}?checkout=cancelled&bookingId=${booking._id}`,
      },
      { idempotencyKey }
    );
  } catch (error) {
    console.error("[stripe checkout] Session creation failed.", {
      type: error.type,
      code: error.code,
      parameter: error.param,
      requestId: error.requestId,
      message: error.message,
    });
    throw paymentError(
      "Could not create a Stripe checkout session. Please try again.",
      statusCode.BAD_GATEWAY
    );
  }

  // Step 4: save the session ID so another Pay request can resume it.
  await Bookings.updateOne(
    {
      _id: booking._id,
      paymentStatus: { $ne: PAYMENT_STATUS.PAID },
    },
    {
      $set: {
        stripeSessionId: session.id,
        paymentStatus: PAYMENT_STATUS.PENDING,
      },
    }
  );
  const savedBooking = await Bookings.findById(booking._id);
  if (!savedBooking) {
    throw paymentError("The booking could not be found after checkout setup.");
  }
  if (savedBooking.paymentStatus === PAYMENT_STATUS.PAID) {
    return {
      ...paymentStatusData(savedBooking),
      resumed: true,
      pendingConfirmation: false,
    };
  }

  return {
    ...checkoutData(savedBooking, session),
    resumed: !bookingResult.created,
  };
};

// Return only the signed-in user's saved payment status.
export const getPaymentStatus = async (userId, bookingId) => {
  validateBookingId(bookingId);

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw paymentError("Please log in to check this booking.", statusCode.UNAUTHORIZED);
  }

  const booking = await Bookings.findOne({ _id: bookingId, user: userId }).lean();
  if (!booking) {
    throw paymentError("Booking not found.", statusCode.NOT_FOUND);
  }

  return paymentStatusData(booking);
};

// Apply a successful signed Stripe event without trusting the browser redirect.
// A payment_intent is Stripe's reference for the payment itself.
const completeCheckout = async (session) => {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    console.warn("[stripe webhook] Completed session has no booking ID.");
    return;
  }

  const booking = await Bookings.findById(bookingId);
  if (!booking) {
    console.warn(`[stripe webhook] Booking ${bookingId} was not found.`);
    return;
  }
  if (booking.paymentStatus === PAYMENT_STATUS.PAID) {
    console.log(`[stripe webhook] Booking ${bookingId} is already paid.`);
    return;
  }
  if (booking.stripeSessionId && booking.stripeSessionId !== session.id) {
    console.warn(`[stripe webhook] Ignored old session for booking ${bookingId}.`);
    return;
  }
  if (session.payment_status !== "paid") {
    console.log(`[stripe webhook] Session ${session.id} is not paid yet.`);
    return;
  }

  const amountMatches = session.amount_total === booking.amount;
  const currencyMatches =
    typeof session.currency === "string" &&
    session.currency.toUpperCase() === booking.currency;
  if (!amountMatches || !currencyMatches) {
    console.error("[stripe webhook] Payment amount or currency did not match booking.", {
      bookingId: booking._id.toString(),
      expectedAmount: booking.amount,
      receivedAmount: session.amount_total,
      expectedCurrency: booking.currency,
      receivedCurrency: session.currency,
    });
    await Bookings.updateOne(
      { _id: booking._id },
      { $set: { paymentReviewRequired: true } }
    );
    return;
  }

  booking.status = BOOKING_STATUS.CONFIRMED;
  booking.paymentStatus = PAYMENT_STATUS.PAID;
  if (typeof session.payment_intent === "string") {
    booking.paymentReference = session.payment_intent;
  } else {
    booking.paymentReference = session.id;
  }
  booking.stripeSessionId = session.id;
  await booking.save();
  console.log(`[stripe webhook] Booking ${bookingId} confirmed.`);
};

// Mark a session as failed unless it has already been paid or replaced.
const failCheckout = async (session, eventType) => {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    console.warn(`[stripe webhook] ${eventType} session has no booking ID.`);
    return;
  }

  const result = await markSessionFailed(bookingId, session.id);
  if (result.modifiedCount > 0) {
    console.log(`[stripe webhook] Checkout session ${session.id} failed.`);
  }
};

// Verify the signature and process the payment events sent directly by Stripe.
// Returning success for a repeated event prevents Stripe from retrying it forever.
export const handleStripeWebhook = async (rawBody, signature) => {
  const stripe = getStripe();
  const webhookSecret = getStripeWebhookSecret(); 
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    throw paymentError("Invalid Stripe webhook signature.", statusCode.BAD_REQUEST);
  }

  console.log(`[stripe webhook] Received ${event.type}.`);
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    await completeCheckout(event.data.object);
  } else if (event.type === "checkout.session.expired") {
    await failCheckout(event.data.object, event.type);
  } else if (event.type === "checkout.session.async_payment_failed") {
    await failCheckout(event.data.object, event.type);
  } else {
    console.log(`[stripe webhook] Ignored ${event.type}.`);
  }

  return { received: true };
};
