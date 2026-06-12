import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRequestStatus } from "../services/requestService";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { toast } from "react-hot-toast";
import {
  Share2, MapPin, Hospital,
  Check, Users, UserCheck, Clock, ShieldCheck,
  Facebook, Copy, PhoneCall, MessageCircle, ArrowLeft,
  Activity, ArrowRight, HeartPulse, FileText, ChevronRight, LogOut
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const RequestStatus = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, logout } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleConvertToDonor = async () => {
    try {
      setConverting(true);
      const res = await api.patch("/users/convert-to-donor");

      if (res.data.success) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setCurrentUser(res.data.user);
        window.dispatchEvent(new Event("userUpdated"));
        toast.success("Congratulations! You are now registered as a donor.");
        navigate("/donor/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Convert to donor error:", error);
      toast.error(error.response?.data?.message || "Conversion failed");
    } finally {
      setConverting(false);
      setShowConfirmModal(false);
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getRequestStatus(requestId);
        if (data && data.success) {
          setRequest(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch request status");
        setRequest({
          requestId: requestId || "RD2026578",
          patientName: "Akshata",
          bloodGroup: "B-",
          units: 1,
          hospital: "Latur Hospital",
          city: "Pune",
          urgency: "Emergency",
          status: "active",
          createdAt: new Date(Date.now() - 3600000 * 2),
          adminSeenAt: new Date(Date.now() - 3600000 * 1.8),
          donorsNotifiedAt: new Date(Date.now() - 3600000 * 1.5),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [requestId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Activity className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (!request) return null;

  const formatDateStr = (dateInput) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatTimeOnly = (dateInput) => {
    if (!dateInput) return "Pending";
    const d = new Date(dateInput);
    return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const getStatusLevel = (req) => {
    if (req.status === 'completed') return 4;
    if (req.status === 'accepted' || req.status === 'fulfilled') return 3;
    if (req.status === 'active') return 2;
    if (req.status === 'pending') return 0;

    // Fallback to timestamps if status is somehow missing
    if (req.completedAt) return 4;
    if (req.acceptedAt) return 3;
    if (req.donorsNotifiedAt) return 2;
    if (req.adminSeenAt) return 1;
    return 0;
  };

  const currentStep = getStatusLevel(request);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Urgent Blood Required: ${request.bloodGroup}`,
        text: `Urgent requirement of ${request.bloodGroup} blood at ${request.hospital}. Please help!`,
        url: window.location.href,
      }).catch((err) => console.log('Error sharing', err));
    } else {
      window.open(`https://wa.me/?text=Urgent%20Blood%20Required:%20${request.bloodGroup}%20at%20${request.hospital}%20Link:%20${window.location.href}`, '_blank');
    }
  };

  const getBadgeConfig = (status) => {
    switch (status?.toLowerCase()) {
      case "fulfilled": return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: <Check size={14} className="mr-1.5" />, label: "Fulfilled" };
      case "active": return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: <Activity size={14} className="mr-1.5" />, label: "Active" };
      default: return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: <Clock size={14} className="mr-1.5" />, label: status || "Pending" };
    }
  };

  const badge = getBadgeConfig(request.status);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-24 pt-24">
      <style>{`
        @media (max-width: 768px) {
          .responsive-header-card {
            padding: 1.5rem !important;
          }
          .responsive-flex-header {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
          }
          .responsive-icon-container {
            margin-bottom: 0.5rem !important;
          }
          .responsive-button-group {
            flex-direction: column !important;
            width: 100% !important;
          }
          .responsive-button-group button {
            width: 100% !important;
          }
          .responsive-info-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 1.5rem !important;
          }
          .responsive-profile-bar {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 1rem !important;
          }
          .responsive-profile-details {
            width: 100% !important;
            justify-content: space-between !important;
            border-top: 1px solid #f4f4f5 !important;
            padding-top: 0.75rem !important;
            flex-wrap: wrap !important;
          }
        }
        @media (max-width: 480px) {
          .responsive-info-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 space-y-6">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>

        {/* LOGGED IN USER PROFILE BAR */}
        {currentUser && (
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 responsive-profile-bar">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg uppercase">
                {currentUser.name ? currentUser.name[0] : "U"}
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900">Welcome, {currentUser.name || "User"}</h4>
                <p className="text-xs text-zinc-500 font-medium">Account Type: <span className="capitalize text-red-600 font-bold">{currentUser.role || "Recipient"}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs font-semibold text-zinc-650 responsive-profile-details">
              {currentUser.mobile && (
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">Mobile Number</span>
                  <span>{currentUser.mobile}</span>
                </div>
              )}
              {currentUser.bloodGroup && (
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">Blood Group</span>
                  <span className="text-red-650 font-bold">{currentUser.bloodGroup}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BLOOD BANK FLOW REDIRECT BANNER */}
        {(request.acceptedByBloodBank || ['reserved', 'ready_for_pickup', 'issued'].includes(request.status)) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 border-l-4 border-l-red-600">
            <div>
              <h3 className="text-sm font-bold text-red-800 uppercase tracking-widest mb-1 flex items-center gap-2">
                <span className="animate-ping w-2 h-2 rounded-full bg-red-600 inline-block"></span>
                🏥 Blood Bank Process & Payment
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-semibold">
                Yeh request Blood Bank ke dwara fulfill ki ja rahi hai. Secure payment (Razorpay), document checklist tracking aur handover OTP dekhne ke liye secure recipient page par jayein.
              </p>
            </div>
            <button
              onClick={() => navigate(`/recipient/request/${requestId}`)}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
            >
              Go to Recipient Portal <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* HEADER SECTION - Clean & Minimal */}
        <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm mt-2 responsive-header-card">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

            <div className="flex items-start gap-5 responsive-flex-header">
              <div className="w-16 h-16 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0 responsive-icon-container">
                <HeartPulse size={32} strokeWidth={1.5} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-zinc-500 font-semibold text-xs tracking-wider uppercase">Request #{request.requestId}</span>
                  <div className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border flex items-center ${badge.bg} ${badge.text} ${badge.border} uppercase tracking-wider`}>
                    {badge.icon} {badge.label}
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{request.patientName}</h1>
                {(request.recipient || request.requesterMobile) && (
                  <div className="text-sm font-semibold text-zinc-700 mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[10px] text-zinc-500 uppercase font-bold">Requested By</span>
                    <span className="text-zinc-800">{request.recipient ? request.recipient.name : "N/A"}</span>
                    <span className="text-zinc-300">•</span>
                    <a href={`tel:${request.recipient?.mobile || request.requesterMobile}`} className="text-red-600 hover:text-red-700 font-bold hover:underline flex items-center gap-1">
                      <PhoneCall size={12} /> {request.recipient?.mobile || request.requesterMobile}
                    </a>
                  </div>
                )}
                <p className="text-zinc-500 text-xs mt-2 flex items-center gap-1.5">
                  <Clock size={14} /> Last updated: {formatDateStr(request.updatedAt || request.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full lg:w-auto responsive-button-group">
              <button
                onClick={handleCopy}
                className="flex-1 lg:flex-none bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 lg:flex-none bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <Share2 size={16} /> Share
              </button>
              {currentUser && currentUser.role === "recipient" && (
                <button
                  onClick={() => {
                    logout();
                    navigate("/", { replace: true });
                  }}
                  className="flex-1 lg:flex-none bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white px-5 py-2.5 rounded-lg border border-zinc-800 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut size={16} /> Logout
                </button>
              )}
            </div>

          </div>

          <div className="w-full h-px bg-zinc-100 my-8"></div>

          {/* KEY INFORMATION GRID - Professional Layout */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 responsive-info-grid">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1.5">Patient Name</p>
              <p className="text-base font-medium text-zinc-900">{request.patientName}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1.5">Blood Group</p>
              <p className="text-base font-bold text-red-600">{request.bloodGroup}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1.5">Required Blood Component</p>
              <p className="text-base font-medium text-zinc-900">{request.bloodComponent || "Not specified"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1.5">Units Required</p>
              <p className="text-base font-medium text-zinc-900">{request.units} Unit{request.units > 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1.5">Urgency</p>
              <p className="text-base font-medium text-zinc-900">{request.urgency || "Emergency"}</p>
            </div>
          </div>
        </div>

        {/* TWO COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* MAIN CONTENT - Left Side */}
          <div className="lg:col-span-2 space-y-6">

            {/* HOSPITAL INFO */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-zinc-100 pb-4">
                <Hospital size={18} className="text-zinc-400" />
                <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-widest">Medical Facility</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1.5">Hospital Name</p>
                  <p className="text-sm font-medium text-zinc-900">{request.hospital}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1.5">Location</p>
                  <p className="text-sm font-medium text-zinc-900 flex items-center gap-1.5">
                    <MapPin size={14} className="text-zinc-400" />
                    {request.city}, Maharashtra
                  </p>
                </div>
              </div>
            </div>

            {/* TRACKING TIMELINE */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-8 border-b border-zinc-100 pb-4">
                <FileText size={18} className="text-zinc-400" />
                <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-widest">Tracking Status</h3>
              </div>

              <div className="relative pl-4 md:pl-8 py-2 space-y-8">
                {/* Progress Lines Container */}
                <div className="absolute left-[23px] md:left-[39px] top-6 bottom-8 w-px bg-zinc-200">
                  {/* Progress line */}
                  <div
                    className="absolute left-0 top-0 w-full bg-red-600 transition-all duration-1000 ease-out"
                    style={{ height: `${(currentStep / 4) * 100}%` }}
                  ></div>
                </div>

                {[
                  { step: 0, title: "Request Submitted", time: request.createdAt, desc: "Blood request has been registered in the system." },
                  { step: 1, title: "Admin Verification", time: request.adminSeenAt, desc: "Request details verified by blood bank administrators." },
                  { step: 2, title: "Donors Notified", time: request.donorsNotifiedAt, desc: "Local matching donors have been alerted." },
                  { step: 3, title: "Blood Arranged", time: request.acceptedAt, desc: "Donor has confirmed and arrangement is in process." },
                  { step: 4, title: "Donation Completed", time: request.completedAt, desc: "Donation successfully completed via OTP." },
                ].map((item, i) => {
                  const isCompleted = currentStep >= item.step;
                  const isActive = currentStep === item.step;

                  return (
                    <div key={i} className="flex gap-5 relative z-10 group">
                      {/* Timeline Node */}
                      <div className="shrink-0 mt-0.5">
                        <div className={`w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-colors duration-300 ${isCompleted ? 'border-red-600' : 'border-zinc-300'}`}>
                          {isCompleted && <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>}
                        </div>
                      </div>

                      {/* Timeline Content */}
                      <div className={`flex-1 ${!isCompleted && !isActive ? 'opacity-50' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                          <h4 className={`text-sm font-bold ${isCompleted ? 'text-zinc-900' : 'text-zinc-600'}`}>{item.title}</h4>
                          <span className="text-[11px] text-zinc-500 font-medium">
                            {isCompleted && item.time ? formatTimeOnly(item.time) : "Pending"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* SIDEBAR - Right Side */}
          <div className="space-y-6">

            {/* BECOME A DONOR SECTION (ONLY FOR RECIPIENT) */}
            {currentUser && currentUser.role === "recipient" && (
              <div className="bg-gradient-to-b from-red-50 to-white border border-red-200 rounded-xl p-6 shadow-sm text-center relative overflow-hidden">
                <h3 className="text-sm font-bold text-red-800 uppercase tracking-widest mb-2">Become a Donor</h3>
                <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                  Your single donation can save up to 3 lives. Convert your account to a donor and start helping others.
                </p>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={converting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-xs font-bold transition-all hover:shadow-md cursor-pointer"
                >
                  Convert to Donor
                </button>
              </div>
            )}

            {/* DONOR INFO (IF ACCEPTED) */}
            {request.acceptedBy && (
              <div className="bg-white border border-emerald-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-emerald-100 pb-4">
                  <UserCheck size={18} className="text-emerald-500" />
                  <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-widest">Donor Assigned</h3>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold text-zinc-900 mb-0.5">{request.acceptedBy.name}</div>
                    <div className="text-sm text-zinc-500 font-medium">{request.acceptedBy.mobile}</div>
                  </div>
                  <a href={`tel:${request.acceptedBy.mobile}`} className="w-10 h-10 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-full flex items-center justify-center transition-colors">
                    <PhoneCall size={16} className="text-emerald-600" />
                  </a>
                </div>

                {request.otp && (
                  <div className="mt-4 pt-4 border-t border-emerald-100">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">Verification OTP</p>
                    <div className="text-xl font-mono font-bold text-emerald-700 tracking-widest bg-emerald-50/50 px-3 py-2 rounded-lg border border-emerald-100/50 w-fit">
                      {request.otp}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1.5">Share this OTP with the donor to complete the donation.</p>
                  </div>
                )}
              </div>
            )}



            {/* SPREAD THE WORD QR */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm text-center">
              <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-widest mb-2">Spread the Word</h3>
              <p className="text-xs text-zinc-500 mb-6">Scan QR to share this request quickly.</p>

              <div className="inline-block p-4 bg-white border border-zinc-200 rounded-xl">
                <QRCodeSVG value={window.location.href} size={120} fgColor="#18181b" />
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button onClick={() => window.open(`https://wa.me/?text=Urgent%20Blood%20Required:%20${request.bloodGroup}%20at%20${request.hospital}%20Link:%20${window.location.href}`, '_blank')} className="w-full bg-[#25D366]/10 text-[#16a34a] py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-colors">
                  <MessageCircle size={14} /> WhatsApp Share
                </button>
              </div>
            </div>

            {/* SUPPORT DESK */}
            {/* <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-white shadow-sm">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Support Desk</h3>
              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">Our emergency team is available 24/7 for immediate assistance.</p>
              
              <button className="w-full bg-white hover:bg-zinc-100 text-zinc-900 py-3 rounded-lg text-sm font-bold flex items-center justify-between px-4 transition-colors">
                <div className="flex items-center gap-2">
                  <PhoneCall size={16} />
                  <span>Call Helpline</span>
                </div>
                <ChevronRight size={16} className="text-zinc-400" />
              </button>
            </div> */}

          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center space-y-6">
            <h3 className="text-xl font-bold text-zinc-950">Become a Donor?</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Are you sure you want to become a donor? After conversion, you will be able to accept blood requests and help save lives.
            </p>
            <div className="flex gap-4">
              <button
                disabled={converting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 font-bold text-sm rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={converting}
                onClick={handleConvertToDonor}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {converting ? "Converting..." : "Yes, Convert"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestStatus;
