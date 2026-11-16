import { useEffect } from "react";
import { ToastContainer } from "react-toastify";

import AppRoutes from "./routes/AppRoutes";
import useAuthStore from "./Stores/authStore";
import apiBooking from "./apis/apiBooking";
import MyTripsFloat from "./Components/UserDashboard/MyTripsFloat";
export default function App() {
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {

    const fetchBookings = async () => {

         try {
      const response = await apiBooking.get("/get")

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