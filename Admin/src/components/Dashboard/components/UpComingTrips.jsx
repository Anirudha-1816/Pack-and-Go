import styles from '../AdminDashboard.module.css'
const trips = [
  { name: "Rishikesh Rafting Camp", day: "02", month: "Nov", booked: 14, seats: 20 },
  { name: "Manali Adventure", day: "12", month: "Nov", booked: 25, seats: 25 },
  { name: "Goa Beach Week", day: "05", month: "Dec", booked: 22, seats: 30 },
  { name: "Jaipur Heritage Trail", day: "18", month: "Dec", booked: 9, seats: 25 },
  { name: "Kerala Backwaters", day: "06", month: "Jan", booked: 19, seats: 20 },
  { name: "Spiti Valley Road Trip", day: "20", month: "Jan", booked: 6, seats: 16 },
  { name: "Andaman Island Escape", day: "10", month: "Feb", booked: 11, seats: 24 },
  { name: "Ladakh Bike Expedition", day: "01", month: "Mar", booked: 4, seats: 12 },


];

const stateOf = (t) => (t.booked >= t.seats ? "full" : t.booked / t.seats >= 0.8 ? "filling" : "open");
const stateLabel = { full: "Sold out", filling: "Filling fast", open: "Open" };

const UpComingTrips = () => {

 
    
  return (
    <>
            <section className={styles.trips}>
          <div className={styles.tripsHead}>
            <h2>Upcoming trips</h2>
            <span className={styles.count}>{trips.length}</span>
          </div>
          <ul className={styles.list}>
            {trips.map((t) => {
              const s = stateOf(t);
              return (
                <li key={t.name} className={styles.trip}>
                  <div className={styles.date}><b>{t.day}</b>{t.month}</div>
                  <div className={styles.tripInfo}>
                    <h3>{t.name}</h3>
                    <div className={`${styles.bar} ${styles[s]}`} style={{ "--p": `${(t.booked / t.seats) * 100}%` }} />
                    <p>{t.booked}/{t.seats} seats</p>
                  </div>
                  <span className={`${styles.chip} ${styles[s]}`}>{stateLabel[s]}</span>
                </li>
              );
            })}
          </ul>
      
        </section>
    </>
  )
}



export default UpComingTrips
