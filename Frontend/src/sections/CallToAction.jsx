import { Link } from "react-router-dom";
import { Compass, ArrowRight, CheckCircle } from "lucide-react";

const serifFont = "font-normal [font-family:'Instrument_Serif',Georgia,serif]";

// Change the text and links here, or pass them in as props
export default function CallToAction({
  title = "Your next adventure starts here",
  text = "Browse trips, festivals and meetups from trusted local operators, and book your spot in a few clicks.",
  primary = { to: "/package", label: "Explore events" },
  secondary = { to: "/contact-us", label: "Talk to our team" },
  points = ["Admin-approved operators", "Book and pay online"],
}) {
  return (
    <section className="mx-auto max-w-[1100px]">
      <div className="relative overflow-hidden rounded-[28px] bg-[#142b3b] px-6 py-14 text-center sm:px-12 sm:py-16">
        {/* Soft glow in the corners */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#2f6b8a]/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[#c49a55]/25 blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold !text-[#e8d3a8]">
            <Compass className="h-4 w-4" aria-hidden="true" />
            Pack&Go
          </span>

          <h2 className={`${serifFont} mx-auto mt-5 max-w-[640px] text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.1] !text-white`}>
            {title}
          </h2>

          <p className="mx-auto mt-4 max-w-[520px] text-lg leading-relaxed !text-white/70">{text}</p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={primary.to}
              className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#c49a55] px-7 py-3.5 font-bold !text-[#142b3b] no-underline shadow-[0_8px_24px_rgba(196,154,85,0.35)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#d4ab68] motion-reduce:transition-none"
            >
              {primary.label}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>

            <Link
              to={secondary.to}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-white/25 px-7 py-3.5 font-semibold !text-white no-underline transition duration-200 hover:bg-white/10 motion-reduce:transition-none"
            >
              {secondary.label}
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm !text-white/60">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-[#c49a55]" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}