import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WhyDonateSection from "../components/WhyDonateSection";
import DarkInfoSection from "../components/DarkInfoSection";
import {
  Heart, Users, QrCode, Calendar, Award, Shield, Clock,
  CheckCircle, Activity, Zap, TrendingUp, Star, BadgeCheck, ThumbsUp, Tent
} from "lucide-react";

const StarRating = () => (
  <div className="flex gap-1 mt-3">
    {[...Array(5)].map((_, i) => (
      <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
    ))}
  </div>
);

const Home = () => {
  const navigate = useNavigate();

  const goDonorRegister = () => navigate("/register");
  const goOrganizerEnquiry = () => navigate("/organizer-enquiry");
  const goServices = () => navigate("/services");

  const [bgType, setBgType] = useState(() => localStorage.getItem("homeBgType") || "gradient");
  const [bgUrl, setBgUrl] = useState(() => localStorage.getItem("homeBgUrl") || "");

  const [countDonors, setCountDonors] = useState(0);
  const [countLives, setCountLives] = useState(0);
  const [countCamps, setCountCamps] = useState(0);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await fetch("/api/admin/theme");
        const data = await res.json();
        if (data) {
          setBgType(data.bgType || "gradient");
          setBgUrl(data.bgUrl || "");
        }
      } catch {
        const st = localStorage.getItem("homeBgType");
        const su = localStorage.getItem("homeBgUrl");
        if (st) setBgType(st);
        if (su) setBgUrl(su);
      }
    };
    fetchTheme();

    const handleScroll = () => {
      document.querySelectorAll(".animate-on-scroll").forEach((el) => {
        if (el.getBoundingClientRect().top <= window.innerHeight * 0.75) {
          el.classList.add("visible");
        }
      });
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();

    let di = setInterval(() => setCountDonors(p => { const n = Math.min(p + 50, 5000); if (n >= 5000) clearInterval(di); return n; }), 20);
    let li = setInterval(() => setCountLives(p => { const n = Math.min(p + 150, 15000); if (n >= 15000) clearInterval(li); return n; }), 20);
    let ci = setInterval(() => setCountCamps(p => { const n = Math.min(p + 10, 500); if (n >= 500) clearInterval(ci); return n; }), 30);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(di); clearInterval(li); clearInterval(ci);
    };
  }, []);

  const isCustomBg = bgType !== "gradient";

  /* ---- Service card data ---- */
  const services = [
    {
      badge: "For Organizers", badgeColor: "bg-red-100 text-red-600",
      iconBg: "bg-red-50 text-red-500",
      icon: <Users size={40} />,
      title: "Organizer Dashboard",
      desc: "Complete control center for managing blood donation drives. Access donor details, track campaigns, and coordinate efficiently.",
      items: [
        { icon: <TrendingUp size={20} className="text-red-500" />, title: "Real-Time Analytics", sub: "Track donations and campaigns instantly" },
        { icon: <Users size={20} className="text-red-500" />, title: "Donor Management", sub: "Complete donor profiles access" },
        { icon: <Zap size={20} className="text-red-500" />, title: "Smart Notifications", sub: "Automated alerts for team" },
      ],
    },
    {
      badge: "For Donors", badgeColor: "bg-blue-100 text-blue-600",
      iconBg: "bg-blue-50 text-blue-500",
      icon: <Calendar size={40} />,
      title: "Easy Registration",
      desc: "Simple, fast, and secure donor registration. Get started in minutes through organizer links and begin your journey.",
      items: [
        { icon: <Zap size={20} className="text-blue-500" />, title: "One-Click Sign Up", sub: "Register using invitation links" },
        { icon: <Shield size={20} className="text-blue-500" />, title: "Secure Platform", sub: "Encrypted data protection" },
        { icon: <CheckCircle size={20} className="text-blue-500" />, title: "Instant Confirmation", sub: "Immediate verification" },
      ],
    },
    {
      badge: "Smart Tech", badgeColor: "bg-green-100 text-green-600",
      iconBg: "bg-green-50 text-green-500",
      icon: <QrCode size={40} />,
      title: "QR Code System",
      desc: "Modern, contactless check-in system using QR codes. Fast verification, instant access, and complete digital tracking.",
      items: [
        { icon: <QrCode size={20} className="text-green-500" />, title: "Quick Check-In", sub: "Instant venue access" },
        { icon: <Activity size={20} className="text-green-500" />, title: "Contactless Process", sub: "Safe touchless system" },
        { icon: <Clock size={20} className="text-green-500" />, title: "Digital History", sub: "All donations tracked" },
      ],
    },
  ];

  /* ---- How it works steps ---- */
  const steps = [
    { num: "01", icon: <Users size={32} />, iconBg: "bg-red-100 text-red-500", title: "Register Online", desc: "Quick 2-minute registration through our platform or organizer link." },
    { num: "02", icon: <Activity size={32} />, iconBg: "bg-blue-100 text-blue-500", title: "Health Screening", desc: "Free health check-up by our medical professionals." },
    { num: "03", icon: <Heart size={32} />, iconBg: "bg-green-100 text-green-500", title: "Donate Blood", desc: "Safe sterile donation takes only 10-15 minutes." },
    { num: "04", icon: <Award size={32} />, iconBg: "bg-amber-100 text-amber-500", title: "Save Lives", desc: "Your donation helps up to 3 patients. Track your impact!" },
  ];

  /* ---- Testimonials ---- */
  const testimonials = [
    { initial: "D", name: "Donor Testimonial", role: "Regular Donor", text: "\"The entire process is so smooth and professional. The QR code system makes check-in instant. I've donated 5 times now!\"" },
    { initial: "O", name: "Organizer Testimonial", role: "Blood Camp Organizer", text: "\"The organizer dashboard is incredible! Real-time tracking and donor management made our blood camp so efficient.\"" },
    { initial: "V", name: "Volunteer Testimonial", role: "Healthcare Worker", text: "\"Working with this platform has been amazing. User-friendly, donors feel comfortable, and safety protocols are top-notch!\"" },
  ];

  /* ---- Trust cards ---- */
  const trustCards = [
    {
      iconBg: "bg-green-100 text-green-600",
      icon: <Shield size={32} />,
      title: "Certified & Safe",
      desc: "All our processes follow WHO standards with sterile, single-use equipment. Your safety is guaranteed at every step.",
      features: ["WHO Certified Process", "Sterile Equipment", "Trained Professionals"],
    },
    {
      iconBg: "bg-blue-100 text-blue-600",
      icon: <Activity size={32} />,
      title: "Real-Time Tracking",
      desc: "Track your donation journey and see the real impact you're making. Complete transparency from start to finish.",
      features: ["Live Updates", "Donation History", "Impact Reports"],
    },
    {
      iconBg: "bg-red-100 text-red-600",
      icon: <Heart size={32} />,
      title: "Community Driven",
      desc: "Join a caring community of donors and organizers working together to save lives and make a lasting impact.",
      features: ["5000+ Active Donors", "500+ Organizers", "24/7 Support"],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fbff] via-[#eef6ff] to-[#f6fbff] relative">

      {/* Animated BG Orbs */}
      {bgType === "gradient" && (
        <div className="bg-orbs" aria-hidden="true">
          <div className="orb w-[640px] h-[640px] [background:radial-gradient(circle,rgba(37,99,235,.85),rgba(56,189,248,.45))] -top-[220px] -left-[220px]" />
          <div className="orb w-[520px] h-[520px] [background:radial-gradient(circle,rgba(6,182,212,.75),rgba(56,189,248,.40))] -bottom-[170px] -right-[170px] [animation-delay:7s]" />
          <div className="orb w-[420px] h-[420px] [background:radial-gradient(circle,rgba(59,130,246,.60),rgba(14,165,233,.32))] top-[38%] right-[8%] [animation-delay:14s]" />
        </div>
      )}

      {/* =========================================================
          HERO SECTION
          ========================================================= */}
      <section
        className={`relative min-h-screen flex items-center pt-[120px] pb-[80px] px-6 z-[1] overflow-hidden ${isCustomBg ? "" : ""}`}
        style={bgType === "image" && bgUrl ? { backgroundImage: `url("${bgUrl.replace("localhost", window.location.hostname)}")`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      >
        {/* Hero bg radial gradients (only for gradient mode) */}
        {!isCustomBg && (
          <div className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(900px 520px at 16% 20%, rgba(37,99,235,.20), transparent 60%),
                radial-gradient(760px 520px at 82% 18%, rgba(56,189,248,.18), transparent 60%),
                radial-gradient(720px 520px at 72% 80%, rgba(225,29,72,.10), transparent 60%),
                linear-gradient(180deg,#f7fbff,#ffffff 55%,#f6fbff)
              `
            }}
          />
        )}

        {/* Grid lines overlay */}
        {!isCustomBg && (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.12]"
            style={{
              backgroundImage: "linear-gradient(to right,rgba(15,23,42,.06) 1px,transparent 1px),linear-gradient(to bottom,rgba(15,23,42,.06) 1px,transparent 1px)",
              backgroundSize: "70px 70px",
            }}
          />
        )}

        {/* Video background */}
        {bgType === "video" && bgUrl && (
          <video autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
            src={bgUrl.replace("localhost", window.location.hostname)}
          />
        )}

        {/* Left-to-right dark shadow overlay (for custom bg) */}
        {isCustomBg && (
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.15) 70%, transparent 100%)" }}
          />
        )}

        {/* Hero Content */}
        <div className="max-w-[1400px] mx-auto w-full relative z-[1]">
          <div className="animate-on-scroll max-w-3xl">
            <h1
              className={`font-cinzel font-black leading-[1.06] tracking-[-0.04em] mb-6 mt-14 ml-5 flex items-center gap-4
                ${isCustomBg
                  ? "text-white [text-shadow:0_4px_20px_rgba(0,0,0,0.5)]"
                  : "text-[#0f172a] [text-shadow:0_18px_45px_rgba(2,6,23,0.10)]"
                }
              `}
              style={{ fontSize: "clamp(2.6rem, 4vw, 4.6rem)" }}
            >
              <Heart size={64} className="text-red-500 fill-red-500 animate-[pulse-scale_3.2s_ease-in-out_infinite]" />
              Raktdaan
            </h1>

            <p className={`text-[1.5rem] leading-[1.9] mb-10 ml-5 max-w-[620px] font-medium
              ${isCustomBg ? "text-white/85" : "text-slate-500"}`}
            >
              Pune ka Blood Donation Platform
            </p>

            <div className="flex gap-4 flex-wrap mb-12 ml-5">
              <button
                type="button"
                onClick={goDonorRegister}
                className="shine inline-flex items-center gap-2 px-9 py-[18px] rounded-full text-[1.1rem] font-bold text-white cursor-pointer border-none transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_64px_rgba(225,29,72,0.34)]"
                style={{ background: "linear-gradient(135deg,#e11d48 0%,#dc2626 55%,#fb7185 120%)", boxShadow: "0 18px 50px rgba(225,29,72,.26)" }}
              >
                <span>Donate Blood</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/blood-request")}
                className={`shine inline-flex items-center gap-2 px-9 py-[18px] rounded-full text-[1.1rem] font-bold cursor-pointer border transition-all duration-300 hover:-translate-y-1
                  ${isCustomBg ? "bg-white/10 text-white border-white/20 hover:bg-white/20 hover:shadow-[0_22px_64px_rgba(255,255,255,0.1)]" : "bg-white text-slate-800 border-slate-200 hover:shadow-[0_22px_64px_rgba(0,0,0,0.08)]"}
                `}
              >
                <span>blood Request</span>
              </button>

              <button
                type="button"
                onClick={goOrganizerEnquiry}
                className={`shine inline-flex items-center gap-2 px-9 py-[18px] rounded-full text-[1.1rem] font-bold cursor-pointer border transition-all duration-300 hover:-translate-y-1
                  ${isCustomBg ? "bg-white/10 text-white border-white/20 hover:bg-white/20 hover:shadow-[0_22px_64px_rgba(255,255,255,0.1)]" : "bg-white text-slate-800 border-slate-200 hover:shadow-[0_22px_64px_rgba(0,0,0,0.08)]"}
                `}
              >
                <span>Camp Arrange</span>
              </button>
            </div>

            {/* Unique Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full max-w-[900px]">
              {[
                { label: "Active Donors", value: countDonors.toLocaleString() + "+", icon: <Users size={24} className={isCustomBg ? "text-red-400" : "text-red-500"} />, lightBg: "bg-red-50 border-red-100", darkBg: "bg-black/30 border-red-500/20", iconBgLight: "bg-white shadow-sm", iconBgDark: "bg-red-500/20" },
                { label: "Lives Saved", value: countLives.toLocaleString() + "+", icon: <Activity size={24} className={isCustomBg ? "text-blue-400" : "text-blue-500"} />, lightBg: "bg-blue-50 border-blue-100", darkBg: "bg-black/30 border-blue-500/20", iconBgLight: "bg-white shadow-sm", iconBgDark: "bg-blue-500/20" },
                { label: "Camps Organized", value: countCamps + "+", icon: <Tent size={24} className={isCustomBg ? "text-green-400" : "text-green-500"} />, lightBg: "bg-green-50 border-green-100", darkBg: "bg-black/30 border-green-500/20", iconBgLight: "bg-white shadow-sm", iconBgDark: "bg-green-500/20" },
              ].map(({ label, value, icon, lightBg, darkBg, iconBgLight, iconBgDark }) => (
                <div 
                  key={label} 
                  className={`relative overflow-hidden flex items-center gap-4 px-4 py-4 rounded-2xl border backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group
                    ${isCustomBg ? darkBg : lightBg}
                  `}
                >
                  {/* Subtle hover glow */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />
                  
                  <div className={`p-3 rounded-full flex-shrink-0 ${isCustomBg ? iconBgDark : iconBgLight}`}>
                    {icon}
                  </div>
                  <div className="flex flex-col">
                    <div className={`text-2xl md:text-3xl font-black tracking-tight ${isCustomBg ? "text-white drop-shadow-md" : "text-gray-900"}`}>{value}</div>
                    <div className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-0.5 ${isCustomBg ? "text-white/80" : "text-gray-500"}`}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Donate Blood Section */}
      <WhyDonateSection />

      {/* How It Works + Success Stories + Partners */}
      <DarkInfoSection />
    </div>
  );
};

export default Home;
