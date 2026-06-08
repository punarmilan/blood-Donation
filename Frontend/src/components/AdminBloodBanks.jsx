import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Search, MapPin, Building, ShieldCheck, Ban } from "lucide-react";
import adminService from "../services/adminService";

export default function AdminBloodBanks() {
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchBloodBanks();
  }, [filterStatus]);

  const fetchBloodBanks = async () => {
    setLoading(true);
    try {
      const res = await adminService.getBloodBanks({ status: filterStatus });
      if (res.success) {
        setBloodBanks(res.data);
      }
    } catch (err) {
      toast.error("Failed to fetch blood banks");
    } finally {
      setLoading(false);
    }
  };

  const filteredBanks = bloodBanks.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#0f172a] p-6 rounded-xl border border-zinc-800 text-white min-h-[500px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building className="w-6 h-6 text-red-500" />
            Registered Blood Banks
          </h2>
          <p className="text-zinc-400 text-sm">Manage all blood banks on the platform</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search name, city, license..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1e293b] border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 text-sm text-white"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-[#1e293b] border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 text-sm text-white cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-zinc-400">Loading blood banks...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-sm">
                <th className="py-3 px-4 font-medium">Blood Bank Name</th>
                <th className="py-3 px-4 font-medium">Contact & License</th>
                <th className="py-3 px-4 font-medium">Location</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Verified</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanks.map((bank) => (
                <tr key={bank._id} className="border-b border-zinc-800 hover:bg-[#1e293b]/40 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-bold text-red-400">{bank.name}</div>
                    <div className="text-xs text-zinc-400 mt-1">Mgr: {bank.managerName}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm font-medium">{bank.mobile}</div>
                    <div className="text-xs text-zinc-500 mt-1">Lic: {bank.licenseNumber}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-500" /> {bank.city}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">{bank.state}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-md border ${
                      bank.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      bank.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                      bank.status === 'blocked' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                      'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {bank.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {bank.isVerified ? (
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                    ) : (
                      <Ban className="w-5 h-5 text-red-500" />
                    )}
                  </td>
                </tr>
              ))}
              {filteredBanks.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-zinc-500">
                    No blood banks found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
