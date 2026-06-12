import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, ArrowLeft, Droplet, User, Phone, Layers, Database, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import bloodBankService from "../../services/bloodBankService";

export default function AddBloodUnit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    donorName: "",
    donorMobile: "",
    donorBloodGroup: "O+",
    bloodGroup: "O+",
    component: "Whole Blood",
    volumeML: 350,
    bagNumber: "",
    collectionDate: new Date().toISOString().split("T")[0],
    storageLocation: "Shelf A",
    fridgeNumber: "1",
    shelfNumber: "1",
  });

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const components = ["Whole Blood", "RBC", "Platelets", "Plasma"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.donorName || !formData.donorMobile || !formData.bagNumber || !formData.volumeML) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await bloodBankService.createBloodUnit(formData);
      if (res.success) {
        toast.success("Blood Unit Registered Successfully!");
        navigate("/bloodbank/units");
      } else {
        toast.error(res.message || "Failed to register blood unit.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to register blood unit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="bg-[#E24B4A] text-white p-6 flex items-center gap-3">
            <PlusCircle className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Register Collected Blood Unit</h1>
              <p className="text-xs text-red-100">Log new donor collection and storage details</p>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span><strong>Medical Disclaimer:</strong> Real blood testing is done physically in the lab. This software is only for inventory and tracking purposes.</span>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Donor Information */}
            <div>
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2 border-zinc-100">
                <User className="w-4 h-4 text-[#E24B4A]" /> Donor Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">Donor Name *</label>
                  <input
                    type="text"
                    name="donorName"
                    value={formData.donorName}
                    onChange={handleChange}
                    className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">Donor Mobile *</label>
                  <input
                    type="tel"
                    name="donorMobile"
                    value={formData.donorMobile}
                    onChange={handleChange}
                    className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                    placeholder="10-digit mobile"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">Donor Blood Group *</label>
                  <select
                    name="donorBloodGroup"
                    value={formData.donorBloodGroup}
                    onChange={handleChange}
                    className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                  >
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Blood Unit Details */}
            <div>
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2 border-zinc-100">
                <Droplet className="w-4 h-4 text-[#E24B4A]" /> Blood Unit details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">Target Blood Group *</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                  >
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">Component Type *</label>
                  <select
                    name="component"
                    value={formData.component}
                    onChange={handleChange}
                    className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                  >
                    {components.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">Volume (ML) *</label>
                  <input
                    type="number"
                    name="volumeML"
                    value={formData.volumeML}
                    onChange={handleChange}
                    className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                    placeholder="e.g. 350 or 450"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">Bag Number / Barcode *</label>
                  <input
                    type="text"
                    name="bagNumber"
                    value={formData.bagNumber}
                    onChange={handleChange}
                    className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                    placeholder="e.g. BAG987654"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">Collection Date *</label>
                  <input
                    type="date"
                    name="collectionDate"
                    value={formData.collectionDate}
                    onChange={handleChange}
                    className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Storage Information */}
            <div>
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2 border-zinc-100">
                <Database className="w-4 h-4 text-[#E24B4A]" /> Storage location
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">Storage Room/Area</label>
                  <input
                    type="text"
                    name="storageLocation"
                    value={formData.storageLocation}
                    onChange={handleChange}
                    className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                    placeholder="e.g. Room A or Shelf X"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">Fridge Number</label>
                  <input
                    type="text"
                    name="fridgeNumber"
                    value={formData.fridgeNumber}
                    onChange={handleChange}
                    className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                    placeholder="e.g. Fridge #3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">Shelf Number</label>
                  <input
                    type="text"
                    name="shelfNumber"
                    value={formData.shelfNumber}
                    onChange={handleChange}
                    className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                    placeholder="e.g. Shelf #2"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 border-t pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 rounded-lg border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-[#E24B4A] text-white text-sm font-bold hover:bg-[#c93d3c] disabled:opacity-50 transition"
              >
                {loading ? "Registering..." : "Register Unit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
