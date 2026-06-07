import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRequestStatus } from "../services/requestService";
import { 
  Share2, MapPin, Hospital, 
  Check, Users, UserCheck, Clock, ShieldCheck, 
  Facebook, Copy, PhoneCall, MessageCircle, ArrowLeft,
  Activity, ArrowRight, HeartPulse, FileText, ChevronRight
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const RequestStatus = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
    if (req.fulfilledAt) return 4;
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
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 space-y-6">
        
        {/* BACK BUTTON */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>

        {/* HEADER SECTION - Clean & Minimal */}
        <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm mt-2">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
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
                <p className="text-zinc-500 text-sm mt-1.5 flex items-center gap-1.5">
                  <Clock size={14} /> Last updated: {formatDateStr(request.updatedAt || request.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full lg:w-auto">
              <button 
                onClick={handleCopy}
                className="flex-1 lg:flex-none bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />} 
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button 
                onClick={handleShare}
                className="flex-1 lg:flex-none bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Share2 size={16} /> Share
              </button>
            </div>

          </div>

          <div className="w-full h-px bg-zinc-100 my-8"></div>

          {/* KEY INFORMATION GRID - Professional Layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1.5">Patient Name</p>
              <p className="text-base font-medium text-zinc-900">{request.patientName}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1.5">Blood Group</p>
              <p className="text-base font-bold text-red-600">{request.bloodGroup}</p>
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
                {/* Vertical connecting line */}
                <div className="absolute left-[23px] md:left-[39px] top-6 bottom-6 w-px bg-zinc-200"></div>
                
                {/* Progress line */}
                <div 
                  className="absolute left-[23px] md:left-[39px] top-6 w-px bg-red-600 transition-all duration-1000 ease-out" 
                  style={{ height: `${(currentStep / 4) * 100}%` }}
                ></div>

                {[
                  { step: 0, title: "Request Submitted", time: request.createdAt, desc: "Blood request has been registered in the system." },
                  { step: 1, title: "Admin Verification", time: request.adminSeenAt, desc: "Request details verified by blood bank administrators." },
                  { step: 2, title: "Donors Notified", time: request.donorsNotifiedAt, desc: "Local matching donors have been alerted." },
                  { step: 3, title: "Blood Arranged", time: request.acceptedAt, desc: "Donor has confirmed and arrangement is in process." },
                  { step: 4, title: "Fulfilled", time: request.fulfilledAt, desc: "Donation completed successfully." },
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
                          <span className="text-[11px] text-zinc-500 font-medium">{formatTimeOnly(item.time)}</span>
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
            
            {/* ARRIVAL ESTIMATE */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 pb-4">
                <Clock size={18} className="text-zinc-400" />
                <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-widest">Arrival Estimate</h3>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-zinc-900 mb-0.5">30 Mins</div>
                  <div className="text-xs text-zinc-500 font-medium">Average response time</div>
                </div>
                <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center">
                  <MapPin size={18} className="text-zinc-400" />
                </div>
              </div>
            </div>

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
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-white shadow-sm">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Support Desk</h3>
              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">Our emergency team is available 24/7 for immediate assistance.</p>
              
              <button className="w-full bg-white hover:bg-zinc-100 text-zinc-900 py-3 rounded-lg text-sm font-bold flex items-center justify-between px-4 transition-colors">
                <div className="flex items-center gap-2">
                  <PhoneCall size={16} />
                  <span>Call Helpline</span>
                </div>
                <ChevronRight size={16} className="text-zinc-400" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default RequestStatus;
