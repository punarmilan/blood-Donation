import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import bloodBankService from "../services/bloodBankService";

export default function BloodBankSetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      toast.error("Invalid or missing setup link parameters.");
      navigate("/");
    }
  }, [token, email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // The API takes token in URL and { email, password, confirmPassword } in body.
      // Wait, our backend route is actually /api/blood-banks/set-password (no token in URL). Let's check bloodBankService.js
      // In my bloodBankService.js I wrote: `api.post(\`/blood-banks/set-password/\${token}\`, passwordData)`
      // Let's modify the service call to match what we had: `fetch(\`/api/blood-banks/set-password\`, body: { email, token, password, confirmPassword })`
      // Actually let's just adjust bloodBankService's method to pass it properly or call it right here using api instance.
      // It's cleaner to fix bloodBankService or just pass { email, token, password, confirmPassword } as data.
      
      const data = await bloodBankService.setPassword({ email, token, password, confirmPassword });
      
      if (data.success) {
        toast.success(data.message);
        navigate("/blood-bank/login");
      } else {
        toast.error(data.message || "Failed to set password.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0a0c] px-4">
      <div className="w-full max-w-md bg-[#0f172a] rounded-2xl shadow-2xl border border-zinc-800 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <ShieldCheck className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Setup Your Password</h2>
          <p className="text-zinc-400 text-sm">Create a strong password to secure your Blood Bank account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">New Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-white transition-all"
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">Confirm Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-white transition-all"
                placeholder="Confirm password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
          >
            {loading ? "Saving Password..." : "Set Password & Proceed to Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
