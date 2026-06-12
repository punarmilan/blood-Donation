import React, { useState, useEffect } from "react";
import {
  getHomeContents,
  createHomeContent,
  updateHomeContent,
  deleteHomeContent,
  uploadHomeMedia,
} from "../services/homeContentService";
import toast from "react-hot-toast";

const HomeContentAdmin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    country: "India",
    state: "Maharashtra",
    city: "",
    isGlobal: false,
    isActive: true,
    priority: 0,
    heroHeadline: "",
    heroSubtitle: "",
    heroButtonText: "blood Request",
    heroSecondaryButtonText: "Become a Donor",
    homeBackgroundVideo: "",
    homeBackgroundImage: "",
    emergencyBannerText: "",
    localImpactText: "",
    localDonorCount: 0,
    localBloodBankCount: 0,
    preferredLanguage: "English",
  });

  const [uploading, setUploading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getHomeContents();
      if (data && data.success) {
        setItems(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch home contents", err);
      toast.error("Failed to load rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number(value)
          : value,
    }));
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileData = new FormData();
    fileData.append("file", file);

    setUploading(true);
    try {
      const data = await uploadHomeMedia(fileData);
      if (data && data.success) {
        setFormData((prev) => ({ ...prev, [field]: data.fileUrl }));
        toast.success("File uploaded successfully!");
      } else {
        toast.error("Upload failed: " + (data?.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      toast.error("Error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.heroHeadline) {
      return toast.error("Hero Headline is required");
    }
    try {
      const data = editId
        ? await updateHomeContent(editId, formData)
        : await createHomeContent(formData);
      if (data && data.success) {
        toast.success(
          editId ? "Updated successfully!" : "Created successfully!"
        );
        setShowForm(false);
        resetForm();
        fetchItems();
      } else {
        toast.error("Failed to save: " + (data?.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Save error", err);
      toast.error("Failed to save home content.");
    }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setFormData({
      country: item.country || "India",
      state: item.state || "Maharashtra",
      city: item.city || "",
      isGlobal: item.isGlobal || false,
      isActive: item.isActive !== undefined ? item.isActive : true,
      priority: item.priority || 0,
      heroHeadline: item.heroHeadline || "",
      heroSubtitle: item.heroSubtitle || "",
      heroButtonText: item.heroButtonText || "blood Request",
      heroSecondaryButtonText: item.heroSecondaryButtonText || "Become a Donor",
      homeBackgroundVideo: item.homeBackgroundVideo || "",
      homeBackgroundImage: item.homeBackgroundImage || "",
      emergencyBannerText: item.emergencyBannerText || "",
      localImpactText: item.localImpactText || "",
      localDonorCount: item.localDonorCount || 0,
      localBloodBankCount: item.localBloodBankCount || 0,
      preferredLanguage: item.preferredLanguage || "English",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this home content personalization?"
      )
    )
      return;
    try {
      const data = await deleteHomeContent(id);
      if (data && data.success) {
        toast.success("Deleted successfully!");
        fetchItems();
      } else {
        toast.error("Failed to delete: " + (data?.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Delete error", err);
      toast.error("Failed to delete");
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      country: "India",
      state: "Maharashtra",
      city: "",
      isGlobal: false,
      isActive: true,
      priority: 0,
      heroHeadline: "",
      heroSubtitle: "",
      heroButtonText: "blood Request",
      heroSecondaryButtonText: "Become a Donor",
      homeBackgroundVideo: "",
      homeBackgroundImage: "",
      emergencyBannerText: "",
      localImpactText: "",
      localDonorCount: 0,
      localBloodBankCount: 0,
      preferredLanguage: "English",
    });
  };

  return (
    <div className="chart-card">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="text-danger fw-bold m-0">Personalized Homepage Content</h2>
        <div className="d-flex gap-2">
          {!showForm && (
            <button
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              + Add Personalized Content
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
            <h5 className="mb-3 text-primary">
              {editId
                ? "Edit Personalized Content"
                : "Add Personalized Content"}
            </h5>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Geo targeting */}
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

                {/* Configurations */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    Priority (Higher runs first)
                  </label>
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
                    <label
                      className="form-check-label fw-bold ms-2"
                      htmlFor="isGlobalSwitch"
                    >
                      Is Global Content?
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
                    <label
                      className="form-check-label fw-bold ms-2"
                      htmlFor="isActiveSwitch"
                    >
                      Is Content Active?
                    </label>
                  </div>
                </div>

                <hr className="my-4" />

                {/* Content */}
                <div className="col-md-12">
                  <label className="form-label fw-bold">Hero Headline *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="heroHeadline"
                    placeholder="Save Lives, Donate Blood"
                    value={formData.heroHeadline}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label fw-bold">Hero Subtitle</label>
                  <textarea
                    className="form-control"
                    name="heroSubtitle"
                    rows="2"
                    placeholder="Connecting blood donors with recipients in real-time."
                    value={formData.heroSubtitle}
                    onChange={handleInputChange}
                  ></textarea>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Primary Button Text
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="heroButtonText"
                    value={formData.heroButtonText}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Secondary Button Text
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="heroSecondaryButtonText"
                    value={formData.heroSecondaryButtonText}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Media uploads */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Home Background Video URL
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="homeBackgroundVideo"
                    value={formData.homeBackgroundVideo}
                    onChange={handleInputChange}
                  />
                  <input
                    type="file"
                    className="form-control mt-2"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, "homeBackgroundVideo")}
                    disabled={uploading}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Home Background Image URL
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="homeBackgroundImage"
                    value={formData.homeBackgroundImage}
                    onChange={handleInputChange}
                  />
                  <input
                    type="file"
                    className="form-control mt-2"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "homeBackgroundImage")}
                    disabled={uploading}
                  />
                </div>

                <hr className="my-4" />

                {/* Emergency & Stats */}
                <div className="col-md-12">
                  <label className="form-label fw-bold text-danger">
                    Emergency Banner Text (Displays pulse alert on landing page)
                  </label>
                  <input
                    type="text"
                    className="form-control text-danger fw-bold"
                    name="emergencyBannerText"
                    placeholder="e.g. URGENT: O- negative blood needed at Ruby Hall Clinic!"
                    value={formData.emergencyBannerText}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label fw-bold">
                    Local Impact Text
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="localImpactText"
                    placeholder="Together, we have saved thousands of lives in Pune."
                    value={formData.localImpactText}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    Local Active Donors Count
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="localDonorCount"
                    value={formData.localDonorCount}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    Local Blood Banks Count
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="localBloodBankCount"
                    value={formData.localBloodBankCount}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    Preferred Language
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-12 mt-4 text-end">
                  <button
                    type="button"
                    className="btn btn-secondary me-2"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={uploading}
                  >
                    {editId ? "Update Content" : "Save Content"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="custom-table-container text-white">
          {loading ? (
            <p className="text-center py-4 text-muted">
              Loading personalized contents...
            </p>
          ) : items.length === 0 ? (
            <p className="text-center py-4 text-muted">
              No personalized contents found. Create your first targeting rule.
            </p>
          ) : (
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Location targeting</th>
                  <th>Hero Headline</th>
                  <th>Emergency Banner</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>
                      {item.isGlobal ? (
                        <span className="badge bg-primary">Global</span>
                      ) : (
                        <span className="fw-bold text-dark">
                          📍 {item.city || "(Any City)"},{" "}
                          {item.state || "(Any State)"},{" "}
                          {item.country || "(Any Country)"}
                        </span>
                      )}
                    </td>
                    <td>
                      <strong>{item.heroHeadline}</strong>
                    </td>
                    <td>
                      {item.emergencyBannerText ? (
                        <span className="text-danger small fw-bold">
                          {item.emergencyBannerText}
                        </span>
                      ) : (
                        <span className="text-muted small">None</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      {item.isActive ? (
                        <span className="badge bg-success rounded-pill">
                          Active
                        </span>
                      ) : (
                        <span className="badge bg-secondary rounded-pill">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-light border"
                          onClick={() => handleEdit(item)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-sm btn-light border text-danger"
                          onClick={() => handleDelete(item._id)}
                        >
                          🗑️
                        </button>
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

export default HomeContentAdmin;
