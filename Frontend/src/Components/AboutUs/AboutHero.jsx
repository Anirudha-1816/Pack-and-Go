import styles from "./AboutUs.module.css";

import { Link } from "react-router-dom";


const AboutHero = () => {
    
const heroCards = [
  {
    title: "A guide on every trip",
    text: "Each trip has an assigned guide, so you always know who to call.",
    style: styles.heroWhite,
  },
  {
    title: "Clear pickup and drop",
    text: "Time and place are shown before you book. No surprises on the day.",
    style: styles.heroGreen,
  },
  {
    title: "Pay online, per person",
    text: "Pick a per-head, group of 2 or group of 4 price and pay in one go.",
    style: styles.heroOrange,
  },
];

  return (
    <>
    <main className={styles.page}>

          <section className={styles.hero}>
            <div className={styles.heroText}>
              <h1>Group trips, without the group chat chaos.</h1>
              <p>
                Pack&amp;Go is a group travel booking platform. Pick a trip, see the
                full plan, book your seat and pay online. We handle the rest, with a
                guide on every journey.
              </p>
              <Link to="/know-us" className={styles.btn}>
                Know More
              </Link>
            </div>
    
            <div className={styles.heroCards}>
              {heroCards.map((card) => (
                  <div key={card.title} className={`${styles.heroCard} ${card.style}`}>
                  <h2>{card.title}</h2>
                  <p>{card.text}</p>
                </div>
              ))}
            </div>
          </section>
              </main>
                    </>
  )
}

export default AboutHero