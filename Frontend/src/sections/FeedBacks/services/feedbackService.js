// import axios from "axios";
import { sampleFeedbacks } from "./sampleFeedbacks";

// ============================================================
//  API CONNECTION POINT
// ============================================================
// Right now this returns sample data after a short fake delay.
//
// When your backend is ready:
//   1. Uncomment the axios import above and the "REAL API" lines below.
//   2. Delete the "TEMP" lines.
//
// The API must return an array shaped like sampleFeedbacks.js
// (one item per trip, latest reviews first).
// ============================================================

export async function getFeedbackTrips() {
  // ---- REAL API (uncomment later) ----
  // const response = await axios.get("YOUR_API_URL_HERE");
  // return response.data;

  // ---- TEMP: sample data ----
  await new Promise((resolve) => setTimeout(resolve, 800));
  return sampleFeedbacks;
}