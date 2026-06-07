import React, { useEffect, useRef, useState } from "react";
import { getGalleryImages } from "../services/impactGalleryService";
import { Link } from "react-router-dom";
import gsap from "gsap";
import {
  Heart, ShieldCheck, Users, Activity,
  Target, Eye, Award, Building, Landmark, Handshake
} from "lucide-react";
import aboutHeroImg from "../assets/About Page.png";
import aboutBottomImg from "../assets/about bottom.png";

const About = () => {
  const heroRef = useRef(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const data = await getGalleryImages();
        if (data && data.success) {
          setGalleryItems(data.data);
        }
      } catch (err) {
        console.error("Failed to load gallery items", err);
      }
    };
    fetchGallery();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial state: everything hidden off-screen to the left
      gsap.set([".about-subtitle", ".about-title", ".about-description"], {
        opacity: 0,
        x: -80,
      });
      gsap.set(".about-hero-bg", {
        opacity: 0,
        scale: 1.1,
      });

      // Staggered left-to-right slide-in animation
      gsap.to([".about-subtitle", ".about-title", ".about-description"], {
        opacity: 1,
        x: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.18,
        delay: 0.2,
      });

      // Smooth landing animation for the hero image
      gsap.to(".about-hero-bg", {
        opacity: 1,
        scale: 1,
        duration: 1.6,
        ease: "power2.out",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Handle scroll to hash if present in URL
  useEffect(() => {
    if (window.location.hash === '#our-impact') {
      const element = document.getElementById('our-impact');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 300); // slight delay to allow animations/layout to settle
      }
    }
  }, [window.location.hash]);

  return (
    <div className="about-page">
      <style>{`
        .about-page {
          background: #050505;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          padding: 100px 24px 60px 24px;
          overflow-hidden: hidden;
        }

        .about-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        /* ── HERO SECTION ─────────────────── */
        .about-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          min-height: 580px;
          position: relative;
          border-radius: 20px;
          overflow: hidden;
        }

        .about-hero-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('${aboutHeroImg}') no-repeat right center;
          background-size: cover;
          z-index: 0;
        }

        .about-hero-content {
          flex: 1.2;
          max-width: 600px;
          text-align: left;
          position: relative;
          z-index: 1;
          padding-left: 20px; /* Optional, just to give a bit of breathing room if border-radius is used */
        }

        .about-subtitle {
          color: #e11d48;
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 12px;
          display: inline-block;
        }

        .about-title {
          font-family: 'Inter', sans-serif;
          font-weight: 900;
          font-size: clamp(2.5rem, 5vw, 3.8rem);
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .about-title span {
          color: #e11d48;
          text-shadow: 0 0 20px rgba(225,29,72,0.3);
        }

        .about-description {
          color: #9ca3af;
          font-size: 1.1rem;
          line-height: 1.75;
          margin-bottom: 30px;
        }

        .about-hero-graphic {
          flex: 0.8;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .world-map-glow {
          position: absolute;
          width: 140%;
          height: 140%;
          opacity: 0.08;
          pointer-events: none;
          z-index: 1;
        }

        .hands-drop-svg {
          width: 100%;
          max-width: 380px;
          height: auto;
          position: relative;
          z-index: 2;
        }

        /* ── STATS ROW ────────────────────── */
        .stats-row {
          background: rgba(13, 13, 13, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 20px;
          padding: 24px 32px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-icon-wrap {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: rgba(225, 29, 72, 0.05);
          border: 1.5px solid rgba(225, 29, 72, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e11d48;
          box-shadow: 0 0 12px rgba(225,29,72,0.1);
        }

        .stat-info {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
          text-align: left;
        }

        .stat-value {
          font-weight: 800;
          font-size: 1.5rem;
          color: #ffffff;
        }

        .stat-label {
          color: #9ca3af;
          font-size: 0.8rem;
          font-weight: 500;
          margin-top: 2px;
        }

        /* ── TWO CARDS ROW ────────────────── */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 28px;
        }

        @media (max-width: 992px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }
        }

        .section-card {
          background: #0c0c0c;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 32px;
          text-align: left;
        }

        .card-header {
          font-size: 1.3rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 28px;
          border-bottom: 2px solid #e11d48;
          display: inline-block;
          padding-bottom: 6px;
        }

        /* Mission & Vision layout */
        .mv-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          position: relative;
        }

        .mv-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .mv-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .mv-icon {
          width: 42px;
          height: 42px;
          background: rgba(225, 29, 72, 0.06);
          border: 1px solid rgba(225, 29, 72, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e11d48;
          flex-shrink: 0;
        }

        .mv-text-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mv-title {
          font-weight: 700;
          color: #e11d48;
          font-size: 0.95rem;
        }

        .mv-desc {
          color: #9ca3af;
          font-size: 0.8rem;
          line-height: 1.5;
        }

        .mv-center-graphic {
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          flex-shrink: 0;
        }

        @media (max-width: 576px) {
          .mv-content {
            flex-direction: column;
          }
          .mv-center-graphic {
            display: none;
          }
        }

        /* Values layout */
        .values-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .value-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          padding-bottom: 16px;
        }

        .value-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .value-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(225, 29, 72, 0.05);
          border: 1.5px solid rgba(225, 29, 72, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e11d48;
          flex-shrink: 0;
        }

        .value-title {
          font-weight: 700;
          color: #ffffff;
          font-size: 0.95rem;
          margin-bottom: 4px;
        }

        .value-desc {
          color: #9ca3af;
          font-size: 0.8rem;
          line-height: 1.5;
        }

        /* ── JOIN US BANNER ──────────────── */
        .join-banner-container {
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0,0,0,0.8);
          position: relative;
        }

        .join-banner-img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
        }

        .join-banner-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding-left: 25%;
        }

        .join-banner-content {
          max-width: 500px;
          z-index: 2;
          margin-left: 150px;
        }

        .join-banner-title {
          font-size: 2.2rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 8px;
          text-shadow: 0 2px 10px rgba(0,0,0,0.6);
          letter-spacing: -0.5px;
        }

        .join-banner-desc {
          color: #e5e7eb;
          font-size: 0.95rem;
          font-weight: 500;
          margin-bottom: 24px;
          text-shadow: 0 2px 10px rgba(0,0,0,0.6);
        }

        .join-btn {
          background: #d11a2a;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 12px 28px;
          font-weight: 600;
          font-size: 1rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(209, 26, 42, 0.4);
        }

        .join-btn:hover {
          background: #e61c2e;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(209, 26, 42, 0.6);
        }

        @media (max-width: 1024px) {
          .join-banner-overlay {
            padding-left: 10%;
          }
        }

        @media (max-width: 768px) {
          .join-banner-overlay {
            padding: 20px;
            align-items: center;
            text-align: center;
          }
          .join-banner-title {
            font-size: 1.6rem;
          }
          .join-banner-img {
            min-height: 280px;
          }
        }

        @media (max-width: 768px) {
          .about-hero {
            flex-direction: column;
            text-align: center;
            padding-top: 40px;
          }
          .about-hero-content {
            text-align: center;
          }
        }

        /* ── OUR IMPACT SECTION ──────────────── */
        .impact-section {
          margin-top: 60px;
          margin-bottom: 40px;
        }

        .impact-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .impact-subtitle {
          color: #e11d48;
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 12px;
          display: inline-block;
        }

        .impact-title {
          font-size: clamp(2rem, 4vw, 2.8rem);
          font-weight: 900;
          color: #ffffff;
          margin-bottom: 16px;
        }

        .impact-desc {
          color: #9ca3af;
          font-size: 1rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .impact-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          grid-auto-rows: 220px;
          gap: 20px;
          margin-bottom: 40px;
        }

        @media (max-width: 1024px) {
          .impact-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .large-card {
            grid-column: span 3 !important;
            grid-row: span 2 !important;
          }
        }

        @media (max-width: 768px) {
          .impact-grid {
            grid-template-columns: 1fr;
            grid-auto-rows: 250px;
          }
          .large-card {
            grid-column: span 1 !important;
            grid-row: span 1 !important;
          }
        }

        .impact-card {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.05);
          cursor: pointer;
          transition: transform 0.3s ease, border-color 0.3s ease;
        }

        .impact-card:hover {
          transform: translateY(-4px);
          border-color: rgba(225,29,72,0.4);
        }

        .impact-card-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transition: transform 0.5s ease;
        }

        .impact-card:hover .impact-card-bg {
          transform: scale(1.05);
        }

        .impact-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%);
          display: flex;
          flex-direction: column;
          padding: 20px;
        }

        .large-card {
          grid-column: span 2;
          grid-row: span 2;
        }

        .large-card .impact-card-overlay {
          justify-content: space-between;
        }

        .play-button {
          width: 60px;
          height: 60px;
          background: #e11d48;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: center;
          margin-top: auto;
          margin-bottom: auto;
          box-shadow: 0 0 20px rgba(225,29,72,0.5);
          transition: transform 0.3s ease;
        }

        .impact-card:hover .play-button {
          transform: scale(1.1);
        }

        .duration-badge {
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
          display: inline-block;
          margin-bottom: 12px;
        }

        .large-card-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: white;
          margin-bottom: 6px;
        }

        .large-card-desc {
          font-size: 0.9rem;
          color: #d1d5db;
          margin-bottom: 12px;
        }

        .views-count {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: #9ca3af;
          font-weight: 500;
        }

        .small-overlay {
          justify-content: space-between;
        }

        .gallery-icon {
          align-self: flex-end;
          width: 32px;
          height: 32px;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .small-card-title {
          font-size: 1rem;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
        }

        .small-card-location {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .impact-filters {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 30px;
        }

        .filter-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: #d1d5db;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .filter-btn:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.2);
        }

        .filter-btn.active {
          background: #e11d48;
          border-color: #e11d48;
          color: white;
        }

        .impact-action {
          text-align: center;
        }

        .view-gallery-btn {
          background: transparent;
          border: 1px solid #e11d48;
          color: #e11d48;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-gallery-btn:hover {
          background: rgba(225,29,72,0.1);
        }
      `}</style>

      <div className="about-container">
        
        {/* ── HERO SECTION ───────────────────────────────────── */}
        <section className="about-hero" ref={heroRef}>
          <div className="about-hero-bg"></div>
          <div className="about-hero-content">
            <span className="about-subtitle">Every Drop Counts</span>
            <h1 className="about-title">
              About <span>Us</span>
            </h1>
            <p className="about-description">
              LifeDrop is a non-profit initiative dedicated to connecting blood donors with those in need. 
              We believe one donation can save multiple lives.
            </p>
          </div>
          
          <div className="about-hero-spacer" style={{ flex: 0.8 }} />
        </section>

        {/* ── STATS ROW ──────────────────────────────────────── */}
        <section className="stats-row">
          <div className="stat-item">
            <div className="stat-icon-wrap">
              <Users size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">1M+</span>
              <span className="stat-label">Lives Saved</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon-wrap">
              <Heart size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">2.5M+</span>
              <span className="stat-label">Units Donated</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon-wrap">
              <Building size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">2500+</span>
              <span className="stat-label">Blood Banks</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon-wrap">
              <Handshake size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">850+</span>
              <span className="stat-label">Camps Organized</span>
            </div>
          </div>
        </section>

        {/* ── TWO CARDS ROW ──────────────────────────────────── */}
        <section className="cards-grid">
          {/* Card 1: Our Mission & Vision */}
          <div className="section-card">
            <h2 className="card-header">Our Mission & Vision</h2>
            
            <div className="mv-content">
              <div className="mv-column">
                <div className="mv-item">
                  <div className="mv-icon">
                    <Target size={20} />
                  </div>
                  <div className="mv-text-col">
                    <span className="mv-title">Our Mission</span>
                    <p className="mv-desc">
                      To bridge the gap between donors and patients by building a reliable, accessible and transparent platform for blood donation.
                    </p>
                  </div>
                </div>

                <div className="mv-item">
                  <div className="mv-icon">
                    <Eye size={20} />
                  </div>
                  <div className="mv-text-col">
                    <span className="mv-title">Our Vision</span>
                    <p className="mv-desc">
                      A world where every person in need of blood gets it in time, every time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Central orbital decoration */}
              <div className="mv-center-graphic">
                <svg viewBox="0 0 100 100" width="80" height="80">
                  <circle cx="50" cy="50" r="45" stroke="rgba(225, 29, 72, 0.15)" strokeWidth="1" fill="none" />
                  <circle cx="50" cy="50" r="35" stroke="rgba(225, 29, 72, 0.25)" strokeWidth="1.5" strokeDasharray="4,4" fill="none" />
                  <path d="M50 30C50 30 62 48 62 58C62 65 57 70 50 70C43 70 38 65 38 58C38 48 50 30 50 30Z" fill="#e11d48" filter="drop-shadow(0 0 6px rgba(225,29,72,0.5))" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 2: Our Values */}
          <div className="section-card">
            <h2 className="card-header">Our Values</h2>
            
            <div className="values-list">
              <div className="value-item">
                <div className="value-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <span className="value-title">Trust & Transparency</span>
                  <p className="value-desc">
                    We ensure complete transparency and build trust between donors, blood banks and recipients.
                  </p>
                </div>
              </div>

              <div className="value-item">
                <div className="value-icon">
                  <Heart size={20} />
                </div>
                <div>
                  <span className="value-title">Compassion</span>
                  <p className="value-desc">
                    We serve with empathy, care and a commitment to save lives.
                  </p>
                </div>
              </div>

              <div className="value-item">
                <div className="value-icon">
                  <Users size={20} />
                </div>
                <div>
                  <span className="value-title">Community First</span>
                  <p className="value-desc">
                    We believe in the power of community and working together for a better tomorrow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── OUR IMPACT GALLERY ───────────────────────────── */}
        <section id="our-impact" className="impact-section">
          <div className="impact-header">
            <span className="impact-subtitle">OUR IMPACT</span>
            <h2 className="impact-title">Moments That Create Impact</h2>
            <p className="impact-desc">Glimpses of blood donation camps organized across different locations.</p>
          </div>

          <div className="impact-grid">
            {/* Large Video/Image Card */}
            {(() => {
              const featuredItem = galleryItems.find(item => item.featured) || galleryItems[0];
              if (!featuredItem) return null;
              
              return (
                <div className="impact-card large-card">
                  {featuredItem.mediaType === "video" ? (
                    <video 
                      src={featuredItem.mediaUrl} 
                      className="impact-card-bg" 
                      style={{ objectFit: "cover", width: "100%", height: "100%" }} 
                      autoPlay muted loop playsInline
                    />
                  ) : (
                    <div className="impact-card-bg" style={{ backgroundImage: `url('${featuredItem.mediaUrl}')` }}></div>
                  )}
                  <div className="impact-card-overlay">
                    <div className="play-button">
                      {featuredItem.mediaType === "video" ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" style={{ marginLeft: '4px' }}>
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      )}
                    </div>
                    <div className="large-card-content">
                      <div className="duration-badge">{featuredItem.date || "Recent"}</div>
                      <h3 className="large-card-title">{featuredItem.title}</h3>
                      <p className="large-card-desc">{featuredItem.description || "A glimpse of our journey in saving lives together."}</p>
                      <div className="views-count">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{color: '#e11d48'}}>
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <span>{featuredItem.location || "Various Locations"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Small Cards */}
            {(() => {
              const featuredItem = galleryItems.find(item => item.featured) || galleryItems[0];
              let smallCards = galleryItems.filter(item => item._id !== featuredItem?._id);
              
              if (activeFilter !== "All") {
                smallCards = smallCards.filter(item => item.category === activeFilter);
              }

              return smallCards.map((item, index) => (
                <div className="impact-card small-card" key={item._id || index}>
                  {item.mediaType === "video" ? (
                    <video 
                      src={item.mediaUrl} 
                      className="impact-card-bg" 
                      style={{ objectFit: "cover", width: "100%", height: "100%" }} 
                      muted loop playsInline
                    />
                  ) : (
                    <div className="impact-card-bg" style={{ backgroundImage: `url('${item.mediaUrl}')` }}></div>
                  )}
                  <div className="impact-card-overlay small-overlay">
                    <div className="gallery-icon">
                      {item.mediaType === "video" ? (
                         <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                           <path d="M8 5v14l11-7z" />
                         </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      )}
                    </div>
                    <div className="small-card-content">
                      <h4 className="small-card-title">{item.title}</h4>
                      <p className="small-card-location">{item.location || item.date}</p>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>

          <div className="impact-filters">
            {[
              { name: "All", icon: null },
              { name: "Camp Setup", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg> },
              { name: "Registration", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
              { name: "Blood Collection", icon: <Heart size={14} /> },
              { name: "Volunteers", icon: <Users size={14} /> },
              { name: "Certificates", icon: <Award size={14} /> },
              { name: "Group Photos", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg> }
            ].map(filter => (
              <button 
                key={filter.name}
                className={`filter-btn ${activeFilter === filter.name ? "active" : ""}`}
                onClick={() => setActiveFilter(filter.name)}
              >
                {filter.icon} {filter.name}
              </button>
            ))}
          </div>

          <div className="impact-action">
            <button className="view-gallery-btn">View Full Gallery &rarr;</button>
          </div>
        </section>

        {/* ── JOIN US TODAY BANNER ───────────────────────────── */}
        <section className="join-banner-container">
          <img src={aboutBottomImg} alt="Be a Part of Our Mission" className="join-banner-img" />
          <div className="join-banner-overlay">
            <div className="join-banner-content">
              <h2 className="join-banner-title">Be a Part of Our Mission</h2>
              <p className="join-banner-desc">Together, we can save more lives and create a healthier tomorrow.</p>
              <Link to="/register" className="join-btn">
                Join Us Today <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>→</span>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default About;
