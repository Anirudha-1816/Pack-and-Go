# Pack & Go payments

## How payment works

1. The signed-in traveler sends a trip ID and traveler count to the backend.
2. The backend checks the trip, calculates the price, and creates or reuses a booking.
3. The backend creates or resumes a Stripe card Checkout session and returns its URL.
4. Stripe sends a signed webhook to the backend after payment.
5. The backend checks the webhook and updates the booking. The browser redirect alone never confirms payment.

The booking stores one integer amount in paise, its currency, the Stripe session ID, payment status, and payment reference. The old Payment collection is no longer used by the app. Duplicate charges are not automatically refunded; review them in Stripe and refund them manually.

## API routes

All routes are relative to the backend host. Signed-in routes use the existing HTTP-only `token` cookie.

### Create or resume Stripe Checkout

`POST /api/payments/create-checkout-session` requires the sign-in cookie.

Request:

```json
{
  "tripId": "507f1f77bcf86cd799439011",
  "travelers": 2
}
```

The server reads `trip.pricePerHead` from MongoDB, saves the total as integer paise, and returns `bookingId`, `checkoutSessionId`, `checkoutUrl`, `amount` in paise, `currency`, and `travelers`. The browser does not send a price. A retry uses the saved booking amount and reuses an open Stripe session.

### Check payment status

`GET /api/payments/status/:bookingId` requires the sign-in cookie and returns only the signed-in user's booking.
Its `data` contains only `bookingId`, `status`, `paymentStatus`, `travelers`, `amount` (paise), `currency`, and `paymentReference`.

### Stripe webhook

`POST /api/payments/stripe/webhook` uses Stripe's `stripe-signature` header and the original raw request body. It does not use a sign-in cookie.

Configure these events in Stripe:

- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

Other signed events receive HTTP 200 and are ignored. Invalid signatures receive an error response. A browser return never confirms payment; only a valid signed webhook can mark a booking paid.

## Environment

Copy `Backend/.env.example` to `Backend/.env` and set the backend values. Stripe settings are:

- `STRIPE_SECRET_KEY`: a Stripe secret key (`sk_test_...` for testing or `sk_live_...` for real payments).
- `STRIPE_WEBHOOK_SECRET`: the signing secret from Stripe CLI or the Stripe dashboard (`whsec_...`).
- `CLIENT_URL`: customer website origin used for Checkout return links.

Do not put Stripe secrets in frontend variables or commit a real `.env` file. Use a matching webhook secret from the same Stripe mode.

For local testing, use `CLIENT_URL=http://localhost:5173`, then run:

```powershell
cd Backend
npm test
npm run dev
```

In another terminal:

```powershell
stripe listen --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed --forward-to localhost:8080/api/payments/stripe/webhook
```

Copy the `whsec_...` value printed by Stripe CLI into `STRIPE_WEBHOOK_SECRET` in `Backend/.env`, then restart the backend. Use Stripe's test card `4242 4242 4242 4242`, any future expiry date, and any three-digit CVC. Never use a real card for this test setup.

## Existing database records

Before deploying this version, back up MongoDB and migrate existing booking amounts and Stripe sessions against the same database used by the deployed backend:

```powershell
cd Backend
npm run migrate:booking-amounts
npm run migrate:stripe-sessions
```

The booking amount migration converts old rupee totals to integer paise, removes `pricePerPerson`, `subtotal`, `totalPrice`, and `pricing`, then creates a unique index for active bookings. If multiple pending or failed bookings exist for the same user, trip, and traveler count, the script stops and lists them; review their payment state and resolve the duplicates before running it again. The session migration copies each booking's newest saved Stripe session ID from the old `payments` collection into `bookings.stripeSessionId` and removes the unused `activePaymentKey` index. Neither script deletes old payment records.

## Deployment

Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `CLIENT_URL` as private environment variables on the backend host. Point the customer frontend's `VITE_API_URL` at that backend. Configure the Stripe webhook URL as:

```text
https://<backend-host>/api/payments/stripe/webhook
```

Use the signing secret provided by the Stripe endpoint, not the Stripe CLI secret, for deployment.
