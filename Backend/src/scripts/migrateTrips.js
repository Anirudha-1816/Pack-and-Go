/**
 * One-time migration script to backfill status and isActive fields on old Trip documents.
 * Run once after deploying the fix: node src/scripts/migrateTrips.js
 * Safe to run multiple times (idempotent).
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Trip from "../models/components/tripModel.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_DB_URL || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_DB_URL or MONGO_URI not set in environment");
  process.exit(1);
}

async function migrate() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Backfill status: "approved" where status doesn't exist
    const statusResult = await Trip.updateMany(
      { status: { $exists: false } },
      { $set: { status: "approved" } }
    );
    console.log(`Updated ${statusResult.modifiedCount} trips: status -> "approved"`);

    // 2. Backfill isActive: true where isActive doesn't exist
    const activeResult = await Trip.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );
    console.log(`Updated ${activeResult.modifiedCount} trips: isActive -> true`);

    // 3. Backfill pickupDropType: "group" where it doesn't exist (default for old trips)
    const pickupResult = await Trip.updateMany(
      { pickupDropType: { $exists: false } },
      { $set: { pickupDropType: "group" } }
    );
    console.log(`Updated ${pickupResult.modifiedCount} trips: pickupDropType -> "group"`);

    // 4. Backfill maxTravelers: default 20 where it doesn't exist
    const travelersResult = await Trip.updateMany(
      { maxTravelers: { $exists: false } },
      { $set: { maxTravelers: 20 } }
    );
    console.log(`Updated ${travelersResult.modifiedCount} trips: maxTravelers -> 20`);

    // 5. Backfill rejectionReason: "" where it doesn't exist
    const rejectionResult = await Trip.updateMany(
      { rejectionReason: { $exists: false } },
      { $set: { rejectionReason: "" } }
    );
    console.log(`Updated ${rejectionResult.modifiedCount} trips: rejectionReason -> ""`);

    // 6. Backfill termsType: "regular" where it doesn't exist
    const termsResult = await Trip.updateMany(
      { termsType: { $exists: false } },
      { $set: { termsType: "regular" } }
    );
    console.log(`Updated ${termsResult.modifiedCount} trips: termsType -> "regular"`);

    // 7. Backfill roadmap: [] where it doesn't exist
    const roadmapResult = await Trip.updateMany(
      { roadmap: { $exists: false } },
      { $set: { roadmap: [] } }
    );
    console.log(`Updated ${roadmapResult.modifiedCount} trips: roadmap -> []`);

    console.log("\n✅ Migration complete!");
    console.log("All old Trip documents now have status, isActive, and operator-flow fields set.");

  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

migrate();