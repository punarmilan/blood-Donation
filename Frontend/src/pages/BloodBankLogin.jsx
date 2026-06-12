import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Building2, LogIn, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import bloodBankService from "../services/bloodBankService";

export default function BloodBankLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const data = await bloodBankService.loginBloodBank({ email, password });
      
      if (data.success) {
        localStorage.setItem("bloodBankToken", data.token);
        localStorage.setItem("bloodBankData", JSON.stringify(data.bloodBank));
        toast.success("Login successful!");
        navigate("/blood-bank/profile");
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch (error) {
      const statusMsg = error.response?.data?.message || "Invalid email or password.";
      toast.error(statusMsg, {
        duration: 5000,
        icon: <AlertCircle className="w-5 h-5 text-[#E24B4A]" />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-[#0a0a0c] px-4 py-12">
      <div className="w-full max-w-md bg-[#11111f] rounded-2xl shadow-2xl border border-zinc-800 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#E24B4A]"></div>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#E24B4A]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E24B4A]/20">
            <Building2 className="w-8 h-8 text-[#E24B4A]" />
          </div>
          <h2 className="text-2xl font-black text-white">Blood Bank Login</h2>
          <p className="text-zinc-400 text-xs mt-1">Access your secure blood bank inventory and operations</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4.5 h-4.5 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#181827] border border-zinc-700 rounded-lg focus:border-[#E24B4A] outline-none text-white text-sm placeholder-zinc-600 transition-all"
                placeholder="contact@bloodbank.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4.5 h-4.5 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 bg-[#181827] border border-zinc-700 rounded-lg focus:border-[#E24B4A] outline-none text-white text-sm placeholder-zinc-600 transition-all"
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#E24B4A] hover:bg-[#c93f3e] text-white rounded-xl font-bold shadow-lg shadow-[#E24B4A]/20 transition-all disabled:opacity-50 flex justify-center items-center gap-2 mt-4 cursor-pointer"
          >
            {loading ? "Authenticating..." : <><LogIn className="w-4.5 h-4.5" /> Log In</>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
          <p className="text-zinc-400 text-xs">
            Not registered yet?{" "}
            <Link to="/blood-bank/register" className="text-[#E24B4A] hover:text-[#c93f3e] font-bold ml-1 transition-colors">
              Apply here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
