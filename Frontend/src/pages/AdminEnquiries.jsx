import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import adminService from "../services/adminService";

const AdminEnquiries = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin-token");

  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");

  // States for Approval/Rejection
  const [passwordById, setPasswordById] = useState({});
  const [rejectReasonById, setRejectReasonById] = useState({});

  // ✅ State for EDIT MODAL
  const [editingEnquiry, setEditingEnquiry] = useState(null); // Stores the object being edited
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (!token) {
      navigate("/admin-login");
      return;
    }
    fetchEnquiries();
    // eslint-disable-next-line
  }, []);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const data = await adminService.getEnquiries();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) {
        localStorage.removeItem("admin-token");
        navigate("/admin-login");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS: DELETE ---
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to PERMANENTLY DELETE this enquiry?"
      )
    )
      return;
    try {
      await adminService.deleteEnquiry(id);
      setList((prev) => prev.filter((e) => e._id !== id));
      alert("✅ Deleted successfully");
    } catch (err) {
      alert("Failed to delete");
    }
  };

  // --- ACTIONS: EDIT ---
  const openEditModal = (enquiry) => {
    setEditingEnquiry(enquiry);
    // Fill form with current data
    setEditForm({
      organizerName: enquiry.organizerName,
      email: enquiry.email,
      phone: enquiry.phone,
      organizationName: enquiry.organizationName || "",
      organizationType: enquiry.organizationType || "",
      preferredDate: enquiry.preferredDate ? enquiry.preferredDate.split("T")[0] : "",
      preferredTime: enquiry.preferredTime || "",
      area: enquiry.area,
      state: enquiry.state || "",
      city: enquiry.city || "",
      address: enquiry.address || "",
      pincode: enquiry.pincode || "",
      expectedDonors: enquiry.expectedDonors || "",
      message: enquiry.message,
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    try {
      const data = await adminService.updateEnquiry(editingEnquiry._id, editForm);
      // Update local list
      setList((prev) =>
        prev.map((e) => (e._id === editingEnquiry._id ? data.enquiry : e))
      );
      setEditingEnquiry(null); // Close modal
      alert("✅ Enquiry Details Updated!");
    } catch (err) {
      alert("Failed to update enquiry");
    }
  };

  // --- ACTIONS: APPROVE / REJECT (Same logic as before) ---
  const approveEnquiry = async (enquiryId) => {
    const pw = (passwordById[enquiryId] || "").trim();
    if (!window.confirm("Approve this enquiry?")) return;

    try {
      const data = await adminService.approveEnquiry(enquiryId, pw);
      if (data.type === "existing_user") {
        alert(
          `✅ Approved (Existing User).\nCamp assigned.\nUser logs in with OLD password.`
        );
      } else {
        alert(
          `✅ Approved (New User).\nEmail: ${data.organizerLogin.email}\nPassword: ${data.organizerLogin.password}`
        );
      }
      fetchEnquiries();
    } catch (err) {
      alert(err?.response?.data?.message || "Approve failed");
    }
  };
  const resetPassword = async () => {
    if (!newPassword.trim()) {
      alert("Please enter new password");
      return;
    }

    try {
      await adminService.resetOrganizerPassword(resetModal._id, newPassword);

      alert("✅ Password updated successfully");
      setResetModal(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update password");
    }
  };

  const rejectEnquiry = async (enquiryId) => {
    const reason = (rejectReasonById[enquiryId] || "").trim();
    if (!reason) return alert("Please enter rejection reason");
    if (!window.confirm("Reject this enquiry?")) return;

    try {
      await adminService.rejectEnquiry(enquiryId, reason);
      alert("✅ Rejected");
      fetchEnquiries();
    } catch (err) {
      alert("Reject failed");
    }
  };

  // Filtering
  const filtered = useMemo(() => {
    let data = [...list];
    if (tab !== "all") data = data.filter((e) => e.status === tab);
    const query = q.trim().toLowerCase();
    if (query) {
      data = data.filter((e) =>
        [e.organizerName, e.email, e.phone, e.organizationName, e.area, e.organizationType]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [list, tab, q]);

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-danger fw-bold">📋 Organizer Enquiries</h2>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/admin")}
          >
            Back
          </button>
          <button className="btn btn-primary" onClick={fetchEnquiries}>
            Refresh
          </button>
        </div>
      </div>

      {/* TABS & SEARCH */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="btn-group w-100">
            {["pending", "approved", "rejected", "all"].map((t) => (
              <button
                key={t}
                className={`btn ${
                  tab === t ? "btn-danger" : "btn-outline-danger"
                }`}
                onClick={() => setTab(t)}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="col-md-6">
          <input
            className="form-control"
            placeholder="Search..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="alert alert-light text-center border">
          No enquiries found.
        </div>
      ) : (
        <div className="row g-4">
          {filtered.map((e) => (
            <div className="col-lg-6" key={e._id}>
              <div
                className={`card h-100 shadow-sm border-${
                  e.status === "pending"
                    ? "warning"
                    : e.status === "approved"
                    ? "success"
                    : "secondary"
                }`}
              >
                {/* CARD HEADER */}
                <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 text-danger fw-bold">{e.organizationName || e.organizerName + " Camp"}</h5>
                  <span
                    className={`badge ${
                      e.status === "pending"
                        ? "bg-warning text-dark"
                        : e.status === "approved"
                        ? "bg-success"
                        : "bg-secondary"
                    }`}
                  >
                    {e.status.toUpperCase()}
                  </span>
                </div>

                {/* CARD BODY */}
                <div className="card-body">
                  <div className="row">
                    {/* Organizer Info */}
                    <div className="col-sm-6 mb-3">
                      <h6 className="text-muted text-uppercase small fw-bold">
                        Organizer Details
                      </h6>
                      <div className="fw-semibold">{e.organizerName}</div>
                      <div className="small text-muted">📧 {e.email}</div>
                      <div className="small text-muted">📞 {e.phone}</div>
                    </div>

                    {/* Camp Info */}
                    <div className="col-sm-6 mb-3">
                      <h6 className="text-muted text-uppercase small fw-bold">
                        Camp Details
                      </h6>
                      <div className="small">
                        📅{" "}
                        {e.preferredDate
                          ? new Date(e.preferredDate).toLocaleDateString()
                          : "TBA"}
                        {e.preferredTime ? ` (${e.preferredTime})` : ""}
                      </div>
                      <div className="small">📍 {e.area}</div>
                      {(e.state || e.city) && (
                        <div className="small text-danger fw-bold">
                          🏢 Location: {e.city || ""}{e.city && e.state ? ", " : ""}{e.state || ""} {e.pincode ? `(${e.pincode})` : ""}
                        </div>
                      )}
                      <div className="small">👥 {e.expectedDonors} Donors expected</div>
                      <div className="small text-muted mt-1">Type: {e.organizationType}</div>
                    </div>
                  </div>

                  {e.message && (
                    <div className="alert alert-light border small p-2 mb-2">
                      <strong>Msg:</strong> {e.message}
                    </div>
                  )}

                  {e.status === "rejected" && (
                    <div className="alert alert-danger small p-2">
                      <strong>Reason:</strong> {e.rejectionReason}
                    </div>
                  )}
                </div>

                {/* CARD FOOTER (ACTIONS) */}
                <div className="card-footer bg-transparent">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">
                      Submitted: {new Date(e.createdAt).toLocaleDateString()}
                    </small>

                    {/* EDIT & DELETE BUTTONS (Always Visible) */}
                    <div className="btn-group">
                      {e.status === "approved" && (
                        <button
                          className="btn btn-sm btn-outline-warning"
                          title="Set / Reset Password"
                          onClick={() => {
                            setResetModal(e);
                            setNewPassword("");
                          }}
                        >
                          🔑 Set Password
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openEditModal(e)}
                        title="Edit Details"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(e._id)}
                        title="Delete Enquiry"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {/* APPROVAL ACTIONS (Only for Pending) */}
                  {e.status === "pending" && (
                    <div className="mt-2 pt-2 border-top">
                      <div className="input-group input-group-sm mb-2">
                        <span className="input-group-text">Password</span>
                        <input
                          className="form-control"
                          placeholder="Auto (New User) / Ignored (Old)"
                          value={passwordById[e._id] || ""}
                          onChange={(ev) =>
                            setPasswordById((p) => ({
                              ...p,
                              [e._id]: ev.target.value,
                            }))
                          }
                        />
                        <button
                          className="btn btn-success"
                          onClick={() => approveEnquiry(e._id)}
                        >
                          ✅ Approve
                        </button>
                      </div>

                      <div className="input-group input-group-sm">
                        <input
                          className="form-control"
                          placeholder="Rejection Reason..."
                          value={rejectReasonById[e._id] || ""}
                          onChange={(ev) =>
                            setRejectReasonById((p) => ({
                              ...p,
                              [e._id]: ev.target.value,
                            }))
                          }
                        />
                        <button
                          className="btn btn-secondary"
                          onClick={() => rejectEnquiry(e._id)}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* 🔑 RESET PASSWORD MODAL */}
      {resetModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
        >
          <div
            className="card shadow-lg p-4"
            style={{ width: "90%", maxWidth: "400px" }}
          >
            <h4 className="mb-2 text-danger">🔑 Set New Password</h4>

            <p className="small text-muted mb-3">
              Organizer: <strong>{resetModal.organizerName}</strong>
            </p>

            <input
              type="text"
              className="form-control mb-3"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-secondary"
                onClick={() => setResetModal(null)}
              >
                Cancel
              </button>
              <button className="btn btn-warning" onClick={resetPassword}>
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ EDIT MODAL (Simple Overlay) */}
      {editingEnquiry && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <div
            className="card shadow-lg p-4"
            style={{
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h4 className="mb-3 text-danger">Edit Enquiry Details</h4>

            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label small">Organizer Name</label>
                <input
                  className="form-control"
                  name="organizerName"
                  value={editForm.organizerName}
                  onChange={handleEditChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small">Phone</label>
                <input
                  className="form-control"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                />
              </div>
              <div className="col-12">
                <label className="form-label small">Email</label>
                <input
                  className="form-control"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                />
              </div>

              <div className="col-12">
                <hr />
              </div>

              <div className="col-12">
                <label className="form-label small">Organization Name</label>
                <input
                  className="form-control"
                  name="organizationName"
                  value={editForm.organizationName}
                  onChange={handleEditChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small">Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="preferredDate"
                  value={editForm.preferredDate}
                  onChange={handleEditChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small">Time</label>
                <input
                  className="form-control"
                  name="preferredTime"
                  value={editForm.preferredTime}
                  onChange={handleEditChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small">State</label>
                <input
                  className="form-control"
                  name="state"
                  value={editForm.state}
                  onChange={handleEditChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small">City</label>
                <input
                  className="form-control"
                  name="city"
                  value={editForm.city}
                  onChange={handleEditChange}
                />
              </div>
              <div className="col-md-8">
                <label className="form-label small">Address</label>
                <input
                  className="form-control"
                  name="address"
                  value={editForm.address}
                  onChange={(ev) => setEditForm(prev => ({ ...prev, address: ev.target.value, area: ev.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Pincode</label>
                <input
                  className="form-control"
                  name="pincode"
                  value={editForm.pincode}
                  onChange={handleEditChange}
                />
              </div>
              <div className="col-12">
                <label className="form-label small">Message</label>
                <textarea
                  className="form-control"
                  name="message"
                  rows="2"
                  value={editForm.message}
                  onChange={handleEditChange}
                ></textarea>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                className="btn btn-secondary"
                onClick={() => setEditingEnquiry(null)}
              >
                Cancel
              </button>
              <button className="btn btn-success" onClick={saveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEnquiries;
