import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getNews } from "../services/newsService";

const BADGE_COLORS = {
  AWARENESS: "#e11d48",
  GUIDE: "#ea580c",
  MYTHS: "#f43f5e",
  UPDATE: "#7c3aed",
  EVENT: "#0891b2",
  RESEARCH: "#16a34a",
};

const FALLBACK_SVG_BY_CATEGORY = {
  AWARENESS: (
    <svg viewBox="0 0 400 200" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="g1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(225,29,72,0.5)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <linearGradient id="drop1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4b72" />
          <stop offset="100%" stopColor="#99001b" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="#0b0b0b" />
      <circle cx="200" cy="100" r="85" fill="url(#g1)" />
      <path d="M200 45C200 45 225 80 225 95C225 108.8 213.8 120 200 120C186.2 120 175 108.8 175 95C175 80 200 45 200 45Z" fill="url(#drop1)" />
      <path d="M192 65C192 65 183 80 185 92C181 88 184 75 192 65Z" fill="rgba(255,255,255,0.5)" />
    </svg>
  ),
  GUIDE: (
    <svg viewBox="0 0 400 200" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="g2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(225,29,72,0.4)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <linearGradient id="drop2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4b72" />
          <stop offset="100%" stopColor="#99001b" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="#0b0b0b" />
      <circle cx="200" cy="100" r="85" fill="url(#g2)" />
      <path d="M130 125C155 135 180 120 200 120C220 120 245 135 270 125" stroke="rgba(255,255,255,0.22)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M200 55C200 55 215 80 215 90C215 98.3 208.3 105 200 105C191.7 105 185 98.3 185 90C185 80 200 55 200 55Z" fill="url(#drop2)" />
    </svg>
  ),
  MYTHS: (
    <svg viewBox="0 0 400 200" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="g3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(225,29,72,0.4)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>
      <rect width="400" height="200" fill="#0b0b0b" />
      <circle cx="200" cy="100" r="80" fill="url(#g3)" opacity="0.6" />
      <rect x="165" y="45" width="70" height="110" rx="10" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
      <rect x="167" y="108" width="66" height="42" rx="6" fill="#be123c" opacity="0.85" />
    </svg>
  ),
};

const DEFAULT_SVG = FALLBACK_SVG_BY_CATEGORY.AWARENESS;

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getNews(true); // true means publishedOnly
        if (data && data.success) setArticles(data.data);
      } catch (e) {
        console.error("Failed to load articles", e);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const categories = ["ALL", ...new Set(articles.map(a => a.category))];
  const filtered = activeCategory === "ALL" ? articles : articles.filter(a => a.category === activeCategory);

  return (
    <div style={{ background: "#070707", minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingTop: "100px" }}>
      <style>{`
        .news-page-header {
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 28px 30px;
          text-align: center;
        }
        .news-page-label {
          font-family: 'Cinzel', Georgia, serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: #e11d48;
          text-transform: uppercase;
          margin-bottom: 12px;
          display: block;
        }
        .news-page-title {
          font-family: 'Cinzel', Georgia, serif;
          font-size: 2.4rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.06em;
          line-height: 1.2;
          margin-bottom: 16px;
        }
        .news-page-title span { color: #e11d48; }
        .news-page-subtitle {
          color: #6b7280;
          font-size: 1rem;
          max-width: 550px;
          margin: 0 auto;
          line-height: 1.7;
        }
        .news-cat-filters {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          padding: 0 28px 40px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .news-cat-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #9ca3af;
          padding: 7px 18px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          letter-spacing: 0.05em;
        }
        .news-cat-btn:hover { border-color: rgba(225,29,72,0.4); color: #e11d48; }
        .news-cat-btn.active { background: #e11d48; border-color: #e11d48; color: #fff; }
        .news-listing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 28px;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 28px 80px;
        }
        .nl-card {
          background: #0d0d0d;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .nl-card:hover {
          transform: translateY(-8px);
          border-color: rgba(225,29,72,0.3);
          box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(225,29,72,0.06);
        }
        .nl-img-wrap {
          position: relative;
          width: 100%;
          padding-top: 50%;
          background: #080808;
          overflow: hidden;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          flex-shrink: 0;
        }
        .nl-img {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .nl-card:hover .nl-img { transform: scale(1.05); }
        .nl-badge {
          position: absolute;
          bottom: 12px; left: 16px;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          letter-spacing: 0.08em;
          color: #fff;
          z-index: 2;
        }
        .nl-body {
          padding: 22px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .nl-title {
          color: #ffffff;
          font-weight: 700;
          font-size: 1.05rem;
          margin-bottom: 10px;
          line-height: 1.4;
          flex: 1;
        }
        .nl-desc {
          color: #9ca3af;
          font-size: 0.85rem;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .nl-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nl-date { color: #6b7280; font-size: 0.75rem; font-weight: 500; }
        .nl-read-more {
          color: #e11d48;
          font-size: 0.8rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .nl-read-more:hover { color: #fff; gap: 8px; }
        .news-empty {
          text-align: center;
          padding: 80px 20px;
          color: #4b5563;
        }
        .news-empty-icon { font-size: 4rem; margin-bottom: 16px; }
        .news-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 100px 20px;
        }
        .news-spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(225,29,72,0.2);
          border-top-color: #e11d48;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) {
          .news-page-title { font-size: 1.8rem; }
          .news-listing-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Page Header */}
      <div className="news-page-header">
        <span className="news-page-label">Blood Awareness Hub</span>
        <h1 className="news-page-title">LATEST NEWS &amp; <span>AWARENESS</span></h1>
        <p className="news-page-subtitle">
          Stay informed with the latest articles, guides, and research on blood donation and healthcare.
        </p>
      </div>

      {/* Category Filters */}
      {!loading && articles.length > 0 && (
        <div className="news-cat-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`news-cat-btn ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="news-loading">
          <div className="news-spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="news-empty">
          <div className="news-empty-icon">📰</div>
          <p style={{ fontSize: "1.1rem", color: "#6b7280" }}>No articles found.</p>
        </div>
      ) : (
        <div className="news-listing-grid">
          {filtered.map(article => (
            <div key={article._id} className="nl-card" onClick={() => navigate(`/news/${article.slug}`)}>
              <div className="nl-img-wrap">
                {article.thumbnailUrl ? (
                  <img className="nl-img" src={article.thumbnailUrl} alt={article.title} />
                ) : (
                  FALLBACK_SVG_BY_CATEGORY[article.category] || DEFAULT_SVG
                )}
                <span className="nl-badge" style={{ background: BADGE_COLORS[article.category] || "#e11d48" }}>
                  {article.category}
                </span>
              </div>
              <div className="nl-body">
                <h2 className="nl-title">{article.title}</h2>
                <p className="nl-desc">{article.shortDescription}</p>
                <div className="nl-footer">
                  <span className="nl-date">{formatDate(article.publishedAt || article.createdAt)}</span>
                  <Link to={`/news/${article.slug}`} className="nl-read-more" onClick={e => e.stopPropagation()}>
                    Read More →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
