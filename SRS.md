# Pack & Go
## Software Requirements Specification

## 1. Purpose

Pack & Go is a travel booking website. Travelers can browse trips, create an account, book a trip, and pay online. Staff use a separate admin app to manage trips and review bookings.

This document describes the current system, not planned features.

## 2. People who use the system

- **Traveler:** creates an account, views trips, books trips, pays, and checks its own bookings.
- **Admin:** signs in to the admin app, creates , hides or delete trips, and reviews bookings.
- **Visitor:** browses public trip and website content, and can request help through the contact form.

## 3. Main features

### Accounts

- A new traveler verifies their email with a one-time code (OTP) before registration.
- Travelers and admins sign in with email and password.
- A secure, HTTP-only cookie keeps the user signed in. Admin access is based on the account role (Imitable).
- A traveler can sign out and view their account details.

### Trips

- Visitors can view active trips and open a trip for its itinerary, dates, price, pickup and drop-off details, included services, and terms.
- Admins can add trips with a banner and thumbnail, edit whether a trip is visible, and delete a trip.
- Trip prices are set by the admin as a per-person amount.

### Bookings and payments

- A signed-in traveler chooses a trip and number of travelers.
- The server calculates the total from the saved trip price. It does not trust a price sent by the browser.
- A booking keeps a snapshot of its price and traveler count.
- Payments use Stripe Checkout with card payments.
- A booking is confirmed only after the backend verifies the payment. Stripe uses signed webhooks; returning from the Stripe page alone is not proof of payment.
- Travelers can view their bookings and payment status. Admins can review all bookings.
- Failed attempts can be retried. Refunds and duplicate payments are recorded for follow-up.

### Website content and contact

- The site can load trip listings, navigation, cities, buttons, and content blocks from the backend.
- Signed-in visitors can submit a contact message. The system stores it and emails the visitor and site contact address.
- Email is also used to send account verification codes.

## 4. System overview

- The traveler website and admin app are separate React applications.
- The backend is an Express API. It stores users, trips, bookings, payments, and site content in MongoDB through Mongoose.
- Trip images are stored with Cloudinary.
- Email is sent through the configured mail service.
- Stripe secret keys stay on the backend.
- The apps are intended to be hosted separately. The frontend calls the backend URL configured for that deployment.

## 5. Key rules

- Only active trips are shown to visitors and can be booked.
- A trip date in the past cannot be booked.
- Traveler count must be a positive whole number.
- The saved booking price is used for payment retries; changing the trip price does not silently change an existing booking.
- Payment status and booking status are separate. A pending, failed, or refunded payment must not be shown as a confirmed booking.
- Payment provider credentials, webhook signing secrets, database credentials, and email credentials must not be placed in frontend variables or committed to source control.
- Stripe test keys are used during development; the backend also accepts live keys for production payments.

## 6. Important quality requirements

- The website should work on mobile and desktop screens.
- Private account, booking, and admin actions require the appropriate signed-in user or admin role.
- The server validates booking inputs and payment details before changing a booking.
- Payment webhooks must be checked using the provider's signature and original request body.
- Errors should be returned with an HTTP status and a clear message.
- No uptime, traffic, or response-time target has been measured or promised yet.

## 7. External services and setup

The backend needs MongoDB, email, and Cloudinary settings. Payment features also need the relevant provider credentials and webhook configuration. Stripe Checkout needs a backend `CLIENT_URL` for its return links. See [PAYMENT_INTEGRATION.md](./PAYMENT_INTEGRATION.md) for payment setup and testing.

## 8. API reference

The backend API is documented in Swagger UI at **`/api-docs`** on the backend host. For local development, this is usually `http://localhost:8080/api-docs`. The reference lists the implemented endpoints, request formats, authentication, and common responses.

## 9. Not included in the current version

Trip reviews, loyalty points, multiple languages, AI recommendations, WhatsApp notifications, and live Stripe payments are not part of the current system.
