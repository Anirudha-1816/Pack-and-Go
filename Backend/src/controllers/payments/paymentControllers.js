import mongoose from "mongoose";
import Bookings from "../../models/Bookings/bookingModel.js";
import Payment from "../../models/payments/paymentModel.js";
import Trip from "../../models/components/tripModel.js";
import User from "../../models/users/usersModel.js";
import { getRazorpay, getWebhookSecret } from "../../configs/razorpay.js";
import statusCode from "../../utils/statusCodes.js";
import {
	getPaymentPrice,
	getWebhookEventId,
	isTripDateAvailable,
	makeActivePaymentKey,
	makeReceipt,
	matchesRazorpayPayment,
	verifyCheckoutSignature,
	verifyWebhookSignature,
} from "../../utils/paymentUtils.js";

const makeError = (message, status = statusCode.BAD_REQUEST) => {
	const error = new Error(message);
	error.statusCode = status;
	return error;
};

const isMongoId = (value) =>
	typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

const checkoutData = (booking, payment, keyId) => ({
	bookingId: booking._id,
	orderId: payment.razorpayOrderId,
	receipt: payment.receipt,
	amount: payment.amount,
	currency: payment.currency,
	keyId,
	travelers: booking.travelers,
	pricing: booking.pricing,
	totalPrice: booking.totalPrice,
});

const markPaymentFailed = async (payment, booking) => {
	if (!booking) return;

	await Payment.updateOne(
		{ _id: payment._id, status: { $nin: ["captured", "refunded"] } },
		{
			$set: { status: "failed", failureReason: "Payment was not completed." },
			$unset: { activeAttemptKey: 1 },
		}
	);
	const currentPayment = await Payment.findById(payment._id);
	if (currentPayment?.status !== "failed") return;

	await Bookings.updateOne(
		{
			_id: booking._id,
			paymentStatus: { $nin: ["paid", "refunded"] },
			razorpayOrderId: payment.razorpayOrderId,
		},
		{ $set: { paymentStatus: "failed" } }
	);
};

const refundDuplicatePayment = async (client, payment) => {
	const claimed = await Payment.findOneAndUpdate(
		{
			_id: payment._id,
			status: "captured",
			refundInProgress: false,
		},
		{
			$set: { refundInProgress: true, reconciliationRequired: true },
		},
		{ new: true }
	);

	if (!claimed) return;

	try {
		const razorpayClient = client || getRazorpay().client;
		const refund = await razorpayClient.payments.refund(payment.razorpayPaymentId, {
			amount: payment.amount,
			notes: { reason: "Duplicate successful payment for one booking" },
		});

		await Payment.updateOne(
			{ _id: payment._id },
			{
				$set: {
					refundId: refund.id,
					status: refund.status === "processed" ? "refunded" : "captured",
					refundedAmount: refund.status === "processed" ? payment.amount : 0,
					refundInProgress: refund.status !== "processed",
					reconciliationRequired: refund.status !== "processed",
					failureReason:
						refund.status === "processed"
							? "Duplicate payment refunded."
							: "Duplicate payment refund is still processing.",
				},
			}
		);
	} catch {
		await Payment.updateOne(
			{ _id: payment._id },
			{
				$set: {
					refundInProgress: true,
					reconciliationRequired: true,
					failureReason: "Duplicate captured payment needs refund reconciliation.",
				},
			}
		);
	}
};

const confirmCapturedPayment = async (client, payment, booking, razorpayPayment) => {
	const latestPayment = await Payment.findById(payment._id);
	if (latestPayment?.status === "refunded") {
		return { booking, refunded: false };
	}

	await Payment.updateOne(
		{ _id: payment._id, status: { $ne: "refunded" } },
		{
			$set: {
				status: "captured",
				razorpayPaymentId: razorpayPayment.id,
				signatureVerified: true,
				failureReason: "",
			},
			$unset: { activeAttemptKey: 1 },
		}
	);

	const confirmedBooking = await Bookings.findOneAndUpdate(
		{
			_id: booking._id,
			paymentStatus: { $nin: ["paid", "refunded"] },
			status: { $ne: "cancelled" },
		},
		{
			$set: {
				status: "confirmed",
				paymentStatus: "paid",
				paymentReference: razorpayPayment.id,
				razorpayOrderId: payment.razorpayOrderId,
			},
		},
		{ new: true }
	);

	if (confirmedBooking) return { booking: confirmedBooking, refunded: false };

	const currentBooking = await Bookings.findById(booking._id);
	if (currentBooking?.paymentReference === razorpayPayment.id) {
		return { booking: currentBooking, refunded: false };
	}

	await refundDuplicatePayment(client, payment);
	return { booking: currentBooking, refunded: true };
};

const getOwnedPayment = async (userId, orderId) => {
	const payment = await Payment.findOne({ razorpayOrderId: orderId });
	if (!payment || payment.user.toString() !== userId.toString()) return null;

	const booking = await Bookings.findOne({ _id: payment.booking, user: userId });
	return booking ? { payment, booking } : null;
};

export const createPaymentOrder = async (req, res, next) => {
	let booking;
	let payment;

	try {
		const userId = req.user?.userId;
		const { tripId, travelers } = req.body ?? {};
		if (!userId) throw makeError("Please log in to book a trip.", statusCode.UNAUTHORIZED);

		if (!isMongoId(tripId)) {
			throw makeError("A valid trip ID is required.");
		}
		if (!Number.isInteger(travelers) || travelers < 1) {
			throw makeError("Travelers must be a positive whole number.");
		}
		if (!mongoose.Types.ObjectId.isValid(userId)) {
			throw makeError("Please log in to book a trip.", statusCode.UNAUTHORIZED);
		}

		const user = await User.findById(userId).select("_id");
		if (!user) throw makeError("Please log in to book a trip.", statusCode.UNAUTHORIZED);

		const trip = await Trip.findById(tripId);

		if (!trip) throw makeError("Trip not found.", statusCode.NOT_FOUND);
		if (trip.isActive === false) throw makeError("This trip is not available.", statusCode.GONE);
		if (!isTripDateAvailable(trip.date)) {
			throw makeError("This trip date has passed.", statusCode.GONE);
		}
		const { client, keyId } = getRazorpay();

		const activePaymentKey = makeActivePaymentKey(userId, tripId, travelers);
		booking = await Bookings.findOne({ activePaymentKey });

		if (booking && ["paid", "refunded"].includes(booking.paymentStatus)) {
			throw makeError("This booking cannot accept another payment.", statusCode.CONFLICT);
		}
		if (booking?.status === "cancelled") {
			throw makeError("This booking has been cancelled.", statusCode.CONFLICT);
		}

		if (!booking) {
			const pricing = getPaymentPrice(trip.pricePerHead, travelers);

			try {
				booking = await Bookings.create({
					user: userId,
					trip: trip._id,
					travelers,
					pricing: {
						pricePerPerson: pricing.pricePerPerson,
						subtotal: pricing.subtotal,
						currency: pricing.currency,
					},
					totalPrice: pricing.subtotal,
					status: "pending",
					paymentStatus: "pending",
					activePaymentKey,
				});
			} catch (error) {
				if (error.code !== 11000) throw error;
				booking = await Bookings.findOne({ activePaymentKey });
				if (!booking) throw error;
			}
		}

		const activeAttemptKey = booking._id.toString();
		const existingPayment = await Payment.findOne({ activeAttemptKey });

		if (existingPayment) {
			if (!existingPayment.razorpayOrderId) {
				throw makeError("Your payment order is still being prepared.", statusCode.CONFLICT);
			}

			return res.status(statusCode.OK).json({
				success: true,
				data: checkoutData(booking, existingPayment, keyId),
			});
		}

		if (!booking.pricing?.pricePerPerson || !booking.pricing?.subtotal) {
			throw makeError("This booking cannot be retried. Please start a new booking.", statusCode.CONFLICT);
		}

		const pricing = getPaymentPrice(booking.pricing.pricePerPerson, booking.travelers);
		payment = new Payment({
			booking: booking._id,
			user: userId,
			amount: pricing.amount,
			currency: booking.pricing.currency,
			activeAttemptKey,
		});
		payment.receipt = makeReceipt(payment._id);

		try {
			await payment.save();
		} catch (error) {
			if (error.code !== 11000) throw error;
			const activePayment = await Payment.findOne({ activeAttemptKey });
			if (activePayment?.razorpayOrderId) {
				return res.status(statusCode.OK).json({
					success: true,
					data: checkoutData(booking, activePayment, keyId),
				});
			}
			throw makeError("Your payment order is still being prepared.", statusCode.CONFLICT);
		}

		let order;
		try {
			order = await client.orders.create({
				amount: payment.amount,
				currency: payment.currency,
				receipt: payment.receipt,
				notes: { bookingId: booking._id.toString() },
			});
		} catch {
			await Payment.updateOne(
				{ _id: payment._id },
				{
					$set: { status: "failed", failureReason: "Order creation failed." },
					$unset: { activeAttemptKey: 1 },
				}
			);
			await Bookings.updateOne(
				{ _id: booking._id, paymentStatus: { $ne: "paid" } },
				{ $set: { paymentStatus: "failed" } }
			);
			throw makeError("Could not create a payment order. Please try again.", statusCode.BAD_GATEWAY);
		}

		try {
			payment.razorpayOrderId = order.id;
			await payment.save();
			booking.razorpayOrderId = order.id;
			booking.paymentStatus = "pending";
			await booking.save();
		} catch {
			await Payment.updateOne(
				{ _id: payment._id },
				{
					$set: {
						status: "failed",
						failureReason: "Order could not be saved. Reconciliation may be required.",
						reconciliationRequired: true,
					},
					$unset: { activeAttemptKey: 1 },
				}
			).catch(() => {});
			await Bookings.updateOne(
				{ _id: booking._id, paymentStatus: { $ne: "paid" } },
				{ $set: { paymentStatus: "failed" } }
			).catch(() => {});
			throw makeError("Could not prepare the payment. Please try again.", statusCode.BAD_GATEWAY);
		}

		return res.status(statusCode.CREATED).json({
			success: true,
			data: checkoutData(booking, payment, keyId),
		});
	} catch (error) {
		return next(error);
	}
};

export const verifyPayment = async (req, res, next) => {
	try {
		const userId = req.user?.userId?.toString();
		const {
			razorpay_order_id: orderId,
			razorpay_payment_id: paymentId,
			razorpay_signature: signature,
		} = req.body ?? {};

		if (typeof orderId !== "string" || typeof paymentId !== "string" || typeof signature !== "string") {
			throw makeError("Payment verification details are incomplete.");
		}

		const owned = await getOwnedPayment(userId, orderId);
		if (!owned) throw makeError("Payment was not found.", statusCode.NOT_FOUND);

		const { payment, booking } = owned;
		const { client, keySecret } = getRazorpay();

		if (!verifyCheckoutSignature(orderId, paymentId, signature, keySecret)) {
			throw makeError("Payment signature is invalid.", statusCode.BAD_REQUEST);
		}

		let razorpayPayment;
		try {
			razorpayPayment = await client.payments.fetch(paymentId);
		} catch {
			throw makeError("Payment status could not be checked. Please retry.", statusCode.BAD_GATEWAY);
		}
		if (!matchesRazorpayPayment(razorpayPayment, {
			orderId,
			amount: payment.amount,
			currency: payment.currency,
		})) {
			throw makeError("Payment details do not match this order.", statusCode.BAD_REQUEST);
		}

		if (razorpayPayment.status === "failed") {
			await markPaymentFailed(payment, booking);
			return res.status(statusCode.OK).json({
				success: true,
				data: { bookingId: booking._id, status: booking.status, paymentStatus: "failed" },
			});
		}

		let verifiedPayment = razorpayPayment;
		if (verifiedPayment.status === "authorized") {
			try {
				await client.payments.capture(paymentId, payment.amount, payment.currency);
				verifiedPayment = await client.payments.fetch(paymentId);
			} catch {
				return res.status(statusCode.ACCEPTED).json({
					success: true,
					data: { bookingId: booking._id, status: booking.status, paymentStatus: "pending" },
				});
			}
		}

		if (verifiedPayment.status !== "captured") {
			return res.status(statusCode.ACCEPTED).json({
				success: true,
				data: { bookingId: booking._id, status: booking.status, paymentStatus: "pending" },
			});
		}

		const result = await confirmCapturedPayment(client, payment, booking, verifiedPayment);
		if (result.refunded) {
			throw makeError(
				"This payment arrived after another payment confirmed the booking. It is being refunded or reconciled.",
				statusCode.CONFLICT
			);
		}

		return res.status(statusCode.OK).json({
			success: true,
			data: {
				bookingId: result.booking._id,
				status: result.booking.status,
				paymentStatus: result.booking.paymentStatus,
				totalPrice: result.booking.totalPrice,
				paymentReference: result.booking.paymentReference,
			},
		});
	} catch (error) {
		return next(error);
	}
};

export const getPaymentStatus = async (req, res, next) => {
	try {
		const { bookingId } = req.params;
		if (!mongoose.Types.ObjectId.isValid(bookingId)) {
			throw makeError("A valid booking ID is required.");
		}

		const booking = await Bookings.findOne({
			_id: bookingId,
			user: req.user.userId,
		}).lean();

		if (!booking) throw makeError("Booking not found.", statusCode.NOT_FOUND);

		const attempts = await Payment.find({ booking: booking._id, user: req.user.userId })
			.sort({ createdAt: -1 })
			.select("razorpayOrderId razorpayPaymentId amount currency status failureReason createdAt refundedAmount reconciliationRequired")
			.lean();

		return res.status(statusCode.OK).json({
			success: true,
			data: {
				bookingId: booking._id,
				status: booking.status,
				paymentStatus: booking.paymentStatus,
				totalPrice: booking.totalPrice,
				pricing: booking.pricing,
				attempts,
			},
		});
	} catch (error) {
		return next(error);
	}
};

const recordWebhookEvent = async (paymentId, eventId, eventType) => {
	await Payment.updateOne(
		{ _id: paymentId, "webhookEvents.eventId": { $ne: eventId } },
		{ $push: { webhookEvents: { eventId, eventType } } }
	);
};

const respondToWebhook = (res) =>
	res.status(statusCode.OK).json({ success: true, received: true });

export const handleRazorpayWebhook = async (req, res, next) => {
	try {
		const rawBody = req.body;
		const signature = req.get("x-razorpay-signature");
		const webhookSecret = getWebhookSecret();

		if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
			throw makeError("Invalid webhook signature.", statusCode.BAD_REQUEST);
		}

		let event;
		try {
			event = JSON.parse(rawBody.toString("utf8"));
		} catch {
			throw makeError("Invalid webhook body.", statusCode.BAD_REQUEST);
		}

		const eventId = getWebhookEventId(rawBody, req.get("x-razorpay-event-id"));
		const eventType = event.event;
		const paymentEntity = event.payload?.payment?.entity;

		if (["payment.captured", "payment.failed", "payment.authorized"].includes(eventType)) {
			if (!paymentEntity?.order_id) return respondToWebhook(res);

			const payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id });
			if (!payment) return respondToWebhook(res);

			if (!matchesRazorpayPayment(paymentEntity, {
				orderId: payment.razorpayOrderId,
				amount: payment.amount,
				currency: payment.currency,
			})) {
				await Payment.updateOne(
					{ _id: payment._id },
					{
						$set: {
							reconciliationRequired: true,
							failureReason: "Webhook amount or currency did not match the order.",
						},
					}
				);
				await recordWebhookEvent(payment._id, eventId, eventType);
				return respondToWebhook(res);
			}

			if (eventType === "payment.captured") {
				await Payment.updateOne(
					{ _id: payment._id, status: { $ne: "refunded" } },
					{
						$set: {
							status: "captured",
							razorpayPaymentId: paymentEntity.id,
							failureReason: "",
						},
						$unset: { activeAttemptKey: 1 },
					}
				);
			} else if (eventType === "payment.failed") {
				await Payment.updateOne(
					{ _id: payment._id, status: { $nin: ["captured", "refunded"] } },
					{
						$set: {
							status: "failed",
							razorpayPaymentId: paymentEntity.id,
							failureReason: "Payment was not completed.",
						},
						$unset: { activeAttemptKey: 1 },
					}
				);
			} else {
				await Payment.updateOne(
					{ _id: payment._id, status: { $nin: ["captured", "failed", "refunded"] } },
					{
						$set: {
							status: "authorized",
							razorpayPaymentId: paymentEntity.id,
						},
					}
				);
			}

			await recordWebhookEvent(payment._id, eventId, eventType);

			if (eventType === "payment.captured") {
				const booking = await Bookings.findById(payment.booking);
				if (booking) await confirmCapturedPayment(null, payment, booking, paymentEntity);
			}

			if (eventType === "payment.failed") {
				const currentPayment = await Payment.findById(payment._id);
				if (currentPayment?.status === "failed") {
					await markPaymentFailed(currentPayment, await Bookings.findById(payment.booking));
				}
			}

			return respondToWebhook(res);
		}

		if (eventType === "refund.processed" || eventType === "refund.failed") {
			const refund = event.payload?.refund?.entity;
			const payment = refund?.payment_id
				? await Payment.findOne({ razorpayPaymentId: refund.payment_id })
				: null;

			if (!payment) return respondToWebhook(res);

			if (eventType === "refund.failed") {
				if (payment.status === "refunded") return respondToWebhook(res);

				await Payment.updateOne(
					{ _id: payment._id },
					{
						$set: {
							refundInProgress: false,
							reconciliationRequired: true,
							failureReason: "Razorpay could not process a refund.",
						},
					}
				);
				await recordWebhookEvent(payment._id, eventId, eventType);
				return respondToWebhook(res);
			}

			if (!Number.isInteger(refund.amount) || refund.amount < 1) {
				return respondToWebhook(res);
			}
			if (refund.currency && refund.currency !== payment.currency) {
				await Payment.updateOne(
					{ _id: payment._id },
					{
						$set: {
							reconciliationRequired: true,
							failureReason: "Refund currency did not match the payment currency.",
						},
					}
				);
				await recordWebhookEvent(payment._id, eventId, eventType);
				return respondToWebhook(res);
			}
			if (payment.status === "refunded" && payment.refundId === refund.id) {
				await recordWebhookEvent(payment._id, eventId, eventType);
				return respondToWebhook(res);
			}

			const updatedPayment = await Payment.findOneAndUpdate(
				{
					_id: payment._id,
					"webhookEvents.eventId": { $ne: eventId },
					$expr: { $lte: [{ $add: ["$refundedAmount", refund.amount] }, "$amount"] },
				},
				{
					$inc: { refundedAmount: refund.amount },
					$push: { webhookEvents: { eventId, eventType } },
					$set: { refundInProgress: false, refundId: refund.id },
				},
				{ new: true }
			);

			if (!updatedPayment) {
				const alreadyHandled = await Payment.exists({
					_id: payment._id,
					"webhookEvents.eventId": eventId,
				});
				if (alreadyHandled) return respondToWebhook(res);

				await Payment.updateOne(
					{ _id: payment._id },
					{
						$set: {
							reconciliationRequired: true,
							failureReason: "Refund amount exceeded the original payment amount.",
						},
					}
				);
				return respondToWebhook(res);
			}

			if (updatedPayment.refundedAmount >= updatedPayment.amount) {
				await Payment.updateOne(
					{ _id: updatedPayment._id },
					{
						$set: {
							status: "refunded",
							refundInProgress: false,
							reconciliationRequired: false,
							failureReason: "",
						},
					}
				);
				await Bookings.updateOne(
					{ _id: updatedPayment.booking, paymentReference: updatedPayment.razorpayPaymentId },
					{
						$set: { paymentStatus: "refunded", status: "cancelled" },
						$unset: { activePaymentKey: 1 },
					}
				);
			}

			return respondToWebhook(res);
		}

		return respondToWebhook(res);
	} catch (error) {
		return next(error);
	}
};
