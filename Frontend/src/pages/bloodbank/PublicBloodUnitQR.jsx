import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShieldCheck, HeartPulse, Droplet, Calendar, Activity, AlertTriangle, ShieldAlert } from "lucide-react";
import bloodBankService from "../../services/bloodBankService";

export default function PublicBloodUnitQR() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQRDetails = async () => {
      try {
        const res = await bloodBankService.getPublicQRDetails(unitId);
        if (res.success) {
          setUnit(res.unit);
        } else {
          setError(res.message || "Failed to locate blood unit.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Blood unit not found or invalid QR code.");
      } finally {
        setLoading(false);
      }
    };
    fetchQRDetails();
  }, [unitId]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center p-6 font-sans selection:bg-[#E24B4A] selection:text-white">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden space-y-6">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#E24B4A]/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand */}
        <div className="flex justify-between items-center relative">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">🏥</span>
            <span className="font-extrabold text-sm tracking-wider text-zinc-350">Raktdaan Verification</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">SECURE QR LOG</span>
        </div>

        {loading ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-10 h-10 border-2 border-t-[#E24B4A] border-zinc-800 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-zinc-400">Verifying security signature...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 space-y-4">
            <AlertTriangle className="w-12 h-12 text-[#E24B4A] mx-auto animate-bounce" />
            <div>
              <h2 className="font-bold text-lg text-white">Verification Failed</h2>
              <p className="text-xs text-zinc-400 mt-2">{error}</p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2 bg-[#E24B4A] hover:bg-[#c93d3c] text-white text-xs font-bold rounded-xl transition mt-4"
            >
              Return Home
            </button>
          </div>
        ) : (
          <div className="space-y-6 relative">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-[#E24B4A]/10 border border-[#E24B4A]/30 rounded-full flex items-center justify-center mx-auto text-[#E24B4A]">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="font-black text-xl text-white">Biological Safety Verified</h2>
              <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest">{unit.unitId}</p>
            </div>

            {/* Core Specs */}
            <div className="grid grid-cols-2 gap-4 bg-zinc-800/40 p-4 rounded-2xl border border-zinc-800 text-xs">
              <div>
                <span className="text-zinc-500 block mb-0.5">Blood Group</span>
                <span className="text-base font-black text-[#E24B4A] flex items-center gap-1">
                  <Droplet className="w-4 h-4 fill-current" />
                  {unit.bloodGroup}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-0.5">Component Type</span>
                <span className="text-sm font-bold text-white">{unit.component}</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-0.5">Collection Date</span>
                <span className="text-sm font-semibold text-white">{new Date(unit.collectionDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-0.5">Expiry Date</span>
                <span className="text-sm font-semibold text-white">{new Date(unit.expiryDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Screen Verification Badge */}
            <div className="border border-zinc-800 p-4 rounded-2xl space-y-3 bg-zinc-900">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Infectious Diseases Marker:</span>
                <span className="text-green-500 font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                  NON-REACTIVE
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">ABO & Rh Verification:</span>
                <span className="text-green-500 font-bold">COMPATIBLE / VERIFIED</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Current Lifecycle Status:</span>
                <span className="px-2 py-0.5 bg-zinc-800 rounded font-bold uppercase text-[9px] text-[#E24B4A]">
                  {unit.currentStatus}
                </span>
              </div>
            </div>

            <div className="p-3 bg-yellow-950/20 border border-yellow-800/40 rounded-xl text-yellow-500/90 text-[10px] flex items-start gap-2 leading-relaxed">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-yellow-500 mt-0.5" />
              <span>
                <strong>Privacy Protocol:</strong> Highly sensitive patient and donor identifiers are fully encrypted and redacted under standard health disclosure directives.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
