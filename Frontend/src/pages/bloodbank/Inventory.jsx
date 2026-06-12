import React, { useState, useEffect } from "react";
import { Droplet, AlertTriangle, CheckCircle, Package, RefreshCw, Eye, Info, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import bloodBankService from "../../services/bloodBankService";
import { useNavigate } from "react-router-dom";

export default function Inventory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [filters, setFilters] = useState({ bloodGroup: "", component: "" });

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const components = ["Whole Blood", "RBC", "Platelets", "Plasma"];

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const summaryRes = await bloodBankService.getInventorySummary();
      const unitsRes = await bloodBankService.getAvailableUnits(filters);
      
      if (summaryRes.success) {
        setSummary(summaryRes);
      }
      if (unitsRes.success) {
        setAvailableUnits(unitsRes.units);
      }
    } catch (err) {
      toast.error("Failed to load inventory summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filters]);

  const getLowStockAlerts = () => {
    if (!summary || !summary.matrix) return [];
    const alerts = [];
    Object.entries(summary.matrix).forEach(([bg, comps]) => {
      Object.entries(comps).forEach(([comp, count]) => {
        if (count < 3) {
          alerts.push({ bg, comp, count });
        }
      });
    });
    return alerts;
  };

  const lowStockAlerts = getLowStockAlerts();

  return (
    <div className="min-h-screen bg-zinc-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <Package className="w-7 h-7 text-[#E24B4A]" />
              Inventory & component Matrix
            </h1>
            <p className="text-sm text-zinc-500">Real-time monitoring of cleared/available blood units by group and product type</p>
          </div>
          <button onClick={fetchInventory} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-start gap-2.5">
          <Info className="w-5 h-5 flex-shrink-0 text-blue-500" />
          <div>
            <strong>Matrix Logic:</strong> This table displays verified inventory (units that passed disease screening tests and are in "Available" status). Discarded, collected, and reserved units are excluded from these counts.
          </div>
        </div>

        {/* Stats Summary Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Total Available</span>
              <span className="text-2xl font-extrabold text-zinc-950">{summary?.totalAvailable || 0}</span>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Expiring Soon (3d)</span>
              <span className="text-2xl font-extrabold text-yellow-600">{summary?.expiringSoon || 0}</span>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6 text-[#E24B4A]" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Expired Count</span>
              <span className="text-2xl font-extrabold text-red-600">{summary?.expired || 0}</span>
            </div>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden p-6 space-y-4">
          <h2 className="font-bold text-zinc-800 text-sm">Blood Component Matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="p-4">Blood Group</th>
                  {components.map((c) => (
                    <th key={c} className="p-4 text-center">
                      {c}
                    </th>
                  ))}
                  <th className="p-4 text-right">Row Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-zinc-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#E24B4A] mb-2" />
                      Generating matrix...
                    </td>
                  </tr>
                ) : (
                  bloodGroups.map((bg) => {
                    let rowTotal = 0;
                    return (
                      <tr key={bg} className="hover:bg-zinc-50/30 transition">
                        <td className="p-4 font-bold text-[#E24B4A] flex items-center gap-1.5">
                          <Droplet className="w-4 h-4 fill-current text-[#E24B4A]" />
                          {bg}
                        </td>
                        {components.map((c) => {
                          const count = summary?.matrix?.[bg]?.[c] || 0;
                          rowTotal += count;
                          return (
                            <td key={c} className="p-4 text-center">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                                  count === 0
                                    ? "bg-zinc-50 text-zinc-300 border border-zinc-100"
                                    : count < 3
                                    ? "bg-red-50 text-red-700 border border-red-200 animate-pulse"
                                    : "bg-green-50 text-green-700 border border-green-200"
                                }`}
                              >
                                {count}
                              </span>
                            </td>
                          );
                        })}
                        <td className="p-4 text-right font-extrabold text-zinc-900">{rowTotal}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alarms & Expired Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Low Stock Alerts */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Low Stock Warnings
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {lowStockAlerts.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-4">All products above safety thresholds.</p>
              ) : (
                lowStockAlerts.map((alert, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-red-50/50 border border-red-100 text-xs">
                    <span className="font-semibold text-zinc-800">
                      {alert.bg} - {alert.comp}
                    </span>
                    <span className="font-bold text-red-700">{alert.count} units remaining</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Unit Listing */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-3">
              <h3 className="font-bold text-zinc-800 text-sm">Stock Ledger</h3>
              <div className="flex gap-2">
                <select
                  value={filters.bloodGroup}
                  onChange={(e) => setFilters((prev) => ({ ...prev, bloodGroup: e.target.value }))}
                  className="border border-zinc-200 rounded-lg p-1.5 text-xs bg-zinc-50 outline-none"
                >
                  <option value="">All Groups</option>
                  {bloodGroups.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.component}
                  onChange={(e) => setFilters((prev) => ({ ...prev, component: e.target.value }))}
                  className="border border-zinc-200 rounded-lg p-1.5 text-xs bg-zinc-50 outline-none"
                >
                  <option value="">All Components</option>
                  {components.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[300px] divide-y divide-zinc-100">
              {availableUnits.length === 0 ? (
                <p className="text-center py-8 text-zinc-400 text-xs">No active stock matches filter criteria.</p>
              ) : (
                availableUnits.map((u) => (
                  <div key={u._id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-zinc-900">{u.unitId}</div>
                      <div className="text-zinc-500">
                        {u.component} ({u.bloodGroup}) | Vol: {u.volumeML}ml
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-zinc-800">
                        Expires: {new Date(u.expiryDate).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-zinc-400">Loc: {u.storageLocation}</div>
                    </div>
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
