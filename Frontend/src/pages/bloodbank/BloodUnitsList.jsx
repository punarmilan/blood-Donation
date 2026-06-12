import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, RefreshCw, Droplet, Clock, AlertCircle, CheckCircle2, MoreVertical, ShieldAlert, FlaskConical, Calendar, Send, Compass } from "lucide-react";
import toast from "react-hot-toast";
import bloodBankService from "../../services/bloodBankService";

export default function BloodUnitsList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    search: "",
    bloodGroup: "",
    component: "",
    currentStatus: "",
    testStatus: "",
    expiryStatus: "",
  });

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const components = ["Whole Blood", "RBC", "Platelets", "Plasma"];
  const statuses = ["Collected", "Testing Pending", "Available", "Reserved", "Issued", "Used", "Transfused", "Expired", "Discarded"];
  const testStatuses = ["Pending", "Passed", "Failed"];

  const fetchUnits = async (page = 1) => {
    setLoading(true);
    try {
      const res = await bloodBankService.getBloodUnits({ ...filters, page, limit: pagination.limit });
      if (res.success) {
        setUnits(res.units);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error("Failed to load blood units.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits(1);
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      bloodGroup: "",
      component: "",
      currentStatus: "",
      testStatus: "",
      expiryStatus: "",
    });
  };

  const handleStartTesting = async (id) => {
    try {
      const res = await bloodBankService.startTesting(id);
      if (res.success) {
        toast.success("Testing phase initialized!");
        fetchUnits(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start testing.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Collected":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Testing Pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Available":
        return "bg-green-50 text-green-700 border-green-200";
      case "Reserved":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Issued":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Used":
      case "Transfused":
        return "bg-zinc-100 text-zinc-700 border-zinc-300";
      case "Expired":
        return "bg-orange-50 text-orange-700 border-orange-200 animate-pulse";
      case "Discarded":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-zinc-50 text-zinc-600 border-zinc-200";
    }
  };

  const getTestBadge = (status) => {
    switch (status) {
      case "Passed":
        return "text-green-700 bg-green-50 border-green-200";
      case "Failed":
        return "text-red-700 bg-red-50 border-red-200";
      default:
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <Droplet className="w-7 h-7 text-[#E24B4A] fill-current" />
              Blood Unit tracking
            </h1>
            <p className="text-sm text-zinc-500">Track donation collections, verify laboratory testing and manage distribution lifecycle</p>
          </div>
          <button
            onClick={() => navigate("/bloodbank/units/add")}
            className="flex items-center gap-2 bg-[#E24B4A] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-[#c93d3c] transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Blood Unit
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
            <span className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-[#E24B4A]" /> Filter Blood Units
            </span>
            <button
              onClick={resetFilters}
              className="text-xs text-[#E24B4A] hover:underline font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-zinc-500">Search</span>
              <div className="flex items-center border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-zinc-50 focus-within:border-[#E24B4A] focus-within:bg-white transition">
                <Search className="w-4 h-4 text-zinc-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  name="search"
                  placeholder="ID, Donor Name..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="bg-transparent border-none outline-none w-full text-zinc-800"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-zinc-500">Blood Group</span>
              <select
                name="bloodGroup"
                value={filters.bloodGroup}
                onChange={handleFilterChange}
                className="border border-zinc-200 rounded-lg p-2 text-sm bg-zinc-50 focus:border-[#E24B4A] focus:outline-none transition"
              >
                <option value="">All Groups</option>
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-zinc-500">Component</span>
              <select
                name="component"
                value={filters.component}
                onChange={handleFilterChange}
                className="border border-zinc-200 rounded-lg p-2 text-sm bg-zinc-50 focus:border-[#E24B4A] focus:outline-none transition"
              >
                <option value="">All Components</option>
                {components.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-zinc-500">Status</span>
              <select
                name="currentStatus"
                value={filters.currentStatus}
                onChange={handleFilterChange}
                className="border border-zinc-200 rounded-lg p-2 text-sm bg-zinc-50 focus:border-[#E24B4A] focus:outline-none transition"
              >
                <option value="">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-zinc-500">Test Result</span>
              <select
                name="testStatus"
                value={filters.testStatus}
                onChange={handleFilterChange}
                className="border border-zinc-200 rounded-lg p-2 text-sm bg-zinc-50 focus:border-[#E24B4A] focus:outline-none transition"
              >
                <option value="">All Test Status</option>
                {testStatuses.map((ts) => (
                  <option key={ts} value={ts}>
                    {ts}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-zinc-500">Expiry Filter</span>
              <select
                name="expiryStatus"
                value={filters.expiryStatus}
                onChange={handleFilterChange}
                className="border border-zinc-200 rounded-lg p-2 text-sm bg-zinc-50 focus:border-[#E24B4A] focus:outline-none transition"
              >
                <option value="">All</option>
                <option value="expiring_soon">Expiring Soon (3d)</option>
                <option value="expired">Expired Units</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table/List */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="p-4">Unit ID</th>
                  <th className="p-4">Donor Details</th>
                  <th className="p-4">Blood details</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Lab Tests</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-zinc-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#E24B4A] mb-2" />
                      Loading blood units...
                    </td>
                  </tr>
                ) : units.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-zinc-500">
                      No blood units found matching filters.
                    </td>
                  </tr>
                ) : (
                  units.map((unit) => (
                    <tr key={unit._id} className="hover:bg-zinc-50/50 transition">
                      <td className="p-4">
                        <div className="font-bold text-zinc-900">{unit.unitId}</div>
                        <div className="text-xs text-zinc-400">Bag: {unit.bagNumber}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-zinc-800">{unit.donorName}</div>
                        <div className="text-xs text-zinc-500">📞 {unit.donorMobile}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 font-bold text-[#E24B4A]">
                          <Droplet className="w-4 h-4 fill-current" />
                          {unit.bloodGroup}
                        </div>
                        <div className="text-xs text-zinc-500">{unit.component} ({unit.volumeML}ml)</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(unit.currentStatus)}`}>
                          {unit.currentStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-zinc-800">
                          {new Date(unit.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                        {new Date(unit.expiryDate) < new Date() && (
                          <div className="text-[10px] text-red-600 font-bold flex items-center gap-0.5 mt-0.5">
                            <AlertCircle className="w-3 h-3" /> EXPIRED
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getTestBadge(unit.testStatus)}`}>
                          {unit.testStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/bloodbank/units/${unit.unitId || unit._id}`)}
                            className="px-3 py-1 rounded-md text-xs font-semibold border border-zinc-200 hover:border-[#E24B4A] hover:text-[#E24B4A] transition"
                          >
                            Details
                          </button>
                          {unit.currentStatus === "Collected" && (
                            <button
                              onClick={() => handleStartTesting(unit._id)}
                              className="px-3 py-1 bg-yellow-500 text-white rounded-md text-xs font-semibold hover:bg-yellow-600 transition flex items-center gap-1"
                            >
                              <FlaskConical className="w-3.5 h-3.5" /> Start Test
                            </button>
                          )}
                          {unit.currentStatus === "Testing Pending" && (
                            <button
                              onClick={() => navigate("/bloodbank/testing")}
                              className="px-3 py-1 bg-[#E24B4A] text-white rounded-md text-xs font-semibold hover:bg-[#c93d3c] transition flex items-center gap-1"
                            >
                              <FlaskConical className="w-3.5 h-3.5" /> Lab Portal
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex justify-between items-center p-4 bg-zinc-50 border-t border-zinc-200">
              <span className="text-xs text-zinc-500 font-medium">
                Showing {units.length} of {pagination.total} units
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchUnits(pagination.page - 1)}
                  className="px-3 py-1.5 rounded border border-zinc-200 hover:bg-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  disabled={units.length < pagination.limit}
                  onClick={() => fetchUnits(pagination.page + 1)}
                  className="px-3 py-1.5 rounded border border-zinc-200 hover:bg-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
