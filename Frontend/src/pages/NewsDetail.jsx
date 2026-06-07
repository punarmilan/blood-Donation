import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getNewsBySlug, getNews } from "../services/newsService";

const BADGE_COLORS = {
  AWARENESS: "#e11d48",
  GUIDE: "#ea580c",
  MYTHS: "#f43f5e",
  UPDATE: "#7c3aed",
  EVENT: "#0891b2",
  RESEARCH: "#16a34a",
};

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function NewsDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await getNewsBySlug(slug);
        if (data && data.success) {
          setArticle(data.data);
          // Fetch related articles (same category, excluding current)
          const allData = await getNews(true);
          if (allData && allData.success) {
            const others = allData.data.filter(
              a => a._id !== data.data._id && a.category === data.data.category
            ).slice(0, 3);
            setRelated(others);
          }
        }
      } catch (e) {
        if (e.response?.status === 404) setNotFound(true);
        else console.error("Failed to load article", e);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  if (loading) {
    return (
      <div style={{ background: "#070707", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "100px" }}>
        <div style={{ width: "48px", height: "48px", border: "3px solid rgba(225,29,72,0.2)", borderTopColor: "#e11d48", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div style={{ background: "#070707", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: "100px", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontSize: "5rem" }}>📰</div>
        <h1 style={{ color: "#fff", marginTop: "24px", fontSize: "2rem" }}>Article Not Found</h1>
        <p style={{ color: "#6b7280", marginTop: "12px" }}>The article you're looking for doesn't exist or has been removed.</p>
        <Link to="/news" style={{ marginTop: "24px", color: "#e11d48", fontWeight: 700, textDecoration: "none" }}>← Back to News</Link>
      </div>
    );
  }

  const badgeColor = BADGE_COLORS[article.category] || "#e11d48";

  return (
    <div style={{ background: "#070707", minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingTop: "100px" }}>
      <style>{`
        .nd-container { max-width: 820px; margin: 0 auto; padding: 0 24px 80px; }
        .nd-back-link {
          display: inline-flex; align-items: center; gap: 6px;
          color: #6b7280; font-size: 0.85rem; font-weight: 600;
          text-decoration: none; margin-bottom: 32px;
          transition: color 0.2s ease;
        }
        .nd-back-link:hover { color: #e11d48; }
        .nd-category-badge {
          display: inline-block;
          font-size: 0.7rem; font-weight: 800;
          padding: 5px 14px; border-radius: 8px;
          letter-spacing: 0.1em; color: #fff;
          margin-bottom: 20px;
        }
        .nd-title {
          font-family: 'Cinzel', Georgia, serif;
          font-size: 2.2rem; font-weight: 800;
          color: #ffffff; line-height: 1.3;
          margin-bottom: 16px;
          letter-spacing: 0.02em;
        }
        .nd-meta {
          display: flex; align-items: center; gap: 20px;
          color: #6b7280; font-size: 0.82rem;
          padding-bottom: 28px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .nd-meta-item { display: flex; align-items: center; gap: 6px; }
        .nd-thumbnail {
          width: 100%; max-height: 420px;
          object-fit: cover; border-radius: 16px;
          margin-bottom: 40px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .nd-content {
          color: #d1d5db;
          font-size: 1rem;
          line-height: 1.85;
        }
        .nd-content p { margin-bottom: 1.4em; }
        .nd-content h2 { color: #fff; font-size: 1.4rem; font-weight: 700; margin: 2em 0 0.8em; }
        .nd-content h3 { color: #fff; font-size: 1.15rem; font-weight: 700; margin: 1.6em 0 0.6em; }
        .nd-content ul, .nd-content ol { padding-left: 1.5em; margin-bottom: 1.4em; }
        .nd-content li { margin-bottom: 0.5em; }
        .nd-content strong { color: #ffffff; font-weight: 700; }
        .nd-content em { color: #9ca3af; font-style: italic; }
        .nd-content a { color: #e11d48; text-decoration: underline; }
        .nd-content blockquote {
          border-left: 3px solid #e11d48;
          padding: 12px 20px;
          margin: 1.5em 0;
          background: rgba(225,29,72,0.05);
          border-radius: 0 8px 8px 0;
          color: #9ca3af;
          font-style: italic;
        }
        .nd-divider {
          border: none; border-top: 1px solid rgba(255,255,255,0.06);
          margin: 48px 0;
        }
        .nd-related-title {
          font-family: 'Cinzel', Georgia, serif;
          font-size: 1.1rem; font-weight: 800;
          color: #fff; letter-spacing: 0.08em;
          margin-bottom: 24px;
          text-transform: uppercase;
        }
        .nd-related-title span { color: #e11d48; }
        .nd-related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }
        .nd-related-card {
          background: #0d0d0d;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.35s ease;
          text-decoration: none;
        }
        .nd-related-card:hover {
          transform: translateY(-5px);
          border-color: rgba(225,29,72,0.3);
          box-shadow: 0 12px 28px rgba(0,0,0,0.5);
        }
        .nd-related-img {
          width: 100%; height: 100px; object-fit: cover;
          display: block;
        }
        .nd-related-img-placeholder {
          width: 100%; height: 100px;
          background: linear-gradient(135deg, #0d0d0d, #1a0008);
          display: flex; align-items: center; justify-content: center;
          font-size: 2rem;
        }
        .nd-related-body { padding: 14px; }
        .nd-related-badge {
          font-size: 0.6rem; font-weight: 800;
          padding: 3px 8px; border-radius: 5px;
          letter-spacing: 0.08em; color: #fff;
          display: inline-block; margin-bottom: 8px;
        }
        .nd-related-card-title {
          color: #e2e8f0; font-size: 0.82rem;
          font-weight: 600; line-height: 1.4;
        }
        @media (max-width: 600px) {
          .nd-title { font-size: 1.6rem; }
          .nd-related-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="nd-container">
        {/* Back */}
        <Link to="/news" className="nd-back-link">← Back to All Articles</Link>

        {/* Badge */}
        <div className="nd-category-badge" style={{ background: badgeColor }}>
          {article.category}
        </div>

        {/* Title */}
        <h1 className="nd-title">{article.title}</h1>

        {/* Meta */}
        <div className="nd-meta">
          <span className="nd-meta-item">
            <span>✍️</span> {article.author || "Admin"}
          </span>
          <span className="nd-meta-item">
            <span>📅</span> {formatDate(article.publishedAt || article.createdAt)}
          </span>
          <span className="nd-meta-item">
            <span>🏷️</span> {article.category}
          </span>
        </div>

        {/* Thumbnail */}
        {article.thumbnailUrl && (
          <img src={article.thumbnailUrl} alt={article.title} className="nd-thumbnail" />
        )}

        {/* Article Content */}
        <div
          className="nd-content"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Related Articles */}
        {related.length > 0 && (
          <>
            <hr className="nd-divider" />
            <h3 className="nd-related-title">Related <span>Articles</span></h3>
            <div className="nd-related-grid">
              {related.map(rel => (
                <Link to={`/news/${rel.slug}`} key={rel._id} className="nd-related-card">
                  {rel.thumbnailUrl ? (
                    <img src={rel.thumbnailUrl} alt={rel.title} className="nd-related-img" />
                  ) : (
                    <div className="nd-related-img-placeholder">📰</div>
                  )}
                  <div className="nd-related-body">
                    <span className="nd-related-badge" style={{ background: BADGE_COLORS[rel.category] || "#e11d48" }}>
                      {rel.category}
                    </span>
                    <p className="nd-related-card-title">{rel.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Back Button */}
        <div style={{ marginTop: "60px", textAlign: "center" }}>
          <Link to="/news" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(225,29,72,0.1)", border: "1px solid rgba(225,29,72,0.3)",
            color: "#e11d48", padding: "12px 28px", borderRadius: "999px",
            fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
            transition: "all 0.3s ease"
          }}>
            ← Back to All Articles
          </Link>
        </div>
      </div>
    </div>
  );
}
