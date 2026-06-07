import React, { useState, useEffect } from "react";
import { getNews, uploadNewsImage, createNews, updateNews, deleteNews } from "../services/newsService";

const CATEGORIES = ["AWARENESS", "GUIDE", "MYTHS", "UPDATE", "EVENT", "RESEARCH"];

const BADGE_COLORS = {
  AWARENESS: "#e11d48",
  GUIDE: "#ea580c",
  MYTHS: "#f43f5e",
  UPDATE: "#7c3aed",
  EVENT: "#0891b2",
  RESEARCH: "#16a34a",
};

const emptyForm = {
  title: "",
  shortDescription: "",
  content: "",
  category: "AWARENESS",
  thumbnailUrl: "",
  published: false,
  author: "Admin",
};

export default function NewsAdmin() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchArticles(); }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const data = await getNews();
      if (data && data.success) setArticles(data.data);
    } catch (e) {
      console.error("Failed to load news", e);
    } finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    setUploading(true);
    try {
      const dataRes = await uploadNewsImage(data);
      if (dataRes && dataRes.success) {
        setForm(prev => ({ ...prev, thumbnailUrl: dataRes.fileUrl }));
      }
    } catch (e) {
      alert("Upload failed: " + (e.response?.data?.message || e.message));
    } finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.shortDescription || !form.content) {
      return alert("Title, Short Description, and Content are required.");
    }
    setSaving(true);
    try {
      if (editId) {
        await updateNews(editId, form);
        alert("Article updated!");
      } else {
        await createNews(form);
        alert("Article created!");
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      fetchArticles();
    } catch (e) {
      alert("Save failed: " + (e.response?.data?.message || e.message));
    } finally { setSaving(false); }
  };

  const handleEdit = (article) => {
    setEditId(article._id);
    setForm({
      title: article.title || "",
      shortDescription: article.shortDescription || "",
      content: article.content || "",
      category: article.category || "AWARENESS",
      thumbnailUrl: article.thumbnailUrl || "",
      published: article.published || false,
      author: article.author || "Admin",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this article?")) return;
    try {
      await deleteNews(id);
      fetchArticles();
    } catch (e) {
      alert("Delete failed: " + (e.response?.data?.message || e.message));
    }
  };

  const handleTogglePublish = async (article) => {
    try {
      await updateNews(article._id, { published: !article.published });
      fetchArticles();
    } catch (e) {
      alert("Failed to toggle publish.");
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div className="chart-card">
      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="text-danger fw-bold m-0">📰 News & Awareness Manager</h2>
        <div className="d-flex gap-2">
          {!showForm && (
            <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}>
              + Add Article
            </button>
          )}
          <button className="btn btn-outline-secondary" onClick={fetchArticles}>Refresh</button>
        </div>
      </div>

      {/* ── Article Form ── */}
      {showForm && (
        <div className="card mb-4 shadow-sm border-0 bg-light">
          <div className="card-body">
            <h5 className="mb-3 text-primary fw-bold">{editId ? "✏️ Edit Article" : "📝 New Article"}</h5>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Title */}
                <div className="col-md-8">
                  <label className="form-label fw-bold">Title *</label>
                  <input type="text" className="form-control" name="title" value={form.title} onChange={handleChange} required placeholder="Article headline..." />
                </div>
                {/* Category */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">Category *</label>
                  <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {/* Author */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Author</label>
                  <input type="text" className="form-control" name="author" value={form.author} onChange={handleChange} placeholder="Author name..." />
                </div>
                {/* Published toggle */}
                <div className="col-md-6 d-flex align-items-end">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="publishedSwitch" name="published" checked={form.published} onChange={handleChange} />
                    <label className="form-check-label fw-bold ms-2" htmlFor="publishedSwitch">
                      {form.published ? "✅ Published" : "⏸ Draft (Unpublished)"}
                    </label>
                  </div>
                </div>
                {/* Short Description */}
                <div className="col-12">
                  <label className="form-label fw-bold">Short Description * <small className="text-muted fw-normal">(shown on cards)</small></label>
                  <textarea className="form-control" name="shortDescription" rows="2" value={form.shortDescription} onChange={handleChange} required placeholder="Brief summary of the article..." />
                </div>
                {/* Thumbnail Upload */}
                <div className="col-12">
                  <label className="form-label fw-bold">Thumbnail Image</label>
                  <div className="d-flex gap-2 align-items-start">
                    <input type="file" className="form-control" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleThumbnailUpload} disabled={uploading} />
                    {uploading && <span className="text-primary mt-2 text-nowrap">Uploading...</span>}
                  </div>
                  {form.thumbnailUrl && (
                    <div className="mt-2 d-flex align-items-center gap-2">
                      <img src={form.thumbnailUrl} alt="Thumbnail preview" style={{ height: "80px", borderRadius: "8px", objectFit: "cover" }} />
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setForm(p => ({ ...p, thumbnailUrl: "" }))}>Remove</button>
                    </div>
                  )}
                </div>
                {/* Full Article Content */}
                <div className="col-12">
                  <label className="form-label fw-bold">Full Article Content * <small className="text-muted fw-normal">(HTML supported)</small></label>
                  <textarea
                    className="form-control"
                    name="content"
                    rows="12"
                    value={form.content}
                    onChange={handleChange}
                    required
                    placeholder="Write the full article content here. You can use basic HTML tags like <p>, <h2>, <ul>, <li>, <strong>, <em>, <br> etc."
                    style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                  />
                </div>
                {/* Actions */}
                <div className="col-12 d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}>Cancel</button>
                  <button type="submit" className="btn btn-success px-4" disabled={saving || uploading}>
                    {saving ? "Saving..." : editId ? "Update Article" : "Publish Article"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Articles Table ── */}
      {!showForm && (
        <div className="custom-table-container">
          {loading ? (
            <p className="text-center py-5 text-muted">Loading articles...</p>
          ) : articles.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: "3rem" }}>📰</div>
              <p className="text-muted mt-2">No articles yet. Add your first article!</p>
            </div>
          ) : (
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Thumbnail</th>
                  <th>Title & Category</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(article => (
                  <tr key={article._id}>
                    <td>
                      {article.thumbnailUrl ? (
                        <img src={article.thumbnailUrl} alt="thumb" style={{ width: "64px", height: "42px", objectFit: "cover", borderRadius: "6px" }} />
                      ) : (
                        <div style={{ width: "64px", height: "42px", background: "#0d0d0d", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>📰</div>
                      )}
                    </td>
                    <td>
                      <div className="fw-bold" style={{ fontSize: "0.88rem", maxWidth: "260px" }}>{article.title}</div>
                      <span className="badge rounded-pill mt-1" style={{ background: BADGE_COLORS[article.category] || "#e11d48", color: "#fff", fontSize: "0.65rem" }}>{article.category}</span>
                    </td>
                    <td>
                      {article.published
                        ? <span className="badge bg-success rounded-pill">Published</span>
                        : <span className="badge bg-secondary rounded-pill">Draft</span>}
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#64748b" }}>{formatDate(article.createdAt)}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className={`btn btn-sm ${article.published ? "btn-outline-warning" : "btn-outline-success"}`}
                          onClick={() => handleTogglePublish(article)}
                          title={article.published ? "Unpublish" : "Publish"}
                        >
                          {article.published ? "⏸" : "▶"}
                        </button>
                        <button className="btn btn-sm btn-light border" onClick={() => handleEdit(article)} title="Edit">✏️</button>
                        <button className="btn btn-sm btn-light border text-danger" onClick={() => handleDelete(article._id)} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
