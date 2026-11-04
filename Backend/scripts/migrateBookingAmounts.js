// Flow: old rupee booking fields -> one integer paise amount -> unique active index.
// Run this once before deploying the model that requires amount in paise.

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// Find the legacy rupee total so the migration can convert it exactly once.
const getLegacyAmount = (booking) => {
  if (Number.isFinite(booking.totalPrice)) {
    return booking.totalPrice;
  }
  if (Number.isFinite(booking.pricing?.subtotal)) {
    return booking.pricing.subtotal;
  }
  return null;
};

// Convert old bookings and create the active-booking index after checking duplicates.
const migrateBookingAmounts = async () => {
  if (!process.env.MONGO_DB_URL) {
    throw new Error("MONGO_DB_URL is required to migrate booking amounts.");
  }

  await mongoose.connect(process.env.MONGO_DB_URL);
  const bookings = mongoose.connection.collection("bookings");
  let migrated = 0;
  const cursor = bookings.find({
    $or: [
      { amount: { $exists: false } },
      { totalPrice: { $exists: true } },
      { pricing: { $exists: true } },
      { pricePerPerson: { $exists: true } },
      { subtotal: { $exists: true } },
    ],
  });

  for await (const booking of cursor) {
    let amount = booking.amount;
    if (!Number.isSafeInteger(amount) || amount < 1) {
      const oldAmount = getLegacyAmount(booking);
      if (!Number.isFinite(oldAmount) || oldAmount <= 0) {
        throw new Error(
          `Booking ${booking._id} has no valid legacy total price. Fix it before migrating.`
        );
      }
      amount = Math.round(oldAmount * 100);
    }

    if (!Number.isSafeInteger(amount) || amount < 1) {
      throw new Error(`Booking ${booking._id} has an unsafe amount in paise.`);
    }

    const currency = String(
      booking.currency || booking.pricing?.currency || "INR"
    ).toUpperCase();
    if (currency !== "INR") {
      throw new Error(
        `Booking ${booking._id} uses unsupported currency ${currency}.`
      );
    }

    await bookings.updateOne(
      { _id: booking._id },
      {
        $set: { amount, currency },
        $unset: {
          pricePerPerson: "",
          subtotal: "",
          totalPrice: "",
          pricing: "",
        },
      }
    );
    migrated += 1;
  }

  const duplicates = await bookings.aggregate([
    {
      $match: {
        status: "pending",
        paymentStatus: { $in: ["pending", "failed"] },
      },
    },
    {
      $group: {
        _id: {
          user: "$user",
          trip: "$trip",
          travelers: "$travelers",
        },
        bookingIds: { $push: "$_id" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]).toArray();

  if (duplicates.length > 0) {
    const descriptions = duplicates.map((duplicate) => {
      return `${JSON.stringify(duplicate._id)}: ${duplicate.bookingIds.join(", ")}`;
    });
    throw new Error(
      `Found active duplicate bookings. Resolve them before creating the unique index:\n${descriptions.join("\n")}`
    );
  }

  await bookings.createIndex(
    { user: 1, trip: 1, travelers: 1 },
    {
      unique: true,
      name: "uniq_active_user_trip_travelers",
      partialFilterExpression: {
        status: "pending",
        paymentStatus: { $in: ["pending", "failed"] },
      },
    }
  );

  console.log(`Migrated ${migrated} booking(s) to integer paise amounts.`);
  console.log("Created the unique index for active bookings.");
};

// Report migration failures and always close the database connection.
migrateBookingAmounts()
  .catch((error) => {
    console.error("Booking amount migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
