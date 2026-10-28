1. Introduction
Purpose: A web app for group travel bookings.

Scope: Users can browse trips, book seats, pay online; Admin manages trips and bookings.


Stakeholders: Startup owner (admin), travelers (users).

2. Overall Description
Product Perspective: MERN stack web app, deployed on Vercel/Render, DB on MongoDB Atlas.

Product Functions: Trip listings, booking, payments, dashboards.

User Characteristics: Tech-savvy travelers, mostly mobile users.

3. Functional Requirements
User Registration/Login (JWT auth).

Browse trips (filter by date, destination, price).

Book trip (form + payment).

Payment integration (Stripe/Razorpay).

Admin dashboard (CRUD trips, view bookings).

Notifications (email/WhatsApp confirmations).

4. Non-Functional Requirements
Performance: Handle 100 concurrent users in MVP.

Security: HTTPS, JWT, input validation.

Scalability: Cloud DB, modular design.

Availability: 99% uptime target.

Usability: Mobile-first responsive design.

5. System Models
Use Case Diagrams (User books trip, Admin adds trip).

Data Flow Diagrams (Booking request → Payment (RazerPay)→ DB → Confirmation).

6. Constraints
Free hosting limits (Vercel/Render).

Payment gateway requires verified account.

MVP budget constraints.

7. Future Enhancements
Reviews & ratings.

Loyalty points system.

Multi-language support.

AI-based trip recommendations.