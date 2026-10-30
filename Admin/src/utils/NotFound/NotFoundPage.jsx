
import { Link } from "react-router-dom";
import styles from './NotFound.module.css'

 function NotFoundPage() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <div className={styles.icon}>404</div>

        <h1>Looks like you're off the map!</h1>

        <p>
          The page you're looking for doesn't exist
          or may have been moved.
        </p>

        <Link to="/" className={styles.button}>
          Back to Home
        </Link>
      </div>
    </main>
  );
}

export default NotFoundPage