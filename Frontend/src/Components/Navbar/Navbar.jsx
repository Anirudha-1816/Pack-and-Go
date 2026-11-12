import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";
import { getNav } from "./api";

export default function Navbar() {
  const [nav, setNav] = useState([]);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Load logo + links from the API
  useEffect(() => {
    getNav()
      .then((items) => setNav(items))
      .catch(() => {});
  }, []);

  // Shadow once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu with Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const logo = nav[0]?.logo;
  const navItems = nav[0]?.navItems || [];

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""} animate-slide-down`}>
      <nav className={styles.nav} aria-label="Main">
        <Link to="/" className={styles.brand} aria-label="Pack&Go home">
          {logo && <img src={logo} alt="" className={`${styles.logo} animate-fade-in`} />}
          <span className={styles.brandName}>
            Pack<span className={styles.amp}>&</span>Go
          </span>
        </Link>

        {/* Desktop links */}
        <ul className={styles.links}>
          {navItems.map((l, i) => (
            <li key={l._id} style={{ animationDelay: `${i * 80}ms` }} className="animate-slide-up">
              {l.path.startsWith("#") ? (
                <a
                  href={l.path}
                  className={styles.link}
                >
                  {l.label}
                </a>
              ) : (
                <NavLink
                  to={l.path}
                  end={l.path === "/"}
                  className={({ isActive }) =>
                    `${styles.link} ${isActive ? styles.active : ""}`}
                >
                  {l.label}
                </NavLink>
              )}
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <svg
            className={styles.toggleIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`${styles.mobileMenu} ${open ? styles.mobileMenuOpen : ""} animate-slide-down`}
      >
        <ul className={styles.mobileList}>
          {navItems.map((l, i) => (
            <li key={l._id} style={{ animationDelay: `${i * 60}ms` }} className="animate-slide-up">
              <NavLink
                to={l.path}
                end={l.path === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `${styles.mobileLink} ${isActive ? styles.mobileActive : ""}`}
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}