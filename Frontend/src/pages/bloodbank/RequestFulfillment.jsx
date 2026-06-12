import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Activity, CheckCircle, Clock, FileText, Heart, ShieldAlert,
  User, CheckSquare, ClipboardList, ShieldCheck, CreditCard,
  KeyRound, ShieldX
} from "lucide-react";

export default function RequestFulfillment() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [crossMatchBy, setCrossMatchBy] = useState("");
  const [crossMatchRemarks, setCrossMatchRemarks] = useState("");
  const [slipsChecked, setSlipsChecked] = useState(false);
  const [patientIdChecked, setPatientIdChecked] = useState(false);
  const [receiverIdChecked, setReceiverIdChecked] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverMobile, setReceiverMobile] = useState("");
  const [transportMode, setTransportMode] = useState("Cold Box");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState(5);
  const [transfusionConfirmedBy, setTransfusionConfirmedBy] = useState("");
  const [finalRemarks, setFinalRemarks] = useState("");

  const token = localStorage.getItem("bloodBankToken") || localStorage.getItem("token") || localStorage.getItem("bloodbank-token") || localStorage.getItem("admin-token");

  const fetchRequestDetails = async () => {
    try {
      const res = await fetch(`/api/request-flow/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRequest(data.data);
        setOtpAttemptsLeft(5 - (data.data.otpAttempts || 0));
        // Prefill check lists if already verified
        setSlipsChecked(data.data.requisitionSlipVerified || false);
        setPatientIdChecked(data.data.patientIdVerified || false);
        setReceiverIdChecked(data.data.receiverIdVerified || false);
        setCrossMatchBy(data.data.crossMatchBy || "");
        setCrossMatchRemarks(data.data.crossMatchRemarks || "");

        // If status is accepted, load available units
        if (data.data.status === "accepted") {
          fetchAvailableUnits(data.data.bloodGroup, data.data.bloodComponent || data.data.component || "Whole Blood");
        }
      } else {
        toast.error(data.message || "Failed to load details");
      }
    } catch (err) {
      toast.error("Error fetching request details");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUnits = async (bloodGroup, component) => {
    try {
      const compVal = (component && component !== "undefined") ? component : "Whole Blood";
      const res = await fetch(
        `/api/inventory/available-units?bloodGroup=${encodeURIComponent(bloodGroup)}&component=${encodeURIComponent(compVal)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setAvailableUnits(data.units);
      }
    } catch (err) {
      toast.error("Failed to fetch matching blood units");
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const handleAccept = async () => {
    try {
      const res = await fetch(`/api/request-flow/${requestId}/accept`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Request accepted successfully");
        fetchRequestDetails();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Error accepting request");
    }
  };

  const handleReject = async () => {
    const reason = prompt("Please enter the reason for rejection:");
    if (reason === null) return;
    try {
      const res = await fetch(`/api/blood-requests/${requestId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "rejected", reason })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Request rejected");
        navigate("/bloodbank/inventory");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Error rejecting request");
    }
  };

  const handleReserve = async () => {
    if (selectedUnits.length !== request.units) {
      toast.error(`Please select exactly ${request.units} units`);
      return;
    }
    try {
      const res = await fetch(`/api/request-flow/${requestId}/reserve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ unitIds: selectedUnits })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Units reserved successfully");
        fetchRequestDetails();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Error reserving units");
    }
  };

  const handleCrossMatch = async () => {
    if (!crossMatchBy.trim()) {
      toast.error("Please fill in who performed the cross-match");
      return;
    }
    try {
      const res = await fetch(`/api/request-flow/${requestId}/cross-match`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ crossMatchBy, crossMatchRemarks })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Cross-match details saved");
        fetchRequestDetails();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Error saving cross-match details");
    }
  };

  const handleVerifyDocs = async () => {
    if (!slipsChecked || !patientIdChecked || !receiverIdChecked) {
      toast.error("All document checkboxes must be verified");
      return;
    }
    try {
      const res = await fetch(`/api/request-flow/${requestId}/verify-documents`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requisitionSlipVerified: slipsChecked,
          patientIdVerified: patientIdChecked,
          receiverIdVerified: receiverIdChecked
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Documents checklist verified");
        fetchRequestDetails();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Error verifying documents");
    }
  };

  const handleVerifyOtpAndIssue = async () => {
    if (!receiverName.trim() || !receiverMobile.trim()) {
      toast.error("Receiver Name and Mobile are required");
      return;
    }
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 4) {
      toast.error("Please enter a 4-digit OTP");
      return;
    }

    try {
      const res = await fetch(`/api/request-flow/${requestId}/verify-otp-issue`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          otp: enteredOtp,
          receiverName,
          receiverMobile,
          transportMode
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("OTP verified & Blood Units issued successfully!");
        fetchRequestDetails();
      } else {
        toast.error(data.message);
        fetchRequestDetails(); // refresh attempts count
      }
    } catch (err) {
      toast.error("Error verifying OTP & issuing blood");
    }
  };

  const handleComplete = async () => {
    if (!transfusionConfirmedBy.trim()) {
      toast.error("Transfusion confirmation signature/name is required");
      return;
    }
    try {
      const res = await fetch(`/api/request-flow/${requestId}/complete`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          transfusionConfirmedBy,
          finalRemarks
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Transfusion confirmed. Request marked complete.");
        fetchRequestDetails();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Error completing request");
    }
  };

  const handleUnitToggle = (id) => {
    if (selectedUnits.includes(id)) {
      setSelectedUnits(selectedUnits.filter(uid => uid !== id));
    } else {
      if (selectedUnits.length >= request.units) {
        toast.error(`You can only select up to ${request.units} units`);
        return;
      }
      setSelectedUnits([...selectedUnits, id]);
    }
  };

  const copyPaymentLink = () => {
    const link = `${window.location.origin}/recipient/request/${requestId}/payment`;
    navigator.clipboard.writeText(link);
    toast.success("Payment page link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#E24B4A] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold">Loading request fulfillment workflow...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-red-500 font-bold">Request not found or access denied.</p>
      </div>
    );
  }

  // Step Status Helper
  const getStepStatus = (stepNumber) => {
    const statusMap = {
      1: "completed", // Details card
      2: request.status !== "pending" && request.status !== "active" ? "completed" : "current",
      3: ["reserved", "ready_for_pickup", "issued", "completed"].includes(request.status) ? "completed" : (request.status === "accepted" ? "current" : "upcoming"),
      4: request.crossMatchDone ? "completed" : (request.status === "reserved" ? "current" : "upcoming"),
      5: request.documentsVerified ? "completed" : (["reserved"].includes(request.status) && request.crossMatchDone ? "current" : "upcoming"),
      6: request.paymentStatus === "paid" ? "completed" : (["reserved", "ready_for_pickup"].includes(request.status) ? "current" : "upcoming"),
      7: ["issued", "completed"].includes(request.status) ? "completed" : (request.status === "ready_for_pickup" ? "current" : "upcoming"),
      8: request.status === "completed" ? "completed" : (request.status === "issued" ? "current" : "upcoming"),
    };
    return statusMap[stepNumber];
  };

  return (
    <div className="min-h-screen bg-[#f4f4f5] text-zinc-800 flex flex-col lg:flex-row pb-12 pt-6">
      
      {/* LEFT: Stepper Core */}
      <div className="flex-grow max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="mb-8 flex items-center justify-between border-b border-zinc-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-3">
              <Activity className="text-[#E24B4A] animate-pulse" /> Blood Request Fulfillment Flow
            </h1>
            <p className="text-zinc-500 text-xs mt-1">ID: <span className="font-mono text-zinc-700 font-bold">{request.requestId}</span></p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
            request.status === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
            request.status === "issued" ? "bg-blue-50 text-blue-700 border border-blue-200" :
            request.status === "ready_for_pickup" ? "bg-amber-50 text-amber-700 border border-amber-200" :
            "bg-zinc-200 text-zinc-700"
          }`}>
            {request.status}
          </span>
        </div>

        <div className="space-y-6">

          {/* STEP 1: Details */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#E24B4A]/5 rounded-bl-full flex items-center justify-center">
              <Heart size={36} className="text-[#E24B4A]/10" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">1</span>
              <h2 className="text-md font-bold text-zinc-900">Patient & Request Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <span className="text-zinc-500 text-xs block uppercase tracking-wider font-semibold">Patient Name</span>
                <span className="font-bold text-zinc-800 mt-1 block">{request.patientName}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block uppercase tracking-wider font-semibold">Blood Group / Component</span>
                <span className="font-bold text-zinc-800 mt-1 block flex items-center gap-2">
                  <span className="bg-[#E24B4A]/10 text-[#E24B4A] px-2 py-0.5 rounded text-xs font-black">{request.bloodGroup}</span>
                  <span className="text-zinc-500">({request.bloodComponent || request.component || "Whole Blood"})</span>
                </span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block uppercase tracking-wider font-semibold">Units Required</span>
                <span className="font-bold text-zinc-800 mt-1 block">{request.units} Unit(s)</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block uppercase tracking-wider font-semibold">Hospital & Location</span>
                <span className="font-bold text-zinc-800 mt-1 block">{request.hospital} ({request.city || "Pune"})</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block uppercase tracking-wider font-semibold">Urgency</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 mt-1 rounded-full text-xs font-bold ${
                  request.urgency === "urgent" ? "bg-red-50 text-red-700 border border-red-100" : "bg-zinc-100 text-zinc-600"
                }`}>
                  {request.urgency === "urgent" ? "🚨 Urgent" : "📅 Planned"}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block uppercase tracking-wider font-semibold">Requester Mobile</span>
                <span className="font-bold text-zinc-800 mt-1 block">{request.requesterMobile || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* STEP 2: Accept Request */}
          <div className={`bg-white border rounded-2xl p-6 shadow-sm transition duration-200 ${
            getStepStatus(2) === "current" ? "border-[#E24B4A] ring-1 ring-[#E24B4A]" : "border-zinc-200 opacity-95"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  getStepStatus(2) === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-700"
                }`}>2</span>
                <h2 className="text-md font-bold text-zinc-900">Accept Request</h2>
              </div>
              {getStepStatus(2) === "completed" && <CheckCircle className="text-emerald-600 w-5 h-5" />}
            </div>
            {request.status === "pending" || request.status === "active" ? (
              <div className="flex items-center gap-4 mt-4">
                <button
                  onClick={handleAccept}
                  className="bg-[#E24B4A] hover:bg-[#c93d3c] text-white px-6 py-2.5 rounded-xl font-bold transition duration-200 cursor-pointer"
                >
                  Accept Request
                </button>
                <button
                  onClick={handleReject}
                  className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-zinc-800 px-6 py-2.5 rounded-xl font-bold transition duration-200 cursor-pointer"
                >
                  Reject
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">
                Accepted by Blood Bank on {request.acceptedAt ? new Date(request.acceptedAt).toLocaleString() : "N/A"}.
              </p>
            )}
          </div>

          {/* STEP 3: Reserve Units */}
          <div className={`bg-white border rounded-2xl p-6 shadow-sm transition duration-200 ${
            getStepStatus(3) === "current" ? "border-[#E24B4A] ring-1 ring-[#E24B4A]" : "border-zinc-200 opacity-95"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  getStepStatus(3) === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-700"
                }`}>3</span>
                <h2 className="text-md font-bold text-zinc-900">Reserve Blood Units</h2>
              </div>
              {getStepStatus(3) === "completed" && <CheckCircle className="text-emerald-600 w-5 h-5" />}
            </div>
            {request.status === "accepted" ? (
              <div>
                <p className="text-zinc-500 text-xs mb-3 font-semibold">
                  FIFO (First In First Out) ke rules ke hisab se expiring units pehle select karein. Select exactly <strong>{request.units}</strong> units.
                </p>
                {availableUnits.length === 0 ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 text-xs">
                    <ShieldAlert size={18} />
                    <span>Inventory mein target blood group/component ke available units nahi hain!</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-zinc-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                          <th className="p-3">Select</th>
                          <th className="p-3">Unit ID</th>
                          <th className="p-3">Bag Number</th>
                          <th className="p-3">Volume (ML)</th>
                          <th className="p-3">Expiry Date</th>
                          <th className="p-3">Storage Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableUnits.map(unit => (
                          <tr key={unit._id} className="border-t border-zinc-200 hover:bg-zinc-50 transition duration-150">
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={selectedUnits.includes(unit._id)}
                                onChange={() => handleUnitToggle(unit._id)}
                                className="accent-[#E24B4A]"
                              />
                            </td>
                            <td className="p-3 font-mono font-bold text-zinc-900">{unit.unitId}</td>
                            <td className="p-3 text-zinc-700">{unit.bagNumber || "N/A"}</td>
                            <td className="p-3 text-zinc-700">{unit.volumeML}</td>
                            <td className="p-3 text-zinc-700">{new Date(unit.expiryDate).toLocaleDateString()}</td>
                            <td className="p-3 text-zinc-700">{unit.storageLocation || "Fridge 1"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <button
                  onClick={handleReserve}
                  disabled={selectedUnits.length !== request.units}
                  className="mt-4 bg-[#E24B4A] hover:bg-[#c93d3c] disabled:opacity-40 disabled:hover:bg-[#E24B4A] text-white px-6 py-2.5 rounded-xl font-bold transition duration-200 cursor-pointer"
                >
                  Reserve Selected Units
                </button>
              </div>
            ) : (
              request.reservedUnitIds && request.reservedUnitIds.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1 font-semibold">Reserved Units:</p>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {request.reservedUnits?.map((unit, idx) => (
                      <span key={idx} className="bg-zinc-50 border border-zinc-200 text-xs px-3 py-1.5 rounded-lg font-mono font-bold text-zinc-800">
                        🩸 {unit.unitId}
                      </span>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>

          {/* STEP 4: Cross-match */}
          <div className={`bg-white border rounded-2xl p-6 shadow-sm transition duration-200 ${
            getStepStatus(4) === "current" ? "border-[#E24B4A] ring-1 ring-[#E24B4A]" : "border-zinc-200 opacity-95"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  getStepStatus(4) === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-700"
                }`}>4</span>
                <h2 className="text-md font-bold text-zinc-900">Cross-match Verification</h2>
              </div>
              {getStepStatus(4) === "completed" && <CheckCircle className="text-emerald-600 w-5 h-5" />}
            </div>
            {request.status === "reserved" && !request.crossMatchDone ? (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800 text-xs">
                  <ClipboardList size={22} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">Laboratory Note:</span>
                    <span>Cross-match physically lab/screening center mein hota hai. Yahan operator ko sirf verification complete karne ke baad result record karna hai.</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1.5 font-bold">Cross-matched By (Staff Name)</label>
                    <input
                      type="text"
                      value={crossMatchBy}
                      onChange={e => setCrossMatchBy(e.target.value)}
                      placeholder="e.g. Dr. Ramesh Patil"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-800 focus:border-[#E24B4A] focus:bg-white focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1.5 font-bold">Lab Remarks</label>
                    <input
                      type="text"
                      value={crossMatchRemarks}
                      onChange={e => setCrossMatchRemarks(e.target.value)}
                      placeholder="e.g. Compatible"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-800 focus:border-[#E24B4A] focus:bg-white focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCrossMatch}
                  className="bg-[#E24B4A] hover:bg-[#c93d3c] text-white px-6 py-2.5 rounded-xl font-bold transition duration-200 cursor-pointer"
                >
                  Mark Cross-match Done
                </button>
              </div>
            ) : (
              request.crossMatchDone && (
                <p className="text-xs text-zinc-500">
                  Cross-match completed by {request.crossMatchBy} on {request.crossMatchAt ? new Date(request.crossMatchAt).toLocaleString() : "N/A"}. Remarks: {request.crossMatchRemarks || "None"}
                </p>
              )
            )}
          </div>

          {/* STEP 5: Verify Documents Checklist */}
          <div className={`bg-white border rounded-2xl p-6 shadow-sm transition duration-200 ${
            getStepStatus(5) === "current" ? "border-[#E24B4A] ring-1 ring-[#E24B4A]" : "border-zinc-200 opacity-95"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  getStepStatus(5) === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-700"
                }`}>5</span>
                <h2 className="text-md font-bold text-zinc-900">Document Checklist Verification</h2>
              </div>
              {getStepStatus(5) === "completed" && <CheckCircle className="text-emerald-600 w-5 h-5" />}
            </div>
            {!request.documentsVerified ? (
              <div className="space-y-4">
                <p className="text-zinc-500 text-xs font-semibold">Verify physical/upload documents before checking:</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 hover:border-zinc-300 transition duration-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={slipsChecked}
                      onChange={e => setSlipsChecked(e.target.checked)}
                      className="w-4 h-4 accent-[#E24B4A]"
                    />
                    <div className="text-xs">
                      <span className="text-zinc-800 font-bold block">Doctor Requisition Slip Verified</span>
                      <span className="text-zinc-500">Hospital form with doctor stamp & signature</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 hover:border-zinc-300 transition duration-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={patientIdChecked}
                      onChange={e => setPatientIdChecked(e.target.checked)}
                      className="w-4 h-4 accent-[#E24B4A]"
                    />
                    <div className="text-xs">
                      <span className="text-zinc-800 font-bold block">Patient ID Proof Verified</span>
                      <span className="text-zinc-500">Aadhaar, PAN Card or Hospital ID proof</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 hover:border-zinc-300 transition duration-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={receiverIdChecked}
                      onChange={e => setReceiverIdChecked(e.target.checked)}
                      className="w-4 h-4 accent-[#E24B4A]"
                    />
                    <div className="text-xs">
                      <span className="text-zinc-800 font-bold block">Receiver ID Proof Verified</span>
                      <span className="text-zinc-500">Handover receiver original government ID check</span>
                    </div>
                  </label>
                </div>
                <button
                  onClick={handleVerifyDocs}
                  disabled={!slipsChecked || !patientIdChecked || !receiverIdChecked}
                  className="bg-[#E24B4A] hover:bg-[#c93d3c] disabled:opacity-40 disabled:hover:bg-[#E24B4A] text-white px-6 py-2.5 rounded-xl font-bold transition duration-200 cursor-pointer"
                >
                  Verify Documents & Update Checklist
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">
                All documents successfully verified by {request.documentsVerifiedBy} on {request.documentsVerifiedAt ? new Date(request.documentsVerifiedAt).toLocaleString() : "N/A"}.
              </p>
            )}
          </div>

          {/* STEP 6: Payment Processing Fee */}
          <div className={`bg-white border rounded-2xl p-6 shadow-sm transition duration-200 ${
            getStepStatus(6) === "current" ? "border-[#E24B4A] ring-1 ring-[#E24B4A]" : "border-zinc-200 opacity-95"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  getStepStatus(6) === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-700"
                }`}>6</span>
                <h2 className="text-md font-bold text-zinc-900">Blood Processing Fee</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                  request.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  {request.paymentStatus === "paid" ? "Paid" : "Pending"}
                </span>
                {getStepStatus(6) === "completed" && <CheckCircle className="text-emerald-600 w-5 h-5" />}
              </div>
            </div>
            {request.paymentStatus !== "paid" ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                  <div>
                    <span className="text-zinc-500 text-xs font-semibold">Total Processing Fee</span>
                    <h3 className="text-xl font-black text-zinc-900 mt-1">
                      ₹{(((request.bloodComponent || request.component) === "Platelets" || (request.bloodComponent || request.component) === "Plasma" ? 300 : 1100) * request.units).toLocaleString()}
                    </h3>
                  </div>
                  <button
                     onClick={copyPaymentLink}
                     className="bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 px-4 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer shadow-sm"
                  >
                    Copy Payment Page Link
                  </button>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800 text-xs">
                  <CreditCard size={18} />
                  <span>Recipient ko payment link unke tracking panel (status page) mein dikh raha hai. Payment safe checkout se hoga.</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 font-semibold">
                Payment verified successfully on {request.paidAt ? new Date(request.paidAt).toLocaleString() : "N/A"}. Amount: ₹{request.paymentAmount}.
              </p>
            )}
          </div>

          {/* STEP 7: OTP Handover & Issue */}
          <div className={`bg-white border rounded-2xl p-6 shadow-sm transition duration-200 ${
            getStepStatus(7) === "current" ? "border-[#E24B4A] ring-1 ring-[#E24B4A]" : "border-zinc-200 opacity-95"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  getStepStatus(7) === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-700"
                }`}>7</span>
                <h2 className="text-md font-bold text-zinc-900">Secure OTP Handover & Issue</h2>
              </div>
              {getStepStatus(7) === "completed" && <CheckCircle className="text-emerald-600 w-5 h-5" />}
            </div>
            {request.status === "ready_for_pickup" ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-emerald-800 text-xs">
                  <ShieldCheck size={22} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">Verification Completed:</span>
                    <span>All checks (cross-match, documents, payment) are completed. OTP recipient ke WhatsApp/mobile number pe successfully send kar diya gaya hai.</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1.5 font-bold">Receiver Full Name</label>
                    <input
                      type="text"
                      value={receiverName}
                      onChange={e => setReceiverName(e.target.value)}
                      placeholder="Name of person picking up"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-800 focus:border-[#E24B4A] focus:bg-white focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1.5 font-bold">Receiver Mobile Number</label>
                    <input
                      type="text"
                      value={receiverMobile}
                      onChange={e => setReceiverMobile(e.target.value)}
                      placeholder="Mobile number"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-800 focus:border-[#E24B4A] focus:bg-white focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1.5 font-bold">Transport Mode</label>
                    <select
                      value={transportMode}
                      onChange={e => setTransportMode(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-800 focus:border-[#E24B4A] focus:bg-white focus:outline-none transition-all duration-200"
                    >
                      <option value="Cold Box">Cold Box (Recommended)</option>
                      <option value="Thermos Flask">Thermos Flask</option>
                      <option value="Ice Pack Carrier">Ice Pack Carrier</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs text-zinc-500 block mb-2 font-bold">Enter Handover OTP (4-Digit)</label>
                  <div className="flex gap-3">
                    {otp.map((val, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        maxLength="1"
                        value={val}
                        onChange={e => {
                          const newOtp = [...otp];
                          newOtp[idx] = e.target.value.slice(-1);
                          setOtp(newOtp);
                          if (e.target.value && idx < 3) {
                            document.getElementById(`otp-input-${idx + 1}`).focus();
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === "Backspace" && !otp[idx] && idx > 0) {
                            document.getElementById(`otp-input-${idx - 1}`).focus();
                          }
                        }}
                        className="w-12 h-12 bg-zinc-50 border border-zinc-200 rounded-xl text-center text-lg font-bold text-zinc-900 focus:border-[#E24B4A] focus:bg-white focus:outline-none transition-all duration-200"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600 font-bold">
                    <KeyRound size={14} />
                    <span>Attempts left: {otpAttemptsLeft}</span>
                  </div>
                </div>

                <button
                  onClick={handleVerifyOtpAndIssue}
                  className="mt-4 bg-[#E24B4A] hover:bg-[#c93d3c] text-white px-6 py-2.5 rounded-xl font-bold transition duration-200 cursor-pointer"
                >
                  Verify OTP & Issue Blood
                </button>
              </div>
            ) : (
              request.status === "issued" || request.status === "completed" ? (
                <p className="text-xs text-zinc-500 font-semibold">
                  Issued to {request.receiverName} ({request.receiverMobile}) on {request.issuedAt ? new Date(request.issuedAt).toLocaleString() : "N/A"}.
                </p>
              ) : (
                <p className="text-xs text-zinc-400 font-semibold">Pending completions of previous checks (Cross-match, Documents, and Payment).</p>
              )
            )}
          </div>

          {/* STEP 8: Hospital Transfusion / Complete */}
          <div className={`bg-white border rounded-2xl p-6 shadow-sm transition duration-200 ${
            getStepStatus(8) === "current" ? "border-[#E24B4A] ring-1 ring-[#E24B4A]" : "border-zinc-200 opacity-95"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  getStepStatus(8) === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-700"
                }`}>8</span>
                <h2 className="text-md font-bold text-zinc-900">Transfusion Confirmation & Completion</h2>
              </div>
              {getStepStatus(8) === "completed" && <CheckCircle className="text-emerald-600 w-5 h-5" />}
            </div>
            {request.status === "issued" ? (
              <div className="space-y-4">
                <p className="text-zinc-500 text-xs font-semibold">Verify transfusion outcome details received from the hospital:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1.5 font-bold">Transfusion Confirmed By (Doctor/Nurse Name)</label>
                    <input
                      type="text"
                      value={transfusionConfirmedBy}
                      onChange={e => setTransfusionConfirmedBy(e.target.value)}
                      placeholder="e.g. Nurse Stella"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-800 focus:border-[#E24B4A] focus:bg-white focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1.5 font-bold">Final Remarks</label>
                    <input
                      type="text"
                      value={finalRemarks}
                      onChange={e => setFinalRemarks(e.target.value)}
                      placeholder="e.g. Success, no complications"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-800 focus:border-[#E24B4A] focus:bg-white focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>
                <button
                  onClick={handleComplete}
                  className="bg-[#E24B4A] hover:bg-[#c93d3c] text-white px-6 py-2.5 rounded-xl font-bold transition duration-200 cursor-pointer"
                >
                  Mark Request Completed
                </button>
              </div>
            ) : (
              request.status === "completed" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-xs text-emerald-700 font-bold mb-1">🎉 Flow completed successfully!</p>
                  <p className="text-xs text-zinc-500 font-semibold">
                    Transfusion confirmed by {request.transfusionConfirmedBy} on {request.completedAt ? new Date(request.completedAt).toLocaleString() : "N/A"}.
                  </p>
                </div>
              )
            )}
          </div>

        </div>
      </div>

      {/* RIGHT SIDEBAR: Status History Timeline */}
      <div className="w-full lg:w-80 px-6 py-4 shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-200 mt-6 lg:mt-0">
        <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Clock className="text-[#E24B4A]" size={16} /> Audit Timeline
        </h3>
        {request.statusHistory && request.statusHistory.length > 0 ? (
          <div className="relative border-l border-zinc-200 pl-4 space-y-6">
            {request.statusHistory.map((history, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[21px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border border-[#E24B4A]" />
                <span className="text-[10px] text-zinc-400 block font-bold">{new Date(history.updatedAt).toLocaleString()}</span>
                <span className="text-xs font-black text-zinc-800 mt-1 block uppercase">{history.status} - {history.action}</span>
                <p className="text-xs text-zinc-600 mt-1 font-medium">{history.note}</p>
                <span className="text-[10px] text-zinc-400 block mt-1 font-semibold">Updated by: {history.updatedBy} ({history.updatedByRole})</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-400 italic font-semibold">No history logged yet.</p>
        )}
      </div>

    </div>
  );
}
