import React, { useState, useEffect } from "react";
import { AlertCircle, RefreshCw, Trash2, Calendar, Droplet, ArrowRight, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import bloodBankService from "../../services/bloodBankService";
import { useNavigate } from "react-router-dom";

export default function ExpiryAlerts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expiringUnits, setExpiringUnits] = useState([]);
  const [expiredUnits, setExpiredUnits] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchExpiryData = async () => {
    setLoading(true);
    try {
      const expiringRes = await bloodBankService.getBloodUnits({ expiryStatus: "expiring_soon" });
      const expiredRes = await bloodBankService.getBloodUnits({ expiryStatus: "expired" });

      if (expiringRes.success) {
        setExpiringUnits(expiringRes.units);
      }
      if (expiredRes.success) {
        setExpiredUnits(expiredRes.units);
      }
    } catch (err) {
      toast.error("Failed to load expiry data.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExpiryData();
  }, []);

  const handleDiscard = async (id, unitId) => {
    if (!window.confirm(`Are you sure you want to discard expired unit ${unitId}? This will log it as discarded and pull it from active inventory counts.`)) return;
    setActionLoading(true);
    try {
      const res = await bloodBankService.discardBloodUnit(id, { reason: "Expired Unit Discarded" });
      if (res.success) {
        toast.success(`Unit ${unitId} discarded successfully.`);
        fetchExpiryData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to discard unit.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <AlertCircle className="w-7 h-7 text-[#E24B4A]" />
              Expiry Alerts & Notifications
            </h1>
            <p className="text-sm text-zinc-500">Prevent biological waste by monitoring expiring stock or discard expired products safely</p>
          </div>
          <button onClick={fetchExpiryData} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expired Section */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="font-bold text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Expired Stock ({expiredUnits.length})
              </h2>
              <span className="text-[10px] text-zinc-400 font-medium">Requires Immediate Discard</span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-center py-8 text-zinc-500 text-xs">Loading expired stock...</div>
              ) : expiredUnits.length === 0 ? (
                <p className="text-center py-8 text-zinc-400 text-xs">No expired units currently in stock.</p>
              ) : (
                expiredUnits.map((u) => (
                  <div key={u._id} className="p-4 rounded-xl border border-red-100 bg-red-50/20 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-zinc-900">{u.unitId}</div>
                      <div className="text-zinc-500 mt-0.5">
                        {u.component} ({u.bloodGroup}) | Vol: {u.volumeML}ml
                      </div>
                      <div className="text-red-600 font-semibold mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Expired on: {new Date(u.expiryDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/bloodbank/units/${u.unitId || u._id}`)}
                        className="px-2.5 py-1.5 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold rounded-lg transition"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleDiscard(u._id, u.unitId)}
                        disabled={actionLoading}
                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Discard
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Expiring Soon Section */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="font-bold text-yellow-600 text-sm flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Expiring Within 3 Days ({expiringUnits.length})
              </h2>
              <span className="text-[10px] text-zinc-400 font-medium">Prioritize for Distribution</span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-center py-8 text-zinc-500 text-xs">Loading expiring stock...</div>
              ) : expiringUnits.length === 0 ? (
                <p className="text-center py-8 text-zinc-400 text-xs">No stock expiring in the next 3 days.</p>
              ) : (
                expiringUnits.map((u) => (
                  <div key={u._id} className="p-4 rounded-xl border border-yellow-100 bg-yellow-50/20 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-zinc-900">{u.unitId}</div>
                      <div className="text-zinc-500 mt-0.5">
                        {u.component} ({u.bloodGroup}) | Vol: {u.volumeML}ml
                      </div>
                      <div className="text-yellow-600 font-semibold mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Expires on: {new Date(u.expiryDate).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/bloodbank/units/${u.unitId || u._id}`)}
                      className="px-3 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold rounded-lg transition flex items-center gap-1"
                    >
                      Inspect <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
