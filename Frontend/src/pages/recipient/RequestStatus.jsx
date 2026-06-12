import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Activity, Clock, Heart, ShieldCheck, CheckCircle2, ChevronRight, KeyRound } from "lucide-react";

export default function RequestStatus() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("jwt_token") || localStorage.getItem("token") || localStorage.getItem("recipient-token");

  const fetchRequestDetails = async () => {
    try {
      const res = await fetch(`/api/request-flow/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRequest(data.data);
      } else {
        toast.error(data.message || "Failed to load request details");
      }
    } catch (err) {
      toast.error("Error loading request details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E24B4A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-red-500 font-bold">Request not found.</p>
      </div>
    );
  }

  // Define steps
  const steps = [
    { label: "Pending", statusKey: "pending" },
    { label: "Accepted", statusKey: "accepted" },
    { label: "Reserved", statusKey: "reserved" },
    { label: "Payment", statusKey: "payment" },
    { label: "Ready", statusKey: "ready_for_pickup" },
    { label: "Issued", statusKey: "issued" },
    { label: "Completed", statusKey: "completed" }
  ];

  // Get current step index based on status
  const getActiveStepIndex = () => {
    const status = request.status;
    if (status === "pending" || status === "active") return 0;
    if (status === "accepted") return 1;
    if (status === "reserved") {
      // If reserved but payment is done, it's pending ready_for_pickup checklist verification,
      // otherwise it stands at reserved step.
      return 2;
    }
    if (status === "ready_for_pickup") return 4; // ready
    if (status === "issued") return 5;
    if (status === "completed") return 6;
    return -1;
  };

  const activeIndex = getActiveStepIndex();

  return (
    <div className="min-h-screen bg-[#f4f4f5] text-zinc-800 pt-28 pb-12 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Title and ID */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-3">
              <Heart className="text-[#E24B4A] animate-pulse" /> Blood Request Tracking
            </h1>
            <p className="text-zinc-500 text-xs mt-1">Request Ref: <span className="font-mono text-zinc-700 font-bold">{request.requestId}</span></p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider self-start md:self-auto ${
            request.status === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
            request.status === "issued" ? "bg-blue-50 text-blue-700 border border-blue-200" :
            request.status === "ready_for_pickup" ? "bg-amber-50 text-amber-700 border border-amber-200" :
            "bg-zinc-200 text-zinc-700"
          }`}>
            {request.status}
          </span>
        </div>

        {/* Horizontal Progress Bar */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm mb-8">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6">Live Status Timeline</h3>
          <div className="flex flex-col md:flex-row items-center justify-between relative gap-6 md:gap-0">
            {/* Connector Line (Desktop Only) */}
            <div className="absolute top-4 left-0 w-full h-0.5 bg-zinc-100 z-0 hidden md:block" />
            <div 
              className="absolute top-4 left-0 h-0.5 bg-[#E24B4A] z-0 hidden md:block transition-all duration-500" 
              style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step, idx) => {
              const isCompleted = idx < activeIndex || (step.statusKey === "payment" && request.paymentStatus === "paid") || request.status === "completed";
              const isCurrent = idx === activeIndex;

              return (
                <div key={idx} className="flex md:flex-col items-center z-10 w-full md:w-auto relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition duration-300 ${
                    isCompleted ? "bg-[#E24B4A] border-[#E24B4A] text-white" :
                    isCurrent ? "bg-white border-[#E24B4A] text-[#E24B4A] shadow-[0_0_15px_rgba(226,75,74,0.15)] animate-pulse" :
                    "bg-white border-zinc-200 text-zinc-400"
                  }`}>
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                  <span className={`ml-4 md:ml-0 md:mt-2 text-xs font-bold transition duration-300 ${
                    isCompleted || isCurrent ? "text-zinc-900" : "text-zinc-400"
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current State Details & Call To Action */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            
            {/* Main Action Banner */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#E24B4A]/5 rounded-bl-full pointer-events-none" />

              {request.status === "ready_for_pickup" && (
                <div>
                  <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mb-4 border border-amber-100">
                    <KeyRound size={24} />
                  </div>
                  <h2 className="text-lg font-black text-zinc-900">OTP Sent to WhatsApp!</h2>
                  <p className="text-zinc-600 text-xs mt-2 leading-relaxed font-semibold">
                    Aapki verification complete ho gayi hai. **Secure handover OTP** aapke registered WhatsApp/mobile number pe send kiya gaya hai.
                  </p>

                  {request.otp && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-800 uppercase tracking-widest font-black block">Handover OTP (For Testing)</span>
                        <span className="text-2xl font-mono font-black text-emerald-700 tracking-widest mt-1 block">{request.otp}</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 bg-emerald-100/50 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                        Active
                      </span>
                    </div>
                  )}

                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 mt-4 text-xs text-zinc-500 font-semibold">
                    💡 <strong>Note:</strong> Yeh OTP blood bank operator ko secure handover complete karne ke liye batayein.
                  </div>
                </div>
              )}

              {request.status === "reserved" && request.paymentStatus !== "paid" && (
                <div>
                  <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mb-4 border border-amber-100">
                    <Clock size={24} />
                  </div>
                  <h2 className="text-lg font-black text-zinc-900">Payment Processing Fee Required</h2>
                  <p className="text-zinc-600 text-xs mt-2 leading-relaxed font-semibold">
                    Blood Bank ne units reserve kar li hain. Processing flow ko aage badhane ke liye processing fee pay karein.
                  </p>
                  <button
                    onClick={() => navigate(`/recipient/request/${requestId}/payment`)}
                    className="mt-6 bg-[#E24B4A] hover:bg-[#c93d3c] text-white px-6 py-3 rounded-2xl text-xs font-black transition duration-200 cursor-pointer shadow-[0_10px_20px_rgba(226,75,74,0.15)] flex items-center gap-1.5"
                  >
                    Pay Processing Fee <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {request.status === "reserved" && request.paymentStatus === "paid" && (
                <div>
                  <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mb-4 border border-amber-100">
                    <Clock size={24} />
                  </div>
                  <h2 className="text-lg font-black text-zinc-900">Verification in Progress</h2>
                  <p className="text-zinc-600 text-xs mt-2 leading-relaxed font-semibold">
                    Payment receive ho chuka hai. Blood Bank laboratory cross-match aur document checklist check kar raha hai. Flow jald hi transition hoga.
                  </p>
                </div>
              )}

              {request.status === "completed" && (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                    <CheckCircle2 size={24} />
                  </div>
                  <h2 className="text-lg font-black text-zinc-900">Request Completed Successfully!</h2>
                  <p className="text-zinc-600 text-xs mt-2 leading-relaxed font-semibold">
                    Transfusion confirmed successfully. Raktdaan aapke jald swasth hone ki kamna karta hai!
                  </p>
                </div>
              )}

              {["pending", "active", "accepted"].includes(request.status) && (
                <div>
                  <div className="w-12 h-12 bg-zinc-50 border border-zinc-200 text-zinc-400 rounded-2xl flex items-center justify-center mb-4">
                    <Clock size={24} />
                  </div>
                  <h2 className="text-lg font-black text-zinc-900">Awaiting Blood Bank Acceptance</h2>
                  <p className="text-zinc-600 text-xs mt-2 leading-relaxed font-semibold">
                    Request submitted. Blood bank operators options review kar rahe hain. Update hone pe WhatsApp par notification aayega.
                  </p>
                </div>
              )}

            </div>

            {/* Request Summary Card */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider mb-4">Request Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-zinc-400 block font-semibold">Patient Name</span>
                  <span className="text-zinc-800 font-bold block mt-1">{request.patientName}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-semibold">Blood Group / Component</span>
                  <span className="text-zinc-800 font-bold block mt-1">{request.bloodGroup} ({request.bloodComponent || request.component || "Not specified"})</span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-semibold">Required Units</span>
                  <span className="text-zinc-800 font-bold block mt-1">{request.units} Unit(s)</span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-semibold">Hospital Venue</span>
                  <span className="text-zinc-800 font-bold block mt-1">{request.hospital}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Audit Timeline */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm h-fit">
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock size={16} className="text-[#E24B4A]" /> Progress History
            </h3>
            {request.statusHistory && request.statusHistory.length > 0 ? (
              <div className="relative border-l border-zinc-200 pl-4 space-y-6">
                {request.statusHistory.map((history, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#E24B4A]" />
                    <span className="text-[10px] text-zinc-400 block font-bold">{new Date(history.updatedAt).toLocaleDateString()}</span>
                    <span className="text-xs font-bold text-zinc-800 mt-1 block uppercase">{history.status}</span>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">{history.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic font-semibold">No progress logs found.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
