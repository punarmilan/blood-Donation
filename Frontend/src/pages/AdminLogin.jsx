import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import adminService from "../services/adminService";
import donarBg from "../assets/donar.png";

const inputCls = "w-full pl-11 pr-4 py-3.5 bg-[#0e0e10]/90 border border-zinc-900/60 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/30 transition-all duration-200";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("कृपया ईमेल आणि पासवर्ड भरा.");
      return;
    }
    setLoading(true);
    try {
      const data = await adminService.login(email, password);
      localStorage.setItem("admin-token", data.token);
      navigate("/admin");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. कृपया माहिती तपासा.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ── Fixed Fullscreen Background ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url(${donarBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }}
      />
      {/* ── Dark Overlay ── */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.75)", zIndex: 1 }} />

      {/* ── Scrollable Content Wrapper ── */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-28">
        <div className="w-full max-w-md">
          <div
            className="rounded-[32px] p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            style={{
              background: "rgba(10, 10, 12, 0.9)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Header / Emblem */}
            <div className="text-center mb-8">
              {/* Glowing Red Droplet Icon Container */}
              <div className="w-14 h-14 rounded-full bg-black border border-red-500/30 flex items-center justify-center mx-auto mb-4 relative shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse" />
                <svg className="w-7 h-7 text-red-500 relative z-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  <path d="M12 9v6M9 12h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                Admin <span className="text-red-500">Login</span>
              </h2>
              <p className="text-zinc-400 text-sm">
                Access your administrator panel to manage campaigns and requests
              </p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {/* Email Field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-red-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  className={inputCls}
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-red-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={inputCls}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors bg-transparent border-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-xl text-white font-bold text-sm cursor-pointer border-none flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500"
              >
                {loading ? (
                  <span>Logging in...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </>
                )}
              </button>

              {/* Go Back Button */}
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-zinc-400 hover:text-white text-sm font-medium flex items-center justify-center gap-1.5 mx-auto transition-colors bg-transparent border-none cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Go Back to Home
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
