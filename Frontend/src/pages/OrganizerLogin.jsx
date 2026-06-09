import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff, Users, Calendar, Droplet, HeartPulse, Home, ShieldCheck, Upload } from "lucide-react";
import organizerService from "../services/organizerService";
import donarBg from "../assets/donar.png";

const inputCls = "w-full pl-11 pr-10 py-3.5 bg-[#141416] border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/30 transition-all duration-200";
const labelCls = "block text-zinc-400 text-xs font-semibold mb-2";

const OrganizerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await organizerService.login(email, password);
      localStorage.setItem("organizer-token", data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      navigate("/organizer-dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 lg:p-6 font-sans relative">
      <div className="max-w-[1400px] w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        
        {/* Left Side - Content & Image */}
        <div className="hidden lg:flex flex-col justify-between h-full relative p-8 rounded-[2.5rem]">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                <Droplet className="text-white w-5 h-5" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white leading-none tracking-tight">Raktdaan</h1>
                <p className="text-zinc-400 text-sm">Organizer Portal</p>
              </div>
            </div>
            {/* Dotted pattern */}
            <div className="grid grid-cols-4 gap-1.5 opacity-20">
              {[...Array(16)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
              ))}
            </div>
          </div>

          {/* Text Content */}
          <div className="mt-12 mb-4 relative z-10">
            <h2 className="text-[2.8rem] font-extrabold text-white mb-4 leading-[1.1]">
              Manage Blood Donation <br />
              <span className="text-red-500">Camps with Ease</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
              Organize, manage and track your blood donation camps, donors and reports in one place.
            </p>
          </div>

          {/* Center Glowing Image (Fallback to donarBg) */}
          <div className="relative flex-1 flex items-center justify-center py-6 min-h-[300px]">
             {/* Radial gradient glow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-600/20 blur-[100px] rounded-full pointer-events-none" />
             <img src={donarBg} alt="Blood Donation" className="relative z-10 w-full max-w-[320px] object-contain drop-shadow-2xl opacity-90 transition-transform hover:scale-105 duration-500" style={{ filter: 'drop-shadow(0 0 30px rgba(220,38,38,0.3))' }} />
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4 relative z-10">
            {[
              { icon: Users, num: "1,200+", text: "Donors Registered" },
              { icon: Calendar, num: "350+", text: "Camps Organized" },
              { icon: Droplet, num: "5,000+", text: "Units Collected" },
              { icon: HeartPulse, num: "10,000+", text: "Lives Saved" }
            ].map((stat, i) => (
              <div key={i} className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg transition-transform hover:-translate-y-1 duration-300">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
                  <stat.icon className="w-5 h-5 text-red-500" />
                </div>
                <h4 className="text-white font-bold text-xl mb-1">{stat.num}</h4>
                <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider">{stat.text}</p>
              </div>
            ))}
          </div>

          {/* Footer Text */}
          <div className="mt-8 flex items-center justify-between relative z-10 pt-6 border-t border-zinc-800/50">
            <h3 className="text-white font-bold text-3xl tracking-tighter">Edit</h3>
            <div className="flex items-start gap-2 max-w-sm">
              <span className="text-red-500 text-2xl font-serif leading-none mt-1">"</span>
              <p className="text-zinc-400 text-sm">
                Every drop of blood is a gift of life. <br />
                <span className="text-red-500">Be a hero. Donate blood.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex flex-col items-center justify-center lg:justify-end w-full h-full relative">
          <div className="w-full max-w-[480px] bg-[#0c0c0e] rounded-[32px] p-8 sm:p-12 border border-zinc-800/80 shadow-[0_0_50px_rgba(220,38,38,0.03)] relative overflow-hidden z-10">
            {/* Subtle red glow at top of card */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />
            
            {/* Header */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-full bg-[#141416] border border-zinc-800 flex items-center justify-center mx-auto mb-6 shadow-inner relative">
                 {/* Subtle ring animation */}
                 <div className="absolute inset-0 rounded-full border border-red-500/20 animate-ping opacity-50" />
                 <div className="w-8 h-8 rounded-full bg-red-600/10 flex items-center justify-center z-10">
                    <Droplet className="w-4 h-4 text-red-500" fill="currentColor" />
                 </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome <span className="text-red-500">Back!</span>
              </h2>
              <p className="text-zinc-400 text-sm">
                Sign in to continue to your organizer dashboard
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className={labelCls}>Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-red-500 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-red-500 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className={inputCls}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors bg-transparent border-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="peer sr-only"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <div className="w-4 h-4 border border-zinc-700 rounded bg-[#141416] peer-checked:bg-red-500 peer-checked:border-red-500 transition-colors"></div>
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="text-zinc-400 text-sm group-hover:text-zinc-300 transition-colors">Remember me</span>
                </label>
                <a href="#" className="text-red-500 text-sm font-medium hover:text-red-400 transition-colors">Forgot Password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 py-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:-translate-y-0.5"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center py-4 opacity-50">
                <div className="h-px bg-zinc-700 w-full" />
                <span className="px-4 text-zinc-400 text-xs font-semibold uppercase tracking-wider">or</span>
                <div className="h-px bg-zinc-700 w-full" />
              </div>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full py-4 rounded-xl text-zinc-300 font-semibold text-sm flex items-center justify-center gap-2 transition-all border border-zinc-800 hover:bg-zinc-800/50 hover:text-white"
              >
                <Home className="w-5 h-5" />
                Go Back to Home
              </button>
            </form>
          </div>

          {/* Secure Login Footer */}
          <div className="mt-8 flex items-center justify-center gap-2 text-zinc-600 text-xs w-full lg:w-auto relative z-10">
            <ShieldCheck className="w-4 h-4 text-red-500/70" />
            <span>Secure login • Your data is protected</span>
          </div>
        </div>

        {/* Floating Share/Upload Button (Bottom Right) */}
        <button className="fixed bottom-6 right-6 w-12 h-12 bg-[#121214] border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all shadow-xl z-50">
          <Upload className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default OrganizerLogin;
