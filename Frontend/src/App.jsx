import { useEffect } from "react";
import { ToastContainer } from "react-toastify";

import AppRoutes from "./routes/AppRoutes";
import useAuthStore from "./Stores/authStore";
import axios from "axios";
import MyTripsFloat from "./Components/UserDashboard/MyTripsFloat";
export default function App() {
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {

    const fetchBookings = async () => {

         try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/booking/get`,{
        withCredentials : true
      })

      console.log(response.data)
      
    } catch (err) {

      console.log(err)
      console.log(err.response)
      console.log(err.response?.data)
      
    }};

    fetchBookings()
 
  }, [])
  

  return (
    <>

      <AppRoutes />
      <ToastContainer />
      <MyTripsFloat/>
    </>
  );
}