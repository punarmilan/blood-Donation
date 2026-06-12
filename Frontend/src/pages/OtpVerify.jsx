import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { ShieldCheck, Activity, Lock, RefreshCcw } from "lucide-react";
import bgImage from "../assets/ragister.png";

const OtpVerify = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { verifyOtpAndRegister, sendOtp } = useAuth();
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!state?.formData) {
      navigate("/register");
      return;
    }
    
    // Start resend timer
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [state, navigate]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setLoading(true);
    const res = await verifyOtpAndRegister(otpValue, state.formData);
    setLoading(false);

    if (res.success) {
      toast.success(state.formData.isLogin ? "Login successful!" : "Registration successful!");
      
      const role = res.user?.role;
      if (role === "donor") {
        navigate("/donor/dashboard");
      } else if (role === "recipient") {
        if (res.user?.activeRequestId) {
          navigate(`/request-status/${res.user.activeRequestId}`);
        } else {
          navigate("/blood-request");
        }
      } else if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "bloodBank") {
        navigate("/blood-bank/profile");
      } else {
        navigate("/login");
      }
    } else {
      toast.error(res.message);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setTimer(30);
    const res = await sendOtp(state.formData.mobile, "recaptcha-resend");
    if (res.success) {
      toast.success("OTP resent!");
    } else {
      toast.error("Failed to resend OTP");
    }
  };

  if (!state?.formData) return null;

  return (
    <div 
      className="min-h-screen flex flex-col p-4 pt-28 pb-12 relative mt-16"
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
          maxWidth: "440px",
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
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-red-600 blur-xl opacity-40 rounded-full"></div>
            <div className="relative z-10 w-16 h-16 flex items-center justify-center bg-gradient-to-b from-red-500 to-red-800 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] border border-red-400/50">
               <ShieldCheck className="text-white w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-wider">
            Verify <span className="text-red-600">OTP</span>
          </h2>
          <p className="text-zinc-400 text-sm">
            OTP sent to <span className="font-bold text-white">+91 {state.formData.mobile}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* OTP Inputs */}
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-14 sm:w-12 sm:h-14 bg-[#141414] border border-zinc-800 rounded-xl text-center text-xl font-bold text-white focus:border-red-500/80 focus:ring-1 focus:ring-red-500/50 outline-none transition-all shadow-inner"
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white font-bold text-sm hover:from-red-600 hover:to-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all flex justify-center items-center gap-2 group border border-red-500/30 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-in-out"></div>
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />
                <span>Verify & Login</span>
              </>
            )}
          </button>
        </form>

        {/* Resend Section */}
        <div className="mt-8 text-sm">
          <button
            type="button"
            onClick={handleResend}
            disabled={timer > 0}
            className={`font-semibold inline-flex items-center gap-1.5 transition-colors ${
              timer > 0 ? "text-zinc-600 cursor-not-allowed" : "text-red-500 hover:text-red-400 hover:underline"
            }`}
          >
            <RefreshCcw size={14} className={timer === 0 ? "animate-pulse" : ""} />
            {timer > 0 ? `Resend OTP in 00:${timer.toString().padStart(2, "0")}` : "Resend OTP Now"}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-center items-center gap-3 text-[10px] text-zinc-500 font-medium border-t border-zinc-800/50 pt-4">
          <div className="flex items-center gap-1"><Lock size={10} /> 100% Secure</div>
          <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
          <div>End-to-End Encrypted</div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerify;
