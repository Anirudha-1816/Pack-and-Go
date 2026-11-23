import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "../Components/Navbar/Navbar";
import Footer from "../Components/Footer/Footer";

import NetworkStatus from "../Utils/NetworkStatus";
import ProtectedRoutes from "./ProtectedRoute";
import Hero from "../sections/Hero/heroSection";
import HeroSlider from "../sections/Hero/HeroSlider";
import Destinations from "../sections/Destinations/Destinations";
import AboutHero from "../Components/AboutUs/AboutHero";
import NotFound from "../Utils/notFound/NotFound";
import CallToAction from "../sections/CallToAction";


const AuthPage = lazy(() => import("../Pages/Auth/AuthPage"));
const Contact = lazy(() => import("../Pages/Contacts/Contact"));
const AboutUs = lazy(() => import("../Components/AboutUs/AboutUs"));
const EventsPage = lazy(() => import("../Pages/Events/EventsPage"));
const FeedbackPage = lazy(() => import("../Pages/Feedback/FeedbackPage"));


const TripDetails = lazy(() =>
  import("../Components/trips/TripDetails")
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
    <div className="landing-page">
      <NetworkStatus />
      <Navbar />
      <Hero />
      <AboutHero />
      <CallToAction/>
      <HeroSlider />
      <Destinations />
      <Footer />
    </div>
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
        <Route path="/events" element={<EventsPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/check" element={<CallToAction />} />

        {/* Protected Routes: Logged-in users and admins */}
        <Route element={<ProtectedRoutes allowedRoles={["user", "admin"]} />}>
          <Route path="/contact-us" element={<Contact />} />
          <Route path="/package" element={<Packages />} />
          <Route path="user-dashboard" element={<Dashboard />} />
        </Route>


        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}