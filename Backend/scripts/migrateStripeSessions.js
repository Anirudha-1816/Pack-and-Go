// Copy existing Stripe session IDs from the old payments collection onto bookings.

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// Keep the newest Stripe session on each unpaid booking for the new service to resume.
const migrateStripeSessions = async () => {
  if (!process.env.MONGO_DB_URL) {
    throw new Error("MONGO_DB_URL is required to migrate Stripe sessions.");
  }

  await mongoose.connect(process.env.MONGO_DB_URL);
  const bookings = mongoose.connection.collection("bookings");
  const payments = mongoose.connection.collection("payments");
  let migrated = 0;

  const oldSessions = payments.find({
    provider: "stripe",
    stripeCheckoutSessionId: { $type: "string" },
  }).sort({ createdAt: -1 });

  for await (const payment of oldSessions) {
    const result = await bookings.updateOne(
      {
        _id: payment.booking,
        stripeSessionId: { $exists: false },
        paymentStatus: { $nin: ["paid", "refunded"] },
        status: { $ne: "cancelled" },
      },
      { $set: { stripeSessionId: payment.stripeCheckoutSessionId } }
    );
    migrated += result.modifiedCount;
  }

  // The old booking model created this index for activePaymentKey; the new model no longer uses it.
  const indexes = await bookings.indexes();
  const oldIndex = indexes.find((index) => index.key?.activePaymentKey === 1);
  if (oldIndex) await bookings.dropIndex(oldIndex.name);

  console.log(`Copied ${migrated} Stripe session ID(s) to bookings.`);
};

// Always close the database connection, including when a migration step fails.
migrateStripeSessions()
  .catch((error) => {
    console.error("Stripe session migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
