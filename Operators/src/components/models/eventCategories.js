import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Set this to false once your backend route is ready.
const USE_MOCK_DATA = false;

// Each category from the database should look like this:
// { id, slug, name, description, icon }
// `icon` is just a name (see ICONS in AddEventModal.jsx).
const MOCK_CATEGORIES = [
  {
    id: "1",
    slug: "festivals-celebrations",
    name: "Festivals & Celebrations",
    description: "Cultural festivals, concerts, seasonal events and special occasions.",
    icon: "festival",
  },
  {
    id: "2",
    slug: "curated-trips",
    name: "Curated Trips",
    description: "Planned journeys with a destination, stays and a day-by-day itinerary.",
    icon: "trip",
  },
  {
    id: "3",
    slug: "adventure-outdoors",
    name: "Adventure & Outdoors",
    description: "Treks, hikes, cycling, sunrise trips, running events and road trips.",
    icon: "adventure",
  },
  {
    id: "4",
    slug: "networking-meetups",
    name: "Networking & Learning Meetups",
    description: "Meetups where students, job seekers and professionals connect and learn.",
    icon: "networking",
  },
  {
    id: "5",
    slug: "social-gatherings",
    name: "Social Gatherings & Parties",
    description: "Community parties, house gatherings and hosted meetups, free or paid.",
    icon: "social",
  },
];

export async function getEventCategories() {
  if (USE_MOCK_DATA) return MOCK_CATEGORIES;

  const res = await axios.get(`${API_URL}/operator/event-categories`, {
    withCredentials: true,
  });

  return res.data?.data || [];
}