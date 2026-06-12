import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

import {
  ShieldCheck,
  Zap,
  Users,
  Calendar,
  BarChart3,
  ArrowRight,
  Heart,
  Droplet,
  ChevronRight,
  ClipboardList,
  Home
} from "lucide-react";
import servicesImg from "../assets/servicesimg1.png";
import services2Img from "../assets/services2.png";

const Services = () => {
  useEffect(() => {
    // Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // GSAP ScrollReveal Animations for .animate-on-scroll elements
    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => {
      // Remove the CSS transition so GSAP can take over smoothly
      el.style.transition = 'none';
      
      gsap.fromTo(el, 
        { 
          y: 60, 
          opacity: 0 
        },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] text-white pt-28 pb-12 overflow-x-hidden relative font-sans">
      
      {/* Dynamic Smooth Landing CSS styles injected locally */}
      <style>{`
        .landing-fade-bg {
          animation: fadeBg 1.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .landing-fade-title {
          opacity: 0;
          animation: fadeUp 1.0s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          animation-delay: 0.2s;
        }
        .landing-fade-desc {
          opacity: 0;
          animation: fadeUp 1.0s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          animation-delay: 0.4s;
        }
        .landing-fade-features {
          opacity: 0;
          animation: fadeUp 1.0s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          animation-delay: 0.6s;
        }

        @keyframes fadeBg {
          from {
            opacity: 0;
            transform: scale(1.08) translate(10px, -5px);
          }
          to {
            opacity: 0.9;
            transform: scale(1) translate(0, 0);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .service-card {
          border: 1px solid transparent !important;
        }
        .service-card:hover {
          border: 1px solid rgba(220, 38, 38, 0.4) !important;
        }
        
        .hex-card {
          position: absolute;
          width: 320px;
          height: 100px;
          background: #09090b;
          clip-path: polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%);
          border: 1px solid rgba(220, 38, 38, 0.2);
          display: flex;
          align-items: center;
          padding: 0 35px;
          gap: 15px;
          z-index: 20;
          transition: all 0.3s;
          box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
        .hex-card:hover {
          background: #110d0e;
          box-shadow: 0 0 30px rgba(220,38,38,0.2);
        }
        .hex-card::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 1px;
          background: linear-gradient(90deg, rgba(220,38,38,0.4), transparent, rgba(220,38,38,0.4));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        
        .hex-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #000;
          border: 2px solid rgba(220,38,38,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px rgba(220,38,38,0.5);
          flex-shrink: 0;
        }

        @keyframes dashRoll {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-dash-roll {
          animation: dashRoll 1s linear infinite;
        }

        .support-card {
          position: absolute;
          width: 320px;
          height: 100px;
          background: #050505;
          border-radius: 40px;
          border: 1px solid rgba(220, 38, 38, 0.2);
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 15px;
          z-index: 20;
          transition: all 0.3s;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 0 0 15px rgba(220,38,38,0.1);
        }
        .support-card:hover {
          background: #0a0a0a;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 0 0 25px rgba(220,38,38,0.3);
          border-color: rgba(220, 38, 38, 0.5);
        }
        .support-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #000;
          border: 2px solid rgba(220,38,38,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px rgba(220,38,38,0.6);
          flex-shrink: 0;
        }
        .tube-glow {
          filter: drop-shadow(0 0 8px rgba(220,38,38,0.8));
        }

        /* Hide arrow in desktop */
        .services-hero-feature-arrow {
          display: none;
        }

        .offer-mobile-graphic-container {
          display: none;
        }
        .offer-mobile-card-arrow {
          display: none;
        }

        @media (max-width: 768px) {
          .min-h-screen.pt-28 {
            padding-top: 88px !important;
          }

          .services-hero-bg-div {
            position: relative !important;
            width: calc(100% + 32px) !important;
            margin-left: -16px !important;
            margin-right: -16px !important;
            margin-top: 0 !important;
            margin-bottom: 20px !important;
            max-width: none !important;
            aspect-ratio: 16/9 !important;
            height: auto !important;
            background-size: cover !important;
            background-repeat: no-repeat !important;
            background-position: 180% center !important;
            mask-image: none !important;
            -webkit-mask-image: none !important;
            top: auto !important;
            right: auto !important;
            left: auto !important;
            display: block !important;
            opacity: 1 !important;
            transform: scale(1.18) !important;
            transform-origin: center center !important;
            animation: none !important;
          }

          .services-hero-container {
            padding: 0 16px !important;
            max-width: 100% !important;
          }

          .services-hero-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 0 !important;
          }

          .services-hero-content {
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
          }

          .services-section-label-wrap {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 12px !important;
            width: 100% !important;
            margin-bottom: 12px !important;
          }

          .services-section-label-wrap::before {
            content: '' !important;
            height: 2px !important;
            width: 20px !important;
            background: #ef4444 !important;
            display: block !important;
          }

          .services-label-line {
            width: 20px !important;
            height: 2px !important;
            background: #ef4444 !important;
            display: block !important;
          }

          .services-hero-content h1 {
            text-align: center !important;
            font-size: 30px !important;
            line-height: 1.2 !important;
            margin-bottom: 16px !important;
          }

          .services-hero-content h1 br {
            display: none !important;
          }

          .services-hero-content p.landing-fade-desc {
            text-align: center !important;
            font-size: 0.92rem !important;
            color: #9ca3af !important;
            line-height: 1.5 !important;
            margin: 0 auto 28px auto !important;
            max-width: 380px !important;
          }

          .services-hero-features-list {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
            width: 100% !important;
            max-width: 380px !important;
            margin: 0 auto !important;
          }

          .services-hero-feature-item {
            display: flex !important;
            align-items: center !important;
            gap: 14px !important;
            padding: 12px 16px !important;
            background: #09090b !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 12px !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 70px !important;
            box-sizing: border-box !important;
            flex: none !important;
            transition: all 0.2s ease !important;
          }

          .services-hero-feature-item:active {
            transform: scale(0.98) !important;
            background: #110d0e !important;
          }

          .services-hero-feature-icon-wrap {
            width: 44px !important;
            height: 44px !important;
            border-radius: 50% !important;
            background: rgba(220, 38, 38, 0.05) !important;
            border: 1.5px solid rgba(220, 38, 38, 0.4) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: #ef4444 !important;
            padding: 0 !important;
            flex-shrink: 0 !important;
          }

          .services-hero-feature-icon-wrap svg {
            width: 20px !important;
            height: 20px !important;
          }

          .services-hero-feature-text-wrap {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            text-align: left !important;
          }

          .services-hero-feature-text-wrap h4 {
            font-size: 0.9rem !important;
            font-weight: 700 !important;
            color: #ffffff !important;
            margin: 0 !important;
          }

          .services-hero-feature-text-wrap p {
            font-size: 0.72rem !important;
            color: #9ca3af !important;
            margin: 2px 0 0 0 !important;
          }

          .services-hero-feature-arrow {
            display: block !important;
            margin-left: auto !important;
            color: #ef4444 !important;
            flex-shrink: 0 !important;
          }

          /* WHAT WE OFFER MOBILE DESIGN OVERRIDES */
          
          /* 1. Section background with subtle red glow/radial gradient and no horizontal overflow */
          .offer-section {
            background-color: #000000 !important;
            background-image: radial-gradient(circle at 50% 25%, rgba(220, 38, 38, 0.15) 0%, transparent 60%) !important;
            position: relative !important;
            overflow: hidden !important;
            padding: 35px 14px !important;
          }
          
          .offer-section-header {
            margin-top: 0 !important;
            margin-bottom: 20px !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          
          .offer-section-header h2 {
            font-size: 28px !important;
            margin-bottom: 8px !important;
          }
          
          .offer-section-header p {
            font-size: 13px !important;
            line-height: 1.4 !important;
          }

          /* 2. Top decorative blood icon */
          .offer-mobile-graphic-container {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            margin: 20px auto 30px auto !important;
            width: 100% !important;
            max-width: 180px !important;
            height: 180px !important;
            position: relative !important;
          }
          
          .offer-mobile-graphic-inner {
            position: relative !important;
            width: 160px !important;
            height: 160px !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
          }
          
          .offer-mobile-circle {
            position: absolute !important;
            border-radius: 50% !important;
          }
          
          .offer-mobile-circle.circle-dashed {
            width: 160px !important;
            height: 160px !important;
            border: 1.5px dashed rgba(220, 38, 38, 0.7) !important;
            animation: rotateDashed 15s linear infinite !important;
          }
          
          .offer-mobile-circle.circle-solid {
            width: 130px !important;
            height: 130px !important;
            border: 1px solid rgba(220, 38, 38, 0.3) !important;
          }
          
          .offer-mobile-circle.circle-glow {
            width: 100px !important;
            height: 100px !important;
            border: 2px solid rgba(220, 38, 38, 0.8) !important;
            box-shadow: inset 0 0 20px rgba(220, 38, 38, 0.35), 0 0 20px rgba(220, 38, 38, 0.25) !important;
            animation: pulseGlow 3s ease-in-out infinite alternate !important;
          }
          
          .offer-mobile-dots-orbit {
            position: absolute !important;
            width: 160px !important;
            height: 160px !important;
            animation: rotateOrbit 10s linear infinite !important;
          }
          
          .offer-mobile-orbit-dot {
            position: absolute !important;
            width: 6px !important;
            height: 6px !important;
            background-color: #ef4444 !important;
            border-radius: 50% !important;
            box-shadow: 0 0 8px #ef4444 !important;
          }
          
          .offer-mobile-orbit-dot.dot-1 {
            top: 0 !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
          }
          
          .offer-mobile-orbit-dot.dot-2 {
            bottom: 20px !important;
            right: 15px !important;
          }
          
          .offer-mobile-orbit-dot.dot-3 {
            bottom: 20px !important;
            left: 15px !important;
          }
          
          .offer-mobile-blood-drop {
            position: absolute !important;
            width: 70px !important;
            height: 70px !important;
            background: #000000 !important;
            border: 1.5px solid rgba(220, 38, 38, 0.85) !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 0 25px rgba(220, 38, 38, 0.5), inset 0 0 15px rgba(220, 38, 38, 0.3) !important;
            z-index: 2 !important;
            animation: floatDrop 4s ease-in-out infinite !important;
          }
          
          @keyframes rotateDashed {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes rotateOrbit {
            from { transform: rotate(0deg); }
            to { transform: rotate(-360deg); }
          }
          
          @keyframes pulseGlow {
            0% { transform: scale(0.95); opacity: 0.8; }
            100% { transform: scale(1.05); opacity: 1; }
          }
          
          @keyframes floatDrop {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }

          /* 4. Card design */
          .offer-mobile-container {
            margin-bottom: 30px !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          
          .offer-mobile-cards-list {
            display: flex !important;
            flex-direction: column !important;
            gap: 11px !important; /* 10px-12px as requested */
            width: 100% !important;
          }
          
          .offer-mobile-card {
            background-color: #000000 !important;
            border: 1px solid rgba(255, 0, 0, 0.25) !important;
            border-radius: 12px !important; /* 10px-14px as requested */
            height: 76px !important; /* approx 70px-82px as requested */
            display: flex !important;
            align-items: center !important;
            padding: 0 14px !important;
            gap: 12px !important;
            box-sizing: border-box !important;
            width: 100% !important;
            position: relative !important;
          }
          
          /* 5. Icon style */
          .offer-mobile-icon-badge {
            width: 44px !important; /* approx 42px-48px */
            height: 44px !important;
            border-radius: 50% !important;
            background-color: #000000 !important;
            border: 1.5px solid rgba(220, 38, 38, 0.7) !important;
            box-shadow: 0 0 10px rgba(220, 38, 38, 0.4) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: #ef4444 !important;
            flex-shrink: 0 !important;
          }
          
          .offer-mobile-icon-badge svg {
            width: 20px !important;
            height: 20px !important;
          }
          
          .offer-mobile-card-content {
            display: flex !important;
            flex-direction: column !important;
            flex-grow: 1 !important;
            justify-content: center !important;
            min-width: 0 !important; /* Prevents overflow of description */
          }
          
          .offer-mobile-card-header {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            margin-bottom: 2px !important;
          }
          
          /* 6. Typography */
          .offer-mobile-card-num {
            color: #ef4444 !important; /* Red/pink tone */
            font-weight: 900 !important;
            font-size: 15px !important;
            line-height: 1 !important;
          }
          
          .offer-mobile-card-title {
            color: #ffffff !important;
            font-weight: 700 !important;
            font-size: 14px !important; /* 14px-16px */
            line-height: 1.2 !important;
          }
          
          .offer-mobile-card-desc {
            color: #9ca3af !important; /* Grey text */
            font-size: 11.5px !important; /* 11px-13px */
            line-height: 1.3 !important;
            margin: 0 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
          
          .offer-mobile-card-arrow {
            color: #ef4444 !important; /* red chevron arrow */
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
          }
          
          .offer-mobile-card-arrow svg {
            width: 18px !important;
            height: 18px !important;
          }

          /* ===== HOW IT WORKS - SIMPLE STEPS MOBILE ===== */
          .how-it-works-section {
            padding: 0 14px !important;
            margin-top: 32px !important;
            margin-bottom: 48px !important;
          }

          .how-it-works-header {
            margin-bottom: 28px !important;
          }

          .how-it-works-header h2 {
            font-size: 24px !important;
            line-height: 1.25 !important;
          }

          .how-it-works-steps-wrap {
            flex-direction: column !important;
            gap: 0 !important;
            align-items: stretch !important;
          }

          /* Hide the horizontal dashed connector line on mobile */
          .how-it-works-connector {
            display: none !important;
          }

          /* Each step becomes a horizontal row card */
          .how-it-works-step {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            text-align: left !important;
            flex: none !important;
            gap: 14px !important;
            padding: 14px 0 !important;
            position: relative !important;
          }

          /* Vertical connector line between steps */
          .how-it-works-step:not(:last-child)::after {
            content: '' !important;
            position: absolute !important;
            left: 49px !important;
            bottom: -1px !important;
            width: 2px !important;
            height: 2px !important;
            background: rgba(220, 38, 38, 0.35) !important;
          }

          /* Step icon circle */
          .how-it-works-step-icon {
            width: 80px !important;
            height: 80px !important;
            flex-shrink: 0 !important;
          }

          /* Step number badge */
          .how-it-works-step-num {
            font-size: 10px !important;
            margin-bottom: 4px !important;
          }

          /* Step text block */
          .how-it-works-step-text {
            display: flex !important;
            flex-direction: column !important;
            gap: 3px !important;
          }

          .how-it-works-step-text h3 {
            font-size: 14px !important;
            font-weight: 700 !important;
            color: #f3f4f6 !important;
            margin: 0 !important;
          }

          .how-it-works-step-text p {
            font-size: 12px !important;
            color: #6b7280 !important;
            max-width: none !important;
            margin: 0 !important;
            line-height: 1.45 !important;
          }

          /* Vertical line connector between steps */
          .how-it-works-step-divider {
            display: flex !important;
            justify-content: flex-start !important;
            padding-left: 39px !important; /* center-align with icon (80px/2 - 1px) */
          }

          .how-it-works-step-divider-line {
            width: 2px !important;
            height: 20px !important;
            background: linear-gradient(to bottom, rgba(220,38,38,0.5), rgba(220,38,38,0.1)) !important;
            border-radius: 2px !important;
          }
        }
      `}</style>

      {/* Background Services Image (As Requested: Used in background) */}
      <div
        className="absolute top-0 right-0 w-full lg:w-[65%] h-[600px] lg:h-[750px] bg-no-repeat bg-contain lg:bg-cover bg-center lg:bg-right-top pointer-events-none z-0 transition-opacity duration-500 landing-fade-bg services-hero-bg-div"
        style={{
          backgroundImage: `url(${servicesImg})`,
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)'
        }}
      />

      {/* Background Decorative Red Glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute top-[40%] left-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Hero / Top Section */}
      <div className="max-w-[1400px] mx-auto px-6 relative z-10 services-hero-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 min-h-[450px] lg:min-h-[550px] items-center services-hero-row">

          {/* Left Column Text & Highlights */}
          <div className="lg:col-span-7 flex flex-col justify-center services-hero-content">
            <div className="flex items-center gap-2 mb-4 landing-fade-title services-section-label-wrap">
              <span className="text-red-500 font-extrabold tracking-[0.2em] text-xs uppercase">
                OUR SERVICES
              </span>
              <div className="h-[2px] w-12 bg-red-600 services-label-line"></div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6 landing-fade-title">
              Smart Technology for <br />
              <span className="text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.3)]">Saving Lives</span>
            </h1>

            <p className="text-gray-400 text-base md:text-lg max-w-xl leading-relaxed mb-10 landing-fade-desc">
              Our digital platform empowers donors, organizers, and hospitals with seamless tools for blood donation and camp management.
            </p>

            {/* Quick Features List */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center landing-fade-features services-hero-features-list">
              {/* Item 1 */}
              <div className="flex items-start gap-3 max-w-[240px] services-hero-feature-item">
                <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 services-hero-feature-icon-wrap">
                  <ShieldCheck size={20} />
                </div>
                <div className="services-hero-feature-text-wrap">
                  <h4 className="font-bold text-sm text-gray-200">Secure & Reliable</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Data privacy you can trust</p>
                </div>
                <ArrowRight className="services-hero-feature-arrow" size={18} />
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-3 max-w-[240px] services-hero-feature-item">
                <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 services-hero-feature-icon-wrap">
                  <Zap size={20} />
                </div>
                <div className="services-hero-feature-text-wrap">
                  <h4 className="font-bold text-sm text-gray-200">Real-time Updates</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Live tracking of donations & camps</p>
                </div>
                <ArrowRight className="services-hero-feature-arrow" size={18} />
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-3 max-w-[240px] services-hero-feature-item">
                <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 services-hero-feature-icon-wrap">
                  <Users size={20} />
                </div>
                <div className="services-hero-feature-text-wrap">
                  <h4 className="font-bold text-sm text-gray-200">Community Driven</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Stronger together to save more lives</p>
                </div>
                <ArrowRight className="services-hero-feature-arrow" size={18} />
              </div>
            </div>
          </div>

          {/* Right Column: Kept empty for background image space on desktop */}
          <div className="lg:col-span-5 hidden lg:block" />

        </div>
      </div>

      {/* WHAT WE OFFER Section wrapper */}
      <div className="offer-section">
        {/* Decorative Separator "What We Offer" */}
        <div className="max-w-[1400px] mx-auto px-6 mt-20 mb-10 relative z-10 animate-on-scroll text-center offer-section-header">
          <p className="text-red-600 font-extrabold tracking-[0.2em] text-xs uppercase mb-2">OUR SERVICES</p>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            WHAT WE <span className="text-red-600">OFFER</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Comprehensive blood donation solutions to save lives and build a healthier community.
          </p>
        </div>

        {/* Desktop Radial Layout (Hidden on Mobile) */}
        <div className="hidden lg:flex max-w-[1100px] mx-auto relative h-[650px] items-center justify-center z-10 animate-on-scroll">
          
          {/* Central Blood Drop */}
          <div className="absolute z-20 flex items-center justify-center w-[240px] h-[240px] rounded-full border border-red-500/20 shadow-[0_0_60px_rgba(220,38,38,0.15)] bg-[#050505]">
            <div className="w-[190px] h-[190px] rounded-full border-2 border-red-600/50 flex items-center justify-center shadow-[inset_0_0_50px_rgba(220,38,38,0.4)]">
              <svg className="w-24 h-24 text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.9)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
          </div>

          {/* SVG Connecting Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1100 650">
            <defs>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(220,38,38,1)" />
                <stop offset="100%" stopColor="rgba(220,38,38,0)" />
              </radialGradient>
            </defs>
            
            {/* Top Left (01) -> Center */}
            <path d="M 335 175 L 450 250" stroke="rgba(220,38,38,0.4)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-dash-roll" fill="none" />
            <circle cx="335" cy="175" r="4" fill="#dc2626" />
            <circle cx="450" cy="250" r="4" fill="#dc2626" />
            
            {/* Bottom Left (03) -> Center */}
            <path d="M 335 475 L 450 400" stroke="rgba(220,38,38,0.4)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-dash-roll" fill="none" />
            <circle cx="335" cy="475" r="4" fill="#dc2626" />
            <circle cx="450" cy="400" r="4" fill="#dc2626" />

            {/* Top Right (02) -> Center */}
            <path d="M 765 175 L 650 250" stroke="rgba(220,38,38,0.4)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-dash-roll" fill="none" />
            <circle cx="765" cy="175" r="4" fill="#dc2626" />
            <circle cx="650" cy="250" r="4" fill="#dc2626" />

            {/* Bottom Right (04) -> Center */}
            <path d="M 765 475 L 650 400" stroke="rgba(220,38,38,0.4)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-dash-roll" fill="none" />
            <circle cx="765" cy="475" r="4" fill="#dc2626" />
            <circle cx="650" cy="400" r="4" fill="#dc2626" />

            {/* Bottom Center (05) -> Center */}
            <path d="M 550 550 L 550 455" stroke="rgba(220,38,38,0.4)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-dash-roll" fill="none" />
            <circle cx="550" cy="550" r="4" fill="#dc2626" />
            <circle cx="550" cy="455" r="4" fill="#dc2626" />
          </svg>

          {/* 01 Find Blood (Top Left) */}
          <div className="hex-card" style={{ top: '125px', left: '15px' }}>
            <div className="hex-icon">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /><path d="M12 11v4M10 13h4" stroke="black" strokeWidth="2" strokeLinecap="round" /></svg>
            </div>
            <div className="text-left flex-1 border-l border-zinc-800 pl-4 py-1">
              <div className="flex gap-2 items-center mb-1">
                <span className="text-red-500 font-black text-lg">01</span>
                <span className="text-white font-bold text-sm">Find Blood</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">Search available blood units by type and location instantly.</p>
            </div>
          </div>

          {/* 02 Request Blood (Top Right) */}
          <div className="hex-card" style={{ top: '125px', right: '15px', flexDirection: 'row-reverse' }}>
            <div className="hex-icon">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="text-right flex-1 border-r border-zinc-800 pr-4 py-1">
              <div className="flex justify-end gap-2 items-center mb-1">
                <span className="text-white font-bold text-sm">Request Blood</span>
                <span className="text-red-500 font-black text-lg">02</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">Raise a blood request in seconds and get help.</p>
            </div>
          </div>

          {/* 03 Camp Management (Bottom Left) */}
          <div className="hex-card" style={{ top: '425px', left: '15px' }}>
            <div className="hex-icon">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <div className="text-left flex-1 border-l border-zinc-800 pl-4 py-1">
              <div className="flex gap-2 items-center mb-1">
                <span className="text-red-500 font-black text-lg">03</span>
                <span className="text-white font-bold text-sm">Camp Management</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">Organize and manage blood donation camps with ease.</p>
            </div>
          </div>

          {/* 04 Donor Management (Bottom Right) */}
          <div className="hex-card" style={{ top: '425px', right: '15px', flexDirection: 'row-reverse' }}>
            <div className="hex-icon">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="text-right flex-1 border-r border-zinc-800 pr-4 py-1">
              <div className="flex justify-end gap-2 items-center mb-1">
                <span className="text-white font-bold text-sm">Donor Management</span>
                <span className="text-red-500 font-black text-lg">04</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">Maintain donor records and build a strong network.</p>
            </div>
          </div>

          {/* 05 Reports & Analytics (Bottom Center) */}
          <div className="hex-card" style={{ top: '550px', left: '50%', transform: 'translateX(-50%)' }}>
            <div className="hex-icon">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div className="text-left flex-1 border-l border-zinc-800 pl-4 py-1">
              <div className="flex gap-2 items-center mb-1">
                <span className="text-red-500 font-black text-lg">05</span>
                <span className="text-white font-bold text-sm">Reports & Analytics</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">Get real-time insights and reports to track impact.</p>
            </div>
          </div>

        </div>

        {/* Mobile Stacked Layout (Hidden on Desktop) */}
        <div className="lg:hidden max-w-[1400px] mx-auto px-6 relative z-10 mb-20 offer-mobile-container">
          
          {/* Top decorative blood drop visual (visible only under 768px) */}
          <div className="offer-mobile-graphic-container">
            <div className="offer-mobile-graphic-inner">
              <div className="offer-mobile-circle circle-dashed"></div>
              <div className="offer-mobile-circle circle-solid"></div>
              <div className="offer-mobile-circle circle-glow"></div>
              <div className="offer-mobile-dots-orbit">
                <div className="offer-mobile-orbit-dot dot-1"></div>
                <div className="offer-mobile-orbit-dot dot-2"></div>
                <div className="offer-mobile-orbit-dot dot-3"></div>
              </div>
              <div className="offer-mobile-blood-drop">
                <svg className="w-9 h-9 text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.9)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-on-scroll offer-mobile-cards-list">
            {/* Card 1 */}
            <div className="bg-[#0b0c10] border border-red-900/30 rounded-[20px] p-6 flex items-center gap-4 offer-mobile-card">
              <div className="w-14 h-14 bg-red-950/40 rounded-full flex items-center justify-center text-red-500 border border-red-600/30 shrink-0 offer-mobile-icon-badge">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
              </div>
              <div className="offer-mobile-card-content">
                <div className="offer-mobile-card-header">
                  <span className="text-red-500 font-black text-sm mb-0.5 offer-mobile-card-num">01</span>
                  <h3 className="text-base font-bold text-gray-100 mb-1 offer-mobile-card-title">Find Blood</h3>
                </div>
                <p className="text-gray-400 text-xs offer-mobile-card-desc">Search available blood units by type and location instantly.</p>
              </div>
              <div className="offer-mobile-card-arrow">
                <ChevronRight />
              </div>
            </div>
            
            {/* Card 2 */}
            <div className="bg-[#0b0c10] border border-red-900/30 rounded-[20px] p-6 flex items-center gap-4 offer-mobile-card">
              <div className="w-14 h-14 bg-red-950/40 rounded-full flex items-center justify-center text-red-500 border border-red-600/30 shrink-0 offer-mobile-icon-badge">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div className="offer-mobile-card-content">
                <div className="offer-mobile-card-header">
                  <span className="text-red-500 font-black text-sm mb-0.5 offer-mobile-card-num">02</span>
                  <h3 className="text-base font-bold text-gray-100 mb-1 offer-mobile-card-title">Request Blood</h3>
                </div>
                <p className="text-gray-400 text-xs offer-mobile-card-desc">Raise a blood request in seconds and get help fast.</p>
              </div>
              <div className="offer-mobile-card-arrow">
                <ChevronRight />
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#0b0c10] border border-red-900/30 rounded-[20px] p-6 flex items-center gap-4 offer-mobile-card">
              <div className="w-14 h-14 bg-red-950/40 rounded-full flex items-center justify-center text-red-500 border border-red-600/30 shrink-0 offer-mobile-icon-badge">
                <Home className="w-6 h-6" />
              </div>
              <div className="offer-mobile-card-content">
                <div className="offer-mobile-card-header">
                  <span className="text-red-500 font-black text-sm mb-0.5 offer-mobile-card-num">03</span>
                  <h3 className="text-base font-bold text-gray-100 mb-1 offer-mobile-card-title">Camp Management</h3>
                </div>
                <p className="text-gray-400 text-xs offer-mobile-card-desc">Organize and manage blood donation camps with ease.</p>
              </div>
              <div className="offer-mobile-card-arrow">
                <ChevronRight />
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-[#0b0c10] border border-red-900/30 rounded-[20px] p-6 flex items-center gap-4 offer-mobile-card">
              <div className="w-14 h-14 bg-red-950/40 rounded-full flex items-center justify-center text-red-500 border border-red-600/30 shrink-0 offer-mobile-icon-badge">
                <Users className="w-6 h-6" />
              </div>
              <div className="offer-mobile-card-content">
                <div className="offer-mobile-card-header">
                  <span className="text-red-500 font-black text-sm mb-0.5 offer-mobile-card-num">04</span>
                  <h3 className="text-base font-bold text-gray-100 mb-1 offer-mobile-card-title">Donor Management</h3>
                </div>
                <p className="text-gray-400 text-xs offer-mobile-card-desc">Maintain donor records and build stronger connections.</p>
              </div>
              <div className="offer-mobile-card-arrow">
                <ChevronRight />
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-[#0b0c10] border border-red-900/30 rounded-[20px] p-6 flex items-center gap-4 md:col-span-2 lg:col-span-1 offer-mobile-card">
              <div className="w-14 h-14 bg-red-950/40 rounded-full flex items-center justify-center text-red-500 border border-red-600/30 shrink-0 offer-mobile-icon-badge">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="offer-mobile-card-content">
                <div className="offer-mobile-card-header">
                  <span className="text-red-500 font-black text-sm mb-0.5 offer-mobile-card-num">05</span>
                  <h3 className="text-base font-bold text-gray-100 mb-1 offer-mobile-card-title">Reports & Analytics</h3>
                </div>
                <p className="text-gray-400 text-xs offer-mobile-card-desc">Get real-time insights and reports to make an impact.</p>
              </div>
              <div className="offer-mobile-card-arrow">
                <ChevronRight />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Call to Action Banner (No outline/border) */}
      <div className="max-w-[1400px] mx-auto px-6 relative z-10 animate-on-scroll">
        <div className="bg-[#08080c] rounded-[24px] p-8 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-[0_15px_40px_rgba(220,38,38,0.05)]">
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/5 to-transparent pointer-events-none" />

          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 bg-red-950/60 border border-transparent rounded-full flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
              <Heart className="w-7 h-7 fill-red-500/20" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-extrabold text-white">
                Together, we can create a healthier tomorrow.
              </h3>
              <p className="text-xs md:text-sm text-gray-400 mt-1">
                Join our mission and be a part of saving lives.
              </p>
            </div>
          </div>

          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-[14px] text-sm tracking-wide transition-all shadow-[0_4px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_6px_25px_rgba(220,38,38,0.4)] relative z-10 w-full md:w-auto hover:-translate-y-0.5 active:translate-y-0"
          >
            Register as Donor <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Blood Donation Camps Section (mockup based layout with services2.png background) */}
      <div className="max-w-[1400px] mx-auto px-6 mt-16 relative z-10 animate-on-scroll">
        <div
          className="relative rounded-[32px] overflow-hidden min-h-[420px] flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
          style={{
            backgroundImage: `url(${services2Img})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
        >
          {/* Gradients to keep the text on left readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#030303] via-[#030303]/90 to-transparent z-0" />
          <div className="absolute inset-0 bg-black/30 z-0" />

          {/* Section Content */}
          <div className="relative z-10 p-8 md:p-12 flex flex-col justify-between h-full gap-8">
            
            {/* Header info */}
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
                Blood Donation <span className="text-red-500">Camps</span>
              </h2>
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                Join a blood donation camp near you and <pre></pre> be a hero in someone's life.
              </p>
            </div>

            {/* Combined Stats Container */}
            {/* <div className="inline-flex flex-wrap items-center bg-[#09090b]/85 backdrop-blur-md px-6 py-4 rounded-2xl max-w-full w-fit"> */}
              {/* Stat 1 */}
              {/* <div className="flex items-center gap-3.5 pr-8 py-1">
                <div className="p-2.5 bg-red-950/60 rounded-xl text-red-500 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl font-black text-white leading-tight">850+</div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Camps Organized</div>
                </div>
              </div> */}

              {/* Vertical divider */}
              {/* <div className="hidden md:block h-8 w-[1px] bg-zinc-800/60 mx-2" /> */}

              {/* Stat 2 */}
              {/* <div className="flex items-center gap-3.5 px-0 md:px-4 pr-8 py-1">
                <div className="p-2.5 bg-red-950/60 rounded-xl text-red-500 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl font-black text-white leading-tight">120K+</div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Lives Impacted</div>
                </div>
              </div> */}

              {/* Vertical divider */}
              <div className="hidden md:block h-8 w-[1px] bg-zinc-800/60 mx-2" />

              {/* Stat 3 */}
              {/* <div className="flex items-center gap-3.5 pl-0 md:pl-4 py-1">
                <div className="p-2.5 bg-red-950/60 rounded-xl text-red-500 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl font-black text-white leading-tight">50K+</div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Units Collected</div>
                </div>
              </div> */}
            {/* </div> */}

          </div>
        </div>
      </div>

      {/* ===== Complete Support Section ===== */}
      <div className="max-w-[1400px] mx-auto px-6 mt-24 mb-20 relative z-10 animate-on-scroll">
        {/* Section Header */}
        <div className="text-center mb-8">
          <span className="text-red-500 font-extrabold tracking-[0.2em] text-xs uppercase mb-3 block">OUR SERVICES</span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Complete Support for Successful <span className="text-red-600">Blood Camps</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            End-to-end solutions to help you organize, manage and run impactful blood donation camps.
          </p>
        </div>

        {/* Desktop Radial Layout (Hidden on Mobile) */}
        <div className="hidden lg:flex max-w-[1100px] mx-auto relative h-[700px] items-center justify-center z-10">
          
          {/* SVG Connecting Tubes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1100 700">
             <defs>
               <filter id="neonTube" x="-50%" y="-50%" width="200%" height="200%">
                 <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                 <feMerge>
                   <feMergeNode in="coloredBlur"/>
                   <feMergeNode in="SourceGraphic"/>
                 </feMerge>
               </filter>
               <linearGradient id="tubeGradLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" stopColor="rgba(220,38,38,0.3)" />
                 <stop offset="100%" stopColor="rgba(220,38,38,1)" />
               </linearGradient>
               <linearGradient id="tubeGradRight" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" stopColor="rgba(220,38,38,1)" />
                 <stop offset="100%" stopColor="rgba(220,38,38,0.3)" />
               </linearGradient>
             </defs>

             {/* Tubes from Left Cards to Center Bag */}
             <path d="M 335 150 C 450 150, 480 200, 480 280 L 480 320" stroke="url(#tubeGradLeft)" strokeWidth="4" fill="none" filter="url(#neonTube)" />
             <circle cx="335" cy="150" r="6" fill="#fff" stroke="#dc2626" strokeWidth="2" filter="url(#neonTube)" />
             <circle cx="480" cy="320" r="4" fill="#dc2626" filter="url(#neonTube)" />

             <path d="M 335 350 C 420 350, 450 380, 450 400" stroke="url(#tubeGradLeft)" strokeWidth="4" fill="none" filter="url(#neonTube)" />
             <circle cx="335" cy="350" r="6" fill="#fff" stroke="#dc2626" strokeWidth="2" filter="url(#neonTube)" />
             <circle cx="450" cy="400" r="4" fill="#dc2626" filter="url(#neonTube)" />

             <path d="M 335 550 C 450 550, 480 500, 480 480 L 480 440" stroke="url(#tubeGradLeft)" strokeWidth="4" fill="none" filter="url(#neonTube)" />
             <circle cx="335" cy="550" r="6" fill="#fff" stroke="#dc2626" strokeWidth="2" filter="url(#neonTube)" />
             <circle cx="480" cy="440" r="4" fill="#dc2626" filter="url(#neonTube)" />

             {/* Tubes from Right Cards to Center Bag */}
             <path d="M 765 150 C 650 150, 620 200, 620 280 L 620 320" stroke="url(#tubeGradRight)" strokeWidth="4" fill="none" filter="url(#neonTube)" />
             <circle cx="765" cy="150" r="6" fill="#fff" stroke="#dc2626" strokeWidth="2" filter="url(#neonTube)" />
             <circle cx="620" cy="320" r="4" fill="#dc2626" filter="url(#neonTube)" />

             <path d="M 765 350 C 680 350, 650 380, 650 400" stroke="url(#tubeGradRight)" strokeWidth="4" fill="none" filter="url(#neonTube)" />
             <circle cx="765" cy="350" r="6" fill="#fff" stroke="#dc2626" strokeWidth="2" filter="url(#neonTube)" />
             <circle cx="650" cy="400" r="4" fill="#dc2626" filter="url(#neonTube)" />

             <path d="M 765 550 C 650 550, 620 500, 620 480 L 620 440" stroke="url(#tubeGradRight)" strokeWidth="4" fill="none" filter="url(#neonTube)" />
             <circle cx="765" cy="550" r="6" fill="#fff" stroke="#dc2626" strokeWidth="2" filter="url(#neonTube)" />
             <circle cx="620" cy="440" r="4" fill="#dc2626" filter="url(#neonTube)" />
          </svg>

          {/* Central Custom Blood Bag Element */}
          <div className="absolute z-20 flex flex-col items-center justify-center w-[220px]">
             {/* Main Bag Body */}
             <div className="relative w-[180px] h-[260px] bg-gradient-to-b from-red-600/30 to-red-900/80 rounded-[35px] border-4 border-red-500/40 shadow-[0_0_60px_rgba(220,38,38,0.4)] backdrop-blur-md overflow-visible flex items-center justify-center">
                 {/* Top Tubes of the bag */}
                 <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 flex justify-between px-1">
                     <div className="w-3 h-12 bg-gradient-to-b from-transparent to-red-600 rounded-t-full border-x border-t border-red-500/50 tube-glow"></div>
                     <div className="w-3 h-16 bg-gradient-to-b from-transparent to-red-600 rounded-t-full border-x border-t border-red-500/50 tube-glow -mt-4"></div>
                     <div className="w-3 h-12 bg-gradient-to-b from-transparent to-red-600 rounded-t-full border-x border-t border-red-500/50 tube-glow"></div>
                 </div>
                 {/* Inner Label */}
                 <div className="bg-zinc-100 w-[140px] h-[170px] rounded-[15px] flex flex-col items-center justify-center shadow-inner relative z-10 p-2">
                     <h4 className="text-red-600 font-black text-xl leading-none mb-1">BLOOD</h4>
                     <p className="text-zinc-800 font-extrabold text-xs uppercase tracking-[0.2em] mb-4">DONATION</p>
                     <Droplet className="w-10 h-10 text-red-600 fill-red-600 drop-shadow-md mb-3" />
                     <p className="text-[7px] text-zinc-500 font-bold uppercase w-[90%] text-center leading-tight mb-2">TOGETHER, WE CAN SAVE MORE LIVES</p>
                     <div className="w-[80%] h-4 border-y border-zinc-400 flex flex-col justify-center gap-0.5 px-1">
                         <div className="w-full h-0.5 bg-zinc-800"></div>
                         <div className="w-full flex justify-between gap-1">
                             <div className="w-full h-0.5 bg-zinc-800"></div>
                             <div className="w-1/2 h-0.5 bg-zinc-800"></div>
                         </div>
                     </div>
                 </div>
             </div>
          </div>

          {/* Card 1: Blood Donation Camp Setup (Top Left) */}
          <div className="support-card" style={{ top: '100px', left: '15px' }}>
            <div className="support-icon">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </div>
            <div className="text-left flex-1">
              <h3 className="text-white font-bold text-sm mb-1 leading-tight">Blood Donation<br/>Camp Setup</h3>
              <p className="text-[10px] text-gray-400 leading-tight">We help you plan and organize blood donation camps successfully.</p>
            </div>
          </div>

          {/* Card 2: Hospital Partnership (Mid Left) */}
          <div className="support-card" style={{ top: '300px', left: '15px' }}>
            <div className="support-icon">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div className="text-left flex-1">
              <h3 className="text-white font-bold text-sm mb-1 leading-tight">Hospital<br/>Partnership</h3>
              <p className="text-[10px] text-gray-400 leading-tight">Partner with trusted hospitals and ensure safe blood collection.</p>
            </div>
          </div>

          {/* Card 3: Location Planning (Bot Left) */}
          <div className="support-card" style={{ top: '500px', left: '15px' }}>
            <div className="support-icon">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div className="text-left flex-1">
              <h3 className="text-white font-bold text-sm mb-1 leading-tight">Location<br/>Planning</h3>
              <p className="text-[10px] text-gray-400 leading-tight">We assist in selecting the best location and camp arrangements.</p>
            </div>
          </div>

          {/* Card 4: Medical Staff Support (Top Right) */}
          <div className="support-card" style={{ top: '100px', right: '15px', flexDirection: 'row-reverse' }}>
            <div className="support-icon">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div className="text-right flex-1">
              <h3 className="text-white font-bold text-sm mb-1 leading-tight">Medical Staff<br/>Support</h3>
              <p className="text-[10px] text-gray-400 leading-tight">Trained medical staff and professionals for smooth operations.</p>
            </div>
          </div>

          {/* Card 5: Mobile Blood Collection Van (Mid Right) */}
          <div className="support-card" style={{ top: '300px', right: '15px', flexDirection: 'row-reverse' }}>
            <div className="support-icon">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h9l2-2zM3 7h13M16 16h2a1 1 0 001-1v-4l-3-5h-1" /></svg>
            </div>
            <div className="text-right flex-1">
              <h3 className="text-white font-bold text-sm mb-1 leading-tight">Mobile Blood<br/>Collection Van</h3>
              <p className="text-[10px] text-gray-400 leading-tight">Our vans reach your location for hassle-free blood collection.</p>
            </div>
          </div>

          {/* Card 6: Camp Analytics & Reports (Bot Right) */}
          <div className="support-card" style={{ top: '500px', right: '15px', flexDirection: 'row-reverse' }}>
            <div className="support-icon">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div className="text-right flex-1">
              <h3 className="text-white font-bold text-sm mb-1 leading-tight">Camp Analytics &<br/>Reports</h3>
              <p className="text-[10px] text-gray-400 leading-tight">Detailed reports and analytics of your camp and its impact.</p>
            </div>
          </div>

          {/* Bottom Pill Button */}
          <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 z-30">
            <Link to="/organizer-enquiry" className="inline-flex items-center gap-3 px-8 py-4 bg-[#0a0a0a] hover:bg-red-950/20 border border-red-600/40 rounded-full text-white text-xs font-bold uppercase tracking-widest transition-all hover:border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.15)] group">
              <Heart className="w-4 h-4 text-red-500" />
              Together, We Can Save More Lives
              <ArrowRight className="w-4 h-4 text-red-500 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>

        {/* Mobile Stacked Layout (Hidden on Desktop) */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-5 mt-10">
          {[
            {
              icon: <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
              title: "Blood Donation Camp Setup",
              desc: "We help you plan and organize blood donation camps successfully."
            },
            {
              icon: <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
              title: "Hospital Partnership",
              desc: "Partner with trusted hospitals and ensure safe blood collection."
            },
            {
              icon: <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
              title: "Medical Staff Support",
              desc: "Trained medical staff and professionals for smooth operations."
            },
            {
              icon: <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h9l2-2zM3 7h13M16 16h2a1 1 0 001-1v-4l-3-5h-1" /></svg>,
              title: "Mobile Blood Collection Van",
              desc: "Our mobile vans reach your location for hassle-free blood collection."
            },
            {
              icon: <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
              title: "Location Planning",
              desc: "We assist in selecting the best location and camp arrangements."
            },
            {
              icon: <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
              title: "Camp Analytics & Reports",
              desc: "Detailed reports and analytics of your camp and its impact."
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-[#050505] border border-red-900/30 rounded-3xl p-6 flex flex-col gap-4"
            >
              <div className="w-14 h-14 bg-black border border-red-600/50 rounded-full flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                {item.icon}
              </div>
              <h3 className="text-base font-bold text-white leading-tight">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed flex-1">{item.desc}</p>
            </div>
          ))}
          <div className="sm:col-span-2 flex justify-center mt-4">
             <Link to="/organizer-enquiry" className="inline-flex items-center gap-3 px-8 py-4 bg-[#0a0a0a] hover:bg-red-950/20 border border-red-600/40 rounded-full text-white text-xs font-bold uppercase tracking-widest transition-all hover:border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.15)] group">
               <Heart className="w-4 h-4 text-red-500" />
               Together, We Can Save More Lives
               <ArrowRight className="w-4 h-4 text-red-500 group-hover:translate-x-1 transition-transform" />
             </Link>
          </div>
        </div>
      </div>

      {/* ===== How It Works - Simple Steps Section ===== */}
      <div className="max-w-[1400px] mx-auto px-6 mt-8 mb-24 relative z-10 animate-on-scroll how-it-works-section">
        <div className="text-center mb-16 how-it-works-header">
          <span className="text-red-500 font-extrabold tracking-[0.2em] text-xs uppercase mb-3 block">HOW IT WORKS</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white">
            Simple Steps, <span className="relative inline-block">Greater Impact<span className="absolute left-0 bottom-0 w-full h-[3px] bg-red-600/60 rounded" /></span>
          </h2>
        </div>

        <div className="relative flex flex-col md:flex-row items-start justify-between gap-8 md:gap-0 how-it-works-steps-wrap">
          <div className="hidden md:block absolute top-[52px] left-[10%] right-[10%] border-t-2 border-dashed border-red-800/40 z-0 how-it-works-connector" />

          {[
            {
              step: "01",
              icon: (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              title: "Organizer Enquiry",
              desc: "You fill out the enquiry form with camp details."
            },
            {
              step: "02",
              icon: (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              title: "Admin Verification",
              desc: "Our team verifies and confirms your request."
            },
            {
              step: "03",
              icon: (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
              title: "Camp Planning",
              desc: "We plan the camp, allocate resources and staff."
            },
            {
              step: "04",
              icon: (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              ),
              title: "Blood Collection",
              desc: "Camp is conducted and blood is collected safely."
            },
            {
              step: "05",
              icon: (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              title: "Report & Impact",
              desc: "You receive the camp report and impact stats."
            }
          ].map((s, idx, arr) => (
            <React.Fragment key={idx}>
              <div className="relative z-10 flex flex-col items-center text-center flex-1 group how-it-works-step">
                <div className="text-[10px] font-black text-red-500/70 tracking-widest mb-2 how-it-works-step-num">{s.step}</div>
                <div className="w-[100px] h-[100px] rounded-full bg-[#0d0608] border-2 border-red-900/40 flex items-center justify-center text-red-500 mb-4 group-hover:border-red-500/60 group-hover:shadow-[0_0_24px_rgba(220,38,38,0.3)] transition-all duration-300 how-it-works-step-icon">
                  {s.icon}
                </div>
                <div className="how-it-works-step-text">
                  <h3 className="text-sm font-bold text-gray-100 mb-2 group-hover:text-red-400 transition-colors">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-[140px]">{s.desc}</p>
                </div>
              </div>
              {idx < arr.length - 1 && (
                <div className="how-it-works-step-divider" style={{ display: 'none' }}>
                  <div className="how-it-works-step-divider-line" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
