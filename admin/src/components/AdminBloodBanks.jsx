import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Search, MapPin, Building, ShieldCheck, Ban, Plus, Eye, X, FileText, ExternalLink, RefreshCw, AlertTriangle, ShieldAlert, Clock } from "lucide-react";
import adminService from "../services/adminService";
import AdminInviteBloodBank from "./AdminInviteBloodBank";

export default function AdminBloodBanks() {
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "pending" | "active" | "invited" | "rejected" | "all"
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");

  useEffect(() => {
    fetchBloodBanks();
  }, [activeTab]);

  const fetchBloodBanks = async () => {
    setLoading(true);
    try {
      const res = await adminService.getBloodBanks({ status: activeTab });
      if (res.success) {
        setBloodBanks(res.data);
      }
    } catch (err) {
      toast.error("Failed to fetch blood banks");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this blood bank? Password setup link will be generated and sent via email.")) return;
    setActionLoading(true);
    try {
      const res = await adminService.approveBloodBank(id);
      if (res.success) {
        toast.success(res.message || "Approved successfully!");
        setSelectedBank(null);
        fetchBloodBanks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error approving blood bank");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminService.rejectBloodBank(id, rejectionReason);
      if (res.success) {
        toast.success(res.message || "Registration rejected successfully.");
        setSelectedBank(null);
        setIsRejecting(false);
        setRejectionReason("");
        fetchBloodBanks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error rejecting blood bank");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (id) => {
    if (!suspensionReason.trim()) {
      toast.error("Please enter a reason for suspension");
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminService.suspendBloodBank(id, suspensionReason);
      if (res.success) {
        toast.success(res.message || "Blood bank suspended successfully.");
        setSelectedBank(null);
        setIsSuspending(false);
        setSuspensionReason("");
        fetchBloodBanks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error suspending blood bank");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (id) => {
    if (!window.confirm("Reactivate this suspended blood bank account?")) return;
    setActionLoading(true);
    try {
      const res = await adminService.reactivateBloodBank(id);
      if (res.success) {
        toast.success(res.message || "Blood bank reactivated successfully.");
        setSelectedBank(null);
        fetchBloodBanks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error reactivating blood bank");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendInvite = async (id) => {
    setActionLoading(true);
    try {
      const res = await adminService.resendInvite(id);
      if (res.success) {
        toast.success(res.message || "Invitation resent successfully!");
        fetchBloodBanks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error resending invitation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusOverride = async (id, newStatus) => {
    const note = window.prompt(`Enter a note/reason for changing status to ${newStatus} (optional):`);
    if (note === null) return; // Cancelled

    setActionLoading(true);
    try {
      const res = await adminService.updateBloodBankStatus(id, newStatus, note);
      if (res.success) {
        toast.success(res.message || `Status updated to ${newStatus}`);
        // Fetch updated data to sync UI
        const refreshed = await adminService.getBloodBanks({});
        if (refreshed.success) {
          const updated = refreshed.data.find(b => b._id === id);
          if (updated) setSelectedBank(updated);
        }
        fetchBloodBanks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating status");
    } finally {
      setActionLoading(false);
    }
  };

  const isLicenseExpiringSoon = (date) => {
    if (!date) return false;
    const diffTime = new Date(date) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isLicenseExpired = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const filteredBanks = bloodBanks.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#0f172a] p-6 rounded-xl border border-zinc-800 text-white min-h-[500px]">
      
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2 text-white">
            <Building className="w-6 h-6 text-red-500" />
            Blood Banks Directory
          </h2>
          <p className="text-zinc-400 text-xs mt-1">Manage registration requests, verify credentials, and handle operational states</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-red-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Invite Blood Bank
          </button>
          
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search name, city, license..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1e293b] border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 text-xs text-white placeholder-zinc-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-zinc-800 mb-6 overflow-x-auto gap-2">
        {["all", "pending", "active", "invited", "rejected", "suspended"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab 
                ? "border-red-500 text-red-400 bg-red-500/5" 
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid or Table list */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500 text-sm">
          <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto mb-3"></div>
          Loading blood banks...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">Blood Bank Name</th>
                <th className="py-3 px-4 font-bold">Contact & License</th>
                <th className="py-3 px-4 font-bold">Location</th>
                <th className="py-3 px-4 font-bold">Expiry State</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanks.map((bank) => {
                const expiring = isLicenseExpiringSoon(bank.licenseExpiryDate);
                const expired = isLicenseExpired(bank.licenseExpiryDate);
                
                return (
                  <tr key={bank._id} className="border-b border-zinc-800 hover:bg-[#1e293b]/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-zinc-100">{bank.name}</div>
                      <div className="text-xs text-zinc-500 mt-1">Manager: {bank.managerName}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-zinc-200">{bank.mobile}</div>
                      <div className="text-[11px] text-zinc-500 mt-1">License: {bank.licenseNumber}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm flex items-center gap-1 text-zinc-200">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" /> {bank.city}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">{bank.state || "N/A"}</div>
                    </td>
                    <td className="py-4 px-4">
                      {bank.licenseExpiryDate ? (
                        <div>
                          <div className={`text-xs font-semibold ${
                            expired ? "text-red-500" : expiring ? "text-amber-500 animate-pulse" : "text-zinc-400"
                          }`}>
                            {new Date(bank.licenseExpiryDate).toLocaleDateString("en-IN")}
                          </div>
                          {expired && <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider block">Expired</span>}
                          {expiring && <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider block">Expires Soon</span>}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600 italic">Not Submitted</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider ${
                        bank.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        bank.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        bank.status === 'suspended' ? 'bg-red-900/20 text-red-400 border-red-500/20' :
                        bank.status === 'rejected' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' :
                        'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}>
                        {bank.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 flex justify-center gap-2">
                      <button
                        onClick={() => setSelectedBank(bank)}
                        className="flex items-center gap-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded text-xs font-bold transition-all border border-zinc-700 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>

                      {bank.status === "invited" && (
                        <button
                          disabled={actionLoading}
                          onClick={() => handleResendInvite(bank._id)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded text-xs font-bold transition-all border border-red-500/20 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Resend Invite
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredBanks.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-zinc-500 text-xs italic">
                    No blood banks found under the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#11111f] rounded-xl border border-zinc-800 shadow-2xl w-full max-w-2xl p-6 relative">
            <button 
              onClick={() => {
                setShowInviteModal(false);
                fetchBloodBanks();
              }} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white text-lg font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
            <AdminInviteBloodBank />
          </div>
        </div>
      )}

      {/* Drawer slide-out */}
      {selectedBank && (
        <>
          <div onClick={() => { setSelectedBank(null); setIsRejecting(false); setIsSuspending(false); }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" />
          
          <div className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-[#0c0c16] border-l border-zinc-800 shadow-2xl z-[100] flex flex-col text-white transform transition-transform duration-300">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-start">
              <div>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded border uppercase tracking-wider mb-2 inline-block ${
                  selectedBank.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  selectedBank.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {selectedBank.status}
                </span>
                <h3 className="text-xl font-black text-white">{selectedBank.name}</h3>
                <p className="text-[10px] text-zinc-500 mt-1">ID: {selectedBank._id}</p>
              </div>
              <button onClick={() => { setSelectedBank(null); setIsRejecting(false); setIsSuspending(false); }} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-sm">
              
              {/* Contact info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 pb-1">Operational Info</h4>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Manager</span>
                  <span className="font-semibold text-zinc-200">{selectedBank.managerName}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Mobile</span>
                    <span className="font-semibold text-zinc-200">{selectedBank.mobile}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Email</span>
                    <span className="font-semibold text-zinc-200 truncate block">{selectedBank.email}</span>
                  </div>
                </div>
              </div>

              {/* License Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 pb-1">License & Validity</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">License No</span>
                    <span className="font-semibold text-zinc-200">{selectedBank.licenseNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Expiry Date</span>
                    <span className="font-semibold text-zinc-200">
                      {selectedBank.licenseExpiryDate ? new Date(selectedBank.licenseExpiryDate).toLocaleDateString("en-IN") : "N/A"}
                    </span>
                  </div>
                </div>

                {selectedBank.licenseDocumentUrl && (
                  <div className="pt-2">
                    <span className="text-[10px] text-zinc-500 block uppercase mb-1.5">Verification Document</span>
                    <a 
                      href={`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5001"}${selectedBank.licenseDocumentUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-blue-400 rounded border border-zinc-700 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> View License Document <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Location details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 pb-1">Address & Location</h4>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Address</span>
                  <p className="text-xs text-zinc-300 leading-relaxed">{selectedBank.address || "N/A"}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">City</span>
                    <span className="font-semibold text-zinc-200">{selectedBank.city}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">State</span>
                    <span className="font-semibold text-zinc-200">{selectedBank.state || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Pincode</span>
                    <span className="font-semibold text-zinc-200">{selectedBank.pincode || "N/A"}</span>
                  </div>
                </div>

                {selectedBank.latitude && selectedBank.longitude && (
                  <div className="pt-2">
                    <span className="text-[10px] text-zinc-500 block uppercase mb-1">Maps Preview</span>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedBank.latitude},${selectedBank.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E24B4A] hover:underline"
                    >
                      <MapPin className="w-4.5 h-4.5" /> Locate on Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Timing */}
              {(selectedBank.openTime || selectedBank.is24x7) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 pb-1">Operational Timing</h4>
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                    <Clock className="w-4 h-4 text-[#E24B4A]" />
                    {selectedBank.is24x7 ? (
                      <span className="text-green-500">Open 24 Hours / 7 Days</span>
                    ) : (
                      <span>Open: {selectedBank.openTime} | Close: {selectedBank.closeTime}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Audit logs history */}
              {selectedBank.statusHistory && selectedBank.statusHistory.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 pb-1">History Audit Trail</h4>
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedBank.statusHistory.map((hist, idx) => (
                      <div key={idx} className="text-xs bg-zinc-900/60 p-2.5 rounded border border-zinc-800/80">
                        <div className="flex justify-between font-bold text-zinc-300">
                          <span className="capitalize text-[#E24B4A]">{hist.status}</span>
                          <span className="text-zinc-500 text-[10px]">{new Date(hist.updatedAt).toLocaleDateString("en-IN")}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">{hist.action} - {hist.note}</p>
                        <span className="text-[9px] text-zinc-600 block mt-1">By: {hist.updatedBy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedBank.status === "pending" && (
                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  {!isRejecting ? (
                    <div className="flex gap-3">
                      <button
                        disabled={actionLoading}
                        onClick={() => handleApprove(selectedBank._id)}
                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-xs transition-colors cursor-pointer"
                      >
                        Approve Account
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => setIsRejecting(true)}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs transition-colors cursor-pointer"
                      >
                        Reject Request
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-zinc-900/50 p-4 rounded border border-zinc-800">
                      <label className="block text-xs text-zinc-400 font-bold uppercase">Reason for Rejection *</label>
                      <textarea
                        required
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide reason for rejecting..."
                        className="w-full p-2 bg-zinc-950 border border-zinc-850 rounded text-xs text-white focus:outline-none focus:border-red-500"
                        rows="3"
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setIsRejecting(false); setRejectionReason(""); }}
                          className="px-3 py-1 bg-zinc-800 text-zinc-400 hover:text-white rounded text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleReject(selectedBank._id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold cursor-pointer"
                        >
                          Confirm Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedBank.status === "active" && (
                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  {!isSuspending ? (
                    <button
                      disabled={actionLoading}
                      onClick={() => setIsSuspending(true)}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4" /> Suspend Account
                    </button>
                  ) : (
                    <div className="space-y-3 bg-zinc-900/50 p-4 rounded border border-zinc-800">
                      <label className="block text-xs text-zinc-400 font-bold uppercase">Reason for Suspension *</label>
                      <textarea
                        required
                        value={suspensionReason}
                        onChange={(e) => setSuspensionReason(e.target.value)}
                        placeholder="Provide details for suspension..."
                        className="w-full p-2 bg-zinc-950 border border-zinc-850 rounded text-xs text-white focus:outline-none focus:border-red-500"
                        rows="3"
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setIsSuspending(false); setSuspensionReason(""); }}
                          className="px-3 py-1 bg-zinc-800 text-zinc-400 hover:text-white rounded text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleSuspend(selectedBank._id)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold cursor-pointer"
                        >
                          Confirm Suspend
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedBank.status === "suspended" && (
                <div className="pt-4 border-t border-zinc-800">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleReactivate(selectedBank._id)}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" /> Reactivate Account
                  </button>
                </div>
              )}

              {/* Direct Status Selector Override */}
              <div className="pt-6 border-t border-zinc-800 space-y-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Status Override (Force State)</label>
                <div className="relative">
                  <select
                    disabled={actionLoading}
                    value={selectedBank.status}
                    onChange={(e) => handleStatusOverride(selectedBank._id, e.target.value)}
                    className="w-full p-2.5 bg-[#181827] border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    <option value="invited">✉️ Invited</option>
                    <option value="pending">⏳ Pending Review</option>
                    <option value="approved">✅ Approved (Awaiting PW Set)</option>
                    <option value="active">🟢 Active / Activated</option>
                    <option value="rejected">❌ Rejected</option>
                    <option value="suspended">⚠️ Suspended</option>
                  </select>
                </div>
                <p className="text-[10px] text-zinc-500 leading-normal">Manually force this blood bank's state. Bypasses standard step transitions and logs audit trial.</p>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
