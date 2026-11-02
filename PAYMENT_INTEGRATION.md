# Pack & Go Payments

## Architecture

The customer trip page opens an in-page checkout dialog. The browser sends only the trip ID and traveler count. The backend reads the trip price, saves a booking price snapshot, creates a Razorpay order, and returns the public key ID and order details. The secret key is used only by the backend.

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

### Get booking payment status

`GET /api/payments/status/:bookingId` requires the JWT cookie and only returns the signed-in user's booking and attempts.

### Razorpay webhook

`POST /api/payments/webhook` uses the original raw JSON body and `x-razorpay-signature`; it does not use JWT authentication. Configure these Razorpay events: `payment.authorized`, `payment.captured`, `payment.failed`, `refund.processed`, and `refund.failed`.

Existing booking history remains available at `GET /booking/get` with the JWT cookie.
Admins can review all bookings at `GET /booking/admin/get`; it requires the JWT cookie and an admin role.

## Environment

Copy `Backend/.env.example` to a private `Backend/.env` and set the existing application variables. Add Razorpay **Test Mode** values for `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`; set `RAZORPAY_WEBHOOK_SECRET` to the webhook secret configured in the Razorpay dashboard. Never add these values to Vite variables or commit a real `.env` file.

Missing Razorpay credentials do not prevent backend startup. Payment operations return a configuration error until credentials are set.

## Test setup

From `Backend/`, run:

```sh
npm test
```

The current automated tests cover pricing math, traveler validation, trip-date validation, receipts, and checkout/webhook signature helpers. No real payment is made. Full API verification requires a test Razorpay account and an available test database.

For a manual request, first log in through the customer app so the JWT cookie is present, then post a trip ID and traveler count to the create-order endpoint. Open Razorpay Checkout with the returned `keyId`, `orderId`, amount, and currency, then post its callback fields to `/api/payments/verify`. Do not treat the browser callback as proof of payment.

## Deployment

Set the three Razorpay variables as private Render environment variables. Set `VITE_API_URL` on the customer Vercel project to the backend origin; do not put any Razorpay secret in a `VITE_` variable. Configure the Render webhook URL as `https://<backend-host>/api/payments/webhook` and use the exact same webhook secret in Render. Keep Razorpay in Test Mode until onboarding and live credentials are explicitly completed.

The frontend checkout popup is implemented, but end-to-end Razorpay testing still needs test credentials, a reachable backend/database, and a configured webhook endpoint.