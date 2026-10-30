import { useState } from "react";
import { NavLink, useNavigate ,  } from "react-router-dom";
import {
  FaThLarge, FaSuitcaseRolling, FaCalendarCheck, FaImages, FaEnvelope, FaStar,
  FaSignOutAlt, FaBars, FaSearch, FaBell, FaRupeeSign, FaArrowUp, FaArrowDown,
} from "react-icons/fa";
import styles from "./AdminDashboard.module.css";
import useAuthStore from "../../store/authStore";
import baseApi from "../../api/baseApi";
import UpComingTrips from "./components/UpComingTrips";
const admin = { email: "admin@packandgo.com" };

const nav = [
  { to: "/admin-dashboard", label: "Dashboard", icon: <FaThLarge />, end: true },
  { to: "/admin-managePackages", label: "Packages", icon: <FaSuitcaseRolling /> },
  { to: "/admin/bookings", label: "Bookings", icon: <FaCalendarCheck /> },
  { to: "/admin/gallery", label: "Gallery", icon: <FaImages /> },
  { to: "/admin/messages", label: "Messages", icon: <FaEnvelope />, badge: 3 },
  { to: "/admin/feedbacks", label: "Feedbacks", icon: <FaStar /> },
];

const kpis = [
  { label: "Revenue", value: "₹4.82L", trend: "+12%", up: true, icon: <FaRupeeSign /> },
  { label: "Bookings", value: "128", trend: "+8%", up: true, icon: <FaCalendarCheck /> },
  { label: "Active packages", value: "24", trend: "+2", up: true, icon: <FaSuitcaseRolling /> },
  { label: "Avg. rating", value: "4.8", trend: "-0.1", up: false, icon: <FaStar /> },
];




export default function AdminDashboard() {
  const [open, setOpen] = useState(() => window.innerWidth > 900);
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  const logoutUser  = useAuthStore((state)=> state.logout)

  const closeOnMobile = () => window.innerWidth <= 900 && setOpen(false);
  const logout = async() => {

    try{

      const response = await baseApi.post(`/users/logout`,{},{withCredentials : true})

      console.log(response.data)

      await logoutUser() 
      navigate("/");
    }
    catch(err){
      console.log(err)
      console.log(err.message)
    }

  };

  return (
    <div className={styles.app}>
      <div className={styles.shell} data-open={open}>
        {/* Logo - always visible */}
        <div className={styles.logo}>
          <img src="/main.png" alt="" />
          <b>Pack<span>&amp;</span>Go</b>
          <small>Admin</small>
        </div>

        {/* Top bar */}
        <header className={styles.top}>
          <button
            className={styles.toggle}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="admin-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <FaBars />
          </button>
          <div className={styles.heading}>
            <h1>Overview</h1>
            <p>{today}</p>
          </div>
          <label className={styles.search}>
            <FaSearch />
            <input placeholder="Search trips, bookings..." aria-label="Search" />
          </label>
          <button className={styles.bell} aria-label="Notifications"><FaBell /></button>
        </header>

        {/* Slide-open sidebar */}
        <aside id="admin-menu" className={styles.side}>
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={closeOnMobile}
              className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
            >
              {n.icon} {n.label}
              {n.badge && <span className={styles.badge}>{n.badge}</span>}
            </NavLink>
          ))}
          <button className={`${styles.item} ${styles.logout}`} onClick={logout}>
            <FaSignOutAlt /> Log out
          </button>
        </aside>

        {/* Main area */}
        <main className={styles.main}>
          <section className={styles.kpis}>
            {kpis.map((k) => (
              <div key={k.label} className={styles.kpi}>
                <div className={styles.kpiTop}>
                  <span className={styles.icon}>{k.icon}</span>
                  <span className={`${styles.trend} ${k.up ? styles.up : styles.down}`}>
                    {k.up ? <FaArrowUp /> : <FaArrowDown />} {k.trend}
                  </span>
                </div>
                <strong>{k.value}</strong>
                <span className={styles.kpiLabel}>{k.label}</span>
              </div>
            ))}
          </section>

          {/* Empty on purpose - future updates go here */}
          <section className={styles.workspace} aria-label="Workspace" />
        </main>

        {/* Admin profile */}
        <section className={styles.profile}>
          <div className={styles.avatar}><img className={styles.adminImg} src="/Admin-logo.png" alt="A" /></div>
          <div>
            <p>{admin.email}</p>
            <span className={styles.role}>Admin</span>
          </div>
        </section>

        <UpComingTrips/>

        
      </div>

      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}
    </div>
  );
}
