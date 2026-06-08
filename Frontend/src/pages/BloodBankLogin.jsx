import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Building2, LogIn } from "lucide-react";
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
        toast.success("Login successful");
        navigate("/blood-bank/dashboard");
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-[#0a0a0c] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-[#0f172a] rounded-2xl shadow-2xl border border-zinc-800 p-8">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <Building2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Blood Bank Login</h2>
            <p className="text-zinc-400 text-sm">Access your blood bank panel and manage inventory</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-zinc-400 mb-2">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-white transition-all"
                  placeholder="admin@bloodbank.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-400 mb-2">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-white transition-all"
                  placeholder="••••••••"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 transition-all disabled:opacity-50 flex justify-center items-center gap-2 mt-4"
            >
              {loading ? "Authenticating..." : <><LogIn className="w-5 h-5" /> Login</>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
            <p className="text-zinc-400 text-sm">
              Not registered yet?{" "}
              <Link to="/blood-bank/register" className="text-red-500 hover:text-red-400 font-bold ml-1 transition-colors">
                Apply here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
