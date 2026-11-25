import {  useEffect ,useState} from "react";
import { NavLink ,useNavigate} from "react-router-dom";
import useAuthStore from "../../../store/authStore";
import styles from '../AdminDashboard.module.css'
import baseApi from "../../../api/baseApi";



import {
  FaSignOutAlt, 
  FaLayerGroup,
  FaClipboardList,
  FaEnvelope,
  FaUsers,
  FaStar, 
  FaSuitcaseRolling,
  FaCalendarCheck,
} from "react-icons/fa";

import {FaGear} from "react-icons/fa6"


const AdminSideNav = () => {

     const logoutUser  = useAuthStore((state)=> state.logout)

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

  const [open, setOpen] = useState(() => window.innerWidth > 900);
  const [pendingTripsCount, setPendingTripsCount] = useState(0);

 const closeOnMobile = () => window.innerWidth <= 900 && setOpen(false);

const nav = [
  { to: "/admin-managePackages", label: "Manage packages", icon: <FaSuitcaseRolling /> },
  { to: "/admin/bookings", label: "Check bookings", icon: <FaCalendarCheck /> },
  { to: "/admin/operator-requests", label: "Operator requests", icon: <FaUsers /> },
  { to: "/admin/operator-trips", label: "Operator trips", icon: <FaClipboardList /> },
  { to: "/admin/messages", label: "Messages", icon: <FaEnvelope />, badge: 3 },
  { to: "/admin/feedback", label: "Feedbacks", icon: <FaStar /> },
  { to: "/admin/content-management", label: "Content management", icon: <FaLayerGroup /> },

  { to: "/admin/settings", label: "Settings", icon: <FaGear /> },
];
 
async function fetchPendingOperatorTripsCount() {
    try {
        const res = await baseApi.get("/admin/operator-trips?status=pending");
        const trips = Array.isArray(res.data.data) ? res.data.data : [];
        return trips.length;
    } catch {
        return 0;
    }
}
useEffect(() => {
let active = true;
fetchPendingOperatorTripsCount().then((count) => {
  if (active) setPendingTripsCount(count);
});
return () => { active = false; };
}, []);


const navigate = useNavigate();



  return (
  <>
     
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
              {n.badge !== undefined && n.badge > 0 && <span className={styles.badge}>{n.badge}</span>}
              {n.to === "/admin/operator-trips" && pendingTripsCount > 0 && (
                <span className={styles.badge}>{pendingTripsCount}</span>
              )}
            </NavLink>
          ))}
          <button className={`${styles.item} ${styles.logout} animate-slide-up`} onClick={logout}>
            <FaSignOutAlt /> Log out
          </button>
        </aside>


  </>
  )
}

export default AdminSideNav












 




 

