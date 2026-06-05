import React, { useState } from "react";
import { User, Phone, Mail, Calendar, MapPin, Building2, MessageSquare, Send, Clock, Users, CheckCircle } from "lucide-react";
import axios from "axios";
import donarBg from "../assets/donar.png";

const inputCls = "w-full pl-11 pr-4 py-3.5 bg-[#0e0e10]/90 border border-zinc-900/60 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/30 transition-all duration-200";

const OrganizerEnquiry = () => {
  const [form, setForm] = useState({
    organizerName: "",
    phone: "",
    email: "",
    organizationType: "Personal",
    organizationName: "",
    preferredDate: "",
    preferredTime: "",
    area: "",
    expectedDonors: "50-100",
    venueAvailable: true,
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setSuccessMsg("");
    setErrorMsg("");
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSelect = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/api/organizer-enquiry/submit", form);
      setSuccessMsg("✅ Enquiry submitted successfully! Response within 24-48 hours.");
      setForm({
        organizerName: "", phone: "", email: "",
        organizationType: "Personal", organizationName: "",
        preferredDate: "", preferredTime: "", area: "",
        expectedDonors: "50-100", venueAvailable: true, message: "",
      });
    } catch (err) {
      setErrorMsg("❌ Failed to submit enquiry. " + (err.response?.data?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ── Fixed Fullscreen Background ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url(${donarBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }}
      />
      {/* ── Dark Overlay ── */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.75)", zIndex: 1 }} />

      {/* ── Scrollable Content Wrapper ── */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-28">
        <div className="w-full max-w-2xl">
          <div 
            className="rounded-[32px] p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            style={{
              background: "rgba(10, 10, 12, 0.9)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Header / Emblem */}
            <div className="text-center mb-8">
              {/* Glowing Red Droplet Icon Container */}
              <div className="w-16 h-16 rounded-full bg-black border border-red-500/30 flex items-center justify-center mx-auto mb-4 relative shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse" />
                <svg className="w-8 h-8 text-red-500 relative z-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  <path d="M12 9v6M9 12h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                Organizer <span className="text-red-500">Enquiry</span>
              </h2>
              <p className="text-zinc-400 text-sm max-w-md mx-auto">
                Plan a blood donation camp with us.<br />Our admin team will verify & assist you.
              </p>

              {/* ECG heartbeat pulse line separator */}
              <div className="flex items-center justify-center my-5 gap-3 opacity-80">
                <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-red-500/50" />
                <svg className="w-12 h-5 text-red-500" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 15H30L36 5L42 25L48 10L53 18L58 15H100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-red-500/50" />
              </div>
            </div>

            {errorMsg && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-sm font-medium">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-sm font-medium">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* SECTION 1 */}
              <div>
                <h3 className="text-red-500 text-xs font-bold uppercase tracking-wider mb-3">Section 1 — Personal Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-red-500"><User className="h-5 w-5" /></div>
                    <input className={inputCls} name="organizerName" placeholder="Organizer Name" value={form.organizerName} onChange={handleChange} required />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-red-500"><Phone className="h-5 w-5" /></div>
                    <input className={inputCls} name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} required />
                  </div>
                  <div className="relative md:col-span-2">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-red-500"><Mail className="h-5 w-5" /></div>
                    <input className={inputCls} name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} required />
                    <p className="text-xs text-red-400 mt-1 pl-2">⚠️ Isi email pe login credentials aayenge</p>
                  </div>
                </div>
              </div>

              {/* SECTION 2 */}
              <div className="border-t border-zinc-800/60 pt-4">
                <h3 className="text-red-500 text-xs font-bold uppercase tracking-wider mb-3">Section 2 — Organization Info</h3>
                
                <div className="mb-4">
                  <label className="text-zinc-400 text-xs mb-2 block pl-1">Organization Type *</label>
                  <div className="flex flex-wrap gap-2">
                    {['Personal', 'College', 'Corporate', 'NGO', 'Society'].map(type => (
                      <button
                        key={type} type="button"
                        onClick={() => handleSelect('organizationType', type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          form.organizationType === type 
                          ? 'bg-red-600/20 text-red-500 border border-red-500/50' 
                          : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-red-500"><Building2 className="h-5 w-5" /></div>
                  <input className={inputCls} name="organizationName" placeholder="Organization Name (Optional)" value={form.organizationName} onChange={handleChange} />
                </div>
              </div>

              {/* SECTION 3 */}
              <div className="border-t border-zinc-800/60 pt-4">
                <h3 className="text-red-500 text-xs font-bold uppercase tracking-wider mb-3">Section 3 — Camp Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-red-500"><Calendar className="h-5 w-5" /></div>
                    <input className={`${inputCls} appearance-none cursor-pointer [color-scheme:dark]`} name="preferredDate" type="date" value={form.preferredDate} onChange={handleChange} required />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-red-500"><Clock className="h-5 w-5" /></div>
                    <input className={inputCls} name="preferredTime" placeholder="Preferred Time (Optional)" value={form.preferredTime} onChange={handleChange} />
                  </div>
                  <div className="relative md:col-span-2">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-red-500"><MapPin className="h-5 w-5" /></div>
                    <input className={inputCls} name="area" placeholder="Area / Location" value={form.area} onChange={handleChange} required />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-zinc-400 text-xs mb-2 block pl-1">Expected Donors *</label>
                  <div className="flex flex-wrap gap-2">
                    {['10-25', '25-50', '50-100', '100-200', '200+'].map(range => (
                      <button
                        key={range} type="button"
                        onClick={() => handleSelect('expectedDonors', range)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          form.expectedDonors === range 
                          ? 'bg-red-600/20 text-red-500 border border-red-500/50' 
                          : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-2">
                  <label className="text-zinc-400 text-xs mb-2 block pl-1">Venue available hai aapke paas? *</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelect('venueAvailable', true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                        form.venueAvailable 
                        ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/50' 
                        : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
                      }`}
                    >
                      {form.venueAvailable && <CheckCircle className="w-3 h-3" />} Haan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelect('venueAvailable', false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        !form.venueAvailable 
                        ? 'bg-red-600/20 text-red-500 border border-red-500/50' 
                        : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
                      }`}
                    >
                      Nahi
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 4 */}
              <div className="border-t border-zinc-800/60 pt-4">
                <h3 className="text-red-500 text-xs font-bold uppercase tracking-wider mb-3">Section 4 — Extra Info</h3>
                <div className="relative">
                  <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-red-500"><MessageSquare className="h-5 w-5" /></div>
                  <textarea className={`${inputCls} resize-none min-h-[100px] pl-11 pt-3`} name="message" placeholder="Additional Message / Special Requirements (Optional)" value={form.message} onChange={handleChange} />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-4 rounded-xl text-white font-bold text-base cursor-pointer border-none flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500"
              >
                {loading ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Enquiry</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerEnquiry;