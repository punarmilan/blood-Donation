  import React, { useEffect, useRef, useState } from "react";
  import { Link, useNavigate } from "react-router-dom";
  import gsap from "gsap";
  import { ScrollTrigger } from "gsap/ScrollTrigger";
  import { getStories } from "../services/successStoriesService";
  import { getPublicNews } from "../services/newsService";
  import { Swiper, SwiperSlide } from 'swiper/react';
  import { Autoplay, Pagination, Navigation } from 'swiper/modules';
  import 'swiper/css';
  import 'swiper/css/pagination';
  import 'swiper/css/navigation';
  import homeFooterBg from '../assets/home footer.png';

  gsap.registerPlugin(ScrollTrigger);

  /* ── STEPS DATA ─────────────────────────────────────────── */
  const steps = [
    {
      num: "01",
      icon: "📋",
      title: "Register Online",
      desc: "Quickly sign up online and create your donor profile.",
    },
    {
      num: "02",
      icon: "🩺",
      title: "Health Screening",
      desc: "Get a quick, free health check-up before donating.",
    },
    {
      num: "03",
      icon: "🩸",
      title: "Donate Blood",
      desc: "Visit a camp or center and donate blood safely.",
    },
    {
      num: "04",
      icon: "💖",
      title: "Save Lives",
      desc: "Your donation can give hope and save precious lives.",
    },
  ];

  /* ── FALLBACK TESTIMONIALS DATA ───────────────────────────────────── */
  const fallbackTestimonials = [
    {
      name: "Rahul S.",
      role: "Regular Donor",
      image: null,
      initials: "RS",
      review:
        "Donating blood made me feel like a real hero. It's a small act that creates a big impact.",
    },
    {
      name: "Priya M.",
      role: "Blood Camp Organizer",
      image: null,
      initials: "PM",
      review:
        "The organizer dashboard is seamless. Managing donors and camps has never been so easy and efficient.",
    },
    {
      name: "Dr. Ankit V.",
      role: "Healthcare Professional",
      photo: null,
      image: null,
      initials: "AV",
      review:
        "This platform ensures safe, tracked donations. I recommend every eligible person to donate regularly.",
    },
    {
      name: "Sneha R.",
      role: "Camp Volunteer",
      image: null,
      initials: "AK",
      review:
        "I was nervous at first, but the process was so smooth and the team was incredibly supportive.",
    },
  ];

  /* ── PARTNERS DATA ───────────────────────────────────────── */
  const partners = [
    {
      component: (
        <div className="partner-logo-content">
          <div className="partner-logo-graphic">
            <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M55 12C55 12 68 35 58 58C48 81 32 85 28 100C28 100 48 97 60 78C72 59 65 38 55 12Z" fill="#E11D48" />
              <path d="M45 30C52 42 50 60 40 70C30 80 20 80 16 92C16 92 30 90 42 77C54 64 50 42 45 30Z" fill="#FFFFFF" />
              <path d="M38 42C43 51 41 64 34 71C27 78 20 78 16 86C16 86 26 84 35 75C44 66 42 51 38 42Z" fill="#9CA3AF" />
            </svg>
          </div>
          <div className="partner-logo-text-col">
            <span className="apollo-title">Apollo</span>
            <span className="apollo-subtitle">HOSPITALS</span>
          </div>
        </div>
      )
    },
    {
      component: (
        <div className="partner-logo-content">
          <div className="partner-logo-graphic">
            <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 60C25 42 38 30 50 30C62 30 75 42 75 60C75 75 65 80 50 80C35 80 25 75 25 60Z" stroke="#129048" strokeWidth="6" strokeLinecap="round" />
              <circle cx="38" cy="42" r="6" fill="#129048" />
              <circle cx="62" cy="42" r="6" fill="#129048" />
              <circle cx="50" cy="60" r="7" fill="#129048" />
              <path d="M38 78C42 81 58 81 62 78" stroke="#E11D48" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="partner-logo-text-col">
            <span className="fortis-title">Fortis</span>
            <span className="fortis-subtitle">HEALTHCARE</span>
          </div>
        </div>
      )
    },
    {
      component: (
        <div className="partner-logo-content">
          <div className="partner-logo-graphic">
            <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="42" y="15" width="16" height="27" fill="#E11D48" rx="2" />
              <rect x="15" y="42" width="27" height="16" fill="#1E40AF" rx="2" />
              <rect x="42" y="58" width="16" height="27" fill="#0D9488" rx="2" />
              <rect x="58" y="42" width="27" height="16" fill="#D97706" rx="2" />
              <rect x="42" y="42" width="16" height="16" fill="#FFFFFF" opacity="0.3" />
            </svg>
          </div>
          <div className="partner-logo-text-col">
            <span className="ruby-title">Ruby Hall</span>
            <span className="ruby-subtitle">CLINIC</span>
          </div>
        </div>
      )
    },
    {
      component: (
        <div className="partner-logo-content" style={{ justifyContent: 'space-between' }}>
          <div className="partner-logo-text-col">
            <span className="sahyadri-title">Sahyadri</span>
            <span className="sahyadri-subtitle">Hospitals</span>
          </div>
          <div className="partner-logo-graphic">
            <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 25V75M25 50H75" stroke="#1E40AF" strokeWidth="6" strokeLinecap="round" />
              <circle cx="50" cy="18" r="6" fill="#E11D48" />
              <circle cx="50" cy="82" r="6" fill="#E11D48" />
              <circle cx="18" cy="50" r="6" fill="#E11D48" />
              <circle cx="82" cy="50" r="6" fill="#E11D48" />
            </svg>
          </div>
        </div>
      )
    },
    {
      component: (
        <div className="partner-logo-content">
          <div className="partner-logo-graphic">
            <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="40" y="15" width="20" height="70" fill="#E11D48" rx="2" />
              <rect x="15" y="40" width="70" height="20" fill="#E11D48" rx="2" />
            </svg>
          </div>
          <div className="partner-logo-text-col">
            <span className="redcross-title">INDIAN RED</span>
            <span className="redcross-subtitle">CROSS SOCIETY</span>
          </div>
        </div>
      )
    }
  ];

  /* ─────────────────────────────────────────────────────────── */

  export default function DarkInfoSection() {
    const sectionRef = useRef(null);
    const [activeSlide, setActiveSlide] = useState(0);
    const [news, setNews] = useState([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [newsError, setNewsError] = useState(null);
    
    const [successStories, setSuccessStories] = useState([]);
    const [loadingStories, setLoadingStories] = useState(true);

    const navigate = useNavigate();

    const displayStories = successStories.length > 0 ? successStories : fallbackTestimonials;
    const currentSlideData = displayStories[activeSlide % displayStories.length] || fallbackTestimonials[0];

    /* Auto-advance slides */
    useEffect(() => {
      const timer = setInterval(() => {
        setActiveSlide((p) => (p + 1) % displayStories.length);
      }, 4500);
      return () => clearInterval(timer);
    }, [displayStories.length]);

    /* Fetch success stories */
    useEffect(() => {
      const fetchStories = async () => {
        try {
          const data = await getStories(true);
          if (data && data.success && data.data.length > 0) {
            setSuccessStories(data.data);
          }
        } catch (err) {
          console.error("Failed to load success stories", err);
        } finally {
          setLoadingStories(false);
        }
      };
      fetchStories();
    }, []);

    /* Fetch latest news */
    useEffect(() => {
      const fetchNews = async () => {
        try {
          const data = await getPublicNews();
          if (data && data.success) {
            setNews(data.data);
          }
        } catch (err) {
          console.error("Failed to load news", err);
          setNewsError("Failed to load latest news.");
        } finally {
          setLoadingNews(false);
        }
      };
      fetchNews();
    }, []);

    /* GSAP ScrollTrigger animations */
    useEffect(() => {
      const ctx = gsap.context(() => {
        /* How It Works steps */
        gsap.fromTo(
          ".how-step-item",
          { opacity: 0, y: 50 },
          {
            opacity: 1, y: 0, duration: 0.8, stagger: 0.18, ease: "power3.out",
            scrollTrigger: { trigger: ".how-steps-row", start: "top 80%", toggleActions: "play none none reverse" },
          }
        );

        /* Arrow connectors */
        gsap.fromTo(
          ".step-arrow",
          { opacity: 0, scaleX: 0 },
          {
            opacity: 1, scaleX: 1, duration: 0.6, stagger: 0.3, ease: "power2.out",
            scrollTrigger: { trigger: ".how-steps-row", start: "top 80%", toggleActions: "play none none reverse" },
          }
        );

        /* Success Stories card */
        gsap.fromTo(
          ".stories-card",
          { opacity: 0, scale: 0.92, y: 40 },
          {
            opacity: 1, scale: 1, y: 0, duration: 1, ease: "power3.out",
            scrollTrigger: { trigger: ".stories-card", start: "top 82%", toggleActions: "play none none reverse" },
          }
        );

        /* Partner logos */
        gsap.fromTo(
          ".partner-logo-item",
          { opacity: 0, y: 35 },
          {
            opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power3.out",
            scrollTrigger: { trigger: ".partners-row", start: "top 85%", toggleActions: "play none none reverse" },
          }
        );
      }, sectionRef);

      return () => ctx.revert();
    }, []);

    return (
      <section className="dark-info-section" ref={sectionRef}>
        <style>{`
          .dark-info-section {
            background: #070707;
            font-family: 'Inter', -apple-system, sans-serif;
            padding: 0 0 70px 0;
            position: relative;
            overflow: hidden;
          }

          /* ── Section titles ─────────────────── */
          .dis-section-label {
            font-family: 'Cinzel', Georgia, serif;
            font-size: 1.55rem;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-align: center;
            color: #ffffff;
            text-transform: uppercase;
            margin-bottom: 2rem;
          }
          .dis-section-label span { color: #e11d48; text-shadow: 0 0 14px rgba(225,29,72,0.45); }

          /* ── Divider row ─────────────────────── */
          .dis-block {
            padding: 60px 28px 50px;
            border-bottom: 1px solid rgba(255,255,255,0.04);
          }
          .dis-inner { max-width: 1100px; margin: 0 auto; }

          /* ── HOW IT WORKS ───────────────────── */
          .how-steps-row {
            display: flex;
            align-items: flex-start;
            justify-content: center;
            gap: 0;
            flex-wrap: wrap;
          }

          .how-step-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            width: 210px;
          }

          .step-circle-wrap {
            position: relative;
            margin-bottom: 1.1rem;
          }

          .step-circle {
            width: 88px;
            height: 88px;
            border-radius: 50%;
            background: rgba(225, 29, 72, 0.07);
            border: 2px solid rgba(225, 29, 72, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            box-shadow: 0 0 20px rgba(225,29,72,0.12);
            transition: all 0.4s ease;
          }

          .how-step-item:hover .step-circle {
            border-color: rgba(225,29,72,0.7);
            box-shadow: 0 0 30px rgba(225,29,72,0.3);
            transform: scale(1.05);
          }

          .step-num-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: #e11d48;
            color: #fff;
            font-size: 0.65rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 10px rgba(225,29,72,0.6);
          }

          .step-title {
            color: #ffffff;
            font-weight: 700;
            font-size: 1rem;
            margin-bottom: 0.4rem;
          }

          .step-desc {
            color: #6b7280;
            font-size: 0.78rem;
            line-height: 1.6;
            max-width: 170px;
            margin: 0 auto;
          }

          /* Arrow between steps */
          .step-arrow {
            display: flex;
            align-items: center;
            padding-top: 38px;
            padding-bottom: 60px;
            transform-origin: left center;
          }

          .step-arrow-line {
            width: 60px;
            height: 1px;
            background: repeating-linear-gradient(
              to right,
              rgba(225,29,72,0.5) 0px,
              rgba(225,29,72,0.5) 6px,
              transparent 6px,
              transparent 12px
            );
            position: relative;
          }

          .step-arrow-head {
            color: rgba(225,29,72,0.8);
            font-size: 1rem;
            line-height: 1;
            margin-left: 2px;
          }

          @media (max-width: 700px) {
            .step-arrow { display: none; }
            .how-steps-row { gap: 28px; }
          }

          /* ── SUCCESS STORIES ─────────────────── */
          .stories-card {
            background: rgba(13,13,13,0.9);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 20px;
            padding: 40px 32px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
            min-height: 220px;
          }

          .stories-card::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at 20% 50%, rgba(225,29,72,0.06) 0%, transparent 60%);
            pointer-events: none;
          }

          .story-inner-container {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 30px;
            padding: 0 20px;
          }

          .story-image {
            flex-shrink: 0;
          }

          .story-image img,
          .story-avatar {
            width: 180px;
            height: 180px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #e11d48;
            box-shadow: 0 0 15px rgba(225,29,72,0.5);
          }

          .story-avatar {
            background: linear-gradient(135deg, #e11d48, #dc2626);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 800;
            font-size: 2.2rem;
          }

          .story-content {
            flex: 1;
            text-align: left;
            position: relative;
          }

          .story-quote-icon {
            position: absolute;
            top: -20px;
            right: 10px;
            font-size: 4rem;
            color: #e11d48;
            opacity: 0.15;
            line-height: 1;
            font-family: Georgia, serif;
          }

          .story-text {
            color: #d1d5db;
            font-size: 1.05rem;
            line-height: 1.7;
            font-style: italic;
            margin-bottom: 1.2rem;
            position: relative;
            z-index: 1;
          }

          .story-author {
            color: #e11d48;
            font-weight: 700;
            font-size: 1.1rem;
            letter-spacing: 0.04em;
            margin: 0 0 4px 0;
          }

          .story-role {
            color: #9ca3af;
            font-size: 0.85rem;
            margin: 0;
            display: block;
          }

          .story-nav-btn {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.04);
            color: #9ca3af;
            font-size: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            flex-shrink: 0;
            transition: all 0.25s ease;
          }
          .story-nav-btn:hover {
            border-color: rgba(225,29,72,0.5);
            color: #e11d48;
            background: rgba(225,29,72,0.06);
          }

          .story-dots {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 20px;
          }
          .story-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255,255,255,0.12);
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .story-dot.active {
            background: #e11d48;
            box-shadow: 0 0 8px rgba(225,29,72,0.7);
            width: 22px;
            border-radius: 4px;
          }

          /* ── OUR PARTNERS ─────────────────────── */
          .partners-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            flex-wrap: wrap;
            background: rgba(10, 10, 10, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.03);
            border-radius: 16px;
            padding: 24px 16px;
          }

          .partner-logo-item {
            background: #090909;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 18px 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1 1 180px;
            max-width: 220px;
            min-height: 82px;
            cursor: pointer;
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            overflow: hidden;
          }

          .partner-logo-item::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(225, 29, 72, 0.04) 0%, transparent 100%);
            opacity: 0;
            transition: opacity 0.35s ease;
          }

          .partner-logo-item:hover {
            transform: translateY(-5px);
            border-color: rgba(225, 29, 72, 0.25);
            box-shadow: 0 12px 30px rgba(0,0,0,0.6), 0 0 15px rgba(225,29,72,0.06);
          }

          .partner-logo-item:hover::before {
            opacity: 1;
          }

          .partner-logo-content {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            z-index: 1;
          }

          .partner-logo-graphic {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .partner-logo-text-col {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            line-height: 1.25;
          }

          /* Apollo Typography */
          .apollo-title {
            color: #ffffff;
            font-family: 'Cinzel', Georgia, serif;
            font-weight: 700;
            font-size: 1.15rem;
            letter-spacing: 0.04em;
          }
          .apollo-subtitle {
            color: #ffffff;
            font-size: 0.52rem;
            font-weight: 800;
            letter-spacing: 0.16em;
            opacity: 0.8;
            margin-top: 1px;
          }

          /* Fortis Typography */
          .fortis-title {
            color: #129048;
            font-family: 'Inter', sans-serif;
            font-weight: 800;
            font-size: 1.25rem;
            letter-spacing: -0.02em;
          }
          .fortis-subtitle {
            color: #ffffff;
            font-size: 0.52rem;
            font-weight: 700;
            letter-spacing: 0.14em;
            border-top: 1px solid #129048;
            border-bottom: 1px solid #e11d48;
            padding: 1px 0;
            margin-top: 1px;
          }

          /* Ruby Hall Typography */
          .ruby-title {
            color: #ffffff;
            font-family: 'Inter', sans-serif;
            font-weight: 700;
            font-style: italic;
            font-size: 1.05rem;
          }
          .ruby-subtitle {
            color: #9ca3af;
            font-size: 0.72rem;
            font-weight: 500;
            letter-spacing: 0.08em;
          }

          /* Sahyadri Typography */
          .sahyadri-title {
            color: #e11d48;
            font-family: 'Inter', sans-serif;
            font-weight: 800;
            font-style: italic;
            font-size: 1.05rem;
          }
          .sahyadri-subtitle {
            color: #9ca3af;
            font-size: 0.68rem;
            font-weight: 500;
            margin-top: -2px;
          }

          /* Red Cross Typography */
          .redcross-title {
            color: #ffffff;
            font-family: 'Inter', sans-serif;
            font-weight: 800;
            font-size: 0.72rem;
            letter-spacing: 0.04em;
          }
          .redcross-subtitle {
            color: #9ca3af;
            font-size: 0.62rem;
            font-weight: 700;
            letter-spacing: 0.01em;
          }

          /* ── LATEST NEWS & AWARENESS ─────────────────── */
          .news-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 30px;
            flex-wrap: wrap;
            gap: 16px;
          }

          .view-all-link {
            color: #e11d48;
            font-weight: 700;
            font-size: 0.9rem;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.3s ease;
          }

          .view-all-link:hover {
            color: #ffffff;
            transform: translateX(4px);
          }

          .news-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
          }

          .news-swiper {
            padding-bottom: 50px !important;
            padding-left: 10px;
            padding-right: 10px;
          }

          .swiper-button-next, .swiper-button-prev {
            color: #e11d48 !important;
            transform: scale(0.7);
          }

          .swiper-pagination-bullet-active {
            background: #e11d48 !important;
          }

          .news-card {
            background: rgba(10, 10, 10, 0.85);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            height: 260px;
            display: flex;
            flex-direction: column;
            max-width: 320px;
            margin: 0 auto;
          }

          .news-card:hover {
            transform: translateY(-6px);
            border-color: rgba(225, 29, 72, 0.6);
            box-shadow: 0 10px 25px rgba(225, 29, 72, 0.2);
          }

          .news-image-wrap {
            position: relative;
            width: 100%;
            height: 140px;
            background: #080808;
            overflow: hidden;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            flex-shrink: 0;
          }

          .news-vector-svg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
          }
          
          .news-card:hover .news-vector-svg {
            transform: scale(1.08);
          }

        .news-badge {
          position: absolute;
          bottom: 10px;
          left: 12px;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 9999px;
          letter-spacing: 0.08em;
          z-index: 2;
          background: linear-gradient(135deg, #e11d48, #be123c);
          color: #ffffff;
          text-transform: uppercase;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }

        .news-body {
          padding: 14px 16px;
          text-align: left;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .news-title {
          color: #ffffff;
          font-weight: 700;
          font-size: 18px;
          line-height: 1.3;
          margin-bottom: 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .news-desc {
          color: #9ca3af;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .news-date {
          color: #6b7280;
          font-size: 12px;
          font-weight: 500;
        }

        .news-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
        }

        .news-read-more {
          color: #e11d48;
          font-size: 0.8rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .news-read-more:hover {
          color: #ffffff;
          gap: 8px;
        }

        .news-loading-spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(225,29,72,0.2);
          border-top-color: #e11d48;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .skeleton-img { width: 100%; height: 140px; background: #1a1a1a; animation: pulse 1.5s infinite; }
        .skeleton-title { height: 18px; background: #1a1a1a; margin-bottom: 6px; border-radius: 4px; animation: pulse 1.5s infinite; }
        .skeleton-desc { height: 14px; background: #1a1a1a; margin-bottom: 6px; border-radius: 4px; animation: pulse 1.5s infinite; }
        .w-75 { width: 75%; }
        .w-50 { width: 50%; }
        .mt-2 { margin-top: 10px; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

        /* Media queries for cards */
        @media (max-width: 768px) {
          .news-card { max-width: 280px; }
        }
        @media (max-width: 640px) {
          .news-card { max-width: 100%; }
        }

        @media (max-width: 768px) {
          .story-inner-container {
            flex-direction: column;
            text-align: center;
            gap: 20px;
            padding: 0;
          }
          .story-content { text-align: center; }
          .stories-card { padding: 30px 20px; }
          .story-quote-icon { right: 20px; top: 0px; font-size: 3rem; }
          .story-nav-btn { display: none; /* Hide arrows on very small screens or position differently */ }
        }

        /* ── BECOME A HERO BANNER ────────────────────── */
        .hero-banner-container {
          background: url("${homeFooterBg}") center/cover no-repeat;
          border: 1.5px solid rgba(225, 29, 72, 0.12);
          border-radius: 20px;
          padding: 28px 40px;
          display: flex;
          align-items: center;
          gap: 32px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.8), inset 0 0 40px rgba(225,29,72,0.05);
        }

        .hero-banner-container::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 10% 50%, rgba(225, 29, 72, 0.08) 0%, transparent 60%);
          pointer-events: none;
        }

        .hero-banner-graphic {
          width: 140px;
          height: 140px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
        }

        .banner-glowing-svg {
          width: 100%;
          height: 100%;
        }

        .hero-banner-content {
          flex: 1;
          z-index: 2;
          text-align: left;
          margin-left:20%;
        }

        .hero-banner-title {
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          letter-spacing: 0.04em;
          margin-bottom: 6px;
          text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }

        .hero-banner-text {
          color: #d1d5db;
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 20px;
          opacity: 0.9;
        }

        .hero-banner-buttons {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .banner-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 28px;
          border-radius: 50px;
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .banner-btn.btn-primary {
          background: linear-gradient(135deg, #e11d48, #be123c);
          color: #ffffff;
          box-shadow: 0 6px 20px rgba(225, 29, 72, 0.3);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .banner-btn.btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(225, 29, 72, 0.45);
          background: linear-gradient(135deg, #f43f5e, #e11d48);
        }

        .banner-btn.btn-secondary {
          background: #ffffff;
          color: #070707;
          box-shadow: 0 6px 20px rgba(255,255,255,0.05);
          border: 1px solid transparent;
        }

        .banner-btn.btn-secondary:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(255, 255, 255, 0.15);
          background: #f3f4f6;
        }

        @media (max-width: 768px) {
          .hero-banner-container {
            flex-direction: column;
            text-align: center;
            padding: 32px 24px;
          }
          .hero-banner-graphic {
            width: 120px;
            height: 120px;
          }
          .hero-banner-buttons {
            justify-content: center;
          }
          .hero-banner-title {
            font-size: 1.6rem;
          }
        }
      `}</style>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <div className="dis-block">
        <div className="dis-inner">
          <h2 className="dis-section-label">
            HOW IT <span>WORKS</span>
          </h2>
          <div className="how-steps-row">
            {steps.map((step, idx) => (
              <React.Fragment key={step.num}>
                <div className="how-step-item">
                  <div className="step-circle-wrap">
                    <div className="step-circle">{step.icon}</div>
                    <span className="step-num-badge">{step.num}</span>
                  </div>
                  <div className="step-title">{step.title}</div>
                  <p className="step-desc">{step.desc}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="step-arrow">
                    <div className="step-arrow-line" />
                    <span className="step-arrow-head">›</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── SUCCESS STORIES ──────────────────────────────────── */}
      <div className="dis-block">
        <div className="dis-inner">
          <h2 className="dis-section-label">
            SUCCESS <span>STORIES</span>
          </h2>
          <div className="stories-card">
            <button
              className="story-nav-btn"
              onClick={() => setActiveSlide((p) => (p - 1 + displayStories.length) % displayStories.length)}
            >
              ‹
            </button>
            
            <div className="story-inner-container">
              <div className="story-image">
                {currentSlideData.image ? (
                  <img src={currentSlideData.image} alt={currentSlideData.name} />
                ) : (
                  <div className="story-avatar">{currentSlideData.initials}</div>
                )}
              </div>

              <div className="story-content">
                <span className="story-quote-icon">"</span>
                <p className="story-text">{currentSlideData.review}</p>
                <h4 className="story-author">{currentSlideData.name}</h4>
                <span className="story-role">{currentSlideData.subtitle || currentSlideData.role}</span>
              </div>
            </div>

            <button
              className="story-nav-btn"
              onClick={() => setActiveSlide((p) => (p + 1) % displayStories.length)}
            >
              ›
            </button>
          </div>
          <div className="story-dots">
            {displayStories.map((_, i) => (
              <div
                key={i}
                className={`story-dot ${i === (activeSlide % displayStories.length) ? "active" : ""}`}
                onClick={() => setActiveSlide(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── OUR PARTNERS ─────────────────────────────────────── */}
      <div className="dis-block">
        <div className="dis-inner">
          <h2 className="dis-section-label">
            OUR <span>PARTNERS</span>
          </h2>
          <div className="partners-row">
            {partners.map((p, idx) => (
              <div key={idx} className="partner-logo-item">
                {p.component}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── LATEST NEWS & AWARENESS ───────────────────────────── */}
      <div className="dis-block">
        <div className="dis-inner">
          <div className="news-header">
            <h2 className="dis-section-label" style={{ textAlign: "left", marginBottom: 0 }}>
              LATEST NEWS & <span>AWARENESS</span>
            </h2>
            <Link to="/services" className="view-all-link">
              View All Articles <span className="arrow-span">→</span>
            </Link>
          </div>
          
          {loadingNews ? (
            <div className="news-grid">
              {[1, 2, 3].map(i => (
                <div key={i} className="news-card">
                  <div className="skeleton-img"></div>
                  <div className="news-body">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-title w-75"></div>
                    <div className="skeleton-desc mt-2"></div>
                    <div className="skeleton-desc w-50"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : newsError ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#ef4444" }}>
              <p>{newsError}</p>
            </div>
          ) : news.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#6b7280" }}>
              <p>No News Articles Available</p>
            </div>
          ) : (
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              spaceBetween={24}
              slidesPerView={1}
              autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
              loop={news.length >= 3}
              pagination={{ clickable: true }}
              navigation={true}
              breakpoints={{
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="news-swiper"
            >
              {news.map(article => (
                <SwiperSlide key={article._id}>
                  <div className="news-card" onClick={() => navigate(`/news/${article.slug}`)} style={{ cursor: 'pointer' }}>
                    <div className="news-image-wrap">
                      {article.thumbnailUrl ? (
                        <img src={article.thumbnailUrl} alt={article.title} className="news-vector-svg" />
                      ) : (
                        <div className="news-vector-svg" style={{ background: "#0b0b0b", display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5563", fontSize: "3rem" }}>📰</div>
                      )}
                      <span className="news-badge">
                        {article.category || 'AWARENESS'}
                      </span>
                    </div>
                    <div className="news-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 className="news-title">{article.title}</h3>
                      <p className="news-desc">{article.shortDescription}</p>
                      <div className="news-footer">
                        <span className="news-date">
                          {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date(article.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <Link to={`/news/${article.slug}`} className="news-read-more" onClick={e => e.stopPropagation()}>
                          Read More →
                        </Link>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </div>

      {/* ── BECOME A HERO TODAY BANNER ────────────────────────── */}
      <div className="dis-block" style={{ borderBottom: "none", paddingTop: "10px" }}>
        <div className="dis-inner">
          <div className="hero-banner-container">
            {/* Left glowing blood drop inside hands */}
            <div className="hero-banner-graphic">
              <svg viewBox="0 0 240 240" className="banner-glowing-svg">
                <defs>
                  <radialGradient id="banner-drop-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(225, 29, 72, 0.55)" />
                    <stop offset="50%" stopColor="rgba(225, 29, 72, 0.15)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                  </radialGradient>
                </defs>
                <circle cx="120" cy="120" r="105" fill="url(#banner-drop-glow)" />
                <rect x="112" y="30" width="16" height="180" fill="rgba(225, 29, 72, 0.08)" rx="4" transform="rotate(45 120 120)" />
                <rect x="30" y="112" width="180" height="16" fill="rgba(225, 29, 72, 0.08)" rx="4" transform="rotate(45 120 120)" />
                <path d="M120 40C120 40 160 100 160 130C160 152 142 170 120 170C98 170 80 152 80 130C80 100 120 40 120 40Z" fill="url(#drop-gradient)" filter="drop-shadow(0 0 15px rgba(225,29,72,0.65))" />
                <rect x="114" y="115" width="12" height="30" fill="#FFFFFF" rx="2" />
                <rect x="105" y="124" width="30" height="12" fill="#FFFFFF" rx="2" />
                <path d="M50 180C80 200 110 185 120 185C130 185 160 200 190 180" stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            
            {/* Right text & buttons */}
            <div className="hero-banner-content">
              <h2 className="hero-banner-title">BECOME A HERO TODAY</h2>
              <p className="hero-banner-text">Every drop counts. Be the reason for someone's smile.</p>
              <div className="hero-banner-buttons">
                <Link to="/register" className="banner-btn btn-primary">
                  Donate Blood <span className="btn-arrow">→</span>
                </Link>
                <Link to="/blood-request" className="banner-btn btn-secondary">
                  Request Blood <span className="btn-arrow">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
