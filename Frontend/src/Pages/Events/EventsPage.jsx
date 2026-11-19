import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiComponents from "../../apis/apiComponents";
import useAuthStore from "../../Stores/authStore";
import Navbar from "../../Components/Navbar/Navbar";
import EventsComponent from "../../sections/Destinations/CityEvents";
import { EventCard } from "../../sections/Destinations/CityEvents";

export default function EventsPage() {
  const { user, fetchUser } = useAuthStore();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load user on mount
  useEffect(() => {
    if (!user) {
      fetchUser().catch(() => {});
    }
  }, [user, fetchUser]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiComponents.get("/events");
      const list = res.data?.data || [];
      setEvents(list);
    } catch (err) {
      console.error("Failed to load events:", err);
      setError("Could not load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse">
                <div className="aspect-[16/10] bg-slate-200" />
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="mt-auto h-8 bg-slate-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center text-slate-500">
            {error}
            <button
              onClick={fetchEvents}
              className="mt-4 text-teal-700 font-medium underline"
            >
              Retry
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <EventsComponent events={events} user={user} />
    </>
  );
}