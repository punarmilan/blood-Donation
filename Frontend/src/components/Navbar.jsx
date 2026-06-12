import React, { useState, useEffect, useRef, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { User, Menu, X, ChevronDown, Home, Users, Droplet, Building2, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LocationSelector from "./LocationSelector";

export default function Navbar() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const panelRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [mobileLoginOpen, setMobileLoginOpen] = useState(false);

  const [detectedLocation, setDetectedLocation] = useState(() => {
    const saved = localStorage.getItem("detected_location");
    try {
      return saved ? JSON.parse(saved) : { country: "India", state: "Maharashtra", city: "Pune" };
    } catch {
      return { country: "India", state: "Maharashtra", city: "Pune" };
    }
  });

  useEffect(() => {
    const handleLocationChange = (e) => {
      if (e.detail) {
        setDetectedLocation(e.detail);
      }
    };
    window.addEventListener("locationChanged", handleLocationChange);
    return () => window.removeEventListener("locationChanged", handleLocationChange);
  }, []);

  const handleProfileClick = (e) => {
    if (e) e.preventDefault();
    setIsMobileMenuOpen(false);
    
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (currentUser.role === "donor") {
      navigate("/donor/dashboard");
    } else if (currentUser.role === "recipient") {
      if (currentUser.activeRequestId) {
        navigate(`/request-status/${currentUser.activeRequestId}`);
      } else {
        navigate("/recipient/profile");
      }
    } else if (currentUser.role === "admin") {
      navigate("/admin/dashboard");
    } else if (currentUser.role === "bloodBank") {
      navigate("/blood-bank/profile");
    } else {
      navigate("/login");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [adminToken, setAdminToken] = useState(
    localStorage.getItem("admin-token")
  );
  const [orgToken, setOrgToken] = useState(
    localStorage.getItem("organizer-token")
  );

  useEffect(() => {
    const sync = () => {
      setAdminToken(localStorage.getItem("admin-token"));
      setOrgToken(localStorage.getItem("organizer-token"));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const NAV_ITEMS_WITH_ICONS = useMemo(() => {
    return [
      { to: "/", label: "Home", icon: Home },
      { to: "/about", label: "About Us", icon: Users },
      { to: "/services", label: "Services", icon: Droplet },
      { to: "/blood-banks", label: "Blood Banks", icon: Building2 },
    ];
  }, []);

  const adminItem = useMemo(() => {
    return adminToken
      ? { to: "/admin", label: "Admin" }
      : { to: "/admin-login", label: "Admin Login" };
  }, [adminToken]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "auto";
  }, [isMobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 w-full z-[1500] bg-black/40 backdrop-blur-md border-b border-zinc-900 shadow-md">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">

        {/* BRAND / LOGO */}
        <NavLink to="/" className="flex items-center gap-3 no-underline" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-[42px] h-[42px] flex items-center justify-center relative">
            <svg className="w-full h-full text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              <path d="M12 9v6M9 12h6" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col leading-[1.15]">
            <span className="font-extrabold text-[1.25rem] text-white tracking-wide">रक्तदान</span>
            <span className="text-[0.72rem] text-white font-extrabold tracking-normal whitespace-nowrap">Blood Donation Centre</span>
          </div>
        </NavLink>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS_WITH_ICONS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `text-[14px] font-bold no-underline transition-all duration-300 relative py-1
                  ${isActive
                  ? "text-red-500 after:content-[''] after:absolute after:left-0 after:bottom-[-6px] after:w-full after:h-[2.5px] after:rounded-full after:bg-red-500"
                  : "text-zinc-300 hover:text-red-500"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <LocationSelector />
          {/* USER DASHBOARD / LOGIN BUTTON */}
          <button
            onClick={handleProfileClick}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-800 hover:border-red-500 bg-transparent text-zinc-300 hover:text-red-500 transition-all duration-300 hover:bg-red-600/10 hover:shadow-[0_0_15px_rgba(220,38,38,0.15)] cursor-pointer"
            title="User Dashboard"
          >
            <User className="w-5 h-5" />
          </button>
        </div>

        {/* MOBILE TOGGLE - Hamburger only */}
        <button
          className="md:hidden flex items-center justify-center w-11 h-11 border border-zinc-800 rounded-xl bg-zinc-950 text-white cursor-pointer transition-all duration-200 hover:bg-zinc-900"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      <aside
        ref={panelRef}
        className={`fixed top-0 left-0 w-full h-screen bg-[#0d0d0d] z-[2000] p-4 flex flex-col transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Mobile Header */}
        <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-[36px] h-[36px] flex items-center justify-center relative">
              <svg className="w-full h-full text-red-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                <path d="M12 9v6M9 12h6" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="text-white font-extrabold text-lg leading-tight">रक्तदान</div>
              <div className="text-zinc-400 text-xs font-semibold">Blood Donation Centre</div>
            </div>
          </div>
          <button
            className="w-11 h-11 border border-zinc-800 rounded-xl bg-zinc-950 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Links & Widgets Container */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-4">
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS_WITH_ICONS.map((item, index) => (
              <React.Fragment key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-4 rounded-xl text-sm font-semibold transition-all duration-300 no-underline
                      ${isActive
                        ? "bg-red-600 text-white font-bold"
                        : "bg-[#111113] text-zinc-300 hover:border-red-500/50 hover:shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                      }`
                  }
                  style={({ isActive }) => 
                    isActive ? {} : { border: "1px solid rgba(63, 63, 70, 0.3)" }
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {({ isActive }) => {
                    const Icon = item.icon;
                    return (
                      <>
                        <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-zinc-400"}`} />
                        <span>{item.label}</span>
                      </>
                    );
                  }}
                </NavLink>
                {index < NAV_ITEMS_WITH_ICONS.length - 1 && (
                  <div className="border-t border-dashed border-zinc-800/30 my-2" />
                )}
              </React.Fragment>
            ))}
          </nav>

          <div className="border-t border-dashed border-zinc-800/30 my-4" />

          {/* Location selector card */}
          <LocationSelector
            trigger={
              <div 
                className="flex items-center justify-between p-4 bg-[#111113] rounded-xl cursor-pointer hover:border-zinc-700/50 transition-colors"
                style={{ border: "1px solid rgba(63, 63, 70, 0.3)" }}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-red-500" />
                  <span className="text-white font-medium text-sm">
                    {detectedLocation.city || detectedLocation.state || detectedLocation.country || "Pimpri-Chinchwad"}
                  </span>
                </div>
                <span className="text-xs text-red-500 hover:text-red-400 font-semibold underline">
                  Change
                </span>
              </div>
            }
          />

          {/* My Profile card */}
          <div 
            onClick={handleProfileClick}
            className="flex items-center gap-3 p-4 bg-[#111113] rounded-xl cursor-pointer hover:border-zinc-700/50 transition-colors"
            style={{ border: "1px solid rgba(63, 63, 70, 0.3)" }}
          >
            <User className="w-5 h-5 text-zinc-400" />
            <span className="text-white font-medium text-sm">My Profile</span>
          </div>
        </div>
      </aside>
    </header>
  );
}
