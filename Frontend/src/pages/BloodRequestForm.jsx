import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getBloodRequestBackground, createBloodRequest } from "../services/requestService";
import INDIAN_STATES from "../utils/indianStates";
import toast from "react-hot-toast";
import { AlertCircle, Calendar, Hospital, User, Send, Droplet, Clock, Activity, MapPin, Globe } from "lucide-react";
import bgImage from "../assets/ragister.png";

const BloodRequestForm = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/login?role=recipient");
    }
  }, [currentUser, loading, navigate]);

  const [bgData, setBgData] = useState(null);
  const [formData, setFormData] = useState({
    patientName: "",
    bloodGroup: "",
    bloodComponent: "",
    unitsNeeded: "",
    urgency: "",
    hospitalName: "",
    hospitalArea: "",
    city: "",
    state: "",
    pincode: "",
    neededDateTime: "",
    additionalInfo: "",
    latitude: "",
    longitude: ""
  });
  
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill location details on mount
  useEffect(() => {
    const fetchBackground = async () => {
      try {
        const data = await getBloodRequestBackground();
        if (data && data.success && data.background) {
          setBgData(data.background);
        }
      } catch (err) {
        console.error("Failed to load dynamic background", err);
      }
    };
    fetchBackground();

    // Auto-fill city/state from localStorage
    const savedLoc = localStorage.getItem("detected_location");
    if (savedLoc) {
      try {
        const { city, state } = JSON.parse(savedLoc);
        setFormData(prev => ({
          ...prev,
          city: city || prev.city,
          state: state || prev.state
        }));
      } catch (e) {
        console.error("Error loading saved location", e);
      }
    }

    // Try to get geolocation coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }));
        },
        (err) => {
          console.warn("Geolocation permission not granted for request coordinates", err);
        }
      );
    }

    const handleLocationChange = () => {
      fetchBackground();
      const newLoc = localStorage.getItem("detected_location");
      if (newLoc) {
        try {
          const { city, state } = JSON.parse(newLoc);
          setFormData(prev => ({
            ...prev,
            city: city || prev.city,
            state: state || prev.state
          }));
        } catch (e) {
          console.error(e);
        }
      }
    };

    window.addEventListener("locationChanged", handleLocationChange);
    return () => {
      window.removeEventListener("locationChanged", handleLocationChange);
    };
  }, []);

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const unitOptions = ["1", "2", "3", "4+"];
  const urgencyOptions = [
    { value: "urgent", label: "🚨 Urgent", desc: "Need within 24 hours" },
    { value: "planned", label: "📅 Planned", desc: "Surgery/Planned requirement" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (
      !formData.patientName || 
      !formData.bloodGroup || 
      !formData.unitsNeeded || 
      !formData.urgency || 
      !formData.hospitalName || 
      !formData.hospitalArea ||
      !formData.city ||
      !formData.state ||
      !formData.neededDateTime
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!formData.bloodComponent) {
      toast.error("Please select required blood component.");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("jwt_token");
      
      // Map both new and old fields for complete compatibility
      const dataToSubmit = {
        ...formData,
        units: formData.unitsNeeded === "4+" ? 4 : parseInt(formData.unitsNeeded),
        unitsNeeded: formData.unitsNeeded === "4+" ? 4 : parseInt(formData.unitsNeeded),
        hospital: `${formData.hospitalName}, ${formData.hospitalArea}`,
        hospitalName: formData.hospitalName,
        neededBy: formData.urgency === "urgent" ? "today" : "tomorrow",
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
      };
      
      const dataRes = await createBloodRequest(dataToSubmit, token);

      if (dataRes && dataRes.success) {
        toast.success("Request submitted successfully!");
        navigate(`/request-status/${dataRes.data.requestId}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E24B4A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
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
      {bgData?.mediaType === 'video' && bgData?.mediaUrl && (
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
          <p className="text-zinc-300 text-sm drop-shadow-md font-semibold">Fill details to notify donors in your city immediately</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-white">
          
          {/* Patient Name */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider">Patient Name *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-[#D85A30]" />
              </div>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                className="w-full bg-white/10 text-white pr-4 py-3.5 pl-11 rounded-xl border border-white/20 focus:border-[#D85A30] focus:ring-1 focus:ring-[#D85A30] outline-none transition-all placeholder:text-white/60 text-sm font-semibold"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Enter patient's full name"
                required
              />
            </div>
          </div>

          {/* Hospital Name */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider">Hospital Name *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Hospital size={18} className="text-[#D85A30]" />
              </div>
              <input
                type="text"
                value={formData.hospitalName}
                onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                className="w-full bg-white/10 text-white pr-4 py-3.5 pl-11 rounded-xl border border-white/20 focus:border-[#D85A30] focus:ring-1 focus:ring-[#D85A30] outline-none transition-all placeholder:text-white/60 text-sm font-semibold"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="e.g. Ruby Hall Clinic"
                required
              />
            </div>
          </div>

          {/* Hospital Area */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider">Hospital Area *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPin size={18} className="text-[#D85A30]" />
              </div>
              <input
                type="text"
                value={formData.hospitalArea}
                onChange={(e) => setFormData({ ...formData, hospitalArea: e.target.value })}
                className="w-full bg-white/10 text-white pr-4 py-3.5 pl-11 rounded-xl border border-white/20 focus:border-[#D85A30] focus:ring-1 focus:ring-[#D85A30] outline-none transition-all placeholder:text-white/60 text-sm font-semibold"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="e.g. Koregaon Park"
                required
              />
            </div>
          </div>

          {/* Needed Date & Time */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider">Needed Date/Time *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Calendar size={18} className="text-[#D85A30]" />
              </div>
              <input
                type="datetime-local"
                value={formData.neededDateTime}
                onChange={(e) => setFormData({ ...formData, neededDateTime: e.target.value })}
                className="w-full bg-white/10 text-white pr-4 py-3.5 pl-11 rounded-xl border border-white/20 focus:border-[#D85A30] focus:ring-1 focus:ring-[#D85A30] outline-none transition-all placeholder:text-white/60 text-sm font-semibold cursor-pointer"
                style={{ paddingLeft: '2.75rem' }}
                required
              />
            </div>
          </div>

          {/* State Select Dropdown */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider">State *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Globe size={18} className="text-[#D85A30]" />
              </div>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full bg-white/10 text-white pr-4 py-3.5 pl-11 rounded-xl border border-white/20 focus:border-[#D85A30] focus:ring-1 focus:ring-[#D85A30] outline-none transition-all text-sm font-semibold appearance-none cursor-pointer"
                style={{ paddingLeft: '2.75rem' }}
                required
              >
                <option value="" className="bg-zinc-900" disabled>Select State</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st} className="bg-zinc-900">{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* City */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider">City *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPin size={18} className="text-[#D85A30]" />
              </div>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-white/10 text-white pr-4 py-3.5 pl-11 rounded-xl border border-white/20 focus:border-[#D85A30] focus:ring-1 focus:ring-[#D85A30] outline-none transition-all placeholder:text-white/60 text-sm font-semibold"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="e.g. Pune"
                required
              />
            </div>
          </div>

          {/* Pincode */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider">Pincode</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPin size={18} className="text-[#D85A30]" />
              </div>
              <input
                type="text"
                maxLength="6"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })}
                className="w-full bg-white/10 text-white pr-4 py-3.5 pl-11 rounded-xl border border-white/20 focus:border-[#D85A30] focus:ring-1 focus:ring-[#D85A30] outline-none transition-all placeholder:text-white/60 text-sm font-semibold"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="e.g. 411001"
              />
            </div>
          </div>

          {/* Required Blood Component */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider">Required Blood Component *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Droplet size={18} className="text-[#E24B4A]" />
              </div>
              <select
                value={formData.bloodComponent}
                onChange={(e) => setFormData({ ...formData, bloodComponent: e.target.value })}
                className="w-full bg-white/10 text-white pr-4 py-3.5 pl-11 rounded-xl border border-white/20 focus:border-[#E24B4A] focus:ring-1 focus:ring-[#E24B4A] outline-none transition-all text-sm font-semibold appearance-none cursor-pointer"
                style={{ paddingLeft: '2.75rem' }}
                required
              >
                <option value="" className="bg-zinc-900" disabled>Select Blood Component</option>
                <option value="Whole Blood" className="bg-zinc-900">Whole Blood</option>
                <option value="RBC" className="bg-zinc-900">RBC</option>
                <option value="Platelets" className="bg-zinc-900">Platelets</option>
                <option value="Plasma" className="bg-zinc-900">Plasma</option>
              </select>
            </div>
          </div>

          {/* Blood Group */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider">Blood Group Needed *</label>
            <div className="grid grid-cols-4 gap-2">
              {bloodGroups.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setFormData({ ...formData, bloodGroup: bg })}
                  className={`py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
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
            <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider">Units Needed *</label>
            <div className="grid grid-cols-4 gap-2">
              {unitOptions.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setFormData({ ...formData, unitsNeeded: unit })}
                  className={`py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    formData.unitsNeeded === unit
                      ? "bg-[#D85A30]/90 border-[#D85A30] text-white shadow-[0_0_15px_rgba(216,90,48,0.4)] backdrop-blur-md"
                      : "bg-white/10 border-white/20 text-zinc-100 hover:border-[#D85A30]/80 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  <Droplet size={10} fill={formData.unitsNeeded === unit ? "currentColor" : "none"} /> {unit}
                </button>
              ))}
            </div>
          </div>

          {/* Urgency */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider">Urgency *</label>
            <div className="grid grid-cols-2 gap-3">
              {urgencyOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, urgency: opt.value })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    formData.urgency === opt.value
                      ? "bg-[#E24B4A]/30 border-[#E24B4A] shadow-[0_0_15px_rgba(226,75,74,0.2)] backdrop-blur-md"
                      : "bg-white/10 border-white/20 hover:border-white/50 hover:bg-white/20"
                  }`}
                >
                  <div className={`font-bold text-sm mb-0.5 ${formData.urgency === opt.value ? "text-[#E24B4A]" : "text-zinc-300"}`}>
                    {opt.label}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-semibold">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider">Additional Information (Optional)</label>
            <textarea
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:border-[#D85A30] focus:ring-1 focus:ring-[#D85A30] outline-none transition-all min-h-[80px] resize-none text-sm placeholder:text-white/60 font-semibold"
              placeholder="Any specific instructions for donors..."
            />
          </div>

          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl text-white font-bold text-sm hover:scale-[1.02] transition-all flex justify-center items-center gap-2 cursor-pointer"
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
                  <span>Submit Blood Request</span>
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
