// OpenAPI description for the API docs shown at /api-docs.

// Describe a required JSON body that refers to a shared schema.
const jsonBody = (schema) => ({
  required: true,
  content: { "application/json": { schema: { $ref: `#/components/schemas/${schema}` } } },
});

const errorResponse = {
  description: "The request could not be completed.",
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
};

const created = { description: "Created successfully." };
const ok = { description: "Request completed successfully." };

// Describe a path parameter that contains a MongoDB object ID.
const idParameter = (name, description) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
});

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Pack & Go API",
    version: "1.0.0",
    description:
      "API for trips, accounts, bookings, payments, and website content. Sign-in uses an HTTP-only cookie. Payment totals are calculated by the server.",
  },
  servers: [{ url: "/", description: "This backend server" }],
  tags: [
    { name: "Accounts" },
    { name: "Email verification" },
    { name: "Trips" },
    { name: "Website content" },
    { name: "Bookings" },
    { name: "Payments" },
    { name: "Contact" },
    { name: "Admin" },
  ],
  paths: {
    "/users/create": {
      post: {
        tags: ["Accounts"],
        summary: "Create a traveler account",
        description: "Requires a valid email verification token for the same email address.",
        security: [{ emailVerification: [] }],
        requestBody: jsonBody("RegisterUser"),
        responses: {
          "201": created,
          "400": errorResponse,
          "403": errorResponse,
          "409": errorResponse,
          default: errorResponse,
        },
      },
    },
    "/users/login": {
      post: {
        tags: ["Accounts"],
        summary: "Sign in",
        description: "Sets the sign-in cookie.",
        requestBody: jsonBody("Credentials"),
        responses: { "200": ok, "400": errorResponse, "401": errorResponse, default: errorResponse },
      },
    },
    "/users/logout": {
      post: {
        tags: ["Accounts"],
        summary: "Sign out",
        security: [{ cookieAuth: [] }],
        responses: { "200": ok, "401": errorResponse, default: errorResponse },
      },
    },
    "/users/get-current-user": {
      get: {
        tags: ["Accounts"],
        summary: "Get the signed-in account",
        security: [{ cookieAuth: [] }],
        responses: { "200": ok, "401": errorResponse, default: errorResponse },
      },
    },
    "/otp/create": {
      post: {
        tags: ["Email verification"],
        summary: "Send an email verification code",
        requestBody: jsonBody("Email"),
        responses: { "200": ok, "400": errorResponse, default: errorResponse },
      },
    },
    "/otp/verify": {
      post: {
        tags: ["Email verification"],
        summary: "Verify an email code",
        description: "Returns a short-lived bearer token for account registration.",
        requestBody: jsonBody("VerifyOtp"),
        responses: { "200": ok, "400": errorResponse, default: errorResponse },
      },
    },
    "/components/get-trips": {
      get: {
        tags: ["Trips"],
        summary: "List active trips",
        responses: { "200": ok, default: errorResponse },
      },
    },
    "/trip/get/{id}": {
      get: {
        tags: ["Trips"],
        summary: "Get a trip",
        parameters: [idParameter("id", "Trip ID.")],
        responses: { "200": ok, "404": errorResponse, default: errorResponse },
      },
    },
    "/trip/manage": {
      get: {
        tags: ["Trips"],
        summary: "List trips for admins",
        security: [{ cookieAuth: [] }],
        responses: { "200": ok, "401": errorResponse, "403": errorResponse, default: errorResponse },
      },
    },
    "/trip/create": {
      post: {
        tags: ["Trips"],
        summary: "Create a trip",
        description: "Admin only. Send multipart form data. Encode meals and roadmap as JSON strings.",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/CreateTrip" } } },
        },
        responses: { "201": created, "400": errorResponse, "401": errorResponse, "403": errorResponse, default: errorResponse },
      },
    },
    "/trip/visibility/{id}": {
      patch: {
        tags: ["Trips"],
        summary: "Show or hide a trip",
        security: [{ cookieAuth: [] }],
        parameters: [idParameter("id", "Trip ID.")],
        requestBody: jsonBody("TripVisibility"),
        responses: { "200": ok, "400": errorResponse, "401": errorResponse, "404": errorResponse, default: errorResponse },
      },
    },
    "/trip/delete/{id}": {
      delete: {
        tags: ["Trips"],
        summary: "Delete a trip",
        security: [{ cookieAuth: [] }],
        parameters: [idParameter("id", "Trip ID.")],
        responses: { "200": ok, "401": errorResponse, "404": errorResponse, default: errorResponse },
      },
    },
    "/components/nav": {
      get: { tags: ["Website content"], summary: "Get navigation content", responses: { "200": ok, default: errorResponse } },
      post: { tags: ["Website content"], summary: "Create navigation content", requestBody: jsonBody("GenericData"), responses: { "201": created, "400": errorResponse, default: errorResponse } },
    },
    "/components/city": {
      get: { tags: ["Website content"], summary: "Get city content", responses: { "200": ok, default: errorResponse } },
      post: { tags: ["Website content"], summary: "Create city content", requestBody: jsonBody("GenericData"), responses: { "201": created, "400": errorResponse, default: errorResponse } },
    },
    "/components/buttons": {
      get: { tags: ["Website content"], summary: "Get button content", responses: { "200": ok, default: errorResponse } },
      post: { tags: ["Website content"], summary: "Create button content", requestBody: jsonBody("GenericData"), responses: { "201": created, "400": errorResponse, default: errorResponse } },
    },
    "/components/content-blocks": {
      get: { tags: ["Website content"], summary: "Get content blocks", responses: { "200": ok, default: errorResponse } },
      post: { tags: ["Website content"], summary: "Create content blocks", requestBody: jsonBody("GenericData"), responses: { "201": created, "400": errorResponse, default: errorResponse } },
    },
    "/booking/get": {
      get: {
        tags: ["Bookings"],
        summary: "Get my bookings",
        security: [{ cookieAuth: [] }],
        responses: { "200": ok, "401": errorResponse, default: errorResponse },
      },
    },
    "/booking/admin/get": {
      get: {
        tags: ["Bookings"],
        summary: "Get all bookings",
        security: [{ cookieAuth: [] }],
        description: "Admin only.",
        responses: { "200": ok, "401": errorResponse, "403": errorResponse, default: errorResponse },
      },
    },
    "/api/payments/create-checkout-session": {
      post: {
        tags: ["Payments"],
        summary: "Create or resume a card Checkout session",
        description: "The server calculates the price and returns a Stripe Checkout URL.",
        security: [{ cookieAuth: [] }],
        requestBody: jsonBody("CreatePayment"),
        responses: { "200": ok, "201": created, "400": errorResponse, "401": errorResponse, "503": errorResponse, default: errorResponse },
      },
    },
    "/api/payments/status/{bookingId}": {
      get: {
        tags: ["Payments"],
        summary: "Get payment status",
        security: [{ cookieAuth: [] }],
        parameters: [idParameter("bookingId", "Booking ID.")],
        responses: { "200": ok, "401": errorResponse, "404": errorResponse, default: errorResponse },
      },
    },
    "/api/payments/stripe/webhook": {
      post: {
        tags: ["Payments"],
        summary: "Receive Stripe Checkout events",
        description: "Stripe signs the raw JSON body. The backend handles completed and expired sessions; other signed events receive 200.",
        parameters: [{ name: "stripe-signature", in: "header", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", additionalProperties: true } } } },
        responses: { "200": ok, "400": errorResponse, default: errorResponse },
      },
    },
    "/contacts/create-contacts": {
      post: {
        tags: ["Contact"],
        summary: "Send a contact message",
        security: [{ cookieAuth: [] }],
        requestBody: jsonBody("ContactMessage"),
        responses: { "200": ok, "400": errorResponse, "401": errorResponse, default: errorResponse },
      },
    },
    "/admin/admin-login": {
      post: {
        tags: ["Admin"],
        summary: "Sign in as an admin",
        description: "Sets the sign-in cookie when the account has the admin role.",
        requestBody: jsonBody("Credentials"),
        responses: { "200": ok, "400": errorResponse, "401": errorResponse, default: errorResponse },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "token" },
      emailVerification: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          extraDetails: { type: "string", nullable: true },
        },
      },
      Credentials: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "traveler@example.com" },
          password: { type: "string", example: "your-password" },
        },
      },
      Email: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string", format: "email", example: "traveler@example.com" } },
      },
      VerifyOtp: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: { type: "string", format: "email" },
          otp: { type: "string", pattern: "^\\d{6}$", example: "123456" },
        },
      },
      RegisterUser: {
        type: "object",
        required: ["fullName", "email", "password", "gender", "terms"],
        properties: {
          fullName: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string" },
          gender: { type: "string" },
          terms: { type: "boolean", enum: [true] },
        },
      },
      CreatePayment: {
        type: "object",
        required: ["tripId", "travelers"],
        properties: {
          tripId: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
          travelers: { type: "integer", minimum: 1, example: 2 },
        },
      },
      TripVisibility: {
        type: "object",
        required: ["isActive"],
        properties: { isActive: { type: "boolean" } },
      },
      CreateTrip: {
        type: "object",
        required: [
          "banner", "thumbnail", "from", "to", "guide", "date",
          "pickupTime", "pickupLocation", "dropTime", "dropLocation",
          "duration", "pricePerHead", "tripType", "stays", "travel",
          "roadmap",
        ],
        properties: {
          banner: { type: "string", format: "binary" },
          thumbnail: { type: "string", format: "binary" },
          from: { type: "string" },
          to: { type: "string" },
          guide: { type: "string" },
          date: { type: "string", format: "date" },
          pickupTime: { type: "string", example: "08:00" },
          pickupLocation: { type: "string" },
          dropTime: { type: "string", example: "18:00" },
          dropLocation: { type: "string" },
          duration: { type: "integer", minimum: 2, maximum: 15 },
          pricePerHead: { type: "number", minimum: 1 },
          tripType: { type: "string" },
          stays: { type: "string" },
          travel: { type: "string" },
          termsType: { type: "string", enum: ["regular", "custom"] },
          customTerms: { type: "string" },
          meals: { type: "string", description: "JSON array encoded as a string." },
          roadmap: { type: "string", description: "JSON array of {place, days, note} objects encoded as a string." },
        },
      },
      ContactMessage: {
        type: "object",
        required: ["fullName", "email", "phoneNumber", "message"],
        properties: {
          fullName: { type: "string" },
          email: { type: "string", format: "email" },
          phoneNumber: { type: "string" },
          message: { type: "string" },
        },
      },
      GenericData: {
        description: "Content fields accepted by the selected website-content collection.",
        oneOf: [
          { type: "object", additionalProperties: true },
          { type: "array", items: { type: "object", additionalProperties: true }, minItems: 1 },
        ],
      },
    },
  },
};

export default openApiSpec;
