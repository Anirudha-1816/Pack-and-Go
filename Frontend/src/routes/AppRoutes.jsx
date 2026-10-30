
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "../Components/Navbar/Navbar";
import Footer from "../Components/Footer/Footer";

import NetworkStatus from "../Utils/NetworkStatus";
import ProtectedRoutes from "./ProtectedRoute";
import Hero from "../sections/Hero/heroSection.jsx";
import HeroSlider from "../sections/Hero/HeroSlider";
import Destinations from "../sections/Destinations/Destinations";
import AboutHero from "../Components/AboutUs/AboutHero";


const AuthPage = lazy(() => import("../Pages/Auth/AuthPage"));
const NotFoundPage = lazy(() => import("../Utils/notFound/NotFound"));
const Contact = lazy(() => import("../Pages/Contacts/Contact"));
const AboutUs = lazy(() => import("../Components/AboutUs/AboutUs"));

const AddPackage = lazy(() =>
  import("../Components/AdminDashboard/Components/AddPackage")
);
const TripDetails = lazy(() =>
  import("../Components/trips/TripDetails")
);
const AdminDashboard = lazy(() =>
  import("../Components/AdminDashboard/AdminDashboard")
);
const AdminBookings = lazy(() =>
  import("../Components/AdminDashboard/Components/AdminBookings")
);
const Packages = lazy(() =>
  import("../Components/Packages/Packages_1")
);
const Dashboard = lazy(() =>
  import("../Components/UserDashboard/Dashboard_1")
);

function LoadingFallback() {
  return (
    <div
      style={{
        minHeight: "50vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      Loading...
    </div>
  );
}

function Home() {
  return (
    <>
      <NetworkStatus />
      <Navbar />
      <Hero />
      <AboutHero />
      <HeroSlider />
      <Destinations />
      <Footer />
    </>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/trip/:id" element={<TripDetails />} />
        <Route path="know-us" element={<AboutUs />} />

        {/* Protected Routes: Logged-in users and admins */}
        <Route element={<ProtectedRoutes allowedRoles={["user", "admin"]} />}>
          <Route path="/contact-us" element={<Contact />} />
          <Route path="/package" element={<Packages />} />
          <Route path="user-dashboard" element={<Dashboard />} />
        </Route>

        {/* Admin-only Routes */}
        <Route element={<ProtectedRoutes allowedRoles={["admin"]} />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/managePackages" element={<AddPackage />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
