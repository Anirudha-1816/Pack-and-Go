import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";

import AdminLogin from "./pages/Auth/AdminLogin";
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import AddPackage from "./components/Sections/AddPackage";
import AdminBookings from "./components/Sections/AdminBookings";

import ProtectedRoutes from "./Routes/ProtectedRoutes";

import useAuthStore from "./store/authStore";
import ManagePackages from "./components/x/ManagePackages";
import { Toaster } from "react-hot-toast";
import OperatorRequests from "./components/x/Operatorrequests";
import NotFound from "./utils/notFound/NotFound";

const App = () => {
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <>
    <Toaster position="top-right" />
    <Routes>

      {/* <Route path="/check" element={<UpComingTrips />} />   check route */}


      <Route path="/" element={<AdminLogin />} />

      <Route element={<ProtectedRoutes />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/add-package" element={<AddPackage />} />
      <Route path="/admin-managePackages" element={<ManagePackages />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/operator-requests" element={<OperatorRequests />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
};

export default App;