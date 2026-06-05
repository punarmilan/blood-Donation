import React from "react";
import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-black text-white pt-14 pb-0 border-t border-[#e11d48]/20 relative z-10 shadow-[0_-10px_30px_rgba(225,29,72,0.05)]">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Raktdaan Logo" className="w-10 h-10 rounded-xl object-cover" />
              <h3 className="text-xl font-black text-white m-0">रक्तदान</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              A centralized platform connecting donors, organizers and blood camps
              to save lives efficiently.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2">
              {[
                { to: "/", label: "Home" },
                { to: "/about", label: "About Us" },
                { to: "/services", label: "Services" },
                { to: "/organizer-enquiry", label: "For Organizer" },
                { to: "/register", label: "Register as Donor" },
              ].map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className="text-slate-400 no-underline text-sm hover:text-red-400 transition-colors duration-200"
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-4">Resources</h4>
            <div className="flex flex-col gap-2">
              <NavLink to="/admin-login" className="text-slate-400 no-underline text-sm hover:text-red-400 transition-colors duration-200">Admin Login</NavLink>
              <span className="text-slate-400 text-sm cursor-pointer hover:text-slate-300 transition-colors">Privacy Policy</span>
              <span className="text-slate-400 text-sm cursor-pointer hover:text-slate-300 transition-colors">Terms of Service</span>
              <span className="text-slate-400 text-sm cursor-pointer hover:text-slate-300 transition-colors">Cookie Policy</span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-4">Contact</h4>
            <div className="flex flex-col gap-2 text-slate-400 text-sm">
              <p className="m-0">📍 India</p>
              <p className="m-0">📞 +91 99234 00442</p>
              <p className="m-0">✉️ raktdaan.online@gmail.com</p>
            </div>

            {/* Social */}
            <div className="mt-4">
              <a
                href="https://www.instagram.com/raktdaan.online/"
                target="_blank"
                rel="noreferrer"
                aria-label="Raktdaan Instagram"
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition-colors duration-200"
                title="Instagram"
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                  <defs>
                    <linearGradient id="igGradientFooter" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f58529" />
                      <stop offset="30%" stopColor="#dd2a7b" />
                      <stop offset="60%" stopColor="#8134af" />
                      <stop offset="100%" stopColor="#515bd4" />
                    </linearGradient>
                  </defs>
                  <path
                    fill="url(#igGradientFooter)"
                    d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.25-2.05a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 py-4 text-center text-slate-600 text-sm">
        © 2025 Raktdaan. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
