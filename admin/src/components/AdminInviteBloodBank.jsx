import React, { useState } from "react";
import toast from "react-hot-toast";
import { Mail, Phone, User, Building, MapPin, Shield, Send } from "lucide-react";
import adminService from "../services/adminService";

export default function AdminInviteBloodBank() {
  const [formData, setFormData] = useState({
    bloodBankName: "",
    managerName: "",
    email: "",
    mobile: "",
    city: "",
    licenseNumber: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminService.inviteBloodBank(formData);
      if (res.success) {
        toast.success(res.message || "Invitation sent successfully!");
        setFormData({
          bloodBankName: "",
          managerName: "",
          email: "",
          mobile: "",
          city: "",
          licenseNumber: "",
        });
      } else {
        toast.error(res.message || "Failed to send invitation.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-white w-full">
      <div className="flex items-center gap-3 mb-6">
        <Send className="w-8 h-8 text-red-500" />
        <div>
          <h2 className="text-2xl font-bold">Invite Blood Bank</h2>
          <p className="text-zinc-400 text-sm">Send a secure registration invite email to a new blood bank partner</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Blood Bank Name */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Blood Bank Name *</label>
            <div className="relative">
              <Building className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
              <input
                required
                type="text"
                name="bloodBankName"
                value={formData.bloodBankName}
                onChange={handleChange}
                placeholder="e.g. Red Cross Blood Bank"
                className="w-full pl-10 pr-4 py-2.5 bg-[#1e293b] border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 text-white"
              />
            </div>
          </div>

          {/* Manager Name */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Manager Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
              <input
                required
                type="text"
                name="managerName"
                value={formData.managerName}
                onChange={handleChange}
                placeholder="e.g. Dr. John Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-[#1e293b] border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 text-white"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Email */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. contact@bloodbank.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#1e293b] border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 text-white"
              />
            </div>
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Mobile Number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
              <input
                required
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                className="w-full pl-10 pr-4 py-2.5 bg-[#1e293b] border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 text-white"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* City */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">City *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
              <input
                required
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. New Delhi"
                className="w-full pl-10 pr-4 py-2.5 bg-[#1e293b] border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 text-white"
              />
            </div>
          </div>

          {/* License Number */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">License Number *</label>
            <div className="relative">
              <Shield className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
              <input
                required
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder="e.g. DL-12345"
                className="w-full pl-10 pr-4 py-2.5 bg-[#1e293b] border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 text-white"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
          >
            {loading ? "Sending..." : (
              <>
                <Send className="w-4 h-4" /> Send Invite
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
