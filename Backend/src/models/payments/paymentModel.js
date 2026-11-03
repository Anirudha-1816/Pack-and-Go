import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
	{
		eventId: { type: String, required: true },
		eventType: { type: String, required: true },
		receivedAt: { type: Date, default: Date.now },
	},
	{ _id: false }
);

const paymentSchema = new mongoose.Schema(
	{
		booking: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Booking",
			required: true,
			index: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		provider: {
			type: String,
			enum: ["razorpay", "stripe"],
			default: "razorpay",
		},
		receipt: { type: String, required: true, unique: true },
		razorpayOrderId: { type: String, default: undefined },
		razorpayPaymentId: { type: String, default: undefined },
		stripeCheckoutSessionId: { type: String, default: undefined },
		stripePaymentIntentId: { type: String, default: undefined },
		activeAttemptKey: { type: String, default: undefined },
		refundId: { type: String, default: undefined },
		amount: { type: Number, required: true, min: 1, validate: Number.isInteger },
		currency: { type: String, required: true, enum: ["INR"], default: "INR" },
		status: {
			type: String,
			enum: ["created", "authorized", "captured", "failed", "refunded"],
			default: "created",
		},
		signatureVerified: { type: Boolean, default: false },
		failureReason: { type: String, default: "" },
		refundedAmount: { type: Number, default: 0, min: 0 },
		refundInProgress: { type: Boolean, default: false },
		reconciliationRequired: { type: Boolean, default: false },
		webhookEvents: { type: [webhookEventSchema], default: [] },
	},
	{ timestamps: true }
);

paymentSchema.index(
	{ razorpayOrderId: 1 },
	{ unique: true, partialFilterExpression: { razorpayOrderId: { $type: "string" } } }
);
paymentSchema.index(
	{ razorpayPaymentId: 1 },
	{ unique: true, partialFilterExpression: { razorpayPaymentId: { $type: "string" } } }
);
paymentSchema.index(
	{ stripeCheckoutSessionId: 1 },
	{ unique: true, partialFilterExpression: { stripeCheckoutSessionId: { $type: "string" } } }
);
paymentSchema.index(
	{ stripePaymentIntentId: 1 },
	{ unique: true, partialFilterExpression: { stripePaymentIntentId: { $type: "string" } } }
);
paymentSchema.index({ booking: 1, createdAt: -1 });
paymentSchema.index({ activeAttemptKey: 1 }, { unique: true, sparse: true });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
