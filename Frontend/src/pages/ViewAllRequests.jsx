import React, { useState, useEffect } from "react";
import { getAllLiveRequests } from "../services/requestService";
import INDIAN_STATES from "../utils/indianStates";
import toast from "react-hot-toast";
import { Filter, SlidersHorizontal, MapPin, Globe, Activity, Droplet, Search, Clock, ShieldAlert } from "lucide-react";
import bgImage from "../assets/ragister.png";

const formatTimeAgo = (dateString) => {
  if (!dateString) return "Some time ago";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
};

const ViewAllRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [filters, setFilters] = useState(() => {
    let defaultState = "Maharashtra";
    const savedLoc = localStorage.getItem("detected_location");
    if (savedLoc) {
      try {
        const loc = JSON.parse(savedLoc);
        if (loc.state) defaultState = loc.state;
      } catch (e) {
        console.error(e);
      }
    }
    return {
      state: defaultState,
      city: "",
      bloodGroup: "",
      urgency: "",
      status: "active"
    };
  });

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const urgencyOptions = [
    { value: "urgent", label: "Urgent" },
    { value: "planned", label: "Planned" }
  ];
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "accepted", label: "Accepted" },
    { value: "completed", label: "Completed" }
  ];

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const activeFilters = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) activeFilters[key] = filters[key];
      });
      const res = await getAllLiveRequests(activeFilters);
      if (res && res.success) {
        setRequests(res.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load blood requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    let defaultState = "Maharashtra";
    const savedLoc = localStorage.getItem("detected_location");
    if (savedLoc) {
      try {
        const loc = JSON.parse(savedLoc);
        if (loc.state) defaultState = loc.state;
      } catch (e) {
        console.error(e);
      }
    }
    setFilters({
      state: defaultState,
      city: "",
      bloodGroup: "",
      urgency: "",
      status: "active"
    });
  };

  return (
    <div 
      className="min-h-screen flex flex-col p-4 pt-28 pb-12 relative"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="absolute inset-0 z-0 bg-black/80" style={{ position: 'fixed', top: 0, left: 0 }}></div>

      <div className="w-full relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white font-cinzel flex items-center gap-3">
              <Activity className="text-red-500 w-9 h-9" />
              LIVE BLOOD <span className="text-red-500">REQUESTS</span>
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Real-time emergency requirements. Contact to save lives.</p>
          </div>
          <button 
            onClick={clearFilters}
            className="self-start md:self-auto px-5 py-2.5 rounded-full border border-white/20 text-white font-semibold text-xs hover:bg-white/10 transition-all cursor-pointer"
          >
            Clear Filters
          </button>
        </div>

        {/* Filters Panel Grid */}
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 shadow-xl">
          
          {/* State Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={12} className="text-red-500" /> State
            </label>
            <select
              value={filters.state}
              onChange={(e) => handleFilterChange("state", e.target.value)}
              className="w-full bg-[#141414] text-white px-3 py-2.5 rounded-xl border border-white/10 outline-none text-xs font-bold focus:border-red-500 transition-colors cursor-pointer"
            >
              <option value="">All States</option>
              {INDIAN_STATES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={12} className="text-red-500" /> City / Area
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                placeholder="Search City..."
                className="w-full bg-[#141414] text-white px-3 py-2.5 pl-8 rounded-xl border border-white/10 outline-none text-xs font-bold focus:border-red-500 transition-colors"
              />
              <Search className="absolute left-2.5 top-3 w-3.5 h-3.5 text-zinc-500" />
            </div>
          </div>

          {/* Blood Group Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Droplet size={12} className="text-red-500" /> Blood Group
            </label>
            <select
              value={filters.bloodGroup}
              onChange={(e) => handleFilterChange("bloodGroup", e.target.value)}
              className="w-full bg-[#141414] text-white px-3 py-2.5 rounded-xl border border-white/10 outline-none text-xs font-bold focus:border-red-500 transition-colors cursor-pointer"
            >
              <option value="">All Groups</option>
              {bloodGroups.map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          {/* Urgency Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal size={12} className="text-red-500" /> Urgency
            </label>
            <select
              value={filters.urgency}
              onChange={(e) => handleFilterChange("urgency", e.target.value)}
              className="w-full bg-[#141414] text-white px-3 py-2.5 rounded-xl border border-white/10 outline-none text-xs font-bold focus:border-red-500 transition-colors cursor-pointer"
            >
              <option value="">All Urgency</option>
              {urgencyOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Filter size={12} className="text-red-500" /> Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full bg-[#141414] text-white px-3 py-2.5 rounded-xl border border-white/10 outline-none text-xs font-bold focus:border-red-500 transition-colors cursor-pointer"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Requests List Render Grid */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-zinc-950/60 border border-white/5 rounded-3xl p-16 text-center shadow-lg">
            <ShieldAlert size={48} className="text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No active blood requests found</h3>
            <p className="text-zinc-500 max-w-sm mx-auto text-sm">No requests match the current filters. Try changing your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => (
              <div 
                key={req._id}
                className="bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-red-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header Info */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-14 h-14 bg-red-950/30 border border-red-500/30 rounded-xl text-red-500 font-black text-2xl flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                      {req.bloodGroup}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        req.urgency === "urgent" || req.urgency === "emergency"
                          ? "bg-red-500/10 border border-red-500/20 text-red-500 shadow-inner"
                          : "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                      }`}>
                        {req.urgency === "urgent" || req.urgency === "emergency" ? "🚨 Urgent" : "📅 Planned"}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
                        <Clock size={10} /> {formatTimeAgo(req.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Main Details */}
                  <div className="space-y-3 mb-6">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Patient</span>
                      <h3 className="text-lg font-black text-white">{req.patientName}</h3>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Hospital</span>
                      <p className="text-sm font-semibold text-zinc-200 truncate" title={req.hospitalName || req.hospital}>
                        {req.hospitalName || req.hospital}
                      </p>
                      {req.hospitalArea && (
                        <p className="text-xs text-zinc-400 font-medium truncate">Area: {req.hospitalArea}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Location</span>
                      <p className="text-xs font-bold text-zinc-300">{req.city}, {req.state}</p>
                    </div>

                    {req.neededDateTime && (
                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Needed By</span>
                        <p className="text-xs font-bold text-red-400">
                          {new Date(req.neededDateTime).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="border-t border-white/5 pt-4 mt-auto flex items-center justify-between">
                  <div className="text-[11px] text-zinc-400 font-semibold">
                    Units Required: <span className="text-white font-extrabold">{req.unitsNeeded || req.units}</span> ({req.bloodComponent || "Not specified"})
                  </div>
                  
                  <button 
                    onClick={() => toast.success(`Contacting requester at: ${req.recipient?.mobile || "N/A"}`)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-extrabold tracking-wider transition-colors cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                  >
                    DONATE NOW
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ViewAllRequests;
