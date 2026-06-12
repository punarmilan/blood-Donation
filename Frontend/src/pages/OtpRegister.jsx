import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkMobile } from "../services/requestService";
import INDIAN_STATES from "../utils/indianStates";
import toast from "react-hot-toast";
import { User, Phone, Send, Users, Activity, Shield, Lock, Droplet, MapPin, ChevronRight, Globe } from "lucide-react";
import bgImage from "../assets/ragister.png";

const OtpRegister = () => {
  const navigate = useNavigate();
  const { sendOtp } = useAuth();
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const role = searchParams.get("role") || "donor";
  
  // Steps: "mobile" (ask phone first), "details" (register form), "login" (confirm login)
  const [step, setStep] = useState("mobile");
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [checkingMobile, setCheckingMobile] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    bloodGroup: "",
    city: "",
    state: "",
    role: role
  });
  const [loading, setLoading] = useState(false);

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    if (formData.mobile.length !== 10) {
      toast.error("Mobile number must be 10 digits");
      return;
    }

    setCheckingMobile(true);
    try {
      const res = await checkMobile(formData.mobile);
      if (res.exists) {
        // User exists, setup login mode
        setIsLoginMode(true);
        setFormData(prev => ({
          ...prev,
          name: res.user.name,
          bloodGroup: res.user.bloodGroup || "",
          role: res.user.role || role
        }));
        setStep("login");
        toast.success("Welcome back! Please verify details to login.");
      } else {
        // User does not exist, setup register mode
        setIsLoginMode(false);
        setStep("details");
        toast.success("New mobile number detected. Please register.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to check mobile number status");
    } finally {
      setCheckingMobile(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    
    // Double check validations
    if (!isLoginMode) {
      if (!formData.name || !formData.mobile || !formData.bloodGroup || !formData.state) {
        toast.error("Please fill all required fields");
        return;
      }
    } else {
      if (!formData.name || !formData.mobile) {
        toast.error("Please enter your name and mobile number");
        return;
      }
    }

    setLoading(true);
    const res = await sendOtp(formData.mobile, "recaptcha-container");
    setLoading(false);

    if (res.success) {
      toast.success(`OTP Sent to: ${formData.mobile}`);
      navigate("/verify-otp", { state: { formData: { ...formData, isLogin: isLoginMode } } });
    } else {
      toast.error(res.message || "Failed to send OTP");
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col p-4 pt-28 pb-12 relative mt-20"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Dark Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none" 
        style={{ background: "rgba(0,0,0,0.75)" }}
      ></div>

      <div 
        className="w-full relative z-10 p-8 sm:p-10 m-auto mt-8"
        style={{
          maxWidth: "500px",
          height: "auto",
          borderRadius: "30px",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          background: "rgba(10,10,10,0.85)",
          border: "1px solid rgba(225,29,72,0.25)",
          boxShadow: "0 0 40px rgba(225,29,72,0.25)"
        }}
      >
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-3 flex items-center justify-center">
            <div className="absolute w-20 h-20 bg-[#E11D48] blur-2xl opacity-40 rounded-full pointer-events-none"></div>
            <Droplet className="text-[#E11D48] w-12 h-12 relative z-10 drop-shadow-[0_0_15px_rgba(225,29,72,0.6)]" fill="#E11D48" />
          </div>
          
          <h2 className="text-[28px] font-black text-white mb-1.5 font-cinzel tracking-wider text-center">
            {step === "mobile" ? (
              <><span className="text-[#E11D48]">V</span>ERIFY PHONE</>
            ) : isLoginMode ? (
              <><span className="text-[#E11D48]">L</span>OGIN</>
            ) : role === "recipient" ? (
              "REQUEST BLOOD"
            ) : (
              <><span className="text-[#E11D48]">R</span>AKTDAAN</>
            )}
          </h2>
          <p className="text-gray-300 text-[13px] font-medium text-center">
            {step === "mobile" ? (
              "Enter your mobile number to get started"
            ) : isLoginMode ? (
              "Verify your details to get logged in"
            ) : role === "recipient" ? (
              "Register to find donors instantly"
            ) : (
              "Join Pune's Smart Blood Donation Network"
            )}
          </p>
          
          {/* Statistics Row */}
          <div className="flex justify-between w-full mt-7 border-t border-b border-white/10 py-3.5">
            <div className="flex flex-col items-center justify-center text-center px-1 flex-1">
              <Users size={16} className="text-[#E11D48] mb-1.5 drop-shadow-md" />
              <span className="text-white text-[11px] font-bold">5000+</span>
              <span className="text-gray-400 text-[9px] mt-0.5">Registered Donors</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-1 border-l border-r border-white/10 flex-1">
              <Activity size={16} className="text-[#E11D48] mb-1.5 drop-shadow-md" />
              <span className="text-white text-[11px] font-bold">Fast</span>
              <span className="text-gray-400 text-[9px] mt-0.5">Emergency Support</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-1 flex-1">
              <Shield size={16} className="text-[#E11D48] mb-1.5 drop-shadow-md" />
              <span className="text-white text-[11px] font-bold">Trusted</span>
              <span className="text-gray-400 text-[9px] mt-0.5">Blood Network</span>
            </div>
          </div>
        </div>

        {/* STEP 1: Enter Mobile */}
        {step === "mobile" && (
          <form onSubmit={handleMobileSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-1.5 ml-1 tracking-wide uppercase">Mobile Number</label>
              <div className="flex bg-[#141414] rounded-[14px] border border-white/10 focus-within:border-[#E11D48] focus-within:ring-1 focus-within:ring-[#E11D48] transition-all overflow-hidden group shadow-inner">
                <span className="inline-flex items-center px-4 border-r border-white/10 text-gray-400 text-sm bg-black/40 font-medium">
                  +91
                </span>
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={16} className="text-[#E11D48]/70 group-focus-within:text-[#E11D48] transition-colors" />
                  </div>
                  <input
                    type="tel"
                    maxLength="10"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-transparent text-white px-8 py-3.5 pl-10 outline-none placeholder:text-gray-600 text-sm font-medium tracking-wider"
                    placeholder="Enter your mobile number"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={checkingMobile}
              className="w-full mt-4 py-4 rounded-full text-white font-bold text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2 group relative overflow-hidden cursor-pointer"
              style={{
                background: "linear-gradient(90deg, #DC2626 0%, #E11D48 100%)",
                boxShadow: "0 0 25px rgba(225,29,72,0.4)"
              }}
            >
              {checkingMobile ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Continue</span>
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2 (LOGIN MODE): Confirm details */}
        {step === "login" && (
          <form onSubmit={handleAuthSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1 ml-1 tracking-wide uppercase">Welcome back</label>
              <div className="bg-[#141414] p-4 rounded-xl border border-white/5 space-y-2">
                <p className="text-white font-bold text-base flex items-center gap-2">
                  <User size={16} className="text-red-500" />
                  {formData.name}
                </p>
                <p className="text-gray-400 text-xs font-semibold">
                  📞 +91 {formData.mobile}
                </p>
                {formData.bloodGroup && (
                  <p className="text-gray-400 text-xs font-semibold">
                    🩸 Blood Group: <span className="text-red-500 font-bold">{formData.bloodGroup}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("mobile")}
                className="flex-1 py-3.5 rounded-full border border-white/10 text-white font-bold text-xs cursor-pointer hover:bg-white/5 transition-colors"
              >
                Change Number
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-3.5 rounded-full text-white font-bold text-xs cursor-pointer flex justify-center items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                style={{
                  background: "linear-gradient(90deg, #DC2626 0%, #E11D48 100%)",
                  boxShadow: "0 0 25px rgba(225,29,72,0.4)"
                }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={14} />
                    <span>Get OTP & Login</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2 (REGISTER MODE): Registration Form */}
        {step === "details" && (
          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-1.5 ml-1 tracking-wide uppercase">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-[#E11D48]/70 group-focus-within:text-[#E11D48] transition-colors" />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#141414] text-white px-12 py-3.5 pl-11 rounded-[14px] border border-white/10 focus:border-[#E11D48] focus:ring-1 focus:ring-[#E11D48] outline-none transition-all placeholder:text-gray-600 text-sm shadow-inner"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* Mobile Display */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1.5 ml-1 tracking-wide uppercase">Mobile Number</label>
              <div className="bg-[#141414]/50 text-gray-400 px-4 py-3 rounded-[14px] border border-white/5 text-sm flex justify-between items-center">
                <span>+91 {formData.mobile}</span>
                <button type="button" onClick={() => setStep("mobile")} className="text-red-500 text-xs font-bold hover:underline">Change</button>
              </div>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-2 ml-1 tracking-wide uppercase">Blood Group</label>
              <div className="grid grid-cols-4 gap-2.5">
                {bloodGroups.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setFormData({ ...formData, bloodGroup: bg })}
                    className={`py-3 rounded-[12px] border text-xs font-bold transition-all duration-300 cursor-pointer ${
                      formData.bloodGroup === bg
                        ? "bg-[#E11D48] border-[#E11D48] text-white shadow-[0_0_20px_rgba(225,29,72,0.5)] transform scale-[1.02]"
                        : "bg-[#141414] border-white/10 text-gray-400 hover:border-[#E11D48]/50 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* State Select Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-1.5 ml-1 tracking-wide uppercase">State</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Globe size={18} className="text-[#E11D48]/70 group-focus-within:text-[#E11D48] transition-colors" />
                </div>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full bg-[#141414] text-white px-12 py-3.5 pl-11 rounded-[14px] border border-white/10 focus:border-[#E11D48] focus:ring-1 focus:ring-[#E11D48] outline-none transition-all text-sm shadow-inner appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>Select State</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-1.5 ml-1 tracking-wide uppercase">City</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin size={18} className="text-[#E11D48]/70 group-focus-within:text-[#E11D48] transition-colors" />
                </div>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-[#141414] text-white px-12 py-3.5 pl-11 rounded-[14px] border border-white/10 focus:border-[#E11D48] focus:ring-1 focus:ring-[#E11D48] outline-none transition-all placeholder:text-gray-600 text-sm shadow-inner"
                  placeholder="Enter your city"
                  required
                />
              </div>
            </div>

            {/* Submit Register */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-4 rounded-full text-white font-bold text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2 group relative overflow-hidden cursor-pointer"
              style={{
                background: "linear-gradient(90deg, #DC2626 0%, #E11D48 100%)",
                boxShadow: "0 0 25px rgba(225,29,72,0.4)"
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  <span>Get OTP & Join Now</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-8 flex justify-center items-center gap-3 text-[11px] text-gray-400 font-medium">
          <div className="flex items-center gap-1.5"><Lock size={12} className="text-gray-500" /> 100% Secure</div>
          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
          <div>Unified Auth Flow</div>
          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
          <div>Save Lives</div>
        </div>
        
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default OtpRegister;
