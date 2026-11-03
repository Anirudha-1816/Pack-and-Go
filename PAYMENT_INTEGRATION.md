# Pack & Go Payments

## Architecture

The customer trip page opens an in-page checkout dialog with Razorpay and Stripe as payment options. The browser sends only the trip ID and traveler count. The backend reads the trip price and saves a booking price snapshot. Provider secrets stay on the backend.

Booking and payment updates use conditional MongoDB writes and compensation rather than transactions. This avoids assuming that the configured MongoDB deployment supports transactions. If Razorpay creates an order but the database cannot store its ID, the payment record is flagged for reconciliation and its receipt is retained.

## Lifecycle

- A booking starts as `pending` with `paymentStatus: pending` and an immutable `pricing` snapshot.
- A payment attempt starts as `created`; failed attempts remain in the history and a retry reuses the same booking and price snapshot.
- An authorized payment is captured by the backend. A booking becomes `confirmed` only after Razorpay reports `captured`.
- A failed payment leaves the booking pending and marks its payment status failed.
- A failed webhook cannot downgrade a captured payment. A second captured payment for an already-paid booking triggers an automatic refund attempt and is flagged for reconciliation if the refund cannot be confirmed.
- Full refunds set the payment and booking to `refunded`; partial refunds are recorded without marking the booking fully refunded.

## Endpoints

All URLs below are relative to the backend host.

### Create or resume an order

`POST /api/payments/create-order` requires the existing JWT cookie.

```json
{
  "tripId": "507f1f77bcf86cd799439011",
  "travelers": 2
}
```

The backend calculates `pricePerHead * travelers`; client-supplied prices are ignored. The response includes `bookingId`, `orderId`, `receipt`, `amount` in paise, `currency`, `keyId`, traveler count, pricing snapshot, and rupee `totalPrice`. Repeating the request resumes the active order or creates another attempt for the same booking.

### Verify payment

`POST /api/payments/verify` requires the JWT cookie.

```json
{
  "razorpay_order_id": "order_test_id",
  "razorpay_payment_id": "pay_test_id",
  "razorpay_signature": "checkout_signature"
}
```

The backend validates the signature, ownership, fetched Razorpay order, amount, and currency. It captures authorized payments and confirms a booking only after a captured state. HTTP `202` means the payment is not confirmed yet; query its status instead of displaying success.

### Create a Stripe Checkout Session

`POST /api/payments/create-checkout-session` requires the existing JWT cookie and accepts the same body as the Razorpay order endpoint:

```json
{
  "tripId": "507f1f77bcf86cd799439011",
  "travelers": 2
}
```

The backend calculates the total from the saved booking price and returns `bookingId`, `checkoutSessionId`, `checkoutUrl`, amount in paise, and currency. The customer browser redirects to `checkoutUrl`; Stripe webhooks, not the success redirect, confirm the booking.

### Get booking payment status

`GET /api/payments/status/:bookingId` requires the JWT cookie and only returns the signed-in user's booking and attempts, including its traveler count, payment reference, and latest provider attempt.

### Razorpay webhook

`POST /api/payments/webhook` uses the original raw JSON body and `x-razorpay-signature`; it does not use JWT authentication. Configure these Razorpay events: `payment.authorized`, `payment.captured`, `payment.failed`, `refund.processed`, and `refund.failed`.

### Stripe webhook

`POST /api/payments/stripe/webhook` uses the original raw JSON body and `stripe-signature`; it does not use JWT authentication. Configure `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `payment_intent.payment_failed`, and `charge.refunded`.

Existing booking history remains available at `GET /booking/get` with the JWT cookie.
Admins can review all bookings at `GET /booking/admin/get`; it requires the JWT cookie and an admin role.

## Environment

Copy `Backend/.env.example` to a private `Backend/.env` and set the existing application variables. Stripe uses `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `CLIENT_URL`. Use only Stripe test keys. Hosted Checkout does not require the publishable key in frontend code. Keep all secrets out of Vite variables and do not commit a real `.env` file.

For local Stripe webhook testing, run `stripe listen --forward-to localhost:8080/api/payments/stripe/webhook`, then place the webhook signing secret printed by Stripe CLI into `STRIPE_WEBHOOK_SECRET` in the private backend `.env`. Set `CLIENT_URL=http://localhost:5173` for local return URLs. The Razorpay configuration variables remain available for the existing flow.

Missing Razorpay credentials do not prevent backend startup. Payment operations return a configuration error until credentials are set.

## Test setup

From `Backend/`, run:

```sh
npm test
```

The current automated tests cover pricing math, traveler validation, trip-date validation, receipts, and provider signature/configuration helpers. No real payment is made. Full API verification requires Stripe test configuration, a forwarded webhook, and an available test database.

For Razorpay, log in through the customer app, post a trip ID and traveler count to the create-order endpoint, then verify the Checkout callback through `/api/payments/verify`. For Stripe, post the same trip ID and traveler count to `/api/payments/create-checkout-session` and open the returned `checkoutUrl`. Do not treat a browser redirect as proof of payment.

## Deployment

Set Stripe secret and webhook variables plus `CLIENT_URL` as private Render environment variables. Set `VITE_API_URL` on the customer Vercel project to the backend origin; no Stripe secret belongs in a `VITE_` variable. Configure the Stripe webhook URL as `https://<backend-host>/api/payments/stripe/webhook` and use the same webhook secret in Render. Keep both providers in test mode.

The checkout popup supports Stripe-hosted checkout and resumes by checking the authenticated booking status after Stripe redirects back. The redirect itself is not treated as proof of payment; the booking is confirmed only by the backend webhook. End-to-end testing also needs a reachable backend/database and configured Stripe CLI or dashboard webhook.