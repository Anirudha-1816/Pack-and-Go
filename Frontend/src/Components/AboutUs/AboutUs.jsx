import { Link } from "react-router-dom";
import styles from "./Aboutus.module.css";
import Navbar from "../Navbar/Navbar";
import AboutHero from "./AboutHero";

// ---------- Content (edit the text here, not in the JSX) ----------

const reasons = [
  {
    title: "A guide on every trip",
    text: "Each trip has an assigned guide, so you always know who to call.",
  },
  {
    title: "The whole plan, up front",
    text: "Roadmap, what is included, pickup and drop details: all on the trip page before you book.",
  },
  {
    title: "Pricing that is easy to read",
    text: "Pay per person, or choose a group of 2 or a group of 4.",
  },
  {
    title: "Comfort you choose",
    text: "Pick budget, deluxe or premium stays and travel where a trip offers them.",
  },
  {
    title: "Terms in plain sight",
    text: "Read the trip terms before you pay, not after.",
  },
  {
    title: "Book and pay online",
    text: "Reserve your seat and pay online in a few taps.",
  },
];

const values = [
  {
    title: "No surprises",
    text: "What you read on the trip page is what you get on the road.",
  },
  {
    title: "People first",
    text: "Good trips come from good guides and a group that feels looked after.",
  },
  {
    title: "Easy to join",
    text: "Joining a group trip should take minutes, not twenty chat messages.",
  },
];

// Put your real numbers here. Delete the whole numbers section if you have none yet.
const numbers = [
  { value: "40", label: "trips completed" },
  { value: "89+", label: "travelers on the road" },
  { value: "45+", label: "destinations covered" },
];

// Add real names, roles and photos here
const team = [
  { name: "Ashish Jangid", role: "Travel Experience Planner. Passionate about making every journey memorable, enjoyable, and hassle-free.", about: "(Your guide)", color: "#c49a55" },
  { name: "Harsh Sharma", role: "Trip Planning & Operations. Focuses on creating smooth travel experiences and making group adventures easier to manage.", about: "(Your trip planner)", color: "#2f6b8a" },
  { name: "Raj Singh", role: "Founder & Full-Stack Developer. Building Pack&Go to make discovering destinations, planning trips, and booking adventures easier for everyone.", about: "(Founder)", color: "#142b3b" },
];

// ---------- Page ----------

function AboutUs() {
  return (
    <>
    <Navbar/>
    <main className={styles.page}>
      {/* 1. Hero */}

      <AboutHero/>


      {/* 2. Our story */}
      <section className={styles.story}>
        <div className={styles.inner}>
          <h2 className={styles.sectionTitle}>Our story</h2>
          <div className={styles.storyText}>
            <p>
              Planning a trip with a group usually starts the same way: a long
              chat, a few half-made plans, and one person left to chase everyone
              for money. We thought there had to be a simpler way to travel
              together.
            </p>
            <p>
              So we built Pack&amp;Go: one place where each trip is already
              planned. You see the route, what is included and where the bus
              leaves from. You choose your seat, pay online, and meet your guide
              at the pickup point.
            </p>
            <p>
              [YOUR FOUNDING STORY: who started Pack&amp;Go, where, and what made
              you start. Two sentences.]
            </p>
          </div>
        </div>
      </section>

      {/* 3. Why travel with us */}
      <section className={styles.section}>
        <div className={styles.inner}>
          <h2 className={styles.sectionTitle}>Why travel with us</h2>
          <div className={styles.cards}>
            {reasons.map((item) => (
              <div key={item.title} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Values */}
      <section className={styles.values}>
        <div className={styles.inner}>
          <h2 className={styles.sectionTitle}>What we stand for</h2>
          <div className={styles.cards}>
            {values.map((item) => (
              <div key={item.title} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      {/* 6. Team */}
      <section className={styles.section}>
        <div className={styles.inner}>
          <h2 className={styles.sectionTitle}>The people behind your trip</h2>
          
          <div className={styles.team}>
            {team.map((person, index) => (
              <div key={index} className={styles.person}>
                <div
                  className={styles.avatar}
                  style={{ background: person.color }}
                />
                <h3>{person.name}</h3>
                <p>
                  {person.role}. {person.about}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Numbers */}   
      <section className={styles.numbers}>
        <div className={`${styles.inner} ${styles.numbersRow}`}>
          {numbers.map((item) => (
            <div key={item.label}
            >
              <strong>{item.value}</strong>
              <p>{item.label}</p>
            </div>
          ))}
        </div>
      </section>


      {/* 7. Call to action */}
      <section className={styles.cta}>
        <div className={styles.inner}>
          <h2>Ready for your next trip?</h2>
          <p>
            See what is leaving soon and grab a seat. Questions first? Write to
            us at [YOUR EMAIL] or call [YOUR PHONE].
          </p>
          <Link to="/package" className={styles.btn}>
            Browse upcoming trips
          </Link>
        </div>
      </section>
    </main>
          </>
  );
}

export default AboutUs;
