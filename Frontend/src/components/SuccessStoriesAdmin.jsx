import React, { useState, useEffect } from "react";
import { getStories, uploadStoryImage, createStory, updateStory, deleteStory } from "../services/successStoriesService";

const SuccessStoriesAdmin = () => {
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
    name: "",
    initials: "",
    subtitle: "",
    review: "",
    image: "",
    isActive: true,
    displayOrder: 0,
    country: "India",
    state: "Maharashtra",
    city: "",
    isGlobal: false,
    priority: 0,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getStories();
      if (data && data.success) {
        setItems(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch success stories", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : (name === "priority" || name === "displayOrder" ? Number(value) : value),
      };

      // Auto-generate initials if name changes
      if (name === "name") {
        const parts = value.split(" ");
        const initials = parts.map(p => p.charAt(0)).join("").substring(0, 2).toUpperCase();
        newData.initials = initials;
      }

      return newData;
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);

    setUploading(true);
    try {
      const dataRes = await uploadStoryImage(data);
      if (dataRes && dataRes.success) {
        setFormData((prev) => ({ ...prev, image: dataRes.fileUrl }));
        alert("Image uploaded successfully!");
      }
    } catch (err) {
      console.error("Upload error", err);
      alert("Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.review) {
      return alert("Name and Review are required.");
    }

    try {
      if (editId) {
        await updateStory(editId, formData);
        alert("Story updated successfully");
      } else {
        await createStory(formData);
        alert("Story added successfully");
      }
      setShowForm(false);
      resetForm();
      fetchItems();
    } catch (err) {
      console.error("Save error", err);
      alert("Failed to save story.");
    }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setFormData({
      name: item.name || "",
      initials: item.initials || "",
      subtitle: item.subtitle || "",
      review: item.review || "",
      image: item.image || "",
      isActive: item.isActive,
      displayOrder: item.displayOrder || 0,
      country: item.country || "India",
      state: item.state || "Maharashtra",
      city: item.city || "",
      isGlobal: item.isGlobal || false,
      priority: item.priority || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;
    try {
      await deleteStory(id);
      fetchItems();
    } catch (err) {
      console.error("Delete error", err);
      alert("Failed to delete story.");
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await updateStory(id, { isActive: !currentStatus });
      fetchItems();
    } catch (err) {
      console.error("Toggle active error", err);
      alert("Failed to toggle status.");
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      name: "",
      initials: "",
      subtitle: "",
      review: "",
      image: "",
      isActive: true,
      displayOrder: 0,
      country: "India",
      state: "Maharashtra",
      city: "",
      isGlobal: false,
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
        <h2 className="text-danger fw-bold m-0">Success Stories Manager</h2>
        <div className="d-flex gap-2">
          {!showForm && (
            <button
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              + Add Story
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
            <h5 className="mb-3 text-primary">{editId ? "Edit Success Story" : "Add New Success Story"}</h5>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Donor Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Initials (Auto-generated)</label>
                  <input
                    type="text"
                    className="form-control"
                    name="initials"
                    value={formData.initials}
                    onChange={handleInputChange}
                  />
                </div>
                
                {/* Location targeting targeting */}
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

                <div className="col-md-6">
                  <label className="form-label fw-bold">Designation / Subtitle</label>
                  <input
                    type="text"
                    className="form-control"
                    name="subtitle"
                    placeholder="e.g., First-time Donor"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Display Order</label>
                  <input
                    type="number"
                    className="form-control"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Priority (Targeting)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-12">
                  <label className="form-label fw-bold">Review / Testimonial *</label>
                  <textarea
                    className="form-control"
                    name="review"
                    rows="3"
                    value={formData.review}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>
                
                <div className="col-md-8">
                  <label className="form-label fw-bold">Profile Image Upload</label>
                  <div className="d-flex gap-2">
                    <input
                      type="file"
                      className="form-control"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    {uploading && <span className="text-primary mt-2">Uploading...</span>}
                  </div>
                </div>

                <div className="col-md-12">
                  <label className="form-label fw-bold">Image URL</label>
                  <input
                    type="text"
                    className="form-control"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    readOnly
                  />
                  {formData.image && (
                    <div className="mt-2">
                      <img src={formData.image} alt="Preview" style={{ height: "60px", width: "60px", borderRadius: "50%", objectFit: "cover", border: "2px solid #ccc" }} />
                    </div>
                  )}
                </div>

                <div className="col-md-6 d-flex align-items-center mt-4">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="activeSwitch"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label fw-bold ms-2" htmlFor="activeSwitch">
                      Active (Visible on Frontend)
                    </label>
                  </div>
                </div>
                <div className="col-md-6 d-flex align-items-center mt-4">
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
                <div className="col-md-12 mt-4 text-end">
                  <button type="button" className="btn btn-secondary me-2" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success" disabled={uploading}>
                    {editId ? "Update Story" : "Save Story"}
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
            <p className="text-center py-4 text-muted">Loading stories...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-center py-4 text-muted">No success stories matching filters found.</p>
          ) : (
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>Name & Subtitle</th>
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
                      {item.image ? (
                        <img src={item.image} alt={item.name} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "50%", border: "1px solid #ccc" }} />
                      ) : (
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #e11d48, #dc2626)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                          {item.initials}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{item.name}</strong><br />
                      <span className="text-muted small">{item.subtitle}</span>
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
                      <button 
                        className={`btn btn-sm ${item.isActive ? "btn-success" : "btn-secondary"} rounded-pill`}
                        onClick={() => handleToggleActive(item._id, item.isActive)}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
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

export default SuccessStoriesAdmin;
