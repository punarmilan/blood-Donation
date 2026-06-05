import React, { useState, useEffect } from "react";
import adminService from "../services/adminService"; // Wait, I will use fetch since adminService might not have it. Or I'll just write fetch inside here using the token from localStorage.

const BloodRequestBackgroundAdmin = () => {
  const [backgrounds, setBackgrounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

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
        alert("Upload successful! It has been set as active.");
        setFile(null);
        // reset file input
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
    if (currentActive) return; // Already active
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
        alert("Failed to activate: " + data.message);
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
        <h5 className="mb-3">Upload New Background</h5>
        <form onSubmit={handleUpload} className="d-flex align-items-end gap-3 flex-wrap">
          <div className="flex-grow-1">
            <label className="form-label text-muted small">Select Image (jpg, png, webp, max 5MB) or Video (mp4, webm, max 50MB)</label>
            <input
              id="bgUploadInput"
              type="file"
              className="form-control"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              onChange={handleFileChange}
            />
          </div>
          <button type="submit" className="btn btn-primary px-4" disabled={uploading || !file}>
            {uploading ? "Uploading..." : "Upload & Set Active"}
          </button>
        </form>
      </div>

      {/* List Section */}
      <h5 className="mb-3">Uploaded Backgrounds</h5>
      {loading ? (
        <p>Loading backgrounds...</p>
      ) : backgrounds.length === 0 ? (
        <p className="text-muted">No backgrounds uploaded yet.</p>
      ) : (
        <div className="row g-4">
          {backgrounds.map((bg) => (
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
                <div className="card-footer bg-white d-flex justify-content-between p-3 gap-2">
                  <button
                    className={`btn btn-sm flex-grow-1 ${bg.isActive ? 'btn-success disabled' : 'btn-outline-success'}`}
                    onClick={() => handleToggleActive(bg._id, bg.isActive)}
                    disabled={bg.isActive}
                  >
                    {bg.isActive ? "Currently Active" : "Set Active"}
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
