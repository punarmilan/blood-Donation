import React, { useState, useEffect, useRef, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { User, Menu, X, ChevronDown } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [mobileLoginOpen, setMobileLoginOpen] = useState(false);

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

  const NAV_ITEMS = useMemo(() => {
    return [
      { to: "/", label: "Home" },
      { to: "/about", label: "About Us" },
      { to: "/services", label: "Services" },
      { to: "/blood-banks", label: "Blood Banks" },
      // { to: "/register", label: "Donor Registration" },
      { to: "/organizer-enquiry", label: "Organizer Enquiry" },
    ];
  }, []);

  const adminItem = useMemo(() => {
    return adminToken
      ? { to: "/admin", label: "Admin" }
      : { to: "/admin-login", label: "Admin Login" };
  }, [adminToken]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  return (
    <header className="fixed top-0 left-0 w-full z-[1500] bg-black/40 backdrop-blur-md border-b border-zinc-900 shadow-md">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">

        {/* BRAND / LOGO */}
        <NavLink to="/" className="flex items-center gap-3 no-underline" onClick={() => setOpen(false)}>
          <div className="w-[42px] h-[42px] flex items-center justify-center relative">
            <svg className="w-full h-full text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              <path d="M12 9v6M9 12h6" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col leading-[1.15]">
            <span className="font-extrabold text-[1.25rem] text-white tracking-wide">रक्तदान</span>
            <span className="text-[0.72rem] text-zinc-400 font-semibold tracking-normal whitespace-nowrap">Blood Donation Centre</span>
          </div>
        </NavLink>

        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
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

        <div className="hidden lg:flex items-center gap-4">
          {/* USER DASHBOARD / LOGIN BUTTON */}
          <NavLink
            to="/dashboard"
            className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-800 hover:border-red-500 bg-transparent text-zinc-300 hover:text-red-500 transition-all duration-300 hover:bg-red-600/10 hover:shadow-[0_0_15px_rgba(220,38,38,0.15)]"
            title="User Dashboard"
          >
            <User className="w-5 h-5" />
          </NavLink>

          {/* LOGIN DROPDOWN */}
          <div 
            className="relative" 
            ref={dropdownRef}
          >
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-600/40 hover:border-red-500 bg-transparent text-white text-[13px] font-bold no-underline transition-all duration-300 hover:bg-red-600/10 hover:shadow-[0_0_15px_rgba(220,38,38,0.15)] focus:outline-none cursor-pointer"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <User className="w-4 h-4 text-red-500" />
              <span>Login</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <div
              className={`absolute top-full right-0 mt-2 w-52 bg-[#0a0a0c] border border-zinc-800 rounded-xl shadow-2xl origin-top overflow-hidden z-[2000] transition-all duration-300 ${
                dropdownOpen 
                  ? 'opacity-100 translate-y-0 visible pointer-events-auto' 
                  : 'opacity-0 -translate-y-2 invisible pointer-events-none'
              }`}
            >
              <div className="flex flex-col py-2">
                <NavLink
                  to="/organizer-login"
                  className="px-4 py-2 text-[13px] font-bold text-zinc-300 hover:text-white hover:bg-red-600/10 transition-colors flex items-center gap-2 no-underline"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User className="w-4 h-4 text-red-500" />
                  Organization Login
                </NavLink>
                <NavLink
                  to="/blood-bank/register"
                  className="px-4 py-2 text-[13px] font-bold text-zinc-300 hover:text-white hover:bg-red-600/10 transition-colors flex items-center gap-2 no-underline"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User className="w-4 h-4 text-red-500" />
                  Blood Bank Register
                </NavLink>
                <NavLink
                  to="/blood-bank/login"
                  className="px-4 py-2 text-[13px] font-bold text-zinc-300 hover:text-white hover:bg-red-600/10 transition-colors flex items-center gap-2 no-underline"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User className="w-4 h-4 text-red-500" />
                  Blood Bank Login
                </NavLink>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE TOGGLE */}
        <button
          className="lg:hidden flex items-center justify-center w-11 h-11 border border-zinc-800 rounded-xl bg-zinc-950 text-white cursor-pointer transition-all duration-200 hover:bg-zinc-900"
          onClick={() => setOpen(!open)}
          aria-label="Toggle Menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[1900] transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />

      <aside
        ref={panelRef}
        className={`fixed top-0 right-0 w-[min(90vw,360px)] h-screen bg-[#0a0a0c] border-l border-zinc-900 shadow-2xl p-6 z-[2000] transition-transform duration-[350ms] ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Mobile Header */}
        <div className="flex justify-between items-center pb-5 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-[36px] h-[36px] flex items-center justify-center relative">
              <svg className="w-full h-full text-red-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                <path d="M12 9v6M9 12h6" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="text-white font-extrabold text-lg leading-tight">रक्तदान</div>
              <div className="text-zinc-500 text-xs font-semibold">Blood Donation Centre</div>
            </div>
          </div>
          <button
            className="w-9 h-9 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            onClick={() => setOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Links */}
        <nav className="mt-6 flex flex-col gap-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-3 rounded-xl text-sm font-bold no-underline transition-all duration-200 block
                ${isActive
                  ? "bg-red-500/10 text-red-500 border-l-4 border-red-500"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
                }`
              }
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}

          <div className="h-[1px] bg-zinc-900 my-4" />

          {/* User & Admin Login on Mobile */}
          <div className="flex flex-col gap-3 mt-2">
            <NavLink
              to="/dashboard"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/50 text-white text-sm font-bold no-underline transition-all hover:bg-red-600/10 hover:border-red-600/40"
              onClick={() => setOpen(false)}
            >
              <User className="w-4 h-4 text-red-500" />
              <span>User Profile / Login</span>
            </NavLink>

            {/* Mobile Login Dropdown */}
            <div className="flex flex-col gap-1 border border-red-600/40 rounded-xl bg-red-600/5 overflow-hidden transition-all duration-300">
              <button
                onClick={() => setMobileLoginOpen(!mobileLoginOpen)}
                className="flex items-center justify-center gap-2 px-4 py-3 w-full text-white text-sm font-bold no-underline transition-all hover:bg-red-600/10 focus:outline-none cursor-pointer"
              >
                <User className="w-4 h-4 text-red-500" />
                <span>Login</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${mobileLoginOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <div 
                className={`transition-all duration-300 overflow-hidden ${
                  mobileLoginOpen ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="flex flex-col gap-1 px-2 pb-2">
                  <NavLink
                    to="/organizer-login"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-[13px] font-bold text-zinc-300 hover:text-white hover:bg-red-600/10 transition-colors no-underline"
                    onClick={() => {
                      setOpen(false);
                      setMobileLoginOpen(false);
                    }}
                  >
                    <User className="w-4 h-4 text-red-500" />
                    Organization Login
                  </NavLink>
                  <NavLink
                    to="/blood-bank/register"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-[13px] font-bold text-zinc-300 hover:text-white hover:bg-red-600/10 transition-colors no-underline"
                    onClick={() => {
                      setOpen(false);
                      setMobileLoginOpen(false);
                    }}
                  >
                    <User className="w-4 h-4 text-red-500" />
                    Blood Bank Register
                  </NavLink>
                  <NavLink
                    to="/blood-bank/login"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-[13px] font-bold text-zinc-300 hover:text-white hover:bg-red-600/10 transition-colors no-underline"
                    onClick={() => {
                      setOpen(false);
                      setMobileLoginOpen(false);
                    }}
                  >
                    <User className="w-4 h-4 text-red-500" />
                    Blood Bank Login
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </header>
  );
}
