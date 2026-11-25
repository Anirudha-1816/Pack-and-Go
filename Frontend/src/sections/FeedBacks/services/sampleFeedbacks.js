// Sample data for testing only. Replace it with real API data later.
//
// One item = one trip.
// "reviews" must have the LATEST review first.
// The review cards on the sides keep rotating through this list.
// (Use 5 or more reviews per trip to see the rotation at its best.)

const img = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

const people = [
  { name: "Aarav Sharma", avatar: "https://i.pravatar.cc/100?img=12" },
  { name: "Priya Verma", avatar: "https://i.pravatar.cc/100?img=47" },
  { name: "Rohan Mehta", avatar: "https://i.pravatar.cc/100?img=15" },
  { name: "Sneha Joshi", avatar: "https://i.pravatar.cc/100?img=32" },
  { name: "Karan Singh", avatar: "https://i.pravatar.cc/100?img=8" },
  { name: "Ananya Gupta", avatar: "https://i.pravatar.cc/100?img=44" },
  { name: "Vikram Rathore", avatar: "https://i.pravatar.cc/100?img=33" },
  { name: "Meera Nair", avatar: "https://i.pravatar.cc/100?img=26" },
  { name: "Devansh Patel", avatar: "https://i.pravatar.cc/100?img=52" },
  { name: "Isha Kapoor", avatar: "https://i.pravatar.cc/100?img=20" },
  { name: "Rahul Choudhary", avatar: "https://i.pravatar.cc/100?img=60" },
  { name: "Neha Agarwal", avatar: "https://i.pravatar.cc/100?img=5" },
];

// Small helper so the sample data stays short.
// Your real API just returns plain objects: { id, name, avatar, rating, text }
function makeReviews(tripId, firstPerson, list) {
  return list.map(([rating, text], index) => ({
    id: `${tripId}-review-${index + 1}`,
    ...people[(firstPerson + index) % people.length],
    rating,
    text,
  }));
}

export const sampleFeedbacks = [
  {
    id: "trip-1",
    destination: "Manali",
    location: "Himachal Pradesh",
    subtitle: "3-day snow and café trail",
    bannerImage: img("photo-1506905925346-21bda4d32df4"),
    averageRating: 4.8,
    totalReviews: 128,
    reviews: makeReviews("trip-1", 0, [
      [5, "Snow, bonfire and a super friendly group. Worth every rupee!"],
      [5, "Everything was planned so well. I just packed my bag and enjoyed."],
      [5, "The guide knew every hidden café in town. Loved the evenings."],
      [4, "Clean stay, tasty food and zero stress about transport."],
      [5, "Our group was just 12 people, so it never felt crowded."],
    ]),
  },
  {
    id: "trip-2",
    destination: "Jaisalmer",
    location: "Rajasthan",
    subtitle: "2-day desert camp weekend",
    bannerImage: img("photo-1509316785289-025f5b846b35"),
    averageRating: 4.7,
    totalReviews: 94,
    reviews: makeReviews("trip-2", 2, [
      [5, "Camel ride at sunset and folk music at night. The camp was clean."],
      [4, "Loved the stargazing. Just carry a jacket, nights get cold!"],
      [5, "The fort walk with our guide was the highlight for me."],
      [5, "Good food, comfy tents and a very friendly team."],
      [4, "Booked a seat in two taps and everything matched the plan."],
    ]),
  },
  {
    id: "trip-3",
    destination: "Rishikesh",
    location: "Uttarakhand",
    subtitle: "4-day rafting and yoga break",
    bannerImage: img("photo-1476514525535-07fb3b4ae5f1"),
    averageRating: 4.9,
    totalReviews: 76,
    reviews: makeReviews("trip-3", 4, [
      [5, "Rafting was a blast and the morning yoga by the river felt peaceful."],
      [5, "Safe, well organised and so much fun. Made friends for life."],
      [5, "The instructors were careful and explained every safety step."],
      [4, "The riverside café evenings were my favourite part."],
      [5, "Great value for the price. The plan was well balanced."],
    ]),
  },
  {
    id: "trip-4",
    destination: "Goa",
    location: "South Goa",
    subtitle: "4-day beach and sunset escape",
    bannerImage: img("photo-1507525428034-b723cf961d3e"),
    averageRating: 4.6,
    totalReviews: 152,
    reviews: makeReviews("trip-4", 6, [
      [5, "Quiet beaches, great stays and no stress about planning."],
      [4, "Loved the sunset cruise. The group size was just right."],
      [5, "Our trip leader knew all the best local food spots."],
      [4, "Smooth pickups and on-time plans every single day."],
      [5, "A perfect mix of free time and planned activities."],
    ]),
  },
  {
    id: "trip-5",
    destination: "Spiti Valley",
    location: "Himachal Pradesh",
    subtitle: "7-day high-altitude road trip",
    bannerImage: img("photo-1469854523086-cc02fe5d8800"),
    averageRating: 4.9,
    totalReviews: 61,
    reviews: makeReviews("trip-5", 8, [
      [5, "The best road trip of my life. Every little detail was handled."],
      [5, "Breathtaking views and homestays full of warmth."],
      [5, "Our guide looked after everyone at the high altitude. We felt safe."],
      [5, "Starry nights at the camp were unreal."],
      [4, "Tough roads, but the driver was excellent. Highly recommended."],
    ]),
  },
  {
    id: "trip-6",
    destination: "Agra",
    location: "Uttar Pradesh",
    subtitle: "1-day sunrise Taj Mahal tour",
    bannerImage: img("photo-1524492412937-b28074a5d7da"),
    averageRating: 4.5,
    totalReviews: 83,
    reviews: makeReviews("trip-6", 10, [
      [5, "Reaching before the crowd made all the difference."],
      [4, "Smooth pickup, on-time schedule and a very helpful guide."],
      [5, "The guide's stories about the monument were amazing."],
      [4, "Good value for a one-day trip. Nothing felt rushed."],
      [5, "The breakfast stop was lovely and the timings were perfect."],
    ]),
  },
];