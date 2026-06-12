import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, RefreshCw, Users, Star, Shield, Clock } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import api from "../services/api";
import { getLiveBloodRequests } from "../services/requestService";
import { useAuth } from "../context/AuthContext";

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

const formatTimeAgo = (dateString) => {
  if (!dateString) return "Some time ago";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
};
export default function WhyDonateSection() {
  const sectionRef = useRef(null);
  const navigate = useNavigate();
  const [upcomingCamps, setUpcomingCamps] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const { currentUser } = useAuth();
  
  const [activeCard, setActiveCard] = useState(0);
  const cardsRef = useRef(null);

  const handleCardsScroll = () => {
    if (!cardsRef.current) return;
    const scrollLeft = cardsRef.current.scrollLeft;
    // card width is 250px + 16px gap = 266px
    const cardWidth = 266;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveCard(Math.max(0, Math.min(whyDonateItems.length - 1, index)));
  };

  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftVal = useRef(0);

  const handleMouseDown = (e) => {
    isDown.current = true;
    startX.current = e.pageX - cardsRef.current.offsetLeft;
    scrollLeftVal.current = cardsRef.current.scrollLeft;
    cardsRef.current.style.cursor = 'grabbing';
    cardsRef.current.style.scrollBehavior = 'auto';
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    if (cardsRef.current) {
      cardsRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseUp = () => {
    isDown.current = false;
    if (cardsRef.current) {
      cardsRef.current.style.cursor = 'grab';
      cardsRef.current.style.scrollBehavior = '';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDown.current || !cardsRef.current) return;
    e.preventDefault();
    const x = e.pageX - cardsRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Scroll speed multiplier
    cardsRef.current.scrollLeft = scrollLeftVal.current - walk;
  };

  const fetchActiveRequests = async () => {
    try {
      let stateName = "Maharashtra";
      if (currentUser && currentUser.state) {
        stateName = currentUser.state;
      } else {
        const savedLoc = localStorage.getItem("detected_location");
        if (savedLoc) {
          try {
            const loc = JSON.parse(savedLoc);
            if (loc.state) stateName = loc.state;
          } catch (e) {
            console.error("Error parsing detected location in WhyDonateSection", e);
          }
        }
      }

      const res = await getLiveBloodRequests(stateName);
      if (res && res.success && res.data) {
        setBloodRequests(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch live blood requests", err);
    }
  };

  useEffect(() => {
    fetchActiveRequests();
    
    const handleLocationChange = () => {
      fetchActiveRequests();
    };
    window.addEventListener("locationChanged", handleLocationChange);
    return () => {
      window.removeEventListener("locationChanged", handleLocationChange);
    };
  }, [currentUser?.state]);

  useEffect(() => {
    const fetchUpcomingCamps = async () => {
      try {
        let stateName = "Maharashtra";
        if (currentUser && currentUser.state) {
          stateName = currentUser.state;
        } else {
          const savedLoc = localStorage.getItem("detected_location");
          if (savedLoc) {
            try {
              const loc = JSON.parse(savedLoc);
              if (loc.state) stateName = loc.state;
            } catch (e) {
              console.error("Error parsing location for camps:", e);
            }
          }
        }

        const res = await api.get(`/public/camps?state=${encodeURIComponent(stateName)}`);
        if (res.data && res.data.data) {
          const formattedCamps = res.data.data.map(camp => {
            const d = new Date(camp.date);
            return {
              _id: camp._id || camp.campId,
              day: d.getDate().toString().padStart(2, '0'),
              month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
              name: camp.title,
              location: `${camp.venue || camp.location || 'TBA'}, ${camp.city || 'TBA'}`,
              time: `${camp.startTime || 'TBA'} – ${camp.endTime || 'TBA'}`
            };
          });
          setUpcomingCamps(formattedCamps);
        }
      } catch (err) {
        console.error("Failed to fetch upcoming camps", err);
      }
    };
    
    fetchUpcomingCamps();
    
    const handleLocationChange = () => {
      fetchUpcomingCamps();
    };
    window.addEventListener("locationChanged", handleLocationChange);
    return () => {
      window.removeEventListener("locationChanged", handleLocationChange);
    };
  }, [currentUser?.state]);

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

        .why-donate-dots {
          display: none;
        }

        @media (max-width: 640px) {
          .list-item {
            padding: 10px !important;
            gap: 10px !important;
          }
          .group-badge, .date-badge {
            width: 38px !important;
            height: 38px !important;
            font-size: 0.8rem !important;
          }
          .date-badge-day {
            font-size: 0.9rem !important;
          }
          .date-badge-month {
            font-size: 0.5rem !important;
          }
          .item-title-top {
            font-size: 0.75rem !important;
          }
          .item-subtitle-sub {
            font-size: 0.68rem !important;
          }
          .premium-btn-register {
            padding: 4px 8px !important;
            font-size: 0.65rem !important;
          }
          .item-value {
            font-size: 0.75rem !important;
          }
        }

        @media (max-width: 768px) {
          .why-donate-section {
            padding: 45px 0 !important;
            overflow: hidden !important;
          }

          .why-donate-title {
            text-align: center !important;
            font-size: 22px !important;
            letter-spacing: 2px !important;
          }

          .why-donate-heart {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 14px !important;
            margin: 14px 0 26px !important;
            color: #ff2d5f !important;
            animation: none !important;
          }

          .why-donate-heart::before,
          .why-donate-heart::after {
            content: "" !important;
            width: 45px !important;
            height: 1px !important;
            background: rgba(255, 45, 95, 0.6) !important;
          }

          /* Slider row */
          .why-donate-cards {
            display: flex !important;
            grid-template-columns: none !important;
            gap: 16px !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            padding: 20px 60px !important;
            scroll-padding-left: 60px !important;
          }

          .why-donate-cards::-webkit-scrollbar {
            display: none !important;
          }

          /* Card layout override */
          .why-donate-card {
            flex: 0 0 250px !important;
            height: 280px !important;
            scroll-snap-align: center !important;
            border-radius: 18px !important;
            background: rgba(18, 18, 18, 0.7) !important;
            border: 1px solid rgba(255, 255, 255, 0.09) !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            padding: 28px 22px !important;
            backdrop-filter: blur(10px) !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
            transform: none !important;
          }

          /* Red/pink glow around icon */
          .why-donate-card .icon {
            width: 80px !important;
            height: 80px !important;
            border-radius: 50% !important;
            border: 1.5px solid #ff2d5f !important;
            background: radial-gradient(circle, rgba(255, 45, 95, 0.1) 0%, rgba(255, 45, 95, 0.25) 100%) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin-bottom: 22px !important;
            box-shadow: 0 0 25px rgba(255, 45, 95, 0.4) !important;
          }

          .why-donate-card .icon svg {
            color: #ff2d5f !important;
            filter: drop-shadow(0 0 5px rgba(255, 45, 95, 0.8)) !important;
          }

          .why-donate-card h3 {
            font-size: 18px !important;
            margin-bottom: 12px !important;
            color: #ffffff !important;
          }

          .why-donate-card p {
            font-size: 14px !important;
            line-height: 1.6 !important;
            color: #b8b8b8 !important;
          }

          .why-donate-dots {
            display: flex !important;
            justify-content: center !important;
            gap: 8px !important;
            margin-top: 22px !important;
          }

          .why-donate-dots span {
            width: 8px !important;
            height: 8px !important;
            background: #666 !important;
            border-radius: 50% !important;
            transition: all 0.3s ease !important;
          }

          .why-donate-dots span.active {
            background: #ff2d5f !important;
            box-shadow: 0 0 8px rgba(255, 45, 95, 0.8) !important;
          }
        }
      `}</style>

      <div className="why-donate-container">
        {/* Title */}
        <h2 className="why-donate-title">
          WHY DONATE <span>BLOOD?</span>
        </h2>
        <div className="heart-icon-divider why-donate-heart">
          ♥
        </div>

        {/* 5 Cards Row / Mobile Slider */}
        <div 
          className="cards-row why-donate-cards" 
          ref={cardsRef} 
          onScroll={handleCardsScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {whyDonateItems.map((item, idx) => (
            <div key={idx} className="premium-card why-donate-card">
              <div className="premium-icon-wrap icon">
                {item.icon}
              </div>
              <h3 className="premium-card-title">{item.title}</h3>
              <p className="premium-card-desc">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Pagination Dots (Only visible on mobile) */}
        <div className="why-donate-dots">
          {whyDonateItems.map((_, idx) => (
            <span key={idx} className={idx === activeCard ? "active" : ""} />
          ))}
        </div>

        {/* Widgets Grid */}
        <div className="widgets-grid">
          
          {/* LIVE BLOOD REQUESTS */}
          <div className="premium-widget">
            <div className="widget-header">
              <h3 className="widget-title">Live Blood Requests</h3>
              <button className="view-all-btn" onClick={() => navigate("/live-requests")}>View All</button>
            </div>
            <div className="list-container">
              {bloodRequests.length > 0 ? (
                bloodRequests.map((req, idx) => (
                  <div key={idx} className="list-item">
                    <div className="group-badge">{req.bloodGroup}</div>
                    <div className="item-details">
                      <p className="item-title-top text-red-500 font-bold">Blood Required</p>
                      <p className="item-subtitle-sub text-white font-semibold" title={req.hospitalName || req.hospital}>
                        {req.hospitalName || req.hospital}
                      </p>
                      {req.hospitalArea && (
                        <p className="text-[10px] text-zinc-400 font-medium truncate">
                          📍 {req.hospitalArea}
                        </p>
                      )}
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {req.city}, {req.state}
                      </p>
                    </div>
                    <div className="item-extra shrink-0 flex flex-col items-end">
                      <span className="item-value text-white font-bold">
                        {req.unitsNeeded || req.units} Unit{(req.unitsNeeded || req.units) > 1 ? "s" : ""}
                      </span>
                      <span className={`urgency-badge text-[9px] px-2 py-0.5 mt-1 font-bold rounded ${
                        (req.urgency || "").toLowerCase() === "urgent" || (req.urgency || "").toLowerCase() === "emergency"
                          ? "urgency-urgent"
                          : "urgency-medium"
                      }`}>
                        {req.urgency}
                      </span>
                      <span className="text-[8px] text-zinc-500 mt-1 font-semibold flex items-center gap-0.5">
                        <Clock size={8} /> {formatTimeAgo(req.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-zinc-800/40 rounded-xl">
                  <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.85rem" }}>
                    No live blood requests found in your state.
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
