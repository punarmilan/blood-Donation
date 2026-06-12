import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Check, X, FileText, Building2 } from "lucide-react";
import adminService from "../services/adminService";

export default function AdminBloodBankRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPendingBloodBanks();
      if (res.success) {
        setRequests(res.data);
      }
    } catch (err) {
      toast.error("Failed to fetch pending requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this blood bank? An email with a password setup link will be sent.")) return;
    try {
      const res = await adminService.approveBloodBank(id);
      if (res.success) {
        toast.success(res.message);
        fetchRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error approving blood bank");
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    try {
      const res = await adminService.rejectBloodBank(rejectModal, rejectionReason);
      if (res.success) {
        toast.success(res.message);
        setRejectModal(null);
        setRejectionReason("");
        fetchRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error rejecting blood bank");
    }
  };

  return (
    <div className="bg-[#0f172a] p-6 rounded-xl border border-zinc-800 text-white min-h-[500px]">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-8 h-8 text-red-500" />
        <div>
          <h2 className="text-2xl font-bold">Blood Bank Requests</h2>
          <p className="text-zinc-400 text-sm">Review and approve new blood bank registrations</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-zinc-400">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-500 font-semibold">No pending requests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {requests.map((bank) => (
            <div key={bank._id} className="bg-[#1e293b] p-5 rounded-xl border border-zinc-700 shadow-lg relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-red-400">{bank.name}</h3>
                  <p className="text-sm text-zinc-300">Manager: {bank.managerName}</p>
                </div>
                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-bold rounded-full border border-yellow-500/20">
                  PENDING
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-zinc-400 mb-4">
                <div>
                  <span className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Contact</span>
                  <p className="text-white">{bank.mobile}</p>
                  <p className="text-white truncate">{bank.email}</p>
                </div>
                <div>
                  <span className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">License</span>
                  <p className="text-white">{bank.licenseNumber}</p>
                  <a 
                    href={`${backendUrl}${bank.licenseDocumentUrl}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 mt-1 transition-colors"
                  >
                    <FileText className="w-3 h-3" /> View Document
                  </a>
                </div>
              </div>

              <div className="text-sm text-zinc-400 mb-6">
                <span className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Location</span>
                <p className="text-white">{bank.address}</p>
                <p className="text-white">{bank.city}, {bank.state} - {bank.pincode}</p>
              </div>

              <div className="flex gap-3 mt-auto">
                <button 
                  onClick={() => handleApprove(bank._id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white border border-green-600/30 py-2 rounded-lg font-semibold transition-all"
                >
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button 
                  onClick={() => setRejectModal(bank._id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white border border-red-600/30 py-2 rounded-lg font-semibold transition-all"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] rounded-xl border border-red-500/30 shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-red-500 mb-4">Reject Registration</h3>
            <form onSubmit={handleReject}>
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-2">Reason for rejection *</label>
                <textarea 
                  required 
                  value={rejectionReason} 
                  onChange={(e) => setRejectionReason(e.target.value)} 
                  className="w-full px-3 py-2 bg-[#1e293b] border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500" 
                  rows="4" 
                  placeholder="Explain why this registration is being rejected..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setRejectModal(null)} className="px-4 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 font-semibold transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-lg shadow-red-600/20 transition-colors">Confirm Reject</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
