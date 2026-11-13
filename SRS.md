# Pack & Go
## Software Requirements Specification

## 1. Purpose

Pack & Go is a travel booking platform with three distinct applications:

- **Traveler Website** — Public-facing site where visitors browse trips, create accounts, book trips, and pay online ,join the trips.
- **Admin Dashboard** — Staff application for managing trips, reviewing bookings, approving operators, and overseeing the platform.
- **Operator Portal** — Dedicated portal where approved operators create and manage their own trips, view bookings, and track their business.

This document describes the current system as implemented.

## 2. People Who Use the System

| Role | Description |
|------|-------------|
| **Visitor** | Browses public trips and website content, submits contact requests. |
| **Traveler** | Registered user who verifies email via OTP, browses trips, books trips, pays via Stripe, views their bookings and payment status. |
| **Operator** | Applies for an account, waits for admin approval, then creates and manages their own trips, views bookings on their trips, tracks availability. |
| **Admin** | Signs in to the admin dashboard, manages all trips (create/hide/delete), reviews all bookings, approves/rejects operator applications, manages operator status. |

## 3. Main Features

### 3.1 Accounts & Authentication

**Traveler**
- Registers with email, full name, gender, password, and terms acceptance.
- Verifies email via a one-time passcode (OTP) sent by email before registration completes.
- Signs in with email and password.
- Session maintained via secure, HTTP-only cookie.
- Can sign out and view account details.

**Operator**
- Applies with name, email, password, phone, location, experience, and optional profile photo.
- Application stored with status `pending` until admin reviews.
- Receives email notification when approved or rejected.
- If rejected, sees rejection reason; if pending, sees waiting message.
- After approval, signs in with email and password.
- Session maintained via secure, HTTP-only cookie (separate from traveler/admin cookies).
- Can sign out.

**Admin**
- Signs in with email and password (pre-created admin account).
- Role-based access control via `role: "admin"` on user document.
- Session maintained via secure, HTTP-only cookie.

### 3.2 Trips

**Public (Visitor/Traveler)**
- Views only active trips (`isActive: true`) with future dates.
- Trip detail page shows: banner, thumbnail, route (from/to), guide, date, duration, pickup/drop times and locations, price per person, trip type, included meals, accommodation tier, travel tier, terms, roadmap.
- Can book available trips.

**Admin**
- Creates trips with banner + thumbnail (uploaded to Cloudinary).
- Sets all trip fields: route, guide, date, timings, duration, price, type, inclusions, terms, roadmap.
- Toggles trip visibility (`isActive`) without deleting.
- Deletes trips permanently.
- Views all trips (active/inactive) in management list.

**Operator**
- Creates trips via 3-step form: basic info → pricing & details → images & roadmap.
- Submits trip for admin approval; trip saved with `status: "pending"` and linked to operator.
- Views only their own trips in dashboard, grouped by status (upcoming, running, completed).
- Sees traveler count per trip.
- Cannot edit or delete trips after submission; only admin can change status.

**Trip Statuses**
- `pending` — Operator-submitted, awaiting admin review.
- `approved` — Visible to public, bookable (default for admin-created trips).
- `rejected` — Not visible, operator sees rejection reason.
- `isActive` toggle — Admin can hide/show approved trips without deletion.

### 3.3 Bookings & Payments

**Booking Flow**
- Signed-in traveler selects trip and number of travelers.
- Server calculates total from stored `pricePerHead` (never trusts client-sent price).
- Booking snapshot stores: trip, traveler count, amount (in paise), currency (INR), timestamps.
- Stripe Checkout session created; traveler redirected to Stripe.
- Payment verified via signed Stripe webhook (`checkout.session.completed`).
- Booking confirmed only after webhook verification; returning from Stripe alone is not proof.
- Payment statuses: `pending`, `paid`, `failed`, `refunded`.
- Booking statuses: `pending`, `confirmed`, `cancelled`, `refunded` (separate from payment status).

**Retry & Edge Cases**
- Failed payments can be retried (new Stripe session).
- Snapshot pricing protects against price changes mid-booking.
- Duplicate payments and refunds recorded for manual follow-up.
- `paymentReviewRequired` flag set if webhook amount differs from booking amount.

**Traveler View**
- Sees own bookings with trip details, payment status, booking status.

**Admin View**
- Sees all bookings across all trips with traveler details, payment status, booking status.

**Operator View**
- Sees bookings only for their own trips.
- Passenger list per trip with traveler name, phone, seats, payment status, booked date.
- Check-in button for upcoming/running trips (tracks checked-in travelers).

### 3.4 Operator Dashboard

- **Overview**: Greeting, next trip card (countdown or "running now"), KPIs (active trips, travelers booked, completed trips, rating), upcoming trips list, availability toggle, profile card.
- **My Trips**: Filterable list (upcoming/running/completed/all) with traveler counts, status badges, "View passenger list" action.
- **My Bookings**: Trip selector dropdown → passenger list with check-in functionality, payment status badges, booking dates.
- **Availability Toggle**: Operator sets themselves available/unavailable for new trip assignments.
- **Profile**: Shows name, email, phone, location, experience, status, profile image.
- **Logout**: Clears cookie and redirects to login.

### 3.5 Admin Dashboard

- **Sidebar Navigation**: Manage packages, check bookings, operator requests, gallery, messages, feedbacks, settings.
- **KPIs**: Revenue, bookings count, active packages, average rating (with trend indicators).
- **Quick Actions**: Add package, manage packages, review bookings.
- **Upcoming Trips Panel**: Scrollable list with date, booking progress bar, fill status chips (open/filling/full).
- **Operator Requests**: List of pending/approved/rejected operators with approve/reject actions and rejection reason field.
- **Manage Packages**: Full CRUD for trips with image uploads.

### 3.6 Website Content & Contact

- Dynamic content loaded from backend: navigation links, cities, buttons, content blocks.
- Contact form (signed-in travelers only) stores message and emails both visitor and site contact address.
- Email service used for OTP verification, contact confirmations, operator status notifications.

## 4. System Overview

| Component | Technology |
|-----------|------------|
| Traveler Website | React 19 + Vite + React Router + Tailwind CSS |
| Admin Dashboard | React 19 + Vite + React Router + Tailwind CSS |
| Operator Portal | React 19 + Vite + React Router + Tailwind CSS |
| Backend API | Node.js + Express + Mongoose (MongoDB) |
| Image Storage | Cloudinary (banners, thumbnails, profile photos) |
| Payments | Stripe Checkout + signed webhooks |
| Email | Configured mail service (Nodemailer) |
| Auth | JWT in HTTP-only cookies, bcrypt password hashing |
| Apis | `axios` |

- Three independent React apps, each deployed separately.
- All apps share the same backend API URL (`VITE_API_URL`).
- CORS configured for known frontend origins.
- API documented via Swagger at `/api-docs`.

## 5. Key Rules

- Only active (`isActive: true`) and future-dated trips shown to visitors.
- Past-dated trips cannot be booked.
- Traveler count must be a positive integer (max defined by `MAX_TRAVELERS`).
- Booking price snapshot used for retries; trip price changes don't affect existing bookings.
- Payment status ≠ booking status; both tracked independently.
- Secrets (Stripe keys, MongoDB URI, JWT secret, Cloudinary credentials, email credentials) never in frontend code or committed to source control.
- Stripe test keys for development; live keys supported for production.
- Operator-created trips require admin approval before going live.
- Admin can only see/manage operator requests; operators cannot see other operators.
- Check-in only allowed for upcoming/running trips.

## 6. Important Quality Requirements

- Responsive on mobile and desktop.
- Role-based access enforced on all private routes (frontend + backend).
- Server validates all booking and payment inputs before state changes.
- Stripe webhooks verified via signature + raw body.
- Errors returned with HTTP status code and clear message.
- No SLA, uptime, or response-time targets defined yet.

## 7. External Services & Setup

Required environment variables:

| Service | Variables |
|---------|-----------|
| MongoDB | `MONGO_URI` |
| JWT | `JWT_SECRET` |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLIENT_URL` |
| Email | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` |
| Frontend | `VITE_API_URL` (points to backend) |


this are the not the `actual url or secrets or any apis`

See `PAYMENT_INTEGRATION.md` for Stripe setup and testing details.

## 8. API Reference

Backend API documented in Swagger UI at **`/api-docs`** on the backend host (e.g., `http://localhost:8080/api-docs`). Includes all endpoints, request/response schemas, authentication, and common error responses.

## 9. Not Included in Current Version

- Trip reviews and ratings from travelers
- Loyalty points or referral programs
- Multi-language support
- AI-powered trip recommendations
- WhatsApp / SMS notifications
- Live Stripe payments (test mode only)
- Operator trip editing after submission
- Traveler trip cancellation by user
- Automated refund processing