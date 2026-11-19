import { useMemo } from "react";
import { MapPin, Calendar, Clock, Users, Utensils } from "lucide-react";

// ---------- helpers ----------
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatPrice = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

// "Jaipur", " jaipur " and "JAIPUR" all count as the same city
const isSameCity = (a, b) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

// ---------- one line with an icon ----------
function InfoRow({ icon: Icon, children }) {
  return (
    <li className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
      <span className="min-w-0 truncate">{children}</span>
    </li>
  );
}



// ---------- one event card ----------
export function EventCard({ event }) {
  const nights = Math.max(event.duration - 1, 0);
  const image = event.thumbnail?.url || event.banner?.url;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/10] bg-slate-100">
        {image && (
          <img
            src={image}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium capitalize text-teal-700">
          {event.tripType}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">
            {event.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {event.description}
          </p>
        </div>

        <ul className="space-y-2 text-sm text-slate-600">
          <InfoRow icon={MapPin}>{event.destination}</InfoRow>
          <InfoRow icon={Calendar}>{formatDate(event.date)}</InfoRow>
          <InfoRow icon={Clock}>
            {event.duration} {event.duration === 1 ? "day" : "days"}, {nights}{" "}
            {nights === 1 ? "night" : "nights"}
          </InfoRow>
          <InfoRow icon={Users}>Up to {event.maxTravelers} travelers</InfoRow>
          {event.meals?.length > 0 && (
            <InfoRow icon={Utensils}>
              <span className="capitalize">{event.meals.join(", ")}</span>
            </InfoRow>
          )}
        </ul>

        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs text-slate-500">Hosted by</p>
            <p className="text-sm font-medium text-slate-800">{event.guide}</p>
          </div>
          <p className="text-right">
            <span className="text-xl font-semibold text-teal-700">
              {formatPrice(event.pricePerHead)}
            </span>
            <span className="block text-xs text-slate-500">per person</span>
          </p>
        </div>
      </div>
    </article>
  );
}

// ---------- the page ----------
// events: array of events (as returned by your API)
// user:   the logged-in user, e.g. { name: "Aman", city: "Jaipur" }
export default function Events({ events = [], user }) {
  const city = user?.city;

  const cityEvents = useMemo(
    () => (city ? events.filter((event) => isSameCity(event.city, city)) : []),
    [events, city]
  );

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          {city ? `Events in ${city}` : "Events"}
        </h2>
        {city && (
          <p className="mt-1 text-sm text-slate-500">
            {cityEvents.length} {cityEvents.length === 1 ? "event" : "events"}{" "}
            hosted by operators in your city
          </p>
        )}
      </header>

      {!city ? (
        <EmptyState>Add your city to your profile to see events near you.</EmptyState>
      ) : cityEvents.length === 0 ? (
        <EmptyState>No events in {city} yet. Check back soon.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cityEvents.map((event) => (
            <EventCard key={event._id ?? event.tripIdentifier} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center text-slate-500">
      {children}
    </div>
  );
}