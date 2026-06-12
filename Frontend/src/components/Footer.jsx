import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import { ChevronDown, ChevronUp, Instagram, ArrowUp } from "lucide-react";

const Footer = () => {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (sectionName) => {
    setOpenSection(openSection === sectionName ? null : sectionName);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <footer className="bg-black text-white pt-14 pb-0 border-t border-[#e11d48]/20 relative z-10 shadow-[0_-10px_30px_rgba(225,29,72,0.05)]">
      <style>{`
        /* Hide mobile footer on desktop */
        .mobile-footer {
          display: none !important;
        }
        .desktop-footer {
          display: block !important;
        }
        .floating-back-to-top {
          display: none !important;
        }

        /* Responsive styles */
        @media (max-width: 768px) {
          .desktop-footer {
            display: none !important;
          }
          .mobile-footer {
            display: block !important;
            background: #050505 !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 18px !important;
            padding: 24px 18px !important;
            margin: 20px 12px !important;
            color: #ffffff !important;
            font-family: 'Inter', sans-serif !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
          }
          
          footer.bg-black {
            background: #000000 !important;
            padding-top: 10px !important;
            padding-bottom: 20px !important;
            border-top: none !important;
            box-shadow: none !important;
          }

          .mobile-footer-logo-wrap {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            margin-bottom: 14px !important;
            text-align: center !important;
          }
          .mobile-footer-logo-img {
            width: 48px !important;
            height: 48px !important;
            object-fit: cover !important;
            border-radius: 12px !important;
            margin-bottom: 8px !important;
          }
          .mobile-footer-logo-text {
            font-size: 1.4rem !important;
            font-weight: 900 !important;
            color: #ffffff !important;
            display: block !important;
            line-height: 1.2 !important;
          }
          .mobile-footer-logo-subtitle {
            font-size: 0.75rem !important;
            color: #e11d48 !important;
            font-weight: 700 !important;
            letter-spacing: 0.05em !important;
            display: block !important;
            margin-top: 2px !important;
          }

          .mobile-footer-desc {
            font-size: 0.85rem !important;
            color: #9ca3af !important;
            text-align: center !important;
            line-height: 1.5 !important;
            margin-bottom: 20px !important;
            padding: 0 8px !important;
          }

          .mobile-footer-divider {
            border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
            margin: 18px 0 !important;
          }

          /* Accordion Styles */
          .mobile-footer-accordion {
            display: flex !important;
            flex-direction: column !important;
          }
          .accordion-section {
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          }
          .accordion-header {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 16px 4px !important;
            cursor: pointer !important;
            user-select: none !important;
          }
          .accordion-title {
            font-size: 0.85rem !important;
            font-weight: 800 !important;
            letter-spacing: 0.08em !important;
            color: #ffffff !important;
            text-transform: uppercase !important;
            margin: 0 !important;
          }
          .accordion-arrow {
            width: 18px !important;
            height: 18px !important;
            color: #e11d48 !important;
            transition: transform 0.3s ease !important;
          }
          .accordion-content {
            max-height: 0 !important;
            overflow: hidden !important;
            transition: max-height 0.3s ease-out, padding 0.3s ease !important;
            padding: 0 4px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
          }
          .accordion-content.open {
            max-height: 250px !important;
            padding: 4px 4px 18px 4px !important;
          }
          
          .accordion-link {
            font-size: 0.88rem !important;
            color: #9ca3af !important;
            text-decoration: none !important;
            transition: color 0.2s !important;
            display: block !important;
          }
          .accordion-link:hover {
            color: #f43f5e !important;
          }
          
          .accordion-text-item {
            font-size: 0.88rem !important;
            color: #9ca3af !important;
            margin: 0 !important;
          }

          /* Social Centered */
          .mobile-footer-social-wrap {
            display: flex !important;
            justify-content: center !important;
            margin-top: 24px !important;
            margin-bottom: 16px !important;
          }
          
          .mobile-footer-social-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 42px !important;
            height: 42px !important;
            border-radius: 10px !important;
            background: rgba(255, 255, 255, 0.05) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            transition: background 0.2s, transform 0.2s !important;
          }
          .mobile-footer-social-btn:active {
            transform: scale(0.95) !important;
          }

          .mobile-footer-copyright {
            font-size: 0.78rem !important;
            color: #6b7280 !important;
            text-align: center !important;
            margin-top: 12px !important;
            margin-bottom: 4px !important;
          }

          /* Floating Back to Top Button */
          .floating-back-to-top {
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            width: 44px !important;
            height: 44px !important;
            border-radius: 50% !important;
            background: rgba(15, 15, 15, 0.75) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: #ffffff !important;
            cursor: pointer !important;
            z-index: 9999 !important;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4), 0 0 10px rgba(225, 29, 72, 0.1) !important;
            transition: all 0.3s ease !important;
          }
          .floating-back-to-top:active {
            transform: translateY(-3px) scale(0.95) !important;
          }
          .floating-back-to-top svg {
            width: 18px !important;
            height: 18px !important;
            color: #ffffff !important;
          }
        }
      `}</style>

      {/* ── DESKTOP FOOTER ────────────────────────────────────── */}
      <div className="desktop-footer max-w-[1400px] mx-auto px-6">
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
        {/* Bottom Bar Desktop */}
        <div className="border-t border-white/5 py-4 text-center text-slate-600 text-sm">
          © 2025 Raktdaan. All rights reserved.
        </div>
      </div>

      {/* ── MOBILE FOOTER ─────────────────────────────────────── */}
      <div className="mobile-footer">
        {/* Logo and Brand */}
        <div className="mobile-footer-logo-wrap">
          <img src={logo} alt="Raktdaan Logo" className="mobile-footer-logo-img" />
          <span className="mobile-footer-logo-text">रक्तदान</span>
          <span className="mobile-footer-logo-subtitle">Blood Donation Centre</span>
        </div>

        {/* Short Description */}
        <p className="mobile-footer-desc">
          A centralized platform connecting donors, organizers and blood camps to save lives efficiently.
        </p>

        <div className="mobile-footer-divider"></div>

        {/* Accordion List */}
        <div className="mobile-footer-accordion">
          {/* Quick Links Accordion */}
          <div className="accordion-section">
            <div className="accordion-header" onClick={() => toggleSection("quickLinks")}>
              <h4 className="accordion-title">Quick Links</h4>
              {openSection === "quickLinks" ? <ChevronUp className="accordion-arrow" /> : <ChevronDown className="accordion-arrow" />}
            </div>
            <div className={`accordion-content ${openSection === "quickLinks" ? "open" : ""}`}>
              <NavLink to="/" className="accordion-link">Home</NavLink>
              <NavLink to="/about" className="accordion-link">About Us</NavLink>
              <NavLink to="/services" className="accordion-link">Services</NavLink>
              <NavLink to="/blood-banks" className="accordion-link">Blood Banks</NavLink>
            </div>
          </div>

          {/* Resources Accordion */}
          <div className="accordion-section">
            <div className="accordion-header" onClick={() => toggleSection("resources")}>
              <h4 className="accordion-title">Resources</h4>
              {openSection === "resources" ? <ChevronUp className="accordion-arrow" /> : <ChevronDown className="accordion-arrow" />}
            </div>
            <div className={`accordion-content ${openSection === "resources" ? "open" : ""}`}>
              <NavLink to="/services" className="accordion-link">Latest News</NavLink>
              <NavLink to="/services" className="accordion-link">Awareness</NavLink>
              <NavLink to="/services" className="accordion-link">Camps</NavLink>
              <NavLink to="/about" className="accordion-link">FAQs</NavLink>
            </div>
          </div>

          {/* Contact Accordion */}
          <div className="accordion-section">
            <div className="accordion-header" onClick={() => toggleSection("contact")}>
              <h4 className="accordion-title">Contact</h4>
              {openSection === "contact" ? <ChevronUp className="accordion-arrow" /> : <ChevronDown className="accordion-arrow" />}
            </div>
            <div className={`accordion-content ${openSection === "contact" ? "open" : ""}`}>
              <a href="mailto:raktdaan.online@gmail.com" className="accordion-link">✉️ raktdaan.online@gmail.com</a>
              <a href="tel:+919923400442" className="accordion-link">📞 +91 99234 00442</a>
              <p className="accordion-text-item">📍 India</p>
            </div>
          </div>
        </div>

        {/* Social Instagram Centered */}
        <div className="mobile-footer-social-wrap">
          <a
            href="https://www.instagram.com/raktdaan.online/"
            target="_blank"
            rel="noreferrer"
            aria-label="Raktdaan Instagram"
            className="mobile-footer-social-btn"
          >
            <Instagram className="w-5 h-5 text-red-500" style={{ stroke: "url(#igGradientFooter)" }} />
          </a>
        </div>

        <div className="mobile-footer-divider" style={{ margin: "12px 0 16px 0" }}></div>

        {/* Copyright */}
        <div className="mobile-footer-copyright">
          © 2025 Raktdaan. All rights reserved.
        </div>
      </div>

      {/* Floating Back to Top Button */}
      <button className="floating-back-to-top" onClick={scrollToTop} aria-label="Back to top">
        <ArrowUp />
      </button>
    </footer>
  );
};

export default Footer;
