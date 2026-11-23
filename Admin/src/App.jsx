
import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import useAuthStore from "./store/authStore";
import ProtectedRoutes from "./Routes/ProtectedRoutes";

import { Toaster } from "react-hot-toast";

import AuthLoading from "./utils/AuthLoading";
import AdminSettings from "./components/Sections/AdminSettings";

// Lazy-loaded pages and components
const AdminLogin = lazy(() => import("./pages/Auth/AdminLogin"));
const AdminDashboard = lazy(
  () => import("./components/Dashboard/AdminDashboard")
);
const AddPackage = lazy(
  () => import("./components/Sections/AddPackage")
);
const AdminBookings = lazy(
  () => import("./components/Sections/AdminBookings")
);
const ManagePackages = lazy(
  () => import("./components/x/ManagePackages")
);
const OperatorRequests = lazy(
  () => import("./components/x/Operatorrequests")
);
const OperatorTrips = lazy(
  () => import("./components/x/OperatorTrips")
);
const ContentManagement = lazy(
  () => import("./components/x/ContentManagement")
);
const Feedback = lazy(
  () => import("./pages/Feedback/Feedback")
);
const NotFound = lazy(() => import("./utils/notFound/NotFound"));

// Loading screen


// Automatically decide where the admin should go
const AdminEntry = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return <AuthLoading />;
  }

  if (isAuthenticated && user) {
    return <Navigate to="/admin" replace />;
  }

  return <AdminLogin />;
};

const App = () => {
  const fetchUser = useAuthStore((state) => state.fetchUser);

  // Restore existing admin session on application startup
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <>
      <Toaster position="top-right" />

      <Suspense fallback={<AuthLoading />}>
        <Routes>
          {/* Entry route */}
          <Route path="/" element={<AdminEntry />} />

          {/* Protected admin routes */}
          <Route element={<ProtectedRoutes />}>
            <Route path="/admin" element={<AdminDashboard />} />

            <Route
              path="/admin/add-package"
              element={<AddPackage />}
            />

            <Route
              path="/admin/settings"
              element={<AdminSettings />}
            />

            <Route
              path="/admin-managePackages"
              element={<ManagePackages />}
            />

            <Route
              path="/admin/bookings"
              element={<AdminBookings />}
            />

            <Route
              path="/admin/operator-requests"
              element={<OperatorRequests />}
            />

            <Route
              path="/admin/operator-trips"
              element={<OperatorTrips />}
            />

            <Route
              path="/admin/content-management"
              element={<ContentManagement />}
            />

            <Route
              path="/admin/feedback"
              element={<Feedback />}
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
