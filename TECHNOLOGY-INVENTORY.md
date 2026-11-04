# Frontend
- JavaScript, JSX, HTML, CSS
- React component architecture, hooks, virtual DOM, browser rendering
- React Router DOM: browser routing, nested routes, protected routes
- Zustand authentication state
- React Hook Form
- React Icons
- React Toastify, React Hot Toast
- Tailwind CSS
- CSS Modules and plain CSS
- Axios HTTP clients with credentialed requests
- Lazy loading, dynamic imports, Suspense, route-level code splitting
- Progressive Web App (PWA), web app manifest, service worker
- Workbox precaching, offline fallback, `NetworkFirst` runtime caching
- Browser online/offline events, `IntersectionObserver`, `requestAnimationFrame`, `URL.createObjectURL`, `FormData`
- Trip discovery, trip details, booking, checkout, user dashboard, account registration and login
- Admin dashboard, trip/package management, booking management

# Backend
- JavaScript, Node.js, ECMAScript modules
- Express.js application and REST API
- Routes, controllers, services, Mongoose models, utility modules
- Middleware-based request handling and error handling
- JSON and multipart form-data requests
- Swagger UI and OpenAPI 3 documentation
- Authentication, account registration, email verification, OTP, admin login
- Trip, booking, contact, website-content, and payment endpoints
- Stripe Checkout session creation and payment-status endpoint
- Stripe webhook handling for completed and expired Checkout sessions
- Cloudinary image upload service
- Gmail SMTP email sending via Nodemailer
- Stripe and SMTP integrations configured through environment variables

# Database
- MongoDB
- Mongoose ODM
- MongoDB Node.js driver
- Mongoose schemas, models, validation, subdocuments, virtual fields
- ObjectId references, document population, lean queries, sorting, upserts
- Unique and compound indexes
- Trip, booking, user, OTP verification, contact, navigation, city, button, and content-block collections
- Stripe session migration script
- MongoDB aggregation: not found
- API pagination: not found

# Security
- bcrypt password hashing
- bcrypt-hashed, expiring, attempt-limited email OTPs
- JWT authentication tokens
- Email-verification JWT bearer tokens
- HTTP-only authentication cookies
- Secure and SameSite cookie settings
- Role-based admin authorization
- Backend authentication and authorization middleware
- Email-verification middleware
- CORS origin allowlist and credentialed requests
- In-memory login, OTP, and payment rate limiting
- Stripe webhook signature verification using raw request bodies
- Server-side payment price calculation and amount checks
- Environment-based secrets and API credentials
- Multipart upload file-type, count, and size limits
- Express trusted-proxy setting

# Architecture & Patterns
- Client-server architecture
- Single-page application (SPA)
- REST and CRUD
- MVC-style route/controller/model organization
- Service-layer organization
- Middleware pattern
- Component-based UI
- Shared Axios API clients
- Cookie-based login state with JWTs; no server-side session store
- Event-driven payment updates through Stripe webhooks
- Asynchronous programming: Promises, `async`/`await`, and `Promise.allSettled`
- Centralized Express error middleware
- HTTP request/response lifecycle
- Database schema validation and indexing
- Webhook idempotency check for already-paid bookings

# DevOps & Deployment
- Git version control
- npm package management and lockfiles
- Vite development servers and production builds
- Node.js backend development with Nodemon
- Vercel frontend/admin deployment configuration and SPA rewrite
- Render backend URL referenced in PWA caching configuration
- Cloudinary-hosted image storage and delivery
- Environment-specific configuration through `.env`
- Local frontend and backend development servers
- Production build and preview scripts
- CI/CD workflow configuration: not found
- Dedicated monitoring platform: not found
- Dedicated error-tracking platform: not found

# Hidden Concepts
- HTTP and HTTPS
- DNS resolution and TCP/IP networking
- JSON APIs
- SMTP email delivery
- TLS-secured external service connections
- Environment variables
- Browser cookies and request credentials
- Authentication and authorization flows
- Email verification flow
- Payment redirect and webhook confirmation flow
- Server-side validation
- Rate limiting
- Database indexes and query sorting
- File streaming and multipart uploads
- Offline browser behavior
- Client-side caching and expiration
- Reverse-proxy awareness
- Node.js event loop
- Structured application logging through console output
- Unit testing with Node.js built-in test runner
- Test assertions with Node.js `assert`

# NPM Packages
- `@eslint/js`
- `@tailwindcss/vite`
- `@types/react`
- `@types/react-dom`
- `@vitejs/plugin-react`
- `axios`
- `bcrypt`
- `busboy`
- `cloudinary`
- `concurrently`
- `cookie-parser`
- `cors`
- `dotenv`
- `eslint`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `express`
- `express-rate-limiter`
- `globals`
- `json-parser`
- `jsonwebtoken`
- `mongodb`
- `mongoose`
- `multer`
- `nodemailer`
- `rate-limiter-flexible`
- `react`
- `react-dom`
- `react-hook-form`
- `react-hot-toast`
- `react-icons`
- `react-router-dom`
- `react-toastify`
- `stripe`
- `swagger-ui-express`
- `tailwindcss`
- `v`
- `vite`
- `vite-plugin-pwa`
- `zustand`

# Technologies To Learn
1. Fundamental
   - JavaScript, JSX, HTML, CSS
   - React, components, hooks, and browser rendering
   - HTTP, JSON, REST, and CRUD
   - Node.js, npm, Promises, and `async`/`await`
   - MongoDB and basic queries
   - Git

2. Intermediate
   - Express routes, controllers, and middleware
   - Mongoose schemas, validation, references, population, and indexes
   - React Router, Zustand, and form handling
   - JWT, cookies, bcrypt, OTP, and role-based authorization
   - Multipart uploads, Busboy, and Cloudinary
   - SMTP email with Nodemailer
   - Rate limiting, CORS, and centralized error handling
   - Vite builds, PWA service workers, and caching

3. Advanced
   - Stripe Checkout and webhook signature verification
   - Payment state management and idempotency
   - Webhook-based event processing
   - Deployment configuration for Vercel and Render
   - Reverse-proxy-aware backend configuration
   - Offline-first PWA behavior and runtime caching
