import { Link } from "react-router-dom";
import styles from "./home.module.css";

function OperatorHome() {
  return (
    <main className={styles.page}>
      <section className={styles.mainCard} aria-labelledby="welcome-heading">
        <div className={styles.leftPanel}>
          <Link to="/" className={styles.brandLink} aria-label="Pack&Go home">
            <img src="/operators.png" alt="" />
            <span className={styles.brandName}>
              Pack<span className={styles.accent}>&</span>Go
            </span>
          </Link>

          <div className={styles.brandDivider} />
          <p className={styles.eyebrow}>Pack&Go operator portal</p>
          <h1 id="welcome-heading" className={styles.headline}>
            Make every trip worth remembering.
          </h1>
          <p>
            Sign in to manage your operator account, or apply to bring your
            next great travel experience to Pack&Go.
          </p>

          <p className={styles.copyright}>
            © {new Date().getFullYear()} Pack&Go
          </p>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.rightInner}>
            <p className={styles.welcomeBadge}>
              <span aria-hidden="true" />
              Welcome
            </p>
            <h2>Your next journey starts here.</h2>
            <p>Choose how you'd like to continue.</p>

            <div className={styles.buttonGroup}>
              <Link to="/operator/login" className={styles.primaryBtn}>
                Sign in to your account
              </Link>
              <Link to="/operator/register" className={styles.secondaryBtn}>
                Apply as an operator
              </Link>
            </div>

            <p className={styles.note}>
              New operator accounts are reviewed and approved by the Pack&Go
              team.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default OperatorHome;