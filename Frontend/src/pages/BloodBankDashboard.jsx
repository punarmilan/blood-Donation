import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LogOut, Activity, RefreshCw, Droplet, Clock, Building2, Menu, X, Bell, CheckCircle, AlertTriangle, Package, Search, Download, User, FileText, Filter, MoreVertical, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import bloodBankService from "../services/bloodBankService";

export default function BloodBankDashboard() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const [bloodBank, setBloodBank] = useState(null);
  const [inventory, setInventory] = useState({
    "A+": 0, "A-": 0, "B+": 0, "B-": 0, "O+": 0, "O-": 0, "AB+": 0, "AB-": 0
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState("inventory");

  useEffect(() => {
    if (tab === "blood-request" || tab === "blood-requests" || tab === "requests") {
      setCurrentView("requests");
    } else if (tab === "profile") {
      setCurrentView("profile");
    } else {
      setCurrentView("inventory");
    }
  }, [tab]);

  useEffect(() => {
    const token = localStorage.getItem("bloodBankToken");
    if (!token) {
      navigate("/blood-bank/login");
      return;
    }
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const data = await bloodBankService.getProfile();
      if (data.success) {
        setBloodBank(data.data);
        if (data.data.inventory) {
          setInventory(data.data.inventory);
        }
      } else {
        toast.error("Session expired. Please login again.");
        handleLogout();
        return;
      }

      // Fetch requests
      const reqData = await bloodBankService.getRequests();
      if (reqData.success) {
        setRequests(reqData.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch profile");
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInventoryChange = (group, val) => {
    const num = parseInt(val, 10);
    setInventory(prev => ({
      ...prev,
      [group]: isNaN(num) ? "" : num
    }));
  };

  const handleSaveInventory = async () => {
    setSaving(true);

    const cleanInventory = {};
    for (const key in inventory) {
      cleanInventory[key] = inventory[key] === "" || isNaN(inventory[key]) ? 0 : parseInt(inventory[key], 10);
    }

    try {
      const data = await bloodBankService.updateInventory({ inventory: cleanInventory });
      if (data.success) {
        toast.success("Inventory updated successfully!");
        setInventory(data.data);
        setBloodBank(prev => ({ ...prev, lastInventoryUpdated: data.lastUpdated }));
      } else {
        toast.error(data.message || "Failed to update inventory");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update inventory");
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const res = await bloodBankService.acceptRequest(requestId);
      if (res.success) {
        toast.success("Request accepted successfully!");
        setRequests(requests.map(r => r.requestId === requestId ? { ...r, status: "accepted", acceptedByBloodBank: bloodBank._id } : r));
      } else {
        toast.error(res.message || "Failed to accept request");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept request");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bloodBankToken");
    localStorage.removeItem("bloodBankData");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const totalUnits = useMemo(() => {
    return Object.values(inventory).reduce((acc, curr) => acc + (parseInt(curr) || 0), 0);
  }, [inventory]);

  if (loading) {
    return <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-red-600 font-bold">Loading Dashboard...</div>;
  }

  if (!bloodBank) return null;

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const formattedDate = bloodBank?.lastInventoryUpdated ? new Date(bloodBank.lastInventoryUpdated).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Never';

  const getPriorityBadge = (priority) => {
    const p = (priority || "").toLowerCase();
    if (p === "urgent" || p === "emergency") return "text-red-600 border border-red-600 bg-red-50";
    if (p === "high") return "text-red-500 border border-red-500 bg-red-50/50";
    if (p === "planned" || p === "medium") return "text-yellow-600 border border-yellow-600 bg-yellow-50";
    return "text-zinc-500 border border-zinc-500 bg-zinc-50";
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "pending" || s === "active") return "text-yellow-600 border border-yellow-600 bg-yellow-50";
    if (s === "accepted" || s === "approved") return "text-green-600 border border-green-600 bg-green-50";
    if (s === "forwarded") return "text-blue-600 border border-blue-600 bg-blue-50";
    if (s === "rejected") return "text-red-600 border border-red-600 bg-red-50";
    if (s === "completed" || s === "fulfilled") return "text-zinc-600 border border-zinc-600 bg-zinc-50";
    return "text-zinc-500 border border-zinc-500 bg-zinc-50";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return ["", ""];
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = d.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit', hour12: true });
    return [datePart, timePart];
  };

  return (
    <div className="bb-dashboard-wrapper">
      <style>{`
        .bb-dashboard-wrapper {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background-color: #f4f4f5; /* Light gray main bg */
          font-family: 'Inter', sans-serif;
          color: #000000;
        }
        
        /* SIDEBAR */
        .bb-sidebar {
          width: 260px;
          background-color: #000000; /* Pure Black Sidebar */
          color: #ffffff;
          display: flex;
          flex-direction: column;
          padding: 1.5rem 1rem;
          flex-shrink: 0;
          border-right: 1px solid #27272a;
          transition: all 0.3s ease;
        }
        .bb-sidebar.collapsed {
          width: 80px;
          padding: 1.5rem 0.5rem;
        }
        .bb-sidebar.collapsed .brand-name,
        .bb-sidebar.collapsed .brand-subtitle,
        .bb-sidebar.collapsed .menu-section-title,
        .bb-sidebar.collapsed .menu-item-text {
          display: none;
        }
        .brand-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0 0.5rem;
          margin-bottom: 2.5rem;
        }
        .brand-logo { font-size: 1.8rem; }
        .brand-name {
          font-size: 1.2rem;
          font-weight: 800;
          color: #ffffff;
        }
        .brand-name span { color: #ef4444; /* Red accent */ }
        .brand-subtitle {
          font-size: 0.7rem;
          color: #a1a1aa;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .menu-section { margin-bottom: 2rem; }
        .menu-section-title {
          font-size: 0.7rem;
          text-transform: uppercase;
          color: #71717a;
          font-weight: 700;
          margin-bottom: 0.75rem;
          padding: 0 0.75rem;
          letter-spacing: 0.05em;
        }
        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #d4d4d8;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          margin-bottom: 0.25rem;
        }
        .menu-item:hover {
          color: #ffffff;
          background-color: #27272a;
        }
        .menu-item.active {
          color: #ffffff;
          background-color: #dc2626; /* Red active state */
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
        }

        /* MAIN CONTENT */
        .bb-main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow-y: auto;
          background-color: #f4f4f5; /* Light Theme */
        }
        
        /* HEADER */
        .bb-top-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background-color: #ffffff;
          border-bottom: 1px solid #e4e4e7;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #000000;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .header-title-sub {
          display: flex;
          flex-direction: column;
        }
        .header-title-sub span.title { font-size: 1.1rem; font-weight: 700; }
        .header-title-sub span.subtitle { font-size: 0.7rem; color: #71717a; font-weight: 500; }

        .toggle-sidebar-btn {
          color: #52525b;
          transition: background-color 0.2s;
        }
        .toggle-sidebar-btn:hover { background-color: #f4f4f5; color: #000000; }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .notification-bell {
          position: relative;
          color: #71717a;
          cursor: pointer;
        }
        .notification-bell:hover { color: #000000; }
        .notification-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background-color: #dc2626; /* Red */
          border-radius: 50%;
        }
        .bb-user-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background-color: #ffffff;
          padding: 0.4rem 1rem 0.4rem 0.4rem;
          border-radius: 2rem;
          border: 1px solid #e4e4e7;
        }
        .bb-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ef4444, #b91c1c); /* Red gradient */
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 700;
        }
        .bb-user-info {
          display: flex;
          flex-direction: column;
          max-width: 140px;
        }
        .bb-user-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #000000;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bb-user-role {
          font-size: 0.7rem;
          color: #71717a;
          font-weight: 600;
        }

        /* DASHBOARD CONTENT */
        .bb-dashboard-content {
          padding: 2.5rem;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        /* CARDS */
        .bwr-card, .stat-card, .inventory-section {
          background-color: #ffffff;
          border-radius: 1rem;
          border: 1px solid #e4e4e7;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .inventory-section { border-top: 4px solid #dc2626; } /* Red accent */

        /* STAT CARDS */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .stat-card {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(220, 38, 38, 0.1);
        }
        .stat-icon { color: #dc2626; }
        .stat-info { display: flex; flex-direction: column; }
        .stat-label {
          font-size: 0.75rem;
          color: #71717a;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #000000;
          line-height: 1;
        }
        .stat-subtext {
          font-size: 0.7rem;
          color: #a1a1aa;
          margin-top: 0.25rem;
        }

        /* INVENTORY/REQUEST TABLE AREA */
        .inventory-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .inventory-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #000000;
        }
        .inventory-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        /* FILTER BAR */
        .bb-filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
          align-items: flex-end;
        }
        .bb-filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .bb-filter-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #71717a;
        }
        .bb-filter-select, .bb-search-box-sm {
          background-color: #ffffff;
          border: 1px solid #e4e4e7;
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          color: #000000;
          outline: none;
        }
        .bb-search-box-sm { display: flex; align-items: center; gap: 0.5rem; }
        .bb-search-box-sm input { border: none; outline: none; background: transparent; width: 200px; }
        .reset-link {
          font-size: 0.8rem;
          color: #dc2626;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 0.6rem;
          margin-left: auto;
        }

        .export-btn, .save-btn, .filter-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .export-btn, .filter-btn {
          background-color: transparent;
          border: 1px solid #e4e4e7;
          color: #000000;
        }
        .export-btn:hover, .filter-btn:hover { background-color: #f4f4f5; }
        
        .save-btn {
          background-color: #dc2626;
          border: 1px solid #dc2626;
          color: #ffffff;
        }
        .save-btn:hover { background-color: #b91c1c; }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* TABLE */
        .blood-table {
          width: 100%;
          border-collapse: collapse;
        }
        .blood-table th {
          text-align: left;
          padding: 1rem;
          font-size: 0.75rem;
          color: #71717a;
          font-weight: 600;
          border-bottom: 1px solid #e4e4e7;
        }
        .blood-table td {
          padding: 1rem;
          border-bottom: 1px solid #e4e4e7;
          vertical-align: middle;
          font-size: 0.8rem;
          color: #000000;
        }
        .blood-table tr:hover { background-color: #f4f4f5; }
        
        .group-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          color: #000000;
        }
        .group-name .drop-icon {
          color: #dc2626;
          width: 16px;
          height: 16px;
        }
        
        .units-input {
          background-color: #ffffff;
          border: 1px solid #e4e4e7;
          color: #dc2626; /* Red color for units */
          font-weight: 700;
          border-radius: 0.375rem;
          padding: 0.4rem;
          width: 80px;
          text-align: center;
          outline: none;
          transition: border-color 0.2s;
        }
        .units-input:focus { border-color: #dc2626; }
        
        .action-btn {
          background: transparent;
          border: 1px solid #e4e4e7;
          color: #000000;
          padding: 0.4rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }
        .action-btn:hover { 
          background-color: rgba(220, 38, 38, 0.05); 
          border-color: #dc2626;
          color: #dc2626;
        }

        .badge-status {
          padding: 0.2rem 0.6rem;
          border-radius: 0.25rem;
          font-size: 0.7rem;
          font-weight: 600;
        }
        
        /* SCROLLBAR */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f4f4f5; }
        ::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #a1a1aa; }
        
        /* PROFILE SPECIFIC */
        .profile-label {
          color: #71717a;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .profile-value {
          color: #000000;
          font-size: 1rem;
          font-weight: 700;
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className={`bb-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`} data-lenis-prevent="true">
        <div className="brand-container">
          <div className="brand-logo" title="Blood Bank Panel">🏥</div>
          <div>
            <div className="brand-name">Life<span>Drop</span></div>
            <div className="brand-subtitle">Blood Bank Panel</div>
          </div>
        </div>

        <div className="menu-section">
          <div className="menu-section-title">Main Menu</div>
          <button
            className={`menu-item ${currentView === "inventory" ? "active" : ""}`}
            onClick={() => navigate("/blood-bank/dashboard")}
          >
            <Droplet className="w-5 h-5" />
            <span className="menu-item-text">Inventory</span>
          </button>
          <button
            className={`menu-item ${currentView === "requests" ? "active" : ""}`}
            onClick={() => navigate("/blood-bank/blood-request")}
          >
            <FileText className="w-5 h-5" />
            <span className="menu-item-text">Blood Requests</span>
          </button>
          <button
            className={`menu-item ${currentView === "profile" ? "active" : ""}`}
            onClick={() => navigate("/blood-bank/profile")}
          >
            <Building2 className="w-5 h-5" />
            <span className="menu-item-text">Account Profile</span>
          </button>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button className="menu-item" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
            <span className="menu-item-text">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="bb-main-content" data-lenis-prevent="true">
        <header className="bb-top-header">
          <div className="header-title">
            <button className="toggle-sidebar-btn border-none bg-transparent cursor-pointer flex items-center justify-center p-1 rounded-md" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="header-title-sub">
              <span className="title">
                {currentView === "inventory" && "Inventory"}
                {currentView === "requests" && "Blood Requests"}
                {currentView === "profile" && "Account Profile"}
              </span>
              {currentView === "requests" && <span className="subtitle">Manage incoming blood requests from users, hospitals and organizations</span>}
            </div>
          </div>

          <div className="header-actions">
            {currentView === "requests" && (
              <>
                <div className="search-box hidden sm:flex border border-zinc-200 px-3 py-1.5 rounded-md items-center gap-2 text-sm bg-zinc-50">
                  <Search className="w-4 h-4 text-zinc-400" />
                  <input type="text" placeholder="Search request ID, patient..." className="border-none outline-none bg-transparent w-48" />
                </div>
                <button className="filter-btn hidden sm:flex"><Filter className="w-4 h-4" /> Filter</button>
                <button className="export-btn hidden sm:flex"><Download className="w-4 h-4" /> Export</button>
              </>
            )}

            <div className="notification-bell">
              <Bell className="w-5 h-5" />
              <div className="notification-dot"></div>
            </div>
            <div className="bb-user-profile">
              <div className="bb-user-avatar">
                <User className="w-5 h-5" />
              </div>
              <div className="bb-user-info hidden sm:flex">
                <span className="bb-user-name">{bloodBank.name}</span>
                <span className="bb-user-role">Blood Bank</span>
              </div>
            </div>
          </div>
        </header>

        <div className="bb-dashboard-content">

          {/* BLOOD REQUESTS VIEW */}
          {currentView === "requests" && (
            <>
              {/* Top Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-wrapper">
                    <FileText className="w-6 h-6 stat-icon" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Total Requests</span>
                    <span className="stat-value">128</span>
                    <span className="stat-subtext">All time requests</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>
                    <Clock className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Pending Requests</span>
                    <span className="stat-value text-yellow-600">23</span>
                    <span className="stat-subtext">Awaiting action</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Approved Requests</span>
                    <span className="stat-value text-green-600">86</span>
                    <span className="stat-subtext">Successfully approved</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper">
                    <AlertTriangle className="w-6 h-6 stat-icon" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Emergency Requests</span>
                    <span className="stat-value text-red-600">12</span>
                    <span className="stat-subtext">High priority cases</span>
                  </div>
                </div>
              </div>

              {/* Main Table Section */}
              <div className="inventory-section">

                {/* Filter Bar */}
                <div className="bb-filter-bar">
                  <div className="bb-filter-group">
                    <span className="bb-filter-label">Search</span>
                    <div className="bb-search-box-sm">
                      <Search className="w-4 h-4 text-zinc-400" />
                      <input type="text" placeholder="Search by ID, patient or hospital..." />
                    </div>
                  </div>
                  <div className="bb-filter-group">
                    <span className="bb-filter-label">Blood Group</span>
                    <select className="bb-filter-select w-32">
                      <option>All Groups</option>
                      {bloodGroups.map(bg => <option key={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div className="bb-filter-group">
                    <span className="bb-filter-label">Status</span>
                    <select className="bb-filter-select w-32">
                      <option>All Status</option>
                      <option>Pending</option>
                      <option>Approved</option>
                      <option>Rejected</option>
                    </select>
                  </div>
                  <div className="bb-filter-group">
                    <span className="bb-filter-label">Priority</span>
                    <select className="bb-filter-select w-32">
                      <option>All Priority</option>
                      <option>Emergency</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                  <div className="bb-filter-group">
                    <span className="bb-filter-label">Date Range</span>
                    <div className="bb-search-box-sm">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      <input type="text" placeholder="Select Date Range" className="w-32" />
                    </div>
                  </div>
                  <div className="reset-link ml-auto flex items-center gap-1 hover:underline">
                    <RefreshCw className="w-3 h-3" /> Reset
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="blood-table">
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Patient / Hospital</th>
                        <th>Blood Group</th>
                        <th>Units</th>
                        <th>Priority</th>
                        <th>Required Date</th>
                        <th>Status</th>
                        <th>Requested On</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.length === 0 ? (
                        <tr><td colSpan="7" className="text-center py-8 text-zinc-500">No blood requests found.</td></tr>
                      ) : requests.map(req => {
                        const [createdDate, createdTime] = formatDate(req.createdAt);
                        return (
                          <tr key={req._id}>
                            <td>
                              <div className="font-bold">{req.requestId}</div>
                            </td>
                            <td>
                              <div className="font-bold">{req.patientName}</div>
                              <div className="text-xs text-zinc-500 mt-1">{req.hospital}</div>
                            </td>
                            <td>
                              <div className="group-name">
                                <Droplet className="drop-icon" fill="currentColor" /> {req.bloodGroup}
                              </div>
                            </td>
                            <td className="font-semibold">{req.units} Units</td>
                            <td>
                              <span className={`badge-status ${getPriorityBadge(req.urgency)}`}>{req.urgency || "Normal"}</span>
                            </td>
                            <td>
                              <div className="font-semibold text-zinc-800">{req.neededBy || "Not Specified"}</div>
                            </td>
                            <td>
                              <span className={`badge-status ${getStatusBadge(req.status)}`}>{req.status}</span>
                            </td>
                            <td>
                              <div className="font-semibold text-zinc-800">{createdDate}</div>
                              <div className="text-xs text-zinc-500 mt-0.5">{createdTime}</div>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                {(req.status === "active" || req.status === "pending") ? (
                                  <button
                                    className="action-btn"
                                    onClick={() => handleAcceptRequest(req.requestId)}
                                  >
                                    Accept
                                  </button>
                                ) : (
                                  <button
                                    className="action-btn opacity-50 cursor-not-allowed bg-green-50 text-green-700 border-green-200"
                                    disabled
                                  >
                                    Accepted
                                  </button>
                                )}
                                <button className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-700 transition">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center mt-4 text-xs text-zinc-500 font-medium">
                  <div>Showing 1 to 8 of 128 requests</div>
                  <div className="flex gap-1">
                    <button className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded hover:bg-zinc-50">&lt;</button>
                    <button className="w-8 h-8 flex items-center justify-center bg-red-600 text-white rounded font-bold">1</button>
                    <button className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded hover:bg-zinc-50">2</button>
                    <button className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded hover:bg-zinc-50">3</button>
                    <button className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded hover:bg-zinc-50">&gt;</button>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* INVENTORY VIEW */}
          {currentView === "inventory" && (
            <>
              {/* Top Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-wrapper">
                    <Droplet className="w-6 h-6 stat-icon" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Total Units</span>
                    <span className="stat-value">{totalUnits}</span>
                    <span className="stat-subtext">All Blood Groups</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>
                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Expiring Soon</span>
                    <span className="stat-value text-yellow-600">0</span>
                    <span className="stat-subtext">Within 7 days</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Available Units</span>
                    <span className="stat-value text-green-600">{totalUnits}</span>
                    <span className="stat-subtext">Ready to Use</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper">
                    <Package className="w-6 h-6 stat-icon" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Reserved Units</span>
                    <span className="stat-value">0</span>
                    <span className="stat-subtext">On Hold</span>
                  </div>
                </div>
              </div>

              {/* Main Table Section */}
              <div className="inventory-section">
                <div className="inventory-header">
                  <h2 className="inventory-title">Blood Inventory</h2>
                  <div className="inventory-actions">
                    <div className="search-box hidden sm:flex">
                      <Search className="w-4 h-4 text-zinc-500" />
                      <input type="text" placeholder="Search blood group..." />
                    </div>
                    <button className="export-btn">
                      <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="save-btn" onClick={handleSaveInventory} disabled={saving}>
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Sync Database
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="blood-table">
                    <thead>
                      <tr>
                        <th>Blood Group</th>
                        <th>Total Units</th>
                        <th>Available Units</th>
                        <th>Reserved Units</th>
                        <th>Expiring Soon</th>
                        <th>Last Updated</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bloodGroups.map(bg => {
                        const units = inventory[bg];
                        return (
                          <tr key={bg}>
                            <td>
                              <div className="group-name">
                                <Droplet className="drop-icon" fill="currentColor" /> {bg}
                              </div>
                            </td>
                            <td className="font-bold text-black">{units || 0}</td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                value={units}
                                onChange={(e) => handleInventoryChange(bg, e.target.value)}
                                className="units-input"
                              />
                            </td>
                            <td className="text-zinc-500">0</td>
                            <td className="text-yellow-600 font-bold">0</td>
                            <td className="text-zinc-500 text-xs">{formattedDate}</td>
                            <td>
                              <button className="action-btn" onClick={handleSaveInventory}>
                                Update
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {currentView === "profile" && (
            <div className="inventory-section max-w-3xl">
              <div className="flex items-center gap-4 border-b border-zinc-200 pb-6 mb-6">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
                  <Building2 className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-black leading-tight">{bloodBank.name}</h2>
                  <p className="text-sm text-zinc-500">License: {bloodBank.licenseNumber}</p>
                </div>
              </div>

              <div className="space-y-6 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    <span className="profile-label block mb-1">Manager Name</span>
                    <span className="profile-value block">{bloodBank.managerName}</span>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    <span className="profile-label block mb-1">Email Address</span>
                    <span className="profile-value block">{bloodBank.email}</span>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    <span className="profile-label block mb-1">Contact Number</span>
                    <span className="profile-value block">{bloodBank.mobile}</span>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    <span className="profile-label block mb-1">Emergency</span>
                    <span className="profile-value block">{bloodBank.emergencyContact || "N/A"}</span>
                  </div>
                </div>

                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  <span className="profile-label block mb-1">Address</span>
                  <span className="profile-value block">
                    {bloodBank.address}, {bloodBank.city}, {bloodBank.state} - {bloodBank.pincode}
                  </span>
                </div>

                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex justify-between items-center">
                  <div>
                    <span className="profile-label block mb-1">Operating Hours</span>
                    <span className="profile-value block">
                      {bloodBank.available24x7 ? "24x7 Open" : `${bloodBank.openingTime} to ${bloodBank.closingTime}`}
                    </span>
                  </div>
                  {bloodBank.available24x7 && (
                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-200">
                      Always Open
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
