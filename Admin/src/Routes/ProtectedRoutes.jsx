
import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/authStore";
import AuthLoading from "../utils/AuthLoading";

export default function ProtectedRoutes() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );
  const isLoading = useAuthStore((state) => state.isLoading);

  // Wait until authentication check completes
  if (isLoading) {
    return <AuthLoading />;
  }

  // Not authenticated or not an admin
  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Authorized admin
  return <Outlet />;
}
