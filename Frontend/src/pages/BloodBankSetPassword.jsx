import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ShieldCheck, Check, X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import bloodBankService from "../services/bloodBankService";

export default function BloodBankSetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [bloodBankName, setBloodBankName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!token || !email) {
      toast.error("Invalid or missing setup link parameters.");
      navigate("/blood-bank/login");
      return;
    }
    if (token.includes("...") || token.length < 60) {
      setIsTruncated(true);
      setTokenValid(false);
      setVerifying(false);
      return;
    }
    checkToken();
  }, [token, email]);

  useEffect(() => {
    let timer;
    if (success && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (success && countdown === 0) {
      navigate("/blood-bank/login");
    }
    return () => clearTimeout(timer);
  }, [success, countdown, navigate]);

  const checkToken = async () => {
    try {
      const res = await bloodBankService.verifyPasswordToken(token, email);
      if (res.success && res.valid) {
        setBloodBankName(res.name || "");
        setTokenValid(true);
      } else {
        setTokenValid(false);
      }
    } catch (err) {
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  // Password rules validation logic
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    match: password === confirmPassword && password.length > 0,
  };

  const allRulesPassed = Object.values(rules).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!allRulesPassed) {
      toast.error("Pehle password complexity rules complete karein.");
      return;
    }

    setLoading(true);
    try {
      const data = await bloodBankService.setPassword({ email, token, password, confirmPassword });
      if (data.success) {
        toast.success(data.message || "Password set successfully!");
        setSuccess(true);
      } else {
        toast.error(data.message || "Failed to set password.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-[#E24B4A]/20 border-t-[#E24B4A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 text-sm">Verifying password setup link...</p>
        </div>
      </div>
    );
  }

  if (isTruncated) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6">
        <div className="bg-[#1a1a2e] p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-zinc-800 animate-fade-in">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Incomplete Link Copied</h2>
          <p className="text-zinc-300 text-sm mb-6 leading-relaxed">
            Aapka password setup link adhura (<span className="text-[#E24B4A] font-bold">...</span>) copy hua hai. 
            Aisa tab hota hai jab text message (jaise WhatsApp) se link copy karte waqt visual link text copy ho jata hai.
          </p>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-left text-xs text-zinc-400 space-y-2 mb-8">
            <p className="font-bold text-zinc-300">Ise kaise sahi karein:</p>
            <ol className="list-decimal pl-4 space-y-1.5">
              <li>Gmail application open karein.</li>
              <li>Approval email ke green <strong>"Set Password"</strong> button par direct click karein.</li>
              <li>Agar copy karna hai, toh button par <strong>Right-click</strong> karein aur <strong>"Copy link address"</strong> choose karein (visual text ko select karke copy na karein).</li>
            </ol>
          </div>
          <button 
            onClick={() => navigate("/blood-bank/login")}
            className="px-6 py-3 bg-[#E24B4A] hover:bg-[#c93f3e] text-white rounded-xl font-bold transition-colors w-full shadow-lg"
          >
            Go to Login Page
          </button>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6">
        <div className="bg-[#1a1a2e] p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-zinc-800">
          <div className="w-16 h-16 bg-[#E24B4A]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E24B4A]/20">
            <AlertCircle className="w-8 h-8 text-[#E24B4A]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Link Expired or Invalid</h2>
          <p className="text-zinc-400 mb-8">Password setup link invalid hai ya expire ho chuka hai. Naye approval link ke liye admin se contact karein.</p>
          <button 
            onClick={() => navigate("/blood-bank/login")}
            className="px-6 py-3 bg-[#E24B4A] hover:bg-[#c93f3e] text-white rounded-xl font-bold transition-colors w-full shadow-lg"
          >
            Go to Login Page
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6">
        <div className="bg-[#1a1a2e] p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-zinc-800">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20 animate-bounce">
            <ShieldCheck className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Account Active!</h2>
          <p className="text-zinc-400 mb-6 font-medium">Aapka account set up and activate ho chuka hai.</p>
          <div className="text-sm text-zinc-500">
            Redirecting to login in <span className="text-[#E24B4A] font-black text-lg">{countdown}</span> seconds...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-[#0a0a0c] px-4 py-12">
      <div className="w-full max-w-md bg-[#11111f] rounded-2xl shadow-2xl border border-zinc-800 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#E24B4A]"></div>
        
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#E24B4A]/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#E24B4A]/20">
            <Lock className="w-6 h-6 text-[#E24B4A]" />
          </div>
          <h2 className="text-2xl font-black text-white">Create Setup Password</h2>
          <p className="text-xs text-zinc-400 mt-1">Configure credentials for <strong className="text-zinc-200">{bloodBankName}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Email Address</label>
            <input
              type="text"
              readOnly
              value={email}
              className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-400 font-medium cursor-not-allowed outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-1.5">New Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4.5 h-4.5 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 bg-[#181827] border border-zinc-700 rounded-lg focus:border-[#E24B4A] outline-none text-white text-sm"
                placeholder="Create password"
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Confirm Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4.5 h-4.5 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 bg-[#181827] border border-zinc-700 rounded-lg focus:border-[#E24B4A] outline-none text-white text-sm"
                placeholder="Confirm password"
              />
            </div>
          </div>

          {/* Password Complexity Checklist */}
          <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 space-y-2">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Password Complexity Checks</h4>
            
            <div className="flex items-center gap-2 text-xs">
              {rules.length ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-zinc-600" />}
              <span className={rules.length ? "text-green-500 font-medium" : "text-zinc-500"}>At least 8 characters long</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              {rules.uppercase ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-zinc-600" />}
              <span className={rules.uppercase ? "text-green-500 font-medium" : "text-zinc-500"}>At least 1 uppercase letter</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {rules.lowercase ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-zinc-600" />}
              <span className={rules.lowercase ? "text-green-500 font-medium" : "text-zinc-500"}>At least 1 lowercase letter</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {rules.number ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-zinc-600" />}
              <span className={rules.number ? "text-green-500 font-medium" : "text-zinc-500"}>At least 1 numerical digit</span>
            </div>

            <div className="flex items-center gap-2 text-xs border-t border-zinc-800/80 pt-2 mt-1">
              {rules.match ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-zinc-600" />}
              <span className={rules.match ? "text-green-500 font-medium" : "text-zinc-500"}>Passwords match</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !allRulesPassed}
            className="w-full py-3 bg-[#E24B4A] hover:bg-[#c93f3e] text-white rounded-xl font-bold shadow-lg shadow-[#E24B4A]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Activating Account..." : "Set Password & Activate Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
