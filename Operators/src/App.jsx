import { Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import OperatorLogin from "./Pages/OperatorsLogin";
import Signup from "./Pages/OperatorSignup";
import OperatorHome from "./Pages/home";

import OperatorDashboard from './components/Dashboard'
import AddTrip from "./Pages/AddTrip";
import OperatorProtectedRoute from "./routes/ProtectedRoute";
import useAuthStore from "./Stores/authStore";


export default function App() {
  const fetchUser = useAuthStore((state) => state.fetchUser);

  // Initialize authentication on app load
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <Routes>
      <Route path="/" element={<OperatorHome />} />
      <Route path="/operator/login" element={<OperatorLogin />} />
      <Route path="/operator/register" element={<Signup />} />
      <Route
        path="/operator/dashboard"
        element={
          <OperatorProtectedRoute>
            <OperatorDashboard />
          </OperatorProtectedRoute>
        }
      />
      <Route
        path="/operator/add-trip"
        element={
          <OperatorProtectedRoute>
            <AddTrip />
          </OperatorProtectedRoute>
        }
      />
    </Routes>
  );
}