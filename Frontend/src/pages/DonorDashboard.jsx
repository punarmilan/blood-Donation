import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  LogOut, User, Droplet, Calendar, Award, Heart,
  Search, FileText, AlertCircle, MessageSquare,
  Settings, HelpCircle, MapPin, Clock, ArrowRight, Star, Activity, Bell,
  LayoutDashboard, Check, Menu
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { toast } from "react-hot-toast";
import dashboardImg from "../assets/dashbord.png";
import { io } from "socket.io-client";
import notificationService from "../services/notificationService";
import api from "../services/api";
import DonorHealthDetails from "../components/DonorHealthDetails";

const Dashboard = () => {
  const { currentUser, setCurrentUser, logout, loading } = useAuth();
  const navigate = useNavigate();
  const { tab } = useParams();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (tab === "my-donations") setActiveTab("My Donations");
    else if (tab === "my-certificates") setActiveTab("My Certificates");
    else if (tab === "emergency") setActiveTab("Emergency");
    else if (tab === "profile") setActiveTab("My Profile");
    else if (tab === "health-details") setActiveTab("Health Details");
    else if (tab === "my-requests") setActiveTab("My Requests");
    else setActiveTab("Dashboard");
  }, [tab]);

  const handleTabChange = (label) => {
    setIsSidebarOpen(false);
    if (label === "My Donations") navigate("/dashboard/my-donations");
    else if (label === "My Certificates") navigate("/dashboard/my-certificates");
    else if (label === "Emergency") navigate("/dashboard/emergency");
    else if (label === "My Profile") navigate("/dashboard/profile");
    else if (label === "Health Details") navigate("/dashboard/health-details");
    else if (label === "My Requests") navigate("/dashboard/my-requests");
    else navigate("/dashboard");
  };

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeRequests, setActiveRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [otpInputs, setOtpInputs] = useState({});
  const [upcomingCamps, setUpcomingCamps] = useState([]);
  const [healthSummary, setHealthSummary] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [selectedCampId, setSelectedCampId] = useState(null);
  const [selectedCampDetails, setSelectedCampDetails] = useState(null);
  const [isCampDetailsLoading, setIsCampDetailsLoading] = useState(false);
  const [campDetailsError, setCampDetailsError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const calculateFrontendEligibility = () => {
    const gender = currentUser?.gender || currentUser?.health?.gender || "Male";
    const lastDonationDate = currentUser?.lastDonationDate;
    const gapDays = gender === "Female" ? 120 : 90;

    if (!lastDonationDate) {
      setEligibility({
        status: "Eligible to Donate",
        lastDonationDate: null,
        nextEligibleDate: null,
        daysRemaining: 0,
        gapDays,
        progressPercentage: 100,
        message: "You can donate blood now and help save lives."
      });
      return;
    }

    const lastDate = new Date(lastDonationDate);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + gapDays);

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const nextDateClear = new Date(nextDate);
    nextDateClear.setHours(0, 0, 0, 0);

    const diffTime = nextDateClear.getTime() - todayDate.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      setEligibility({
        status: "Eligible to Donate",
        lastDonationDate: lastDate.toISOString().split('T')[0],
        nextEligibleDate: nextDate.toISOString().split('T')[0],
        daysRemaining: 0,
        gapDays,
        progressPercentage: 100,
        message: "You can donate blood now and help save lives."
      });
    } else {
      const lastDateClear = new Date(lastDate);
      lastDateClear.setHours(0, 0, 0, 0);
      const diffPassed = todayDate.getTime() - lastDateClear.getTime();
      const daysPassed = Math.floor(diffPassed / (1000 * 60 * 60 * 24));
      let progressPercentage = Math.round((daysPassed / gapDays) * 100);
      if (progressPercentage > 100) progressPercentage = 100;
      if (progressPercentage < 0) progressPercentage = 0;

      setEligibility({
        status: "Temporary Hold",
        lastDonationDate: lastDate.toISOString().split('T')[0],
        nextEligibleDate: nextDate.toISOString().split('T')[0],
        daysRemaining,
        gapDays,
        progressPercentage,
        message: `You recently donated blood. You can donate again after ${daysRemaining} days.`
      });
    }
  };

  const fetchEligibility = async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data.success) {
        if (res.data.eligibility) {
          setEligibility(res.data.eligibility);
        }
        if (res.data.user) {
          setCurrentUser(res.data.user);
        }
      } else {
        calculateFrontendEligibility();
      }
    } catch (err) {
      console.error("Failed to fetch eligibility from backend:", err);
      calculateFrontendEligibility();
    }
  };

  const handleOpenCampDetails = async (campId) => {
    setSelectedCampId(campId);
    setIsCampDetailsLoading(true);
    setCampDetailsError("");
    setSelectedCampDetails(null);
    try {
      const res = await api.get(`/camps/${campId}`);
      setSelectedCampDetails(res.data);
    } catch (err) {
      console.error("Error fetching camp details:", err);
      setCampDetailsError(err.response?.data?.message || "Failed to load camp details. Please try again.");
    } finally {
      setIsCampDetailsLoading(false);
    }
  };

  const handleRegisterForCamp = async (campId) => {
    setIsRegistering(true);
    try {
      const res = await api.post(`/camps/${campId}/register`);
      toast.success(res.data.message || "You have successfully registered for this camp.");

      const updatedCamp = res.data.camp;
      setSelectedCampDetails(updatedCamp);

      setUpcomingCamps(prevCamps =>
        prevCamps.map(c => c._id === campId ? { ...c, ...updatedCamp } : c)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to register for camp");
    } finally {
      setIsRegistering(false);
    }
  };

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    bloodGroup: "O-",
    city: "",
    state: "",
    pincode: "",
    address: "",
    latitude: "",
    longitude: "",
    availableForEmergency: true,
    canTravelDistance: 5,
    preferredContactMethod: "Call",
    emergencyContactName: "",
    emergencyContactNumber: ""
  });
  const socketRef = useRef(null);

  useEffect(() => {
    if (!loading && currentUser) {
      if (currentUser.role === "recipient") {
        navigate("/recipient/profile", { replace: true });
      }
    }
  }, [currentUser, loading, navigate]);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      fetchActiveRequests();
      fetchMyRequests();
      fetchMyDonations();
      fetchHealthSummary();
      fetchEligibility();

      const fetchUpcomingCamps = async () => {
        try {
          const res = await api.get("/camps");
          const upcoming = res.data.filter(c => c.status === "upcoming");
          setUpcomingCamps(upcoming);
        } catch (err) {
          console.error("Error fetching camps:", err);
        }
      };
      fetchUpcomingCamps();

      setProfileData({
        name: currentUser.name || "",
        bloodGroup: currentUser.bloodGroup || "O-",
        city: currentUser.city || "",
        state: currentUser.state || "",
        pincode: currentUser.pincode || "",
        address: currentUser.address || "",
        latitude: currentUser.latitude || "",
        longitude: currentUser.longitude || "",
        availableForEmergency: currentUser.availableForEmergency !== undefined ? currentUser.availableForEmergency : true,
        canTravelDistance: currentUser.canTravelDistance || 5,
        preferredContactMethod: currentUser.preferredContactMethod || "Call",
        emergencyContactName: currentUser.emergencyContactName || "",
        emergencyContactNumber: currentUser.emergencyContactNumber || ""
      });

      // Setup socket
      const socketUrl = import.meta.env.VITE_SOCKET_URL || "/";
      socketRef.current = io(socketUrl);
      socketRef.current.emit("join", currentUser._id);

      socketRef.current.on("newEmergencyRequest", (data) => {
        // Increment count and show popup or just update list
        setUnreadCount(prev => prev + 1);
        fetchNotifications();
        fetchActiveRequests();
      });

      return () => {
        if (socketRef.current) socketRef.current.disconnect();
      };
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActiveRequests = async () => {
    try {
      const res = await api.get("/request/active");
      const activeData = res.data.data || [];
      // Don't show the donor's own requests in the emergency tab
      const filtered = activeData.filter(req => {
        if (!req.recipient) return true;
        const recipientId = typeof req.recipient === 'object' ? req.recipient._id : req.recipient;
        return recipientId !== currentUser._id;
      });
      setActiveRequests(filtered);
    } catch (err) {
      console.error("Failed to fetch active requests", err);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await api.get("/request/my-requests");
      setMyRequests(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch my requests", err);
    }
  };

  const fetchMyDonations = async () => {
    try {
      const res = await api.get("/request/my-donations");
      setMyDonations(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch my donations", err);
    }
  };

  const handleVerifyOtp = async (requestId) => {
    const otp = otpInputs[requestId];
    if (!otp || otp.length !== 4) {
      alert("Please enter a valid 4-digit OTP.");
      return;
    }
    try {
      const res = await api.post(`/request/${requestId}/verify-otp`, { otp });
      alert(res.data.message || "OTP Verified Successfully!");
      fetchMyDonations();
    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP or error occurred.");
    }
  };

  const fetchHealthSummary = async () => {
    try {
      const res = await api.get("/donor/health");
      if (res.data.success && res.data.data && res.data.data.health) {
        setHealthSummary(res.data.data.health);
      }
    } catch (err) {
      console.error("Failed to fetch health summary", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.patch(`/request/${requestId}/accept`);
      fetchActiveRequests();
      alert("Request accepted successfully! You can now contact the requester.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept request");
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#E74C3C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Activity, label: "Health Details" },
    { icon: Droplet, label: "My Donations" },
    { icon: FileText, label: "My Requests" },
    { icon: FileText, label: "My Certificates" },
    { icon: AlertCircle, label: "Emergency", badge: activeRequests.length },
    { icon: User, label: "My Profile" },
  ];

  const quickActions = [
    { icon: Droplet, title: "Donate Blood", desc: "Make an impact" },
    { icon: FileText, title: "My Certificates", desc: "View your certificates" },
  ];

  // upcomingCamps is now a state variable

  const achievements = [
    { title: "New Donor", desc: "Just Started", icon: Droplet, color: "text-red-500", bg: "bg-red-50" },
    { title: "Life Saver", desc: "1st Donation", icon: Heart, color: "text-orange-400", bg: "bg-orange-50" },
    { title: "Regular Donor", desc: "Stay Consistent", icon: Award, color: "text-red-500", bg: "bg-red-50" },
    { title: "Hero Donor", desc: "10+ Donations", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
  ];

  const downloadCertificate = async (reqId) => {
    const certElement = document.getElementById(`certificate-${reqId}`);
    if (!certElement) return;

    try {
      toast.loading("Generating certificate...", { id: "cert-toast" });
      const canvas = await html2canvas(certElement, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `LifeDrop_Certificate_${reqId}.png`;
      link.click();
      toast.success("Certificate downloaded successfully!", { id: "cert-toast" });
    } catch (error) {
      console.error("Error downloading certificate:", error);
      toast.error("Failed to download certificate.", { id: "cert-toast" });
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleLocationFetch = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    toast.loading("Fetching location...", { id: "loc" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setProfileData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        toast.success("Location fetched successfully!", { id: "loc" });
      },
      (error) => {
        toast.error("Failed to get location. Please allow access.", { id: "loc" });
      }
    );
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await api.put("/auth/me", profileData);
      if (res.data.success) {
        toast.success("Profile updated successfully!");
        setCurrentUser(res.data.user);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Health Details":
        return <DonorHealthDetails currentUser={currentUser} onUpdate={() => { fetchHealthSummary(); fetchEligibility(); }} />;
      case "My Profile":
        const profilePercent = currentUser?.profileCompleted && currentUser?.locationAdded && healthSummary ? 100 :
          currentUser?.profileCompleted && currentUser?.locationAdded ? 75 :
            currentUser?.profileCompleted ? 50 : 25;
        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Top Header */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">My Profile</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your basic profile, location and availability</p>
              </div>
              <button
                onClick={handleProfileSave}
                disabled={isSavingProfile}
                className="px-6 py-2.5 bg-[#E74C3C] hover:bg-red-700 disabled:opacity-70 rounded-xl text-white font-medium transition-all shadow-sm flex items-center gap-2"
              >
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {/* Profile Completion Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Profile Status</h3>
                <span className="text-red-600 font-bold">{profilePercent}% Completed</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full mb-6 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${profilePercent}%` }}></div>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Check size={12} /> Mobile Verified
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentUser?.locationAdded ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                  {currentUser?.locationAdded ? <Check size={12} /> : <AlertCircle size={12} />}
                  {currentUser?.locationAdded ? 'Location Added' : 'Location Not Added'}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${healthSummary ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                  {healthSummary ? <Check size={12} /> : <AlertCircle size={12} />}
                  {healthSummary ? 'Health Profile Completed' : 'Health Profile Pending'}
                </span>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-3 flex items-center gap-2">
                  <User size={18} className="text-red-500" /> Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Full Name *</label>
                    <input required type="text" name="name" value={profileData.name} onChange={handleProfileChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Blood Group *</label>
                    <select required name="bloodGroup" value={profileData.bloodGroup} onChange={handleProfileChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 appearance-none">
                      <option value="">Select</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 flex items-center justify-between">
                      <span>Phone Number</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded flex items-center gap-1"><Check size={10} /> Verified</span>
                    </label>
                    <input type="text" value={currentUser.mobile || ""} disabled className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" />
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MapPin size={18} className="text-red-500" /> Location Details
                  </h3>
                  <button type="button" onClick={handleLocationFetch} className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <MapPin size={12} /> Use Current Location
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Full Address</label>
                    <input type="text" name="address" value={profileData.address} onChange={handleProfileChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">City *</label>
                    <input required type="text" name="city" value={profileData.city} onChange={handleProfileChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">State *</label>
                    <input required type="text" name="state" value={profileData.state} onChange={handleProfileChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Pincode</label>
                    <input type="text" maxLength={6} name="pincode" value={profileData.pincode} onChange={handleProfileChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500" />
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Latitude</label>
                      <input type="text" value={profileData.latitude} disabled className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 text-xs cursor-not-allowed" />
                    </div>
                    <div className="w-1/2">
                      <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Longitude</label>
                      <input type="text" value={profileData.longitude} disabled className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 text-xs cursor-not-allowed" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Availability & Emergency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <Clock size={18} className="text-red-500" /> Availability
                  </h3>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-gray-700">Available for Emergency</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={profileData.availableForEmergency} onChange={(e) => setProfileData({ ...profileData, availableForEmergency: e.target.checked })} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Can Travel Distance</label>
                      <select name="canTravelDistance" value={profileData.canTravelDistance} onChange={handleProfileChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 appearance-none">
                        <option value={5}>Upto 5 km</option>
                        <option value={10}>Upto 10 km</option>
                        <option value={20}>Upto 20 km</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Preferred Contact Method</label>
                      <select name="preferredContactMethod" value={profileData.preferredContactMethod} onChange={handleProfileChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 appearance-none">
                        <option value="Call">Call</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="SMS">SMS</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <AlertCircle size={18} className="text-red-500" /> Emergency Contact
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Contact Name</label>
                      <input type="text" name="emergencyContactName" value={profileData.emergencyContactName} onChange={handleProfileChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Contact Number</label>
                      <input type="text" maxLength={10} name="emergencyContactNumber" value={profileData.emergencyContactNumber} onChange={handleProfileChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500" />
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Health Summary Read-Only Card */}
            <div className="bg-[#FFFDFB] rounded-2xl p-6 md:p-8 border-2 border-red-50 shadow-sm mt-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Activity size={18} className="text-red-500" /> Health & Medical Summary
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Manage physical vitals, medical conditions, and eligibility</p>
                </div>
                <button type="button" onClick={() => handleTabChange("Health Details")} className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors whitespace-nowrap">
                  Update Health Details
                </button>
              </div>

              {!healthSummary || Object.keys(healthSummary).length === 0 ? (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-amber-800 text-sm flex items-start gap-3">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <p>Your health profile is incomplete. Updating your health details helps organizers match you with critical requests safely and quickly.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">Blood Group</p>
                    <p className="text-xl font-black text-red-600">{currentUser.bloodGroup || '-'}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">BMI</p>
                    <p className="text-xl font-bold text-gray-900">{healthSummary.bmi || '-'}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">Weight</p>
                    <p className="text-xl font-bold text-gray-900">{healthSummary.weight || '-'} <span className="text-xs font-medium text-gray-500">kg</span></p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">Hemoglobin</p>
                    <p className="text-xl font-bold text-gray-900">{healthSummary.hemoglobinLevel || '-'} <span className="text-xs font-medium text-gray-500">g/dL</span></p>
                  </div>
                </div>
              )}
            </div>

          </div>
        );
      case "My Donations":
        return (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">My Donations</h2>
            <div className="space-y-4">
              {myDonations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
                    <Droplet size={32} className="text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No Donations Yet</h3>
                  <p className="text-gray-500 text-sm max-w-md">Your donation history will appear here once you participate in an emergency request.</p>
                </div>
              ) : (
                myDonations.map((req, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                    {/* Header: Blood Group, Patient Name, Status Badge */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
                          <span className="text-red-600 font-extrabold text-lg">{req.bloodGroup}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">{req.patientName}</h4>
                          <p className="text-xs text-gray-400">Request ID: {req.requestId} | Component: <span className="font-semibold">{req.bloodComponent || req.component || "Not specified"}</span></p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${req.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        }`}>
                        {req.status === "completed" ? "Completed" : "In Progress (Accepted)"}
                      </span>
                    </div>

                    {/* Content details in a clean structured layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      {/* Left: Location Details */}
                      <div className="space-y-2.5">
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Location Info</div>
                        <div className="flex items-start gap-2.5 text-sm text-gray-600">
                          <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-semibold text-gray-800">{req.hospital}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {req.city || "N/A"}, {req.state || "N/A"} {req.pincode ? `- ${req.pincode}` : ""}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Donation Details & Timeline */}
                      <div className="space-y-2.5">
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Donation Details</div>
                        <div className="space-y-1.5 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Droplet size={14} className="text-red-500 shrink-0" />
                            <span><strong>Units Donated:</strong> {req.units} unit{req.units > 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400 shrink-0" />
                            {req.status === "completed" && req.completedAt ? (
                              <span><strong>Donated On:</strong> {new Date(req.completedAt).toLocaleString("en-IN", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            ) : (
                              <span><strong>Accepted On:</strong> {new Date(req.acceptedAt || req.createdAt).toLocaleString("en-IN", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Panel (OTP Verification or Completed Badge) */}
                    <div className="pt-4 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-xs text-gray-500">
                        {req.status === "accepted" ? (
                          <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                            <AlertCircle size={14} /> Please verify the OTP from the recipient to complete this donation.
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                            <Check size={14} /> Donation successfully verified and saved to history. Thank you!
                          </span>
                        )}
                      </div>

                      <div className="w-full sm:w-auto shrink-0 flex justify-end">
                        {req.status === "accepted" ? (
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input
                              type="text"
                              pattern="[0-9]*"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              name={`otp-${req.requestId}`}
                              maxLength={4}
                              placeholder="OTP"
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest focus:outline-none focus:border-red-500 text-zinc-800"
                              value={otpInputs[req.requestId] || ""}
                              onChange={(e) => setOtpInputs({ ...otpInputs, [req.requestId]: e.target.value.replace(/\D/g, "") })}
                            />
                            <button
                              onClick={() => handleVerifyOtp(req.requestId)}
                              className="px-4 py-2 bg-[#E74C3C] hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all shrink-0"
                            >
                              Verify OTP
                            </button>
                          </div>
                        ) : (
                          <div className="text-emerald-600 font-bold flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 text-sm">
                            <Check size={16} /> Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case "My Requests":
        return (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">My Requests</h2>
            <div className="space-y-4">
              {myRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-10">You haven't made any blood requests yet.</p>
              ) : (
                myRequests.map((req, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="flex gap-4 items-center">
                      <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
                        <span className="text-red-600 font-black text-xl">{req.bloodGroup}</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 mb-1">{req.patientName}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Units: {req.units} | Component: {req.bloodComponent || req.component || "Not specified"} | Status: <span className="uppercase font-semibold text-red-600">{req.status}</span>
                        </div>
                        {req.status === "accepted" && req.otp && (
                          <div className="mt-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block border border-emerald-100">
                            Verification OTP: <span className="tracking-widest text-lg ml-1">{req.otp}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => navigate(`/request-status/${req.requestId}`)} className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-medium transition-all shadow-sm shrink-0">
                      View Status
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case "My Certificates":
        const completedDonations = myDonations.filter(req => req.status === "completed");
        return (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">My Certificates</h2>
            {completedDonations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
                  <FileText size={32} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Certificates Yet</h3>
                <p className="text-gray-500 text-sm max-w-md">Your certificates will appear here once your donation is verified.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-12">
                {completedDonations.map((req, i) => (
                  <div key={i} className="mb-4">
                    {/* The Certificate Card */}
                    <div id={`certificate-${req.requestId}`} className="relative bg-[#FFFAF5] border-[8px] border-double border-red-200 rounded-xl p-8 md:p-12 overflow-hidden shadow-sm mx-auto max-w-4xl" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}>
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Award size={180} className="text-red-900" />
                      </div>
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 via-red-600 to-red-400"></div>
                      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 via-red-600 to-red-400"></div>

                      <div className="relative z-10 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner border border-red-200">
                          <Droplet size={40} className="text-red-600 drop-shadow-md" />
                        </div>

                        <h3 className="text-3xl md:text-4xl font-black text-red-800 tracking-wider mb-2 font-serif uppercase" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.1)" }}>Certificate of Appreciation</h3>
                        <p className="text-xs md:text-sm font-bold text-red-500 uppercase tracking-[0.3em] mb-10">For Outstanding Contribution</p>

                        <p className="text-gray-600 italic text-lg mb-4 font-serif">This is proudly presented to</p>
                        <h4 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 font-serif pb-4 border-b-2 border-red-200 inline-block px-10">{currentUser.name}</h4>

                        <p className="text-gray-700 max-w-2xl leading-relaxed text-base md:text-lg mb-10">
                          For selflessly donating <span className="font-bold text-red-600 text-xl mx-1">{req.bloodGroup}</span> blood to help save <span className="font-bold text-gray-900">{req.patientName}'s</span> life at <span className="font-bold text-gray-900">{req.hospital}</span>. Your generous act of humanity is deeply appreciated and will never be forgotten.
                        </p>

                        <div className="w-full flex flex-col md:flex-row justify-between items-center md:items-end mt-4 px-4 md:px-8 gap-6 md:gap-0">
                          <div className="text-center md:text-left order-2 md:order-1">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Verification ID</p>
                            <p className="text-sm font-bold text-gray-900 font-mono">{req.requestId}</p>
                          </div>

                          <div className="text-center order-1 md:order-2">
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-red-50 rounded-full border border-red-100 flex items-center justify-center relative shadow-sm">
                              <Award size={48} className="text-red-500 absolute md:w-[64px] md:h-[64px]" />
                              <div className="absolute inset-0 rounded-full border-2 border-dashed border-red-300 animate-[spin_20s_linear_infinite]"></div>
                            </div>
                          </div>

                          <div className="text-center md:text-right order-3">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Date</p>
                            <p className="text-sm font-bold text-gray-900">{new Date(req.completedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-center">
                      <button onClick={() => downloadCertificate(req.requestId)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-red-200 transition-all transform hover:-translate-y-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Download Certificate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "Emergency":
        return (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 flex items-center gap-3">
              Emergency Requests <span className="bg-[#E74C3C] text-white text-xs px-2 py-1 rounded-full">{activeRequests.length} Active</span>
            </h2>
            <div className="space-y-4">
              {activeRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-10">No active emergency requests right now.</p>
              ) : (
                activeRequests.map((req, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
                          <span className="text-red-600 font-black text-xl">{req.bloodGroup}</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 mb-1">{req.patientName} Needs Blood</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <MapPin size={12} className="text-gray-400" /> {req.hospital}, {req.city}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Units: {req.units} | Component: {req.bloodComponent || req.component || "Not specified"} | Needed by: {req.neededBy}
                          </div>
                        </div>
                      </div>
                      <button
                        disabled={eligibility?.status === "Temporary Hold"}
                        onClick={() => {
                          if (eligibility?.status === "Temporary Hold") {
                            const formattedDate = new Date(eligibility.nextEligibleDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            });
                            toast.error(`You are not eligible to donate right now. Next eligible date: ${formattedDate}`);
                          } else {
                            handleAcceptRequest(req.requestId);
                          }
                        }}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-white text-sm font-medium transition-all shadow-sm shrink-0 ${eligibility?.status === "Temporary Hold"
                            ? "bg-gray-300 cursor-not-allowed hover:bg-gray-300 text-gray-500"
                            : "bg-[#E74C3C] hover:bg-red-700"
                          }`}
                      >
                        Accept Request
                      </button>
                    </div>
                    {eligibility?.status === "Temporary Hold" && (
                      <div className="pt-2">
                        <p className="text-xs text-red-500 font-semibold flex items-center gap-1.5 bg-red-50 p-2 rounded-lg border border-red-100">
                          <AlertCircle size={14} /> You are not eligible to donate right now. Next eligible date: {new Date(eligibility.nextEligibleDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                    {req.recipient && (
                      <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                        <div className="text-sm text-gray-800">
                          <span className="font-bold">Requested by:</span> {req.recipient.name} ({req.recipient.mobile})
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case "Dashboard":
      default:
        return (
          <div className="max-w-7xl mx-auto space-y-6">

            {/* HERO BANNER */}
            <div className="bg-gradient-to-r from-red-50 to-white p-6 md:p-8 rounded-2xl shadow-sm border border-red-100 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
              {/* Decorative faint drop */}
              <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                <Droplet size={200} className="text-red-600" />
              </div>

              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border-4 border-red-100 shadow-sm relative z-10">
                  <User size={40} className="text-red-500" />
                </div>
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border border-red-100 shadow-md flex items-center justify-center z-20 transform translate-x-1 translate-y-1">
                  <Heart size={12} className="text-red-500" fill="currentColor" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left relative z-10">
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                  <span className="text-[#E74C3C] text-[10px] font-bold bg-red-50 px-2.5 py-1 rounded-md border border-red-100 uppercase tracking-wide shadow-sm flex items-center gap-1">
                    Welcome Back 👋
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight pl-">
                  Welcome back,
                  <span className="text-[#E74C3C]">{currentUser.name}!</span> <span className="inline-block hover:animate-wave origin-bottom-right">👋</span>
                </h1>
                <p className="text-gray-500 text-sm mb-6 max-w-lg leading-relaxed">
                  Thank you for being a lifesaver.<br />
                  Your donation can save lives.
                </p>

                {/* Pills */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                  <div className="flex items-center gap-3 bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-2">
                    <div className="bg-red-50 p-1.5 rounded-lg">
                      <Droplet size={16} className="text-red-500" fill="currentColor" />
                    </div>
                    <div className="text-left">
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Blood Group</div>
                      <div className="text-sm font-bold text-gray-900 leading-none">{currentUser.bloodGroup || "O-"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-2">
                    <div className="bg-red-50 p-1.5 rounded-lg">
                      <User size={16} className="text-red-500" />
                    </div>
                    <div className="text-left">
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Donor ID</div>
                      <div className="text-sm font-bold text-gray-900 leading-none">
                        {currentUser?._id ? `RD${currentUser._id.toString().slice(-6).toUpperCase()}` : "RD5173"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-2">
                    <div className="bg-red-50 p-1.5 rounded-lg">
                      <Heart size={16} className="text-red-500" fill="currentColor" />
                    </div>
                    <div className="text-left">
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total Donations</div>
                      <div className="text-sm font-bold text-gray-900 leading-none">
                        {currentUser.totalDonations || 0} <span className="text-xs font-normal text-gray-500">times</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Blood Group Stat */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Droplet size={14} className="text-red-500" /> Blood Group
                </p>
                <p className="text-3xl font-bold text-gray-900">{currentUser.bloodGroup || "O-"}</p>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  {currentUser.bloodGroup === "O-" ? "✅ Universal Donor" :
                    currentUser.bloodGroup === "AB+" ? "✅ Universal Recipient" :
                      "✅ Active Donor"}
                </p>
              </div>
              {/* Badge Stat */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Award size={14} className="text-amber-500" /> Donor Badge
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const donations = currentUser.totalDonations || 0;
                    const b = currentUser.badge;
                    if (b && b !== "new donor") {
                      // Capitalize first letters
                      return b.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    }
                    if (donations >= 50) return "Hero";
                    if (donations >= 20) return "Platinum";
                    if (donations >= 10) return "Gold";
                    if (donations >= 3) return "Silver";
                    if (donations === 2) return "Regular Donor";
                    if (donations === 1) return "Donor";
                    return "New Donor";
                  })()}
                </p>
                <p className="text-[11px] text-amber-600 font-medium mt-1">
                  {(currentUser.totalDonations || 0) >= 2 ? "Superb saving!" : "Keep it up!"}
                </p>
              </div>
              {/* Donations Stat */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Heart size={14} className="text-indigo-500" /> Total Donations
                </p>
                <p className="text-3xl font-bold text-indigo-600">{currentUser.totalDonations || 0}</p>
                <p className="text-[11px] text-indigo-600 font-medium mt-1">You can do it!</p>
              </div>
            </div>

            {/* Donation Eligibility Tracker */}
            {eligibility && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="bg-red-50 p-2 rounded-xl border border-red-100 text-[#E74C3C]">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Donation Eligibility Tracker</h3>
                    <p className="text-xs text-gray-500">Track your eligibility based on medical safety standards</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Info & Progress */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Status</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${eligibility.status === "Eligible to Donate"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-orange-50 text-orange-700 border-orange-200"
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${eligibility.status === "Eligible to Donate" ? "bg-emerald-500" : "bg-orange-500"}`}></span>
                        {eligibility.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-gray-500">
                        <span>Recovery Progress</span>
                        <span>{eligibility.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${eligibility.status === "Eligible to Donate" ? "bg-emerald-500" : "bg-orange-500"
                            }`}
                          style={{ width: `${eligibility.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <p className={`text-sm font-medium ${eligibility.status === "Eligible to Donate" ? "text-emerald-700" : "text-orange-700"}`}>
                      {eligibility.message}
                    </p>
                  </div>

                  {/* Right Column: Key Dates & Rules */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Last Donation</p>
                      <p className="text-sm font-bold text-gray-800 mt-1">
                        {eligibility.lastDonationDate
                          ? new Date(eligibility.lastDonationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : "Never Donated"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Next Eligible Date</p>
                      <p className="text-sm font-bold text-gray-800 mt-1">
                        {eligibility.nextEligibleDate
                          ? new Date(eligibility.nextEligibleDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : "Available Now"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Days Remaining</p>
                      <p className="text-sm font-bold text-gray-800 mt-1">
                        {eligibility.daysRemaining > 0 ? `${eligibility.daysRemaining} days` : "0 days"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Gender Rule Applied</p>
                      <p className="text-sm font-bold text-gray-800 mt-1">
                        {eligibility.gapDays} days gap ({currentUser.gender || currentUser.health?.gender || "Male"})
                      </p>
                      <p className="text-[9px] text-gray-400 mt-0.5 leading-none">
                        (90 days for Male, 120 days for Female)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* UPCOMING CAMPS */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Upcoming Registered Camps</h3>
                <button className="text-xs text-[#E74C3C] font-medium hover:underline">View All</button>
              </div>

              <div className="flex flex-col gap-4">
                {upcomingCamps.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    No upcoming donation camps found.
                  </div>
                ) : (
                  upcomingCamps.map((camp, i) => {
                    const campDate = new Date(camp.date);
                    const day = campDate.getDate().toString().padStart(2, "0");
                    const month = campDate.toLocaleString('default', { month: 'short' });
                    const regCount = camp.registeredDonors ? camp.registeredDonors.length : 0;
                    const expected = parseInt(camp.expectedDonors) || 100;

                    return (
                      <div key={camp._id || i} className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 hover:shadow-md transition">

                        {/* Left: Date & Info */}
                        <div className="flex items-center gap-4 sm:w-1/2">
                          <div className="bg-red-50 text-red-600 font-bold rounded-xl w-14 h-14 flex flex-col items-center justify-center shrink-0 border border-red-100 shadow-sm">
                            <span className="text-lg leading-none">{day}</span>
                            <span className="text-[10px] uppercase mt-1">{month}</span>
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-gray-900 leading-tight mb-1.5">{camp.title || camp.name}</h4>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                <MapPin size={12} className="text-gray-400" /> {camp.venue || camp.location}
                              </div>
                              <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full"></div>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                <Clock size={12} className="text-gray-400" /> {camp.time || "10:00 AM - 04:00 PM"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Progress & Action */}
                        <div className="flex flex-col w-full sm:w-1/3 shrink-0">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] text-gray-500"><strong className="text-gray-900">{regCount}</strong> / {expected} Registered</span>
                            <button type="button" onClick={() => handleOpenCampDetails(camp._id)} className="text-[11px] font-bold text-[#E74C3C] hover:underline bg-white border-none cursor-pointer">View Details</button>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (regCount / expected) * 100)}%` }}></div>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* HEALTH PROFILE SUMMARY CARD */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Activity size={16} className="text-[#E74C3C]" /> Health Profile
                </h3>
                <button
                  onClick={() => handleTabChange("Health Details")}
                  className="text-[11px] font-bold text-[#E74C3C] hover:underline bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Update Details
                </button>
              </div>

              {!healthSummary || Object.keys(healthSummary).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3 border border-red-100">
                    <Activity size={20} className="text-red-500" />
                  </div>
                  <p className="text-gray-900 font-bold mb-1">Complete your health profile</p>
                  <p className="text-gray-500 text-xs max-w-sm mb-4">Add your physical vitals and blood profile to keep your donor status up to date.</p>
                  <button
                    onClick={() => handleTabChange("Health Details")}
                    className="px-5 py-2 bg-[#E74C3C] hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Complete Profile
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">BMI</p>
                    <p className="text-lg font-bold text-gray-900">{healthSummary.bmi || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">Hemoglobin</p>
                    <p className="text-lg font-bold text-gray-900">{healthSummary.hemoglobinLevel || '-'} <span className="text-[10px] font-medium text-gray-500">g/dL</span></p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">Weight</p>
                    <p className="text-lg font-bold text-gray-900">{healthSummary.weight || '-'} <span className="text-[10px] font-medium text-gray-500">kg</span></p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">Last Updated</p>
                    <p className="text-xs font-bold text-gray-900 mt-1">
                      {healthSummary.updatedAt ? new Date(healthSummary.updatedAt).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row font-sans relative">

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR MATCHING ORGANIZER DASHBOARD */}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-[#1C1C28] text-gray-300 flex flex-col z-50 transition-transform duration-300 md:translate-x-0 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-red-500 rounded-full p-2"><Droplet className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="text-white font-bold text-xl leading-tight">Raktdaan</h1>
              <p className="text-xs text-gray-400">Donor Panel</p>
            </div>
          </div>
          <p className="text-xs font-semibold tracking-wider text-gray-500 mb-4 px-2">MAIN</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleTabChange(item.label)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition ${activeTab === item.label
                ? "bg-[#E74C3C] text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" /> {item.label}
              </div>
              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center justify-between hover:bg-white/5 p-3 rounded-xl transition group">
            <div className="flex items-center gap-3 text-left">
              <div className="bg-red-500/20 text-red-500 font-bold w-10 h-10 rounded-full flex items-center justify-center border border-red-500/30">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'D'}
              </div>
              <div>
                <p className="text-white text-sm font-semibold truncate w-24">{currentUser.name || 'Donor'}</p>
                <p className="text-xs text-gray-500">Personal</p>
              </div>
            </div>
            <LogOut className="w-5 h-5 text-gray-500 group-hover:text-red-400 transition" />
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 w-full md:w-[calc(100%-16rem)] md:ml-64 relative">
        {/* Top Navbar */}
        <div className="flex justify-between items-center mb-8 gap-4 bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
          {/* Left Title */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle Button */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center border border-red-100 md:hidden shrink-0 text-red-500 hover:bg-red-100 transition"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">Donor Panel</h2>
              <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{activeTab}</p>
            </div>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative p-2.5 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-gray-900 shadow-sm transition-colors"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-[#E74C3C] rounded-full border-2 border-white"></span>
              )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <h3 className="text-gray-900 font-bold text-sm">Notifications</h3>
                  <span className="bg-[#E74C3C] text-white text-[10px] px-2 py-0.5 rounded-full">{unreadCount} New</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-xs">No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n._id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-red-50/50' : ''}`}>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                            <Droplet size={14} className="text-red-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-xs font-bold ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</h4>
                            <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[9px] text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
                              {!n.isRead && (
                                <button onClick={() => markAsRead(n._id)} className="text-[10px] text-[#E74C3C] font-medium hover:underline">Mark read</button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Content */}
        {renderContent()}

        {/* Camp Details Modal */}
        {selectedCampId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col relative animate-scale-up animate-[fadeIn_0.2s_ease-out]">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-red-50 to-white">
                <div>
                  <span className="text-[#E74C3C] text-[10px] font-bold bg-red-50 px-2.5 py-1 rounded-md border border-red-100 uppercase tracking-wide">
                    Donation Camp Details
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mt-2">
                    {isCampDetailsLoading ? "Loading Camp..." : selectedCampDetails?.title || selectedCampDetails?.name || "Camp Details"}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCampId(null)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {/* Content Body */}
              <div className="p-6 space-y-6 flex-1">
                {isCampDetailsLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-10 h-10 border-4 border-[#E74C3C] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-sm font-medium">Fetching details...</p>
                  </div>
                )}

                {campDetailsError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-700 text-sm flex items-start gap-3">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Error loading details</p>
                      <p className="mt-1">{campDetailsError}</p>
                      <button
                        onClick={() => handleOpenCampDetails(selectedCampId)}
                        className="mt-3 text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-lg transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}

                {!isCampDetailsLoading && !campDetailsError && selectedCampDetails && (
                  <div className="space-y-6">
                    {/* Grid layout with cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Date */}
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                        <div className="bg-red-50 p-2.5 rounded-lg text-[#E74C3C]">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Date</p>
                          <p className="text-sm font-bold text-gray-900">
                            {new Date(selectedCampDetails.date).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {/* Time */}
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                        <div className="bg-red-50 p-2.5 rounded-lg text-[#E74C3C]">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Time</p>
                          <p className="text-sm font-bold text-gray-900">
                            {selectedCampDetails.startTime && selectedCampDetails.endTime
                              ? `${selectedCampDetails.startTime} - ${selectedCampDetails.endTime}`
                              : selectedCampDetails.time || "10:00 AM - 04:00 PM"}
                          </p>
                        </div>
                      </div>

                      {/* Venue / Location */}
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-start gap-3 md:col-span-2">
                        <div className="bg-red-50 p-2.5 rounded-lg text-[#E74C3C] mt-0.5">
                          <MapPin size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Venue / Address</p>
                          <p className="text-sm font-bold text-gray-900">
                            {selectedCampDetails.venue || selectedCampDetails.location}
                          </p>
                          {selectedCampDetails.address && (
                            <p className="text-xs text-gray-500 mt-1">{selectedCampDetails.address}</p>
                          )}
                          {(selectedCampDetails.venue || selectedCampDetails.location) && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCampDetails.venue || selectedCampDetails.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-red-500 font-bold hover:underline mt-2"
                            >
                              Google Maps Link <ArrowRight size={12} />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Organizer */}
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                        <div className="bg-red-50 p-2.5 rounded-lg text-[#E74C3C]">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Organizer</p>
                          <p className="text-sm font-bold text-gray-900">
                            {selectedCampDetails.organizerName || selectedCampDetails.organizer?.name || "Hospital Partner"}
                          </p>
                        </div>
                      </div>

                      {/* Available Slots / Registered Count */}
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                        <div className="bg-red-50 p-2.5 rounded-lg text-[#E74C3C]">
                          <Droplet size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Slots (Registered / Capacity)</p>
                          <p className="text-sm font-bold text-gray-900">
                            {selectedCampDetails.registeredDonors ? selectedCampDetails.registeredDonors.length : selectedCampDetails.registeredCount || 0} / {selectedCampDetails.maxSlots || 200}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description Section */}
                    {selectedCampDetails.description && (
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">About This Camp</p>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                          {selectedCampDetails.description}
                        </p>
                      </div>
                    )}

                    {/* Contact Number */}
                    {selectedCampDetails.organizerContact && (
                      <div className="bg-red-50/30 border border-red-100 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-50 p-2 rounded-lg text-[#E74C3C]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.5 19.5 0 0 1 3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Contact Number</p>
                            <p className="text-xs font-bold text-gray-900">{selectedCampDetails.organizerContact}</p>
                          </div>
                        </div>
                        <a href={`tel:${selectedCampDetails.organizerContact}`} className="text-xs bg-white hover:bg-gray-100 text-gray-800 font-bold py-1.5 px-3 rounded-lg border border-gray-200 transition-colors shadow-sm">
                          Call Now
                        </a>
                      </div>
                    )}

                    {/* Ineligibility Warning Message for Camp */}
                    {eligibility?.nextEligibleDate && new Date(selectedCampDetails.date) < new Date(eligibility.nextEligibleDate) && !selectedCampDetails.registeredDonors?.includes(currentUser._id) && (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-700 text-xs flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">You are not eligible to register for this camp</p>
                          <p className="mt-1">
                            Your next eligible donation date is{" "}
                            <span className="font-bold">
                              {new Date(eligibility.nextEligibleDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            . This camp is scheduled on{" "}
                            <span className="font-bold">
                              {new Date(selectedCampDetails.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            .
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Actions / Registration Button */}
                    <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setSelectedCampId(null)}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-bold transition shadow-sm text-center"
                      >
                        Close / Back
                      </button>
                      {(() => {
                        const isAlreadyRegistered = selectedCampDetails.registeredDonors?.includes(currentUser._id);
                        const isCampIneligible = eligibility?.nextEligibleDate && new Date(selectedCampDetails.date) < new Date(eligibility.nextEligibleDate);
                        const isDisabled = isAlreadyRegistered || isRegistering || isCampIneligible;
                        return (
                          <button
                            disabled={isDisabled}
                            onClick={() => {
                              if (isCampIneligible) {
                                toast.error("You are not eligible to register for this camp.");
                              } else {
                                handleRegisterForCamp(selectedCampDetails._id);
                              }
                            }}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition text-center flex items-center justify-center gap-2 ${isAlreadyRegistered
                                ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed border border-emerald-200'
                                : isCampIneligible
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-200 hover:bg-gray-300'
                                  : isRegistering
                                    ? 'bg-red-400 text-white cursor-wait'
                                    : 'bg-[#E74C3C] hover:bg-red-700 text-white shadow-md shadow-red-200'
                              }`}
                          >
                            {isRegistering ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Registering...
                              </>
                            ) : isAlreadyRegistered ? (
                              <>
                                <Check size={16} /> Registered
                              </>
                            ) : isCampIneligible ? (
                              "Not Eligible"
                            ) : (
                              "Register Now"
                            )}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Dashboard;
