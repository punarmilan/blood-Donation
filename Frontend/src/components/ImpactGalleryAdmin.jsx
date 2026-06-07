import React, { useState, useEffect } from "react";
import { getGalleryImages, uploadGalleryImage, createGalleryImage, updateGalleryImage, deleteGalleryImage } from "../services/impactGalleryService";

const CATEGORIES = [
  "Camp Setup",
  "Registration",
  "Blood Collection",
  "Volunteers",
  "Medical Team",
  "Certificates",
  "Group Photos",
];

const ImpactGalleryAdmin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    category: CATEGORIES[0],
    mediaType: "image",
    mediaUrl: "",
    featured: false,
    displayOrder: 0,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getGalleryImages();
      if (data && data.success) {
        setItems(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch gallery items", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);

    setUploading(true);
    try {
      const dataRes = await uploadGalleryImage(data);
      if (dataRes && dataRes.success) {
        setFormData((prev) => ({ ...prev, mediaUrl: dataRes.fileUrl }));
        alert("File uploaded successfully!");
      }
    } catch (err) {
      console.error("Upload error", err);
      alert("Failed to upload file. " + (err.response?.data?.message || ""));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.mediaUrl) {
      return alert("Title and Media URL are required.");
    }

    try {
      if (editId) {
        await updateGalleryImage(editId, formData);
        alert("Item updated successfully");
      } else {
        await createGalleryImage(formData);
        alert("Item added successfully");
      }
      setShowForm(false);
      resetForm();
      fetchItems();
    } catch (err) {
      console.error("Save error", err);
      alert("Failed to save item.");
    }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      location: item.location || "",
      date: item.date || "",
      category: item.category || CATEGORIES[0],
      mediaType: item.mediaType || "image",
      mediaUrl: item.mediaUrl || "",
      featured: item.featured || false,
      displayOrder: item.displayOrder || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteGalleryImage(id);
      fetchItems();
    } catch (err) {
      console.error("Delete error", err);
      alert("Failed to delete item.");
    }
  };

  const handleSetFeatured = async (id) => {
    try {
      await updateGalleryImage(id, { featured: true });
      fetchItems();
    } catch (err) {
      console.error("Set featured error", err);
      alert("Failed to set featured.");
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      title: "",
      description: "",
      location: "",
      date: "",
      category: CATEGORIES[0],
      mediaType: "image",
      mediaUrl: "",
      featured: false,
      displayOrder: 0,
    });
  };

  return (
    <div className="chart-card">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="text-danger fw-bold m-0">Impact Gallery Manager</h2>
        <div className="d-flex gap-2">
          {!showForm && (
            <button
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              + Add Media
            </button>
          )}
          <button className="btn btn-outline-secondary" onClick={fetchItems}>
            Refresh
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-4 shadow-sm border-0 bg-light">
          <div className="card-body">
            <h5 className="mb-3 text-primary">{editId ? "Edit Media" : "Add New Media"}</h5>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Category *</label>
                  <select
                    className="form-select"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    name="location"
                    placeholder="e.g., Pune, Maharashtra"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Date</label>
                  <input
                    type="text"
                    className="form-control"
                    name="date"
                    placeholder="e.g., 12 May 2024"
                    value={formData.date}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label fw-bold">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    rows="2"
                    value={formData.description}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                
                <div className="col-md-4">
                  <label className="form-label fw-bold">Media Type *</label>
                  <select
                    className="form-select"
                    name="mediaType"
                    value={formData.mediaType}
                    onChange={handleInputChange}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div className="col-md-8">
                  <label className="form-label fw-bold">Upload Media File</label>
                  <div className="d-flex gap-2">
                    <input
                      type="file"
                      className="form-control"
                      accept="image/jpeg, image/png, image/webp, video/mp4"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    {uploading && <span className="text-primary mt-2">Uploading...</span>}
                  </div>
                </div>

                <div className="col-md-12">
                  <label className="form-label fw-bold">Media URL (Auto-filled on upload)</label>
                  <input
                    type="text"
                    className="form-control"
                    name="mediaUrl"
                    value={formData.mediaUrl}
                    onChange={handleInputChange}
                    readOnly
                  />
                  {formData.mediaUrl && (
                    <div className="mt-2">
                      {formData.mediaType === "image" ? (
                        <img src={formData.mediaUrl} alt="Preview" style={{ height: "100px", borderRadius: "8px", objectFit: "cover" }} />
                      ) : (
                        <video src={formData.mediaUrl} style={{ height: "100px", borderRadius: "8px" }} controls />
                      )}
                    </div>
                  )}
                </div>

                <div className="col-md-6 d-flex align-items-center mt-4">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="featuredSwitch"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label fw-bold ms-2" htmlFor="featuredSwitch">
                      Set as Featured (Large Card on Left)
                    </label>
                  </div>
                </div>
                <div className="col-md-6 mt-4 text-end">
                  <button type="button" className="btn btn-secondary me-2" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success" disabled={uploading}>
                    {editId ? "Update Item" : "Save Item"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="custom-table-container">
          {loading ? (
            <p className="text-center py-4 text-muted">Loading gallery...</p>
          ) : items.length === 0 ? (
            <p className="text-center py-4 text-muted">No media found. Add your first item.</p>
          ) : (
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Title & Category</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>
                      {item.mediaType === "image" ? (
                        <img src={item.mediaUrl} alt="Preview" style={{ width: "60px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />
                      ) : (
                        <video src={item.mediaUrl} style={{ width: "60px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />
                      )}
                    </td>
                    <td>
                      <strong>{item.title}</strong><br />
                      <span className="badge bg-light text-dark border">{item.category}</span>
                    </td>
                    <td>
                      <span className="text-capitalize text-muted small fw-bold">{item.mediaType}</span>
                    </td>
                    <td>
                      {item.featured ? (
                        <span className="badge bg-danger rounded-pill">Featured</span>
                      ) : (
                        <span className="badge bg-secondary rounded-pill">Standard</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        {!item.featured && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleSetFeatured(item._id)} title="Set as Featured">
                            ⭐
                          </button>
                        )}
                        <button className="btn btn-sm btn-light border" onClick={() => handleEdit(item)}>✏️</button>
                        <button className="btn btn-sm btn-light border text-danger" onClick={() => handleDelete(item._id)}>🗑️</button>
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
};

export default ImpactGalleryAdmin;
