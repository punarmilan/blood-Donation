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
  
  // Filtering States
  const [filterCountry, setFilterCountry] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterGlobalOnly, setFilterGlobalOnly] = useState("all");

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
    country: "India",
    state: "Maharashtra",
    city: "",
    isGlobal: false,
    isActive: true,
    priority: 0
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
      [name]: type === "checkbox" ? checked : (name === "priority" ? Number(value) : value),
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
      country: item.country || "India",
      state: item.state || "Maharashtra",
      city: item.city || "",
      isGlobal: item.isGlobal || false,
      isActive: item.isActive !== undefined ? item.isActive : true,
      priority: item.priority || 0,
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
      country: "India",
      state: "Maharashtra",
      city: "",
      isGlobal: false,
      isActive: true,
      priority: 0,
    });
  };

  const filteredItems = items.filter((item) => {
    if (filterGlobalOnly === "global" && !item.isGlobal) return false;
    if (filterGlobalOnly === "local" && item.isGlobal) return false;
    if (filterCountry && !item.country?.toLowerCase().includes(filterCountry.toLowerCase())) return false;
    if (filterState && !item.state?.toLowerCase().includes(filterState.toLowerCase())) return false;
    if (filterCity && !item.city?.toLowerCase().includes(filterCity.toLowerCase())) return false;
    return true;
  });

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
                <div className="col-md-4">
                  <label className="form-label fw-bold">Country</label>
                  <input
                    type="text"
                    className="form-control"
                    name="country"
                    placeholder="e.g. India"
                    value={formData.country}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">State</label>
                  <input
                    type="text"
                    className="form-control"
                    name="state"
                    placeholder="e.g. Maharashtra"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">City</label>
                  <input
                    type="text"
                    className="form-control"
                    name="city"
                    placeholder="e.g. Pune"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Priority</label>
                  <input
                    type="number"
                    className="form-control"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4 d-flex align-items-center mt-4">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isGlobalSwitch"
                      name="isGlobal"
                      checked={formData.isGlobal}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label fw-bold ms-2" htmlFor="isGlobalSwitch">
                      Is Global?
                    </label>
                  </div>
                </div>
                <div className="col-md-4 d-flex align-items-center mt-4">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isActiveSwitch"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label fw-bold ms-2" htmlFor="isActiveSwitch">
                      Is Active?
                    </label>
                  </div>
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
          {/* Location Filters */}
          <div className="row g-2 mb-4 p-3 border rounded bg-light">
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold">Filter Country</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. India"
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold">Filter State</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. Maharashtra"
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold">Filter City</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. Pune"
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold">Personalization Scope</label>
              <select
                className="form-select form-select-sm"
                value={filterGlobalOnly}
                onChange={(e) => setFilterGlobalOnly(e.target.value)}
              >
                <option value="all">All Content</option>
                <option value="global">Global Only</option>
                <option value="local">Personalized Only</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-center py-4 text-muted">Loading gallery...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-center py-4 text-muted">No media matching filters found.</p>
          ) : (
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Title & Category</th>
                  <th>Target Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
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
                      {item.isGlobal ? (
                        <span className="badge bg-primary">Global</span>
                      ) : (
                        <span className="small text-muted font-monospace">
                          📍 {item.city || "(Any City)"}, {item.state || "(Any State)"}, {item.country || "(Any Country)"}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{item.priority}</span>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        {item.featured && <span className="badge bg-danger rounded-pill">Featured</span>}
                        {item.isActive ? (
                          <span className="badge bg-success rounded-pill">Active</span>
                        ) : (
                          <span className="badge bg-secondary rounded-pill">Inactive</span>
                        )}
                      </div>
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
