import { useEffect, useState } from 'react';
import styles from '../AdminDashboard.module.css'
import { getAllTrips } from '../../../api/trips/tripsApi';


const stateOf = (t) => (t.booked >= t.seats ? "full" : t.booked / t.seats >= 0.8 ? "filling" : "open");
const stateLabel = { full: "Sold out", filling: "Filling fast", open: "Open" };

const UpComingTrips = () => {

    const [trips, setTrips] = useState([])

    useEffect(() => {
  const fetchTrips = async () => {
    try {
      const  data  = await getAllTrips();
      setTrips(data);
    } catch (err) {
      console.log(err.message);
    }
  };

  fetchTrips();
}, []);
    
 
    
  return (
    <>
            <section className={styles.trips}>
          <div className={styles.tripsHead}>
            <h2>Upcoming trips</h2>
          </div>
          <ul className={styles.list}>
            {trips.map((t) => {
              const s = stateOf(t);
              return (
                <li key={t.to} className={styles.trip}>
                  <div className={styles.date}><img className='rounded h-full w-full' src={t.banner.url} alt="" /></div>
                  <div className={styles.tripInfo}>
                    <h3>{t.from}</h3>
                    <div className={`${styles.bar} ${styles[s]}`} style={{ "--p": `${(t.booked / t.seats) * 100}%` }} />
                    <p>{t.duration}/{t.seats} seats</p>
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
