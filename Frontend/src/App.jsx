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
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import About from "./pages/About";
import DonorRegistration from "./pages/DonorRegistration";
import OtpRegister from "./pages/OtpRegister";
import OtpVerify from "./pages/OtpVerify";
import DonorDashboard from "./pages/DonorDashboard";
import BloodRequestForm from "./pages/BloodRequestForm";
import RequestStatus from "./pages/RequestStatus";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import CampDonorList from "./pages/CampDonarList";
import Services from "./pages/Services";
import Navbar from "./components/Navbar";
import AdminEnquiries from "./pages/AdminEnquiries";
import OrganizerEnquiry from "./pages/OrganizerEnquiry";
import OrganizerLogin from "./pages/OrganizerLogin";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import AdminOrganizers from "./pages/AdminOrganizers";
import CampRegistration from "./pages/public/CampRegistration";

import OrganizerDashboard from "./pages/organizer/Dashboard";
import CampDetail from "./pages/organizer/CampDetail";
import Registrations from "./pages/organizer/Registrations";
import Gallery from "./pages/organizer/Gallery";
import Reports from "./pages/organizer/Reports";
import ChangePassword from "./pages/organizer/ChangePassword";
import CompleteCamp from "./pages/admin/CompleteCamp";

/* ✅ Footer wrapper */
const Layout = () => {
  const location = useLocation();

  // ❌ routes where footer should NOT appear
  const hideFooterRoutes = [
    "/admin",
    "/admin-login",
    "/admin-enquiries",
    "/admin-organizers",
    "/organizer-dashboard",
    "/organizer/dashboard",
    "/organizer/camp",
    "/organizer/change-password",
    "/organizer-login",
    "/dashboard",
    "/blood-request",
    "/request-status",
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

        {/* Firebase Auth flow */}     
        <Route path="/register" element={<OtpRegister />} />
        <Route path="/verify-otp" element={<OtpVerify />} />
        <Route path="/dashboard" element={<DonorDashboard />} />
        <Route path="/dashboard/:tab" element={<DonorDashboard />} />
        <Route path="/blood-request" element={<BloodRequestForm />} />
        <Route path="/request-status/:requestId" element={<RequestStatus />} />

        {/* Organizer Routes */}
        <Route path="/organizer/dashboard/:tab?" element={<OrganizerDashboard />} />
        <Route path="/organizer/camp/:campId" element={<CampDetail />} />
        <Route path="/organizer/change-password" element={<ChangePassword />} />

        {/* Admin Complete Camp */}
        <Route path="/admin/camps/:campId/complete" element={<CompleteCamp />} />

        <Route path="/organizer-enquiry" element={<OrganizerEnquiry />} />
        <Route path="/organizer-login" element={<OrganizerLogin />} />
        
        <Route path="/organizer-dashboard/registrations" element={<Registrations />} />
        <Route path="/organizer-dashboard/gallery" element={<Gallery />} />
        <Route path="/organizer-dashboard/reports" element={<Reports />} />
        {/* /organizer-dashboard is handled by /organizer/dashboard above, but keeping for backward compatibility */}
        <Route path="/organizer-dashboard/:tab?" element={<OrganizerDashboard />} />

        <Route path="/admin-organizers" element={<AdminOrganizers />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-enquiries" element={<AdminEnquiries />} />
        <Route path="/admin/camp/:campName" element={<CampDonorList />} />
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
