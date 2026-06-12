import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Droplet, Calendar, ShieldAlert, CheckCircle, AlertTriangle, FileText, Printer, Clock, User, HeartPulse, Truck, ExternalLink, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import bloodBankService from "../../services/bloodBankService";

export default function BloodUnitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState(null);

  // Modals state
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showUsedModal, setShowUsedModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  
  const [actionLoading, setActionLoading] = useState(false);

  // Modal Inputs
  const [reserveForm, setReserveForm] = useState({ requestId: "" });
  const [issueForm, setIssueForm] = useState({
    issuedToHospital: "",
    hospitalAddress: "",
    receiverName: "",
    receiverMobile: "",
    transportMode: "Ambulance",
    issueRemarks: "",
  });
  const [usedForm, setUsedForm] = useState({
    transfusionConfirmedBy: "",
    finalStatusRemarks: "",
    status: "Used"
  });
  const [discardForm, setDiscardForm] = useState({ reason: "" });

  const fetchUnitDetails = async () => {
    setLoading(true);
    try {
      const res = await bloodBankService.getBloodUnitDetails(id);
      if (res.success) {
        setUnit(res.unit);
      }
    } catch (err) {
      toast.error("Failed to load blood unit details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnitDetails();
  }, [id]);

  const handleReserve = async (e) => {
    e.preventDefault();
    if (!reserveForm.requestId) return;
    setActionLoading(true);
    try {
      const res = await bloodBankService.reserveBloodUnit(unit._id, reserveForm);
      if (res.success) {
        toast.success("Unit reserved successfully!");
        setShowReserveModal(false);
        fetchUnitDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reserve unit.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!issueForm.issuedToHospital || !issueForm.receiverName || !issueForm.receiverMobile) {
      toast.error("Please fill in required fields.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await bloodBankService.issueBloodUnit(unit._id, issueForm);
      if (res.success) {
        toast.success("Unit issued successfully!");
        setShowIssueModal(false);
        fetchUnitDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to issue unit.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkUsed = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await bloodBankService.markUnitUsed(unit._id, usedForm);
      if (res.success) {
        toast.success(`Unit marked as ${usedForm.status} successfully!`);
        setShowUsedModal(false);
        fetchUnitDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete transfusion log.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDiscard = async (e) => {
    e.preventDefault();
    if (!discardForm.reason) return;
    setActionLoading(true);
    try {
      const res = await bloodBankService.discardBloodUnit(unit._id, discardForm);
      if (res.success) {
        toast.success("Unit discarded and taken out of rotation.");
        setShowDiscardModal(false);
        fetchUnitDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to discard unit.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-sans text-zinc-500">
        <RefreshCw className="w-6 h-6 animate-spin text-[#E24B4A] mr-2" />
        Loading details...
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6 font-sans">
        <div className="max-w-xl mx-auto text-center py-12">
          <AlertTriangle className="w-12 h-12 text-[#E24B4A] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-zinc-800">Unit Not Found</h2>
          <p className="text-sm text-zinc-500 mt-2">The requested blood unit does not exist or you lack authorization to view it.</p>
          <button onClick={() => navigate(-1)} className="mt-6 px-4 py-2 bg-[#E24B4A] text-white rounded-lg text-sm font-bold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // QR Code URL helper
  const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(unit.qrCode || "")}`;

  return (
    <div className="min-h-screen bg-zinc-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Details Panel */}
          <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-zinc-50/50 flex justify-between items-start">
              <div>
                <span className="text-[10px] bg-red-50 text-[#E24B4A] border border-red-100 font-extrabold uppercase px-2 py-0.5 rounded">
                  {unit.currentStatus}
                </span>
                <h1 className="text-xl font-black text-zinc-950 mt-1">{unit.unitId}</h1>
                <p className="text-xs text-zinc-500">Registered on {new Date(unit.collectionDate).toLocaleDateString()}</p>
              </div>

              {/* Context Actions */}
              <div className="flex gap-2">
                {unit.currentStatus === "Available" && (
                  <button
                    onClick={() => setShowReserveModal(true)}
                    className="px-4 py-2 bg-[#E24B4A] text-white text-xs font-bold rounded-lg hover:bg-[#c93d3c] transition shadow-sm"
                  >
                    Reserve Unit
                  </button>
                )}
                {unit.currentStatus === "Reserved" && (
                  <button
                    onClick={() => setShowIssueModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm"
                  >
                    Issue Blood
                  </button>
                )}
                {unit.currentStatus === "Issued" && (
                  <button
                    onClick={() => setShowUsedModal(true)}
                    className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition shadow-sm"
                  >
                    Mark Used
                  </button>
                )}
                {!["Used", "Transfused", "Discarded"].includes(unit.currentStatus) && (
                  <button
                    onClick={() => setShowDiscardModal(true)}
                    className="px-4 py-2 border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition"
                  >
                    Discard
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Info Matrix */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-b pb-6 border-zinc-100">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Blood Group</span>
                  <span className="text-lg font-black text-[#E24B4A] flex items-center gap-1">
                    <Droplet className="w-5 h-5 fill-current" />
                    {unit.bloodGroup}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Component Type</span>
                  <span className="text-sm font-bold text-zinc-800">{unit.component}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Bag / Barcode</span>
                  <span className="text-sm font-bold text-zinc-800">{unit.bagNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Expiry date</span>
                  <span className="text-sm font-bold text-zinc-800 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    {new Date(unit.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Physical Storage */}
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Storage Coordination</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200/60 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Room / Storage Area</span>
                    <strong className="text-zinc-800 text-sm">{unit.storageLocation || "N/A"}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Fridge Number</span>
                    <strong className="text-zinc-800 text-sm">{unit.fridgeNumber || "N/A"}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Shelf Number</span>
                    <strong className="text-zinc-800 text-sm">{unit.shelfNumber || "N/A"}</strong>
                  </div>
                </div>
              </div>

              {/* Lab Clearance details */}
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Lab Screening Record</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  {[
                    { label: "HIV 1&2", val: unit.hivTest },
                    { label: "Hepatitis B", val: unit.hepatitisBTest },
                    { label: "Hepatitis C", val: unit.hepatitisCTest },
                    { label: "Syphilis", val: unit.syphilisTest },
                    { label: "Malaria", val: unit.malariaTest },
                  ].map((t, idx) => (
                    <div key={idx} className="border border-zinc-200 p-2.5 rounded-lg flex flex-col justify-between">
                      <span className="text-zinc-500 block mb-1">{t.label}</span>
                      <strong className={`font-semibold ${t.val === "Positive" ? "text-red-600" : t.val === "Negative" ? "text-green-600" : "text-yellow-600"}`}>
                        {t.val || "Pending"}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* History Timeline */}
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Lifecycle Audit Log</h3>
                <div className="relative border-l border-zinc-200 ml-3 space-y-6">
                  {unit.history?.map((hist, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-2 top-1.5 w-4 h-4 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-400"></div>
                      </div>
                      <div className="text-xs">
                        <div className="flex justify-between items-center mb-0.5">
                          <strong className="text-zinc-950 font-bold text-sm">{hist.action}</strong>
                          <span className="text-[10px] text-zinc-400">{new Date(hist.updatedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-zinc-500 text-xs mb-1">{hist.note}</p>
                        <span className="text-[10px] text-zinc-400 bg-zinc-100 border px-1.5 py-0.5 rounded font-medium">
                          By: {hist.updatedByRole || "System"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 text-center space-y-4">
              <h3 className="font-bold text-zinc-800 text-sm">Safe QR Unit tag</h3>
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 inline-block">
                <img src={qrCodeDataUrl} alt="Unit QR Code" className="w-[180px] h-[180px] mx-auto" />
              </div>
              <p className="text-xs text-zinc-500 px-4">
                Scan this tag with any camera to view compliance checks and matching status safely.
              </p>
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 border border-zinc-200 py-2 rounded-xl text-xs font-bold hover:bg-zinc-50 transition"
              >
                <Printer className="w-4 h-4" /> Print Tag
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reserve Modal */}
      {showReserveModal && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-zinc-100">
              <h3 className="font-bold text-lg text-zinc-900">Reserve Blood Unit</h3>
              <p className="text-xs text-zinc-500 mt-1">Reserve this unit for a confirmed recipient request ID.</p>
            </div>
            <form onSubmit={handleReserve} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Request ID / Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RD2026174"
                  value={reserveForm.requestId}
                  onChange={(e) => setReserveForm({ requestId: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                />
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowReserveModal(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-lg text-xs font-semibold hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#E24B4A] text-white rounded-lg text-xs font-bold hover:bg-[#c93d3c] transition disabled:opacity-50"
                >
                  {actionLoading ? "Reserving..." : "Reserve Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-zinc-100">
              <h3 className="font-bold text-lg text-zinc-900">Issue Blood Unit</h3>
              <p className="text-xs text-zinc-500 mt-1">Dispatch and hand over blood components to the hospital.</p>
            </div>
            <form onSubmit={handleIssue} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">Hospital Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apollo Hospital"
                    value={issueForm.issuedToHospital}
                    onChange={(e) => setIssueForm({ ...issueForm, issuedToHospital: e.target.value })}
                    className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">Receiver Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Sarah Jenkins"
                    value={issueForm.receiverName}
                    onChange={(e) => setIssueForm({ ...issueForm, receiverName: e.target.value })}
                    className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">Receiver Mobile *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={issueForm.receiverMobile}
                    onChange={(e) => setIssueForm({ ...issueForm, receiverMobile: e.target.value })}
                    className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">Transport Mode *</label>
                  <select
                    value={issueForm.transportMode}
                    onChange={(e) => setIssueForm({ ...issueForm, transportMode: e.target.value })}
                    className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                  >
                    <option value="Ambulance">Ambulance Cold Chain</option>
                    <option value="Courier">Specialized Courier</option>
                    <option value="Hand-Carried">Hand-Carried Box</option>
                    <option value="Other">Other Mode</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Hospital Address</label>
                <input
                  type="text"
                  placeholder="Street details and city"
                  value={issueForm.hospitalAddress}
                  onChange={(e) => setIssueForm({ ...issueForm, hospitalAddress: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Remarks / Courier Notes</label>
                <textarea
                  rows="2"
                  placeholder="Temp box details, ice pack condition..."
                  value={issueForm.issueRemarks}
                  onChange={(e) => setIssueForm({ ...issueForm, issueRemarks: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                />
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-lg text-xs font-semibold hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {actionLoading ? "Issuing..." : "Issue Blood"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Used / Transfusion Modal */}
      {showUsedModal && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-zinc-100">
              <h3 className="font-bold text-lg text-zinc-900">Mark Unit Used / Transfused</h3>
              <p className="text-xs text-zinc-500 mt-1">Log usage details and finalize components tracking.</p>
            </div>
            <form onSubmit={handleMarkUsed} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Final Status *</label>
                <select
                  value={usedForm.status}
                  onChange={(e) => setUsedForm({ ...usedForm, status: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                >
                  <option value="Used">Used (General Usage)</option>
                  <option value="Transfused">Transfused (Patient Infused)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Transfusion Confirmed By *</label>
                <input
                  type="text"
                  required
                  placeholder="Doctor or Staff Nurse name"
                  value={usedForm.transfusionConfirmedBy}
                  onChange={(e) => setUsedForm({ ...usedForm, transfusionConfirmedBy: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Usage / Outcome Remarks</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Infused without transfusion reactions"
                  value={usedForm.finalStatusRemarks}
                  onChange={(e) => setUsedForm({ ...usedForm, finalStatusRemarks: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                />
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowUsedModal(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-lg text-xs font-semibold hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Log Outcome"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discard Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-zinc-100">
              <h3 className="font-bold text-lg text-zinc-900 text-red-600">Discard Blood Unit</h3>
              <p className="text-xs text-zinc-500 mt-1">Discard the unit due to temperature excursion, package leakage or other concerns.</p>
            </div>
            <form onSubmit={handleDiscard} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Reason for Discarding *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe non-conformity (e.g. broken cold chain, microleakage)..."
                  value={discardForm.reason}
                  onChange={(e) => setDiscardForm({ reason: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                />
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowDiscardModal(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-lg text-xs font-semibold hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {actionLoading ? "Discarding..." : "Discard Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
