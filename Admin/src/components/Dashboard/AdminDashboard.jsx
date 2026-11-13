import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaSuitcaseRolling, FaCalendarCheck, FaImages, FaEnvelope, FaStar, FaUsers,
  FaSignOutAlt, FaBars, FaSearch, FaBell, FaRupeeSign, FaArrowUp, FaArrowDown
} from "react-icons/fa";

import {FaGear} from "react-icons/fa6"


import styles from "./AdminDashboard.module.css";
import useAuthStore from "../../store/authStore";
import baseApi from "../../api/baseApi";
import UpComingTrips from "./components/UpComingTrips";
const nav = [
  { to: "/admin-managePackages", label: "Manager packages", icon: <FaSuitcaseRolling /> },
  { to: "/admin/bookings", label: "Check bookings", icon: <FaCalendarCheck /> },
  { to: "/admin/operator-requests", label: "Operator requests", icon: <FaUsers /> },
  { to: "/admin/gallery", label: "Gallery", icon: <FaImages /> },
  { to: "/admin/messages", label: "Messages", icon: <FaEnvelope />, badge: 3 },
  { to: "/admin/feedbacks", label: "Feedbacks", icon: <FaStar /> },
  { to: "/admin/settings", label: "Settings", icon: <FaGear /> },
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
  const user = useAuthStore((state) => state.user);
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  const logoutUser  = useAuthStore((state)=> state.logout)
  // const displayName = user?.fullName?.trim() || "Administrator";
  // const firstName = displayName.split(/\s+/)[0];   // used for admin welcome message, but currently commented
  // const initials = displayName
  //   .split(/\s+/)
  //   .slice(0, 2)
  //   .map((part) => part[0])
  //   .join("")
  //   .toUpperCase();

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
        <div className={`${styles.logo} animate-slide-up`}>
          <b>Pack<span>&</span>Go</b>
        </div>

        {/* Top bar */}
        <header className={`${styles.top} animate-slide-down`}>
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
            <h1>
              {user?.fullName}
            </h1>
            <p>{today}</p>
          </div>
          <label className={styles.search}>
            <FaSearch />
            <input placeholder="Search trips, bookings..." aria-label="Search" />
          </label>
          <button className={styles.bell} aria-label="Notifications"><FaBell /></button>
        </header>

        {/* Slide-open sidebar */}
        <aside id="admin-menu" className={`${styles.side} ${open ? '' : 'animate-slide-down'}`}>
          {nav.map((n, i) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={closeOnMobile}
              className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""} animate-slide-up`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {n.icon} {n.label}
              {n.badge && <span className={styles.badge}>{n.badge}</span>}
            </NavLink>
          ))}
          <button className={`${styles.item} ${styles.logout} animate-slide-up`} onClick={logout}>
            <FaSignOutAlt /> Log out
          </button>
        </aside>

        {/* Main area */}
        <main className={styles.main}>
          {/* <section className={styles.welcome} aria-label="Admin account overview">
            <div className={styles.welcomeCopy}>
              <span className={styles.eyebrow}>PACK&GO ADMIN</span>
              <h2>Welcome back, {firstName}</h2>
              <p>Here's what's happening with your travel business today.</p>
              <div className={styles.account}>
                <span className={styles.accountAvatar} aria-hidden="true">{initials || "A"}</span>
                <span className={styles.accountText}>
                  <strong>{displayName}</strong>
                  <span>{user?.email || "Admin account"}</span>
                </span>
                <span className={styles.adminTag}>Administrator</span>
              </div>
            </div>
            <div className={styles.welcomeDate}>
              <span>Today</span>
              <strong>{today}</strong>
            </div>
          </section> */}

          <section className={`${styles.kpis} animate-slide-up`}>
            {kpis.map((k, i) => (
              <div key={k.label} className={`${styles.kpi} animate-scale-in`} style={{ animationDelay: `${i * 80}ms` }}>
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

          <section className={`${styles.workspace} animate-slide-up`} aria-labelledby="quick-actions-title">
            <div className={styles.workspaceHead}>
              <div>
                <span className={styles.sectionEyebrow}>WORKSPACE</span>
                <h2 id="quick-actions-title">Quick actions</h2>
                <p>Jump straight into the tasks you manage most.</p>
              </div>
            </div>
            <div className={styles.actions}>
              {[
                { to: "/admin/add-package", icon: <FaSuitcaseRolling />, title: "Add a package", desc: "Create a new trip offering" },
                { to: "/admin-managePackages", icon: <FaImages />, title: "Manage packages", desc: "Update visibility and trip details" },
                { to: "/admin/bookings", icon: <FaCalendarCheck />, title: "Review bookings", desc: "Check traveler reservations" },
              ].map((action, i) => (
                <Link key={action.to} to={action.to} className={`${styles.action} animate-scale-in`} style={{ animationDelay: `${i * 100}ms` }}>
                  <span className={styles.actionIcon}>{action.icon}</span>
                  <span>
                    <strong>{action.title}</strong>
                    <small>{action.desc}</small>
                  </span>
                  <span className={styles.actionArrow} aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </section>
        </main>

        {/* Admin profile */}
        <section className={`${styles.profile} animate-slide-up`}>
        
            <p>{user?.email || "Admin account"}</p>
        </section>

        <UpComingTrips/>


      </div>

      {open && <div className={`${styles.backdrop} animate-fade-in`} onClick={() => setOpen(false)} />}
    </div>
  );
}