import React, { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import About from "./pages/About";
import DonorRegistration from "./pages/DonorRegistration";
import OtpRegister from "./pages/OtpRegister";
import OtpVerify from "./pages/OtpVerify";
import DonorDashboard from "./pages/DonorDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import RecipientProfile from "./pages/recipient/RecipientProfile";
import BloodRequestForm from "./pages/BloodRequestForm";
import RequestStatus from "./pages/RequestStatus";
import Services from "./pages/Services";
import Navbar from "./components/Navbar";
import OrganizerEnquiry from "./pages/OrganizerEnquiry";
import OrganizerLogin from "./pages/OrganizerLogin";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import CampRegistration from "./pages/public/CampRegistration";
import BloodBanks from "./pages/BloodBanks";
import ViewAllRequests from "./pages/ViewAllRequests";

import OrganizerDashboard from "./pages/organizer/Dashboard";
import CampDetail from "./pages/organizer/CampDetail";
import Registrations from "./pages/organizer/Registrations";
import Gallery from "./pages/organizer/Gallery";
import Reports from "./pages/organizer/Reports";
import ChangePassword from "./pages/organizer/ChangePassword";
import OrganizerRoute from "./components/OrganizerRoute";
import BloodBankRoute from "./components/BloodBankRoute";

import BloodBankRegister from "./pages/BloodBankRegister";
import BloodBankLogin from "./pages/BloodBankLogin";
import BloodBankSetPassword from "./pages/BloodBankSetPassword";
import BloodBankDashboard from "./pages/BloodBankDashboard";

import BloodUnitsList from "./pages/bloodbank/BloodUnitsList";
import AddBloodUnit from "./pages/bloodbank/AddBloodUnit";
import BloodUnitDetail from "./pages/bloodbank/BloodUnitDetail";
import TestingManagement from "./pages/bloodbank/TestingManagement";
import Inventory from "./pages/bloodbank/Inventory";
import ExpiryAlerts from "./pages/bloodbank/ExpiryAlerts";
import PublicBloodUnitQR from "./pages/bloodbank/PublicBloodUnitQR";
import RequestFulfillment from "./pages/bloodbank/RequestFulfillment";
import RequestPayment from "./pages/recipient/RequestPayment";
import RequestStatusRecipient from "./pages/recipient/RequestStatus";

/* ✅ Footer wrapper */
const Layout = () => {
  const location = useLocation();

  // ❌ routes where footer should NOT appear
  const hideFooterRoutes = [
    "/organizer-dashboard",
    "/organizer/dashboard",
    "/organizer/camp",
    "/organizer/change-password",
    "/organizer-login",
    "/dashboard",
    "/donor",
    "/blood-request",
    "/request-status",
    "/blood-bank",
    "/bloodbank",
  ];

  const shouldHideFooter = hideFooterRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  const shouldHideNavbar = hideFooterRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <>
      <Toaster position="top-center" />
      {!shouldHideNavbar && <Navbar />}
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />

        <Route path="/register-camp" element={<DonorRegistration />} />
        <Route path="/register-camp/:campName" element={<DonorRegistration />} />
        <Route path="/camps/:campId" element={<CampRegistration />} />
        <Route path="/blood-banks" element={<BloodBanks />} />

        {/* Firebase Auth flow */}     
        <Route path="/register" element={<OtpRegister />} />
        <Route path="/login" element={<OtpRegister />} />
        <Route path="/verify-otp" element={<OtpVerify />} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["donor"]}><DonorDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/:tab" element={<ProtectedRoute allowedRoles={["donor"]}><DonorDashboard /></ProtectedRoute>} />
        <Route path="/donor/dashboard" element={<ProtectedRoute allowedRoles={["donor"]}><DonorDashboard /></ProtectedRoute>} />
        <Route path="/donor/profile" element={<ProtectedRoute allowedRoles={["donor"]}><DonorDashboard /></ProtectedRoute>} />
        <Route path="/recipient/profile" element={<Navigate to="/request-status/RD2026174" replace />} />
        <Route path="/blood-request" element={<BloodRequestForm />} />
        <Route path="/live-requests" element={<ViewAllRequests />} />
        <Route path="/request-status/:requestId" element={<RequestStatus />} />

        {/* Organizer Routes */}
        <Route path="/organizer/dashboard/:tab?" element={<OrganizerRoute><OrganizerDashboard /></OrganizerRoute>} />
        <Route path="/organizer/camp/:campId" element={<OrganizerRoute><CampDetail /></OrganizerRoute>} />
        <Route path="/organizer/change-password" element={<OrganizerRoute><ChangePassword /></OrganizerRoute>} />

        <Route path="/organizer-enquiry" element={<OrganizerEnquiry />} />
        <Route path="/organizer-login" element={<OrganizerLogin />} />
        
        <Route path="/organizer-dashboard/registrations" element={<OrganizerRoute><Registrations /></OrganizerRoute>} />
        <Route path="/organizer-dashboard/gallery" element={<OrganizerRoute><Gallery /></OrganizerRoute>} />
        <Route path="/organizer-dashboard/reports" element={<OrganizerRoute><Reports /></OrganizerRoute>} />
        {/* /organizer-dashboard is handled by /organizer/dashboard above, but keeping for backward compatibility */}
        <Route path="/organizer-dashboard/:tab?" element={<OrganizerRoute><OrganizerDashboard /></OrganizerRoute>} />

        {/* Blood Bank Routes */}
        <Route path="/blood-bank/register" element={<BloodBankRegister />} />
        <Route path="/blood-bank/login" element={<BloodBankLogin />} />
        <Route path="/blood-bank/set-password" element={<BloodBankSetPassword />} />
        <Route path="/blood-bank/:tab" element={<BloodBankDashboard />} />

        {/* Tracking, Inventory, Testing and Expiry Routes */}
        <Route path="/bloodbank/units" element={<BloodBankRoute><BloodUnitsList /></BloodBankRoute>} />
        <Route path="/bloodbank/units/add" element={<BloodBankRoute><AddBloodUnit /></BloodBankRoute>} />
        <Route path="/bloodbank/units/:id" element={<BloodBankRoute><BloodUnitDetail /></BloodBankRoute>} />
        <Route path="/bloodbank/testing" element={<BloodBankRoute><TestingManagement /></BloodBankRoute>} />
        <Route path="/bloodbank/inventory" element={<BloodBankRoute><Inventory /></BloodBankRoute>} />
        <Route path="/bloodbank/expiry" element={<BloodBankRoute><ExpiryAlerts /></BloodBankRoute>} />
        <Route path="/bloodbank/requests/:requestId" element={<BloodBankRoute><RequestFulfillment /></BloodBankRoute>} />
        
        {/* Recipient request routes */}
        <Route path="/recipient/request/:requestId" element={<RequestStatusRecipient />} />
        <Route path="/recipient/request/:requestId/payment" element={<RequestPayment />} />
        
        {/* Public QR lookup */}
        <Route path="/blood-units/:unitId" element={<PublicBloodUnitQR />} />
      </Routes>

      {/* ✅ Footer only for PUBLIC pages */}
      {!shouldHideFooter && <Footer />}
    </>
  );
};

const App = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const updateRaf = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateRaf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(updateRaf);
    };
  }, []);

  return (
    <Router>
      <Layout />
    </Router>
  );
};

export default App;
