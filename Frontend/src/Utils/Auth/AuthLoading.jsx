
import styles from "./AuthLoading.module.css";

export default function AuthLoading() {
  return (
    <div className={styles.loader}>
      <div className={styles.content}>
        <div className={styles.icon}>✈</div>

        <h2>Preparing your journey</h2>

        <p>Please wait while we verify your account.</p>

        <div className={styles.spinner} />
      </div>
    </div>
  );
}
