import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, User, Mail, Phone, MapPin, Clock, FileText, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import bloodBankService from "../services/bloodBankService";

export default function BloodBankRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    bloodBankName: "",
    managerName: "",
    email: "",
    mobile: "",
    licenseNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    emergencyContact: "",
    openingTime: "",
    closingTime: "",
    available24x7: false,
    latitude: "",
    longitude: "",
  });
  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("Please upload the license document.");
      return;
    }

    if (!formData.available24x7 && (!formData.openingTime || !formData.closingTime)) {
      toast.error("Please provide opening and closing times if not 24x7.");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      data.append("licenseDocument", file);

      const result = await bloodBankService.registerBloodBank(data);
      if (result.success) {
        toast.success(result.message);
        setSuccess(true);
      } else {
        toast.error(result.message || "Registration failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6">
        <div className="bg-[#1e293b] p-8 rounded-2xl shadow-2xl max-w-lg text-center border border-zinc-800">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Registration Submitted!</h2>
          <p className="text-zinc-400 mb-8">
            Your blood bank details have been sent to the admin. 
            Once approved, you will receive an email to set up your password.
          </p>
          <button 
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors w-full"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-[#0f172a] rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden">
        
        <div className="bg-gradient-to-r from-red-600 to-red-900 p-8 text-center">
          <Building2 className="w-12 h-12 text-white mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">Blood Bank Partner Registration</h1>
          <p className="text-red-100 mt-2">Join our network to save lives faster</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 text-white">
          
          {/* General Details */}
          <div>
            <h3 className="text-xl font-bold border-b border-zinc-800 pb-2 mb-4 text-red-500">General Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">Blood Bank Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                  <input required name="bloodBankName" value={formData.bloodBankName} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-none" placeholder="e.g. City Central Blood Bank" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">Manager / Contact Person *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                  <input required name="managerName" value={formData.managerName} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 outline-none" placeholder="Manager Name" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 outline-none" placeholder="admin@bloodbank.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">Mobile Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                  <input required name="mobile" minLength="10" maxLength="10" pattern="\d{10}" value={formData.mobile} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 outline-none" placeholder="10-digit number" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">License Number *</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                  <input required name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 outline-none" placeholder="e.g. DL-12345" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">License Document (PDF/Image) *</label>
                <input required type="file" accept=".pdf,image/*" onChange={handleFileChange} className="w-full py-2.5 px-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 outline-none text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-600/10 file:text-red-500 hover:file:bg-red-600/20" />
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div>
            <h3 className="text-xl font-bold border-b border-zinc-800 pb-2 mb-4 text-red-500">Location & Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-zinc-400 mb-2">Full Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                  <input required name="address" value={formData.address} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 outline-none" placeholder="Street, Building, Landmark" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">City *</label>
                <input required name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 outline-none" placeholder="City" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">State *</label>
                <input required name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 outline-none" placeholder="State" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">Pincode *</label>
                <input required name="pincode" value={formData.pincode} onChange={handleChange} className="w-full px-4 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 outline-none" placeholder="e.g. 110001" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold text-zinc-400 mb-2">Latitude (Opt)</label>
                  <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} className="w-full px-4 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 outline-none" placeholder="28.6139" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-400 mb-2">Longitude (Opt)</label>
                  <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} className="w-full px-4 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 outline-none" placeholder="77.2090" />
                </div>
              </div>
            </div>
          </div>

          {/* Operational Details */}
          <div>
            <h3 className="text-xl font-bold border-b border-zinc-800 pb-2 mb-4 text-red-500">Operational Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">Emergency Contact (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                  <input name="emergencyContact" minLength="10" maxLength="10" pattern="\d{10}" value={formData.emergencyContact} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 outline-none" placeholder="Emergency Helpline" />
                </div>
              </div>
              
              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-[#1e293b] rounded-xl border border-zinc-700 hover:border-red-500 transition-colors">
                  <input type="checkbox" name="available24x7" checked={formData.available24x7} onChange={handleChange} className="w-5 h-5 accent-red-600" />
                  <span className="font-semibold">Available 24x7</span>
                </label>
              </div>

              {!formData.available24x7 && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">Opening Time *</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                      <input type="time" name="openingTime" required={!formData.available24x7} value={formData.openingTime} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 outline-none color-scheme-dark" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">Closing Time *</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                      <input type="time" name="closingTime" required={!formData.available24x7} value={formData.closingTime} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-[#1e293b] border border-zinc-700 rounded-xl focus:border-red-500 outline-none color-scheme-dark" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-zinc-800">
            <p className="text-sm text-zinc-500">Admin will review the application within 24-48 hours.</p>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/30 disabled:opacity-50"
            >
              {loading ? "Submitting Request..." : "Submit Registration Request"}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
