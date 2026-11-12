import { Route, Routes } from "react-router-dom";
import OperatorLogin from "./Pages/OperatorsLogin";
import Signup from "./Pages/OperatorSignup";
import OperatorHome from "./Pages/home";
import OperatorDashboard from "./components/dashboard";
import OperatorProtectedRoute from "./routes/ProtectedRoute";
import NotFound from "./utils/notFound/NotFound";


export default function App() {
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}