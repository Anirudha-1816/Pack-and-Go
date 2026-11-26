
import { useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";

import OperatorLogin from "./Pages/OperatorsLogin";
import Signup from "./Pages/OperatorSignup";
import OperatorHome from "./Pages/home";

import OperatorDashboard from "./components/dashboard/Dashboard";
import OperatorProtectedRoute from "./routes/ProtectedRoute";
import OperatorAddPackage from "./components/Sections/AddPackages";
import FestivalsForm from "./components/Sections/FestivalsForm";
import AdventureForm from "./components/Sections/AdventureForm";
import SocialEventsForm from "./components/Sections/SocialEventsForm";

import NotFound from "./utils/NotFound";
import useAuthStore from "./Stores/authStore";
import SettingsModal from "./components/Settings/SettingsModal";

// Decide where the operator should go
function OperatorEntry() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return <div>Checking your session...</div>;
  }

  if (isAuthenticated && user) {
    return <Navigate to="/operator/dashboard" replace />;
  }

  return <OperatorHome />;
}

export default function App() {
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <Routes>
      <Route path="/" element={<OperatorEntry />} />

      <Route path="/operator/login" element={<OperatorLogin />} />
      <Route path="/operator/register" element={<Signup />} />
      <Route path="/check" element={<SettingsModal />} />

      <Route element={<OperatorProtectedRoute />}>
        <Route
          path="/operator/dashboard"
          element={<OperatorDashboard />}
        />

        <Route
          path="/operator/add-package"
          element={<OperatorAddPackage />}
        />

        <Route
          path="/operator/add-festival"
          element={<FestivalsForm />}
        />

        <Route
          path="/operator/add-adventure"
          element={<AdventureForm />}
        />

        <Route
          path="/operator/add-social"
          element={<SocialEventsForm />}
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
