import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, User, Mail, Phone, MapPin, Clock, FileText, CheckCircle, AlertCircle, Map, Navigation, Upload, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import bloodBankService from "../services/bloodBankService";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", 
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", 
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", 
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
  "Ladakh", "Lakshadweep", "Puducherry"
];

export default function BloodBankRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("inviteToken");

  const [tokenStatus, setTokenStatus] = useState("verifying"); // "verifying" | "valid" | "invalid"
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    managerName: "",
    email: "",
    mobile: "",
    city: "",
    licenseNumber: "",
    address: "",
    state: "",
    pincode: "",
    emergencyContact: "",
    openTime: "09:00",
    closeTime: "20:00",
    is24x7: false,
    latitude: "",
    longitude: "",
    licenseExpiryDate: "",
  });
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    if (!inviteToken) {
      setTokenStatus("invalid");
      setErrorMessage("Invitation link is missing. Admin se naya invite maangein.");
      return;
    }
    verifyToken();
  }, [inviteToken]);

  const verifyToken = async () => {
    try {
      const res = await bloodBankService.verifyInviteToken(inviteToken);
      if (res.success && res.data) {
        setFormData((prev) => ({
          ...prev,
          name: res.data.name || prev.name,
          managerName: res.data.managerName || prev.managerName,
          email: res.data.email || prev.email,
          mobile: res.data.mobile || prev.mobile,
          city: res.data.city || prev.city,
          licenseNumber: res.data.licenseNumber || prev.licenseNumber,
        }));
        setTokenStatus("valid");
      } else {
        setTokenStatus("invalid");
        setErrorMessage("Link expired ya invalid hai. Admin se naya invite maangein.");
      }
    } catch (err) {
      setTokenStatus("invalid");
      setErrorMessage(err.response?.data?.message || "Link expired ya invalid hai. Admin se naya invite maangein.");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Only PDF, PNG, JPG, and JPEG files are allowed.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB.");
      return;
    }

    setFile(selectedFile);
    
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        toast.success("Location fetched successfully!");
        setGeolocating(false);
      },
      (error) => {
        toast.error("Unable to retrieve your location. Please type manually.");
        setGeolocating(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("License Document upload karna mandatory hai.");
      return;
    }

    if (!formData.address.trim()) {
      toast.error("Please enter Full Address.");
      return;
    }

    if (!formData.state) {
      toast.error("Please select a State.");
      return;
    }

    if (!/^\d{6}$/.test(formData.pincode)) {
      toast.error("Pincode exact 6 digits ka hona chahiye.");
      return;
    }

    if (!/^\d{10}$/.test(formData.emergencyContact)) {
      toast.error("Emergency Contact number exact 10 digits ka hona chahiye.");
      return;
    }

    const expiryDate = new Date(formData.licenseExpiryDate);
    if (expiryDate <= new Date()) {
      toast.error("License expiry date future date honi chahiye.");
      return;
    }

    if (!formData.is24x7 && (!formData.openTime || !formData.closeTime)) {
      toast.error("Please provide opening and closing times if not 24x7.");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      data.append("inviteToken", inviteToken);
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

  // Restrict date picker to future only
  const getTodayString = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Only future dates
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  if (tokenStatus === "verifying") {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-[#E24B4A]/20 border-t-[#E24B4A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 text-sm">Verifying invitation link...</p>
        </div>
      </div>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6">
        <div className="bg-[#1a1a2e] p-8 rounded-2xl shadow-2xl max-w-lg w-full text-center border border-zinc-800">
          <div className="w-16 h-16 bg-[#E24B4A]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E24B4A]/20">
            <AlertCircle className="w-8 h-8 text-[#E24B4A]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Link Expired or Invalid</h2>
          <p className="text-zinc-400 mb-8">{errorMessage}</p>
          <button 
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-[#E24B4A] hover:bg-[#c93f3e] text-white rounded-xl font-bold transition-all w-full shadow-lg shadow-[#E24B4A]/20"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6">
        <div className="bg-[#1a1a2e] p-8 rounded-2xl shadow-2xl max-w-lg w-full text-center border border-zinc-800">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Registration Submitted!</h2>
          <p className="text-zinc-400 mb-8 font-medium leading-relaxed">
            Registration form successfully submit ho gayi hai! Admin 24-48 hours mein details aur license documents verify karega.
            Approval hote hi aapko email par set-password ka link bhej diya jayega.
          </p>
          <button 
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-[#E24B4A] hover:bg-[#c93f3e] text-white rounded-xl font-bold transition-all w-full shadow-lg shadow-[#E24B4A]/20"
          >
            Go to Home Screen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-[#11111f] rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#E24B4A] to-[#992c2b] p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:12px_12px] opacity-30"></div>
          <Building2 className="w-12 h-12 text-white mx-auto mb-3 relative z-10" />
          <h1 className="text-3xl font-black text-white tracking-tight relative z-10">Blood Bank Registration</h1>
          <p className="text-red-100 mt-2 relative z-10 font-medium">Complete form details below to submit registration for verification</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 text-white">
          
          {/* Section 1: Pre-filled Invited details */}
          <div className="bg-[#1e1e2f]/50 p-6 rounded-xl border border-zinc-800">
            <h3 className="text-lg font-bold mb-4 text-[#E24B4A] flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Section 1: Aapki Invite Details (Read-only)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Blood Bank Name</label>
                <input readOnly value={formData.name} className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-400 font-medium cursor-not-allowed outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Manager / Contact Person</label>
                <input readOnly value={formData.managerName} className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-400 font-medium cursor-not-allowed outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input readOnly value={formData.email} className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-400 font-medium cursor-not-allowed outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Mobile Number</label>
                <input readOnly value={formData.mobile} className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-400 font-medium cursor-not-allowed outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">City</label>
                <input readOnly value={formData.city} className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-400 font-medium cursor-not-allowed outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">License Number</label>
                <input readOnly value={formData.licenseNumber} className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-400 font-medium cursor-not-allowed outline-none" />
              </div>
            </div>
          </div>

          {/* Section 2: Address & Location */}
          <div>
            <h3 className="text-lg font-bold border-b border-zinc-800 pb-2 mb-4 text-[#E24B4A] flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Section 2: Address & Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Full Address *</label>
                <textarea 
                  required 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-4 py-2.5 bg-[#181827] border border-zinc-700 rounded-lg focus:outline-none focus:border-[#E24B4A] transition-all text-white placeholder-zinc-500 text-sm"
                  placeholder="Street, Building, Area details..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-1.5">State *</label>
                <select 
                  required 
                  name="state" 
                  value={formData.state} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-[#181827] border border-zinc-700 rounded-lg focus:outline-none focus:border-[#E24B4A] transition-all text-white text-sm"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Pincode *</label>
                <input 
                  required 
                  type="text"
                  maxLength="6"
                  name="pincode" 
                  value={formData.pincode} 
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setFormData(prev => ({ ...prev, pincode: val }));
                  }}
                  className="w-full px-4 py-2.5 bg-[#181827] border border-zinc-700 rounded-lg focus:outline-none focus:border-[#E24B4A] transition-all text-white placeholder-zinc-500 text-sm"
                  placeholder="6-digit PIN"
                />
              </div>
              <div className="md:col-span-2 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <Navigation className="w-5 h-5 text-[#E24B4A]" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Geolocation Coordinates</h4>
                    <p className="text-xs text-zinc-400">Map listing for donors to locate your blood bank easily</p>
                  </div>
                </div>
                <button 
                  type="button"
                  disabled={geolocating}
                  onClick={handleUseMyLocation}
                  className="w-full sm:w-auto px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-lg transition-all border border-zinc-700 flex items-center justify-center gap-1.5"
                >
                  {geolocating ? "Fetching..." : <>
                    <Map className="w-3.5 h-3.5 text-[#E24B4A]" /> Use My Location
                  </>}
                </button>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Latitude</label>
                <input 
                  type="number" 
                  step="any"
                  name="latitude" 
                  value={formData.latitude} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-[#181827] border border-zinc-700 rounded-lg focus:outline-none focus:border-[#E24B4A] transition-all text-white placeholder-zinc-500 text-sm"
                  placeholder="e.g. 28.6139" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Longitude</label>
                <input 
                  type="number" 
                  step="any"
                  name="longitude" 
                  value={formData.longitude} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-[#181827] border border-zinc-700 rounded-lg focus:outline-none focus:border-[#E24B4A] transition-all text-white placeholder-zinc-500 text-sm"
                  placeholder="e.g. 77.2090" 
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Timing */}
          <div>
            <h3 className="text-lg font-bold border-b border-zinc-800 pb-2 mb-4 text-[#E24B4A] flex items-center gap-2">
              <Clock className="w-5 h-5" /> Section 3: Contact & Timing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Emergency Contact Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4.5 h-4.5 text-zinc-500" />
                  <input 
                    required 
                    type="tel"
                    maxLength="10"
                    name="emergencyContact" 
                    value={formData.emergencyContact} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setFormData(prev => ({ ...prev, emergencyContact: val }));
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#181827] border border-zinc-700 rounded-lg focus:outline-none focus:border-[#E24B4A] transition-all text-white placeholder-zinc-500 text-sm"
                    placeholder="10-digit helpline" 
                  />
                </div>
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-3 cursor-pointer select-none bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition-all w-full">
                  <input 
                    type="checkbox" 
                    name="is24x7" 
                    checked={formData.is24x7} 
                    onChange={handleChange}
                    className="w-5 h-5 rounded accent-[#E24B4A] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-sm block">Available 24x7?</span>
                    <span className="text-xs text-zinc-400">Mark if open day & night constantly</span>
                  </div>
                </label>
              </div>

              {!formData.is24x7 && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Open Time *</label>
                    <input 
                      type="time" 
                      name="openTime" 
                      value={formData.openTime} 
                      onChange={handleChange}
                      required={!formData.is24x7}
                      className="w-full px-4 py-2.5 bg-[#181827] border border-zinc-700 rounded-lg focus:outline-none focus:border-[#E24B4A] transition-all text-white text-sm color-scheme-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Close Time *</label>
                    <input 
                      type="time" 
                      name="closeTime" 
                      value={formData.closeTime} 
                      onChange={handleChange}
                      required={!formData.is24x7}
                      className="w-full px-4 py-2.5 bg-[#181827] border border-zinc-700 rounded-lg focus:outline-none focus:border-[#E24B4A] transition-all text-white text-sm color-scheme-dark"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 4: License */}
          <div>
            <h3 className="text-lg font-bold border-b border-zinc-800 pb-2 mb-4 text-[#E24B4A] flex items-center gap-2">
              <FileText className="w-5 h-5" /> Section 4: License & Upload
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-1.5">License Expiry Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4.5 h-4.5 text-zinc-500" />
                  <input 
                    required 
                    type="date" 
                    name="licenseExpiryDate" 
                    min={getTodayString()}
                    value={formData.licenseExpiryDate} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#181827] border border-zinc-700 rounded-lg focus:outline-none focus:border-[#E24B4A] transition-all text-white text-sm color-scheme-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Upload License Document *</label>
                <div className="relative border-2 border-dashed border-zinc-700 hover:border-[#E24B4A] rounded-xl p-4 transition-all bg-zinc-900/30 text-center flex flex-col items-center justify-center cursor-pointer">
                  <input 
                    required 
                    type="file" 
                    accept=".pdf,image/*" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <Upload className="w-6 h-6 text-zinc-500 mb-1" />
                  <span className="text-xs text-zinc-300 font-bold block mb-1">Click to select file</span>
                  <span className="text-[10px] text-zinc-500 block">PDF, PNG, JPG, JPEG (Max 5MB)</span>
                </div>
                {file && (
                  <div className="mt-3 flex items-center gap-2 bg-[#1e1e2f]/50 p-2.5 rounded-lg border border-zinc-800">
                    <FileText className="w-4 h-4 text-[#E24B4A]" />
                    <span className="text-xs text-zinc-300 truncate max-w-[200px]">{file.name}</span>
                    <span className="text-[10px] text-zinc-500">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                )}
                {filePreview && (
                  <div className="mt-3 border border-zinc-800 rounded-lg overflow-hidden w-24 h-24 bg-zinc-900">
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <p className="text-xs text-zinc-500">Aapki details and documents submit hone ke baad admin 24-48 hours mein verify karega.</p>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#E24B4A] hover:bg-[#c93f3e] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#E24B4A]/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Submitting Registration..." : "Submit Registration Form"}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
