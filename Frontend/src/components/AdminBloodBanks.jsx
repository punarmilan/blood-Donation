import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2, MapPin, Search } from "lucide-react";
import adminService from "../services/adminService";

export default function AdminBloodBanks() {
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    _id: null,
    name: "",
    address: "",
    phone: "",
    email: "",
    bloodGroupsAvailable: [],
    status: "active",
    openStatus: "unknown",
    latitude: "",
    longitude: "",
  });

  const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  useEffect(() => {
    fetchBloodBanks();
  }, []);

  const fetchBloodBanks = async () => {
    setLoading(true);
    try {
      const data = await adminService.getBloodBanks();
      setBloodBanks(data || []);
    } catch (err) {
      toast.error("Failed to fetch blood banks");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (bg) => {
    setFormData((prev) => {
      const exists = prev.bloodGroupsAvailable.includes(bg);
      if (exists) {
        return { ...prev, bloodGroupsAvailable: prev.bloodGroupsAvailable.filter((g) => g !== bg) };
      } else {
        return { ...prev, bloodGroupsAvailable: [...prev.bloodGroupsAvailable, bg] };
      }
    });
  };

  const openAddModal = () => {
    setFormData({
      _id: null,
      name: "",
      address: "",
      phone: "",
      email: "",
      bloodGroupsAvailable: [],
      status: "active",
      openStatus: "unknown",
      latitude: "",
      longitude: "",
    });
    setShowModal(true);
  };

  const openEditModal = (bank) => {
    setFormData({
      _id: bank._id,
      name: bank.name,
      address: bank.address,
      phone: bank.phone,
      email: bank.email || "",
      bloodGroupsAvailable: bank.bloodGroupsAvailable || [],
      status: bank.status,
      openStatus: bank.openStatus,
      latitude: bank.location?.coordinates[1] || "",
      longitude: bank.location?.coordinates[0] || "",
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData._id) {
        await adminService.updateBloodBank(formData._id, formData);
        toast.success("Blood bank updated successfully");
      } else {
        await adminService.createBloodBank(formData);
        toast.success("Blood bank created successfully");
      }
      setShowModal(false);
      fetchBloodBanks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving blood bank");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blood bank?")) return;
    try {
      await adminService.deleteBloodBank(id);
      toast.success("Blood bank deleted successfully");
      fetchBloodBanks();
    } catch (err) {
      toast.error("Error deleting blood bank");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await adminService.toggleBloodBankStatus(id);
      toast.success("Status updated");
      fetchBloodBanks();
    } catch (err) {
      toast.error("Error toggling status");
    }
  };

  const handleGeocode = async () => {
    if (!formData.address) {
      toast.error("Please enter an address first");
      return;
    }
    try {
      const data = await adminService.geocodeAddress(formData.address);
      if (data && data.lat && data.lng) {
        setFormData({
          ...formData,
          latitude: data.lat,
          longitude: data.lng,
          address: data.formattedAddress || formData.address,
        });
        toast.success("Coordinates fetched successfully");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch coordinates");
    }
  };

  const filteredBanks = bloodBanks.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#0f172a] p-6 rounded-xl border border-zinc-800 text-white min-h-[500px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Blood Banks Management</h2>
          <p className="text-zinc-400 text-sm">Add, edit, or delete nearby blood banks</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-red-600/20"
        >
          <Plus className="w-4 h-4" /> Add Blood Bank
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          placeholder="Search by name or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#1e293b] border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 text-white"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-zinc-400">Loading blood banks...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-sm">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanks.map((bank) => (
                <tr key={bank._id} className="border-b border-zinc-800 hover:bg-[#1e293b]/50 transition-colors">
                  <td className="py-3 px-4 font-semibold">{bank.name}</td>
                  <td className="py-3 px-4 text-sm text-zinc-300 max-w-xs truncate">{bank.address}</td>
                  <td className="py-3 px-4 text-sm">{bank.phone}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleStatus(bank._id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        bank.status === "active" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {bank.status.toUpperCase()}
                    </button>
                  </td>
                  <td className="py-3 px-4 flex gap-3">
                    <button onClick={() => openEditModal(bank)} className="text-zinc-400 hover:text-white transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(bank._id)} className="text-zinc-400 hover:text-red-500 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBanks.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-zinc-500">No blood banks found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] rounded-xl border border-zinc-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-[#0f172a] z-10">
              <h3 className="text-xl font-bold">{formData._id ? "Edit Blood Bank" : "Add New Blood Bank"}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Blood Bank Name *</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#1e293b] border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Phone Number *</label>
                  <input required name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#1e293b] border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Address *</label>
                <textarea required name="address" value={formData.address} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#1e293b] border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500" rows="2" />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Location Coordinates *</label>
                <div className="flex flex-col md:flex-row gap-2">
                  <input required type="number" step="any" name="latitude" placeholder="Latitude" value={formData.latitude} onChange={handleInputChange} className="flex-1 px-3 py-2 bg-[#1e293b] border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500" />
                  <input required type="number" step="any" name="longitude" placeholder="Longitude" value={formData.longitude} onChange={handleInputChange} className="flex-1 px-3 py-2 bg-[#1e293b] border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500" />
                  <button type="button" onClick={handleGeocode} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-white flex items-center justify-center gap-2 whitespace-nowrap" title="Get Coordinates from Address">
                    <MapPin className="w-4 h-4 text-red-500" /> Auto-fill
                  </button>
                </div>
                <p className="text-xs text-zinc-500 mt-1">Enter address above and click Auto-fill to fetch coordinates.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#1e293b] border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Open Status</label>
                  <select name="openStatus" value={formData.openStatus} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#1e293b] border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500">
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Blood Groups Available</label>
                <div className="flex flex-wrap gap-2">
                  {bloodGroupOptions.map(bg => (
                    <label key={bg} className="flex items-center gap-2 bg-[#1e293b] border border-zinc-700 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-zinc-800">
                      <input type="checkbox" checked={formData.bloodGroupsAvailable.includes(bg)} onChange={() => handleCheckboxChange(bg)} className="accent-red-500" />
                      <span className="text-sm font-medium">{bg}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-zinc-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 rounded-lg font-semibold text-zinc-400 hover:bg-zinc-800">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-lg shadow-red-600/20">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
