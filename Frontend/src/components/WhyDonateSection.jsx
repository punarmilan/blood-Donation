import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, RefreshCw, Users, Star, Shield } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import api from "../services/api";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const whyDonateItems = [
  {
    icon: <Heart size={24} className="text-red-500" />,
    title: "Save Lives",
    desc: "One donation can save up to 3 lives.",
  },
  {
    icon: <RefreshCw size={24} className="text-red-500" />,
    title: "Boost Health",
    desc: "Regular donation improves heart health.",
  },
  {
    icon: <Users size={24} className="text-red-500" />,
    title: "Help Community",
    desc: "Strengthen your community and save lives together.",
  },
  {
    icon: <Star size={24} className="text-red-500" />,
    title: "Sense of Pride",
    desc: "Feel proud and fulfilled by helping others.",
  },
  {
    icon: <Shield size={24} className="text-red-500" />,
    title: "Free Health Checkup",
    desc: "Get free health checkup with every donation.",
  },
];


const bloodAvailability = [
  { group: "O+", type: "Positive", status: "Available", statusColor: "status-available", units: "120 Units" },
  { group: "A+", type: "Positive", status: "Available", statusColor: "status-available", units: "85 Units" },
  { group: "B+", type: "Positive", status: "Low Stock", statusColor: "status-low", units: "22 Units" },
  { group: "AB+", type: "Positive", status: "Available", statusColor: "status-available", units: "45 Units" },
  { group: "O-", type: "Negative", status: "Critical", statusColor: "status-critical", units: "8 Units" },
];

export default function WhyDonateSection() {
  const sectionRef = useRef(null);
  const navigate = useNavigate();
  const [upcomingCamps, setUpcomingCamps] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([
    { group: "O+", hospital: "Ruby Hospital, Pune", units: "2 Units", urgency: "Urgent", urgencyColor: "urgency-urgent" },
    { group: "B-", hospital: "City Care Hospital, Mumbai", units: "1 Unit", urgency: "Urgent", urgencyColor: "urgency-urgent" },
    { group: "A+", hospital: "Fortis Hospital, Bengaluru", units: "3 Units", urgency: "Medium", urgencyColor: "urgency-medium" },
  ]);

  useEffect(() => {
    const fetchActiveRequests = async () => {
      try {
        const res = await api.get("/request/active");
        if (res.data && res.data.data) {
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          
          // Filter out requests older than 24 hours and sort by newest
          const recentRequests = res.data.data
            .filter(req => new Date(req.createdAt) >= twentyFourHoursAgo)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          const formatted = recentRequests.map(req => {
            const urgencyMap = {
              "emergency": "Urgent",
              "urgent": "Urgent",
              "planned": "Medium"
            };
            const colorMap = {
              "emergency": "urgency-urgent",
              "urgent": "urgency-urgent",
              "planned": "urgency-medium"
            };
            const urgency = (req.urgency || "emergency").toLowerCase();
            return {
              group: req.bloodGroup,
              hospital: `${req.hospital}, ${req.city}`,
              units: `${req.units} Unit${req.units > 1 ? 's' : ''}`,
              urgency: urgencyMap[urgency] || "Urgent",
              urgencyColor: colorMap[urgency] || "urgency-urgent"
            };
          });
          
          // Always set the state so that old hardcoded placeholders are removed
          setBloodRequests(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch live blood requests", err);
      }
    };
    const fetchUpcomingCamps = async () => {
      try {
        const res = await api.get("/public/camps");
        if (res.data && res.data.data) {
          const formattedCamps = res.data.data.map(camp => {
            const d = new Date(camp.date);
            return {
              _id: camp._id || camp.campId,
              day: d.getDate().toString().padStart(2, '0'),
              month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
              name: camp.title,
              location: `${camp.venue}, ${camp.city}`,
              time: `${camp.startTime} – ${camp.endTime}`
            };
          });
          setUpcomingCamps(formattedCamps);
        }
      } catch (err) {
        console.error("Failed to fetch upcoming camps", err);
      }
    };
    fetchActiveRequests();
    fetchUpcomingCamps();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Title and heart divider animation
      gsap.fromTo(
        ".why-donate-title, .heart-icon-divider",
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".why-donate-title",
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // 2. The 5 cards staggered entry animation
      gsap.fromTo(
        ".premium-card",
        { opacity: 0, y: 55, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".cards-row",
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // 3. The 3 widgets sliding animations
      const widgets = gsap.utils.toArray(".premium-widget");
      if (widgets.length >= 3) {
        // Left widget slides from left
        gsap.fromTo(
          widgets[0],
          { opacity: 0, x: -70 },
          {
            opacity: 1,
            x: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".widgets-grid",
              start: "top 78%",
              toggleActions: "play none none reverse",
            },
          }
        );

        // Middle widget slides from bottom
        gsap.fromTo(
          widgets[1],
          { opacity: 0, y: 70 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".widgets-grid",
              start: "top 78%",
              toggleActions: "play none none reverse",
            },
          }
        );

        // Right widget slides from right
        gsap.fromTo(
          widgets[2],
          { opacity: 0, x: 70 },
          {
            opacity: 1,
            x: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".widgets-grid",
              start: "top 78%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert(); // clean up GSAP context on component unmount
  }, []);

  return (
    <section className="why-donate-section" ref={sectionRef}>
      <style>{`
        /* Premium Glowing Theme Styling */
        .why-donate-section {
          background-color: #050505;
          position: relative;
          padding: 80px 24px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow: hidden;
        }

        /* Red mesh background glow at the top */
        .why-donate-section::before {
          content: "";
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 350px;
          background: radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.12) 0%, transparent 70%);
          pointer-events: none;
          z-index: 1;
        }

        .why-donate-container {
          max-w: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .why-donate-title {
          font-family: 'Cinzel', 'Georgia', serif;
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-align: center;
          color: #ffffff;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
        }

        .why-donate-title span {
          color: #e11d48;
          text-shadow: 0 0 15px rgba(225, 29, 72, 0.4);
        }

        .heart-icon-divider {
          display: flex;
          justify-content: center;
          color: #e11d48;
          font-size: 1.5rem;
          margin-bottom: 3.5rem;
          animation: heartPulse 2s infinite ease-in-out;
        }

        @keyframes heartPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(225, 29, 72, 0.6)); }
          50% { transform: scale(1.2); filter: drop-shadow(0 0 8px rgba(225, 29, 72, 0.9)); }
        }

        /* 5 Premium Cards Row */
        .cards-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          margin-bottom: 4rem;
        }

        @media (max-width: 1024px) {
          .cards-row {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .cards-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .cards-row {
            grid-template-columns: 1fr;
          }
        }

        .premium-card {
          background: rgba(18, 18, 18, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 28px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
        }

        .premium-card:hover {
          transform: translateY(-8px);
          border-color: rgba(225, 29, 72, 0.3);
          box-shadow: 0 0 25px rgba(225, 29, 72, 0.15), inset 0 0 15px rgba(225, 29, 72, 0.05);
          background: rgba(22, 18, 18, 0.95);
        }

        .premium-icon-wrap {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(225, 29, 72, 0.1) 0%, rgba(225, 29, 72, 0.25) 100%);
          border: 1.5px solid rgba(225, 29, 72, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          transition: all 0.4s ease;
          box-shadow: 0 0 15px rgba(225, 29, 72, 0.3);
        }

        .premium-card:hover .premium-icon-wrap {
          transform: scale(1.1);
          box-shadow: 0 0 25px rgba(225, 29, 72, 0.6);
          background: radial-gradient(circle, rgba(225, 29, 72, 0.25) 0%, rgba(225, 29, 72, 0.45) 100%);
        }

        .premium-icon-wrap svg {
          filter: drop-shadow(0 0 5px rgba(225, 29, 72, 0.8));
          color: #ff3e55 !important;
        }

        .premium-card-title {
          color: #ffffff;
          font-weight: 700;
          font-size: 0.95rem;
          margin-bottom: 0.6rem;
          letter-spacing: 0.03em;
        }

        .premium-card-desc {
          color: #9f9f9f;
          font-size: 0.78rem;
          line-height: 1.5;
        }

        /* Widgets Section styling */
        .widgets-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        @media (max-width: 992px) {
          .widgets-grid {
            grid-template-columns: 1fr;
          }
        }

        .premium-widget {
          background: rgba(13, 13, 13, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .premium-widget:hover {
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8), 0 0 15px rgba(225, 29, 72, 0.02);
        }

        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .widget-title {
          color: #ffffff;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* Pure CSS resets for View All button to bypass Bootstrap */
        .view-all-btn {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
          color: #e11d48 !important;
          font-size: 0.75rem !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          transition: all 0.2s ease !important;
          box-shadow: none !important;
          outline: none !important;
        }

        .view-all-btn:hover {
          color: #ff4d6a !important;
          text-shadow: 0 0 8px rgba(255, 77, 106, 0.4) !important;
          text-decoration: none !important;
        }

        .list-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .list-item {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 14px;
          transition: all 0.3s ease;
        }

        .list-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
          transform: translateX(4px);
        }

        /* Glowing circular badges for Blood Groups */
        .group-badge {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(225, 29, 72, 0.08);
          border: 1px solid rgba(225, 29, 72, 0.4);
          color: #ff3e55;
          font-weight: 800;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 10px rgba(225, 29, 72, 0.2);
          text-shadow: 0 0 5px rgba(225, 29, 72, 0.5);
        }

        .item-details {
          flex: 1;
          min-width: 0;
        }

        .item-title-top {
          color: #e2e8f0;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .item-subtitle-sub {
          color: #64748b;
          font-size: 0.72rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-extra {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .item-value {
          color: #ffffff;
          font-weight: 700;
          font-size: 0.8rem;
        }

        /* Status and Urgency Badges styling */
        .urgency-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .urgency-urgent {
          background: rgba(225, 29, 72, 0.15);
          border: 1.5px solid rgba(225, 29, 72, 0.5);
          color: #ff4d6a;
          box-shadow: 0 0 8px rgba(225, 29, 72, 0.2);
        }

        .urgency-medium {
          background: rgba(234, 179, 8, 0.1);
          border: 1.5px solid rgba(234, 179, 8, 0.4);
          color: #facc15;
        }

        /* Premium Date Badges */
        .date-badge {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: rgba(225, 29, 72, 0.1);
          border: 1px solid rgba(225, 29, 72, 0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #ff3e55;
          flex-shrink: 0;
          box-shadow: 0 0 10px rgba(225, 29, 72, 0.1);
        }

        .date-badge-day {
          font-size: 1.1rem;
          font-weight: 800;
          line-height: 1;
        }

        .date-badge-month {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        /* Premium Register Button */
        .premium-btn-register {
          background: rgba(225, 29, 72, 0.08) !important;
          border: 1.5px solid rgba(225, 29, 72, 0.4) !important;
          color: #ff4d6a !important;
          font-size: 0.7rem !important;
          font-weight: 700 !important;
          padding: 6px 14px !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 0 10px rgba(225, 29, 72, 0.1) !important;
          outline: none !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }

        .premium-btn-register:hover {
          background: #e11d48 !important;
          color: #ffffff !important;
          box-shadow: 0 0 18px rgba(225, 29, 72, 0.5) !important;
          border-color: #e11d48 !important;
          transform: translateY(-1px);
        }

        /* Blood Availability Classes */
        .status-badge-text {
          font-size: 0.72rem;
          font-weight: 600;
        }

        .status-available {
          color: #4ade80;
          text-shadow: 0 0 8px rgba(74, 222, 128, 0.3);
        }

        .status-low {
          color: #facc15;
          text-shadow: 0 0 8px rgba(250, 204, 21, 0.3);
        }

        .status-critical {
          color: #f87171;
          text-shadow: 0 0 8px rgba(248, 113, 113, 0.3);
          animation: pulseRed textPulse 2s infinite ease-in-out;
        }
      `}</style>

      <div className="why-donate-container">
        {/* Title */}
        <h2 className="why-donate-title">
          WHY DONATE <span>BLOOD?</span>
        </h2>
        <div className="heart-icon-divider">
          ♥
        </div>

        {/* 5 Cards Row */}
        <div className="cards-row">
          {whyDonateItems.map((item, idx) => (
            <div key={idx} className="premium-card">
              <div className="premium-icon-wrap">
                {item.icon}
              </div>
              <h3 className="premium-card-title">{item.title}</h3>
              <p className="premium-card-desc">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Widgets Grid */}
        <div className="widgets-grid">
          
          {/* LIVE BLOOD REQUESTS */}
          <div className="premium-widget">
            <div className="widget-header">
              <h3 className="widget-title">Live Blood Requests</h3>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="list-container">
              {bloodRequests.length > 0 ? (
                bloodRequests.map((req, idx) => (
                  <div key={idx} className="list-item">
                    <div className="group-badge">{req.group}</div>
                    <div className="item-details">
                      <p className="item-title-top">Blood Required</p>
                      <p className="item-subtitle-sub" title={req.hospital}>{req.hospital}</p>
                    </div>
                    <div className="item-extra">
                      <span className="item-value">+{req.units}</span>
                      <span className={`urgency-badge ${req.urgencyColor}`}>
                        {req.urgency}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.85rem" }}>
                    No active blood requests in the last 24 hours.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* UPCOMING BLOOD DONATION CAMPS */}
          <div className="premium-widget">
            <div className="widget-header">
              <h3 className="widget-title">Upcoming Blood Donation Camps</h3>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="list-container">
              {upcomingCamps.length > 0 ? (
                upcomingCamps.map((camp, idx) => (
                  <div key={idx} className="list-item">
                    <div className="date-badge">
                      <span className="date-badge-day">{camp.day}</span>
                      <span className="date-badge-month">{camp.month}</span>
                    </div>
                    <div className="item-details">
                      <p className="item-title-top truncate" title={camp.name}>{camp.name}</p>
                      <p className="item-subtitle-sub" title={camp.location}>{camp.location}</p>
                      <p className="text-[10px] text-[#555] mt-0.5">{camp.time}</p>
                    </div>
                    <button className="premium-btn-register" onClick={() => navigate(`/camp/${camp._id}`)}>
                      Register
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.85rem" }}>
                    No upcoming camps found.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* BLOOD AVAILABILITY */}
          <div className="premium-widget">
            <div className="widget-header">
              <h3 className="widget-title">Blood Availability</h3>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="list-container">
              {bloodAvailability.map((item, idx) => (
                <div key={idx} className="list-item">
                  <div className="group-badge">{item.group}</div>
                  <div className="item-details">
                    <p className="item-title-top">{item.type}</p>
                    <p className={`status-badge-text ${item.statusColor}`}>{item.status}</p>
                  </div>
                  <span className="item-value">{item.units}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
