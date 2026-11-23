import mongoose from "mongoose";
import dotenv from "dotenv";
import PackageCategory from "../models/components/packageModel.js";

dotenv.config();

const MONGODB_URI = process.env.MONGO_DB_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/pack-and-go";

const categories = [
  {
    name: "Festivals & Celebrations",
    slug: "festivals-celebrations",
    description: "Cultural festivals, concerts, seasonal events and special occasions.",
    icon: "festival",
    order: 1,
  },
  {
    name: "Curated Trips",
    slug: "curated-trips",
    description: "Planned journeys with a destination, stays and a day-by-day itinerary.",
    icon: "trip",
    order: 2,
  },
  {
    name: "Adventure & Outdoors",
    slug: "adventure-outdoors",
    description: "Treks, hikes, cycling, sunrise trips, running events and road trips.",
    icon: "adventure",
    order: 3,
  },
  {
    name: "Networking & Learning Meetups",
    slug: "networking-meetups",
    description: "Meetups where students, job seekers and professionals connect and learn.",
    icon: "networking",
    order: 4,
  },
  {
    name: "Social Gatherings & Parties",
    slug: "social-gatherings",
    description: "Community parties, house gatherings and hosted meetups, free or paid.",
    icon: "social",
    order: 5,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if collection is empty
    const count = await PackageCategory.countDocuments();
    if (count > 0) {
      console.log(`Collection already has ${count} categories. Skipping seed.`);
      process.exit(0);
    }

    // Insert categories
    await PackageCategory.insertMany(categories);
    console.log("Successfully seeded 5 event categories");

    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();