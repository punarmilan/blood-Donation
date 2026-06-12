import React, { useState, useEffect } from "react";

const BloodRequestBackgroundAdmin = () => {
  const [backgrounds, setBackgrounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

  // Targeting States for Upload
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("Maharashtra");
  const [city, setCity] = useState("");
  const [isGlobal, setIsGlobal] = useState(false);
  const [priority, setPriority] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // List Filters
  const [filterCountry, setFilterCountry] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterGlobalOnly, setFilterGlobalOnly] = useState("all");

  const fetchBackgrounds = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blood-request-background/all", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin-token")}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setBackgrounds(data.backgrounds);
      }
    } catch (err) {
      console.error("Failed to fetch backgrounds", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackgrounds();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("media", file);
    formData.append("country", country);
    formData.append("state", state);
    formData.append("city", city);
    formData.append("isGlobal", isGlobal);
    formData.append("priority", priority);
    formData.append("isActive", isActive);

    setUploading(true);
    try {
      const res = await fetch("/api/blood-request-background", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin-token")}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        alert("Upload successful!");
        setFile(null);
        setCity("");
        setPriority(0);
        document.getElementById("bgUploadInput").value = "";
        fetchBackgrounds();
      } else {
        alert("Upload failed: " + data.message);
      }
    } catch (err) {
      console.error("Upload error", err);
      alert("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      const res = await fetch(`/api/blood-request-background/${id}/active`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin-token")}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        fetchBackgrounds();
      } else {
        alert("Failed to toggle status: " + data.message);
      }
    } catch (err) {
      console.error("Activate error", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this background?")) return;
    try {
      const res = await fetch(`/api/blood-request-background/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin-token")}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        fetchBackgrounds();
      } else {
        alert("Failed to delete: " + data.message);
      }
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  const filteredBackgrounds = backgrounds.filter((item) => {
    if (filterGlobalOnly === "global" && !item.isGlobal) return false;
    if (filterGlobalOnly === "local" && item.isGlobal) return false;
    if (filterCountry && !item.country?.toLowerCase().includes(filterCountry.toLowerCase())) return false;
    if (filterState && !item.state?.toLowerCase().includes(filterState.toLowerCase())) return false;
    if (filterCity && !item.city?.toLowerCase().includes(filterCity.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="chart-card p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="text-danger fw-bold m-0">Blood Request Backgrounds</h2>
        <button className="btn btn-outline-secondary" onClick={fetchBackgrounds}>
          Refresh List
        </button>
      </div>

      {/* Upload Section */}
      <div className="mb-5 p-4 border rounded bg-light shadow-sm">
        <h5 className="mb-3 fw-bold text-primary">Upload New Localized Background</h5>
        <form onSubmit={handleUpload} className="d-flex flex-column gap-3">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label text-muted small fw-bold">Select File (Image/Video) *</label>
              <input
                id="bgUploadInput"
                type="file"
                className="form-control"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                onChange={handleFileChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted small fw-bold">Country</label>
              <input type="text" className="form-control" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. India" />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small fw-bold">State</label>
              <input type="text" className="form-control" value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Maharashtra" />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small fw-bold">City</label>
              <input type="text" className="form-control" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Pune" />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small fw-bold">Priority (Targeting)</label>
              <input type="number" className="form-control" value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
            </div>

            <div className="col-md-6 d-flex align-items-center">
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" id="bgIsGlobalSwitch" checked={isGlobal} onChange={(e) => setIsGlobal(e.target.checked)} />
                <label className="form-check-label fw-bold ms-2" htmlFor="bgIsGlobalSwitch">Is Global Background?</label>
              </div>
            </div>
            <div className="col-md-6 d-flex align-items-center">
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" id="bgIsActiveSwitch" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <label className="form-check-label fw-bold ms-2" htmlFor="bgIsActiveSwitch">Activate on Upload?</label>
              </div>
            </div>

            <div className="col-12 mt-2 text-end">
              <button type="submit" className="btn btn-primary px-4" disabled={uploading || !file}>
                {uploading ? "Uploading..." : "Upload Background"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filters Section */}
      <h5 className="mb-3 fw-bold">Target Location Filters</h5>
      <div className="row g-2 mb-4 p-3 border rounded bg-light">
        <div className="col-md-3">
          <label className="form-label text-muted small fw-bold">Filter Country</label>
          <input type="text" className="form-control form-control-sm" placeholder="e.g. India" value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="form-label text-muted small fw-bold">Filter State</label>
          <input type="text" className="form-control form-control-sm" placeholder="e.g. Maharashtra" value={filterState} onChange={(e) => setFilterState(e.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="form-label text-muted small fw-bold">Filter City</label>
          <input type="text" className="form-control form-control-sm" placeholder="e.g. Pune" value={filterCity} onChange={(e) => setFilterCity(e.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="form-label text-muted small fw-bold">Personalization Scope</label>
          <select className="form-select form-select-sm" value={filterGlobalOnly} onChange={(e) => setFilterGlobalOnly(e.target.value)}>
            <option value="all">All Content</option>
            <option value="global">Global Only</option>
            <option value="local">Personalized Only</option>
          </select>
        </div>
      </div>

      {/* List Section */}
      <h5 className="mb-3 fw-bold">Uploaded Backgrounds</h5>
      {loading ? (
        <p>Loading backgrounds...</p>
      ) : filteredBackgrounds.length === 0 ? (
        <p className="text-muted">No backgrounds match current filters.</p>
      ) : (
        <div className="row g-4">
          {filteredBackgrounds.map((bg) => (
            <div className="col-md-6 col-lg-4" key={bg._id}>
              <div className={`card h-100 shadow-sm border-2 ${bg.isActive ? 'border-success' : 'border-light'}`}>
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <span className={`badge ${bg.isActive ? 'bg-success' : 'bg-secondary'}`}>
                    {bg.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                  <span className="small text-muted">{new Date(bg.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="card-body p-0 position-relative bg-dark" style={{ height: "200px", overflow: "hidden" }}>
                  {bg.mediaType === "image" ? (
                    <img src={bg.mediaUrl} alt="Background" className="w-100 h-100 object-fit-cover" />
                  ) : (
                    <video src={bg.mediaUrl} className="w-100 h-100 object-fit-cover" controls={false} muted loop autoPlay />
                  )}
                </div>
                <div className="p-3 border-bottom bg-light">
                  <div className="small text-dark font-monospace fw-bold mb-1">
                    Target: {bg.isGlobal ? "🌐 Global" : `📍 ${bg.city || "(Any City)"}, ${bg.state || "(Any State)"}, ${bg.country || "(Any Country)"}`}
                  </div>
                  <div className="small text-muted">Priority: {bg.priority || 0}</div>
                </div>
                <div className="card-footer bg-white d-flex justify-content-between p-3 gap-2">
                  <button
                    className={`btn btn-sm flex-grow-1 ${bg.isActive ? 'btn-secondary' : 'btn-outline-success'}`}
                    onClick={() => handleToggleActive(bg._id, bg.isActive)}
                  >
                    {bg.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(bg._id)}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BloodRequestBackgroundAdmin;
