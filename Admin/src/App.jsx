import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";

import AdminLogin from "./pages/Auth/AdminLogin.jsx";
import AdminDashboard from "./components/Dashboard/AdminDashboard.jsx";
import AddPackage from "./components/Sections/AddPackage.jsx";
import AdminBookings from "./components/Sections/AdminBookings.jsx";

import ProtectedRoutes from "./Routes/ProtectedRoutes.jsx";

import useAuthStore from "./store/authStore";
import ManagePackages from "./components/x/ManagePackages.jsx";
import { Toaster } from "react-hot-toast";
import OperatorRequests from "./components/x/Operatorrequests.jsx";
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