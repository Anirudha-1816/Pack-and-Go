
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../Stores/authStore";
import AuthLoading from "../Utils/Auth/AuthLoading";

export default function ProtectedRoutes({ allowedRoles }) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );
  const isLoading = useAuthStore((state) => state.isLoading);

  const location = useLocation();



  // Wait until the current user's session has been checked.
  if (isLoading) {
    return <AuthLoading/>;
  }

  // Redirect unauthenticated users to login.
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Restrict access according to the user's role.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    }

    return <Navigate to="/" replace />;
  }

  // Allow access to the requested protected page.
  return <Outlet />;
}
