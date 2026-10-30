
import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";

import AdminLogin from "./pages/Auth/AdminLogin.jsx";
import AdminDashboard from "./components/Dashboard/AdminDashboard.jsx";
import AddPackage from "./components/Sections/AddPackage.jsx";
import AdminBookings from "./components/Sections/AdminBookings.jsx";

import ProtectedRoutes from "./Routes/ProtectedRoutes.jsx";
import NotFoundPage from "./utils/NotFound/NotFoundPage.jsx";

import useAuthStore from "./store/authStore";

const App = () => {
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <Routes>
      <Route path="/" element={<AdminLogin />} />

      <Route element={<ProtectedRoutes />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin-managePackages" element={<AddPackage />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
