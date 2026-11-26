# Pack&Go Project Analysis for CV

## 1. Short Explanation of Pack&Go

Pack&Go is a full-stack travel booking platform with three distinct frontend applications serving different user roles: a **Traveler Website** for browsing and booking trips, an **Admin Dashboard** for managing trips, operators, and bookings, and an **Operator Portal** for approved tour operators to create and manage their own trips. The platform integrates Stripe for secure payments with webhook verification, uses JWT-based authentication with session tracking, Cloudinary for image storage, and MongoDB for data persistence. Key real-world features include OTP-verified user registration, trip approval workflows, booking management, and a feedback/review system.

---

## 2. Verified Technology Stack

### Frontend (All three apps)
- **React 19** with **Vite** as the build tool
- **React Router** for client-side routing
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Hook Form** for form validation
- **Axios** for API communication
- **React Hot Toast / React Toastify** for notifications
- **Lucide React** and **React Icons** for icons
- **CSS Modules** for modular styling

### Backend
- **Node.js** with **Express.js 5.x**
- **MongoDB** with **Mongoose** ODM
- **MVC Architecture** with separate models, controllers, routes, and services
- **REST APIs** with comprehensive error handling
- **Swagger UI** for API documentation at `/api-docs`

### Authentication & Security
- **JWT** tokens with HTTP-only cookies
- **bcrypt** for password hashing
- **Role-based access control** (`user`, `operator`, `admin` roles)
- **OTP verification** via Nodemailer
- **Device/session tracking** (browser, OS, IP, location) with 7-day expiry
- **Rate limiting** middleware

### Payments
- **Stripe Checkout** for payment processing
- **Signed webhooks** for secure payment verification
- **Idempotency keys** for duplicate prevention
- **Separate booking status** from payment status

### Cloud Infrastructure
- **Cloudinary** for image storage (banners, thumbnails, profiles)
- **MongoDB Atlas** for database
- **Vercel** deployment for frontend apps
- **Render** deployment for backend
- **Nodemailer** for email services

---

## 3. Major Implemented Features

### User Features
- Email/password registration with OTP verification
- Trip browsing with filterable destinations
- Trip details page with roadmap, inclusions, terms
- Booking flow with traveler count selection
- Stripe Checkout integration with automatic price calculation
- Payment status verification via signed webhook
- User dashboard showing booked trips with status tracking
- Contact form for signed-in travelers

### Operator Features
- Operator registration with name, email, phone, experience, location
- Application status tracking (pending/approved/rejected with notification emails)
- Multi-step trip creation form with banner/thumbnail uploads
- Trip categories: Festival, Adventure, Social Events
- Dashboard with KPIs (active trips, travelers, completions)
- Passenger list with check-in functionality
- Availability toggle for new trip assignments

### Admin Features
- Admin login with role-based access
- Dashboard with revenue, bookings, packages KPIs
- Trip management (create, update, delete, activate/deactivate)
- Operator approval/rejection workflow
- Operator trip approval (publishes copy to public Trip collection)
- All bookings overview with traveler details
- Feedback management
- Content management for dynamic nav items

### Database & Architecture
- **5 MongoDB collections**: Users, Operators, Trips, OperatorTrips, Bookings, Feedback, Sessions, PackageCategory, ContentBlocks
- **Soft delete pattern** (`isDeleted` flag)
- **Separate OperatorTrip collection** stores pending operator submissions
- **Approval workflow** copies OperatorTrip to Trip collection on approval
- **Unique compound indexes** for booking deduplication
- **Device tracking** via Session model with geo-location

---

## 4. Polished CV Project Description

**Pack&Go – Full-Stack Travel Booking Platform**

A production-ready MERN (MongoDB, Express, React, Node.js) travel booking platform featuring three role-based applications: a traveler-facing website, an admin dashboard, and an operator portal. Built with React 19, Vite, Tailwind CSS, and Zustand on the frontend; Node.js, Express 5, and Mongoose on the backend.

- **Secure Authentication**: Implemented JWT-based authentication with HTTP-only cookies, bcrypt password hashing, and OTP-verified email registration with device/session tracking for 7-day sessions.

- **Role-Based Access Control**: Engineered RBAC system supporting three user roles (traveler, operator, admin) with protected routes and middleware for authorization.

- **Stripe Payment Integration**: Developed secure payment flow with Stripe Checkout, server-side price validation using MongoDB-stored trip prices, and webhook verification to confirm payments without trusting browser redirects.

- **Trip Management System**: Created admin CRUD operations for trips with Cloudinary image uploads, plus operator submission workflow with pending/approval/rejection states and automatic publishing of approved trips.

- **Real-Time Booking Operations**: Built booking model with snapshot pricing (paise storage for INR), separate payment and booking statuses, idempotency keys for retry safety, and passenger check-in functionality for active trips.

- **Multi-Faceted Dashboard**: Developed admin KPIs (revenue, bookings, ratings) and operator dashboards with trip lists, booking tables, availability toggles, and feedback moderation.

- **Cloud Deployment & API Documentation**: Deployed three independent React apps on Vercel, backend on Render, configured CORS for multiple origins, and implemented Swagger UI at `/api-docs` for comprehensive API documentation.

[GitHub Repository](https://github.com/Anirudha-1816/Pack-and-Go)

---

## 5. Additional Technical Concepts for Interview Preparation

1. **Database Design Decisions**:
   - Why separate `Trip` and `OperatorTrip` collections? (Approval workflow with immutable operator submissions)
   - Snapshot pricing vs. real-time price calculation
   - Compound indexes for unique active bookings constraint

2. **Security Implementation**:
   - JWT token structure with `userId` and `sessionId`
   - HTTP-only cookie vs. localStorage security trade-offs
   - Stripe webhook signature verification
   - CORS configuration for multiple frontend origins

3. **Payment Flow Edge Cases**:
   - Handling duplicate checkout sessions with idempotency keys
   - Payment amount review flag when webhook amount differs
   - Retry logic for failed payments

4. **State Management**:
   - Zustand store with async actions and retries
   - Managing authentication state across three apps

5. **API Design**:
   - Consistent error handling with status codes and extra details
   - Pagination patterns (though not heavily used)
   - Response interceptor pattern for 401/403 handling

6. **Deployment Architecture**:
   - Three separate deployments communicating with one API
   - Environment variable management (secrets never in frontend)
   - MongoDB Atlas for database persistence

7. **Performance Considerations**:
   - Cloudinary image optimization (`w_1600,q_auto,f_auto`)
   - Lazy loading of components with React Suspense
   - Efficient React state updates