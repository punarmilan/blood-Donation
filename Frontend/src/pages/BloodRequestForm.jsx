import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import { AlertCircle, Calendar, Hospital, User, Send, Droplet, Clock, Activity } from "lucide-react";
import bgImage from "../assets/ragister.png";

const BloodRequestForm = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/register?role=recipient");
    }
  }, [currentUser, loading, navigate]);

  const [bgData, setBgData] = useState(null);

  useEffect(() => {
    const fetchBackground = async () => {
      try {
        const res = await axios.get("/api/blood-request-background");
        if (res.data.success && res.data.background) {
          setBgData(res.data.background);
        }
      } catch (err) {
        console.error("Failed to load dynamic background", err);
      }
    };
    fetchBackground();
  }, []);

  const [formData, setFormData] = useState({
    patientName: "",
    bloodGroup: "",
    units: "",
    urgency: "",
    hospital: "",
    neededBy: "",
    additionalInfo: ""
  });
  
  const [submitting, setSubmitting] = useState(false);

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const unitOptions = ["1", "2", "3", "4+"];
  const urgencyOptions = [
    { value: "urgent", label: "🚨 Urgent", desc: "Need within 24 hours" },
    { value: "planned", label: "📅 Planned", desc: "Surgery/Planned requirement" }
  ];
  const timeOptions = ["Aaj", "Kal", "2-3 din mein", "1 hafte mein"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.patientName || !formData.bloodGroup || !formData.units || !formData.urgency || !formData.hospital || !formData.neededBy) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await axios.post("/api/request/create", {
        ...formData,
        units: formData.units === "4+" ? 4 : parseInt(formData.units),
        city: currentUser?.city || "Pune"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success("Request submitted successfully!");
        navigate(`/request-status/${res.data.data.requestId}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#E24B4A] border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <div 
      className="min-h-screen flex flex-col p-4 pt-28 pb-12 relative"
      style={bgData?.mediaType !== 'video' ? {
        backgroundImage: `url(${bgData?.mediaUrl || bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      } : {}}
    >
      {bgData?.mediaType === 'video' && (
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ position: 'fixed', top: 0, left: 0 }}
        >
          <source src={bgData.mediaUrl} />
        </video>
      )}
      <div className="absolute inset-0 z-0 bg-black/30" style={{ position: 'fixed', top: 0, left: 0 }}></div>

      <div className="w-full relative z-10 p-8 sm:p-10 m-auto mt-8 max-w-[900px] bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[30px] shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]">
        
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/20 shadow-[0_0_20px_rgba(216,90,48,0.3)]">
            <Activity className="text-[#D85A30] w-8 h-8 drop-shadow-md" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 font-cinzel tracking-wider drop-shadow-lg">Request Blood</h2>
          <p className="text-zinc-300 text-sm drop-shadow-md">Fill details to notify donors in your city immediately</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          
          {/* Patient Name */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase">Patient Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-[#D85A30]" />
              </div>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                className="w-full bg-white/10 text-white px-4 py-3.5 pl-11 rounded-xl border border-white/20 focus:border-[#D85A30] focus:ring-1 focus:ring-[#D85A30] outline-none transition-all placeholder:text-white/60"
                placeholder="Enter patient's full name"
              />
            </div>
          </div>

          {/* Hospital */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase">Hospital Name & Area</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Hospital size={18} className="text-[#D85A30]" />
              </div>
              <input
                type="text"
                value={formData.hospital}
                onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                className="w-full bg-white/10 text-white px-4 py-3.5 pl-11 rounded-xl border border-white/20 focus:border-[#D85A30] focus:ring-1 focus:ring-[#D85A30] outline-none transition-all placeholder:text-white/60"
                placeholder="e.g. Ruby Hall Clinic, Pune"
              />
            </div>
          </div>

          {/* Blood Group */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase">Blood Group Needed</label>
            <div className="grid grid-cols-4 gap-2">
              {bloodGroups.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setFormData({ ...formData, bloodGroup: bg })}
                  className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                    formData.bloodGroup === bg
                      ? "bg-[#E24B4A]/90 border-[#E24B4A] text-white shadow-[0_0_15px_rgba(226,75,74,0.4)] backdrop-blur-md"
                      : "bg-white/10 border-white/20 text-zinc-100 hover:border-[#E24B4A]/80 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Units */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase">Units Needed</label>
            <div className="grid grid-cols-4 gap-2">
              {unitOptions.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setFormData({ ...formData, units: unit })}
                  className={`py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    formData.units === unit
                      ? "bg-[#D85A30]/90 border-[#D85A30] text-white shadow-[0_0_15px_rgba(216,90,48,0.4)] backdrop-blur-md"
                      : "bg-white/10 border-white/20 text-zinc-100 hover:border-[#D85A30]/80 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  <Droplet size={10} fill={formData.units === unit ? "currentColor" : "none"} /> {unit}
                </button>
              ))}
            </div>
          </div>

          {/* Urgency */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase">Urgency</label>
            <div className="grid grid-cols-2 gap-3">
              {urgencyOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, urgency: opt.value })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.urgency === opt.value
                      ? "bg-[#E24B4A]/30 border-[#E24B4A] shadow-[0_0_15px_rgba(226,75,74,0.2)] backdrop-blur-md"
                      : "bg-white/10 border-white/20 hover:border-white/50 hover:bg-white/20"
                  }`}
                >
                  <div className={`font-bold text-sm mb-0.5 ${formData.urgency === opt.value ? "text-[#E24B4A]" : "text-zinc-300"}`}>
                    {opt.label}
                  </div>
                  <div className="text-[10px] text-zinc-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* When Needed */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase">When do you need it?</label>
            <div className="flex flex-wrap gap-2">
              {timeOptions.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setFormData({ ...formData, neededBy: time })}
                  className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all ${
                    formData.neededBy === time
                      ? "bg-[#D85A30]/40 border-[#D85A30] text-white backdrop-blur-md"
                      : "bg-white/10 border-white/20 text-zinc-100 hover:border-[#D85A30]/80 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  <Clock size={12} className="inline mr-1" /> {time}
                </button>
              ))}
            </div>
          </div>



          {/* Additional Info */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase">Additional Information (Optional)</label>
            <textarea
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:border-[#D85A30] focus:ring-1 focus:ring-[#D85A30] outline-none transition-all min-h-[80px] resize-none text-sm placeholder:text-white/60"
              placeholder="Any specific instructions for donors..."
            />
          </div>

          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl text-white font-bold text-sm hover:scale-[1.02] transition-all flex justify-center items-center gap-2"
              style={{
                background: "linear-gradient(90deg, #D85A30 0%, #E24B4A 100%)",
                boxShadow: "0 0 20px rgba(226,75,74,0.3)"
              }}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  <span>Request Submit Karo</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default BloodRequestForm;
