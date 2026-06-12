import React, { useState } from "react";
import { Link } from "react-router-dom";
import { submitOrganizerEnquiry } from "../services/enquiryService";
import INDIAN_STATES from "../utils/indianStates";
import { 
  User, Users, Phone, Mail, Building2, Calendar, Clock, MapPin, 
  MessageSquare, ArrowRight, ArrowLeft, Droplet, Heart, CheckCircle, Lock, Globe 
} from "lucide-react";

// Input class for the form fields
const inputCls = "w-full pl-11 pr-4 py-4 bg-[#0a0a0a]/60 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/30 transition-all duration-200";

const OrganizerEnquiry = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    organizerName: "",
    phone: "",
    email: "",
    organizationType: "Personal",
    organizationName: "",
    preferredDate: "",
    preferredTime: "",
    area: "",
    state: "Maharashtra",
    city: "",
    address: "",
    pincode: "",
    expectedDonors: "50-100",
    venueAvailable: true,
    message: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSelect = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await submitOrganizerEnquiry(form);
      setSuccessMsg("Enquiry submitted successfully! We will contact you soon.");
      setCurrentStep(5); // Success step
    } catch (err) {
      setErrorMsg("Failed to submit enquiry. " + (err.response?.data?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: "Personal Info" },
    { num: 2, title: "Organization" },
    { num: 3, title: "Camp Details" },
    { num: 4, title: "Review & Submit" }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row overflow-hidden font-sans pt-20 lg:pt-0">
      
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 border-r border-zinc-900/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-[#050505] to-[#050505] pointer-events-none" />
        
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
             <Droplet className="w-4 h-4 fill-white text-white" />
          </div>
          <div>
            <h1 className="text-white font-black text-xl leading-none">Raktdaan</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Blood Donation Centre</p>
          </div>
        </div>

        {/* CSS Blood Bag Graphic */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center mt-12 mb-8">
           <div className="relative w-[220px] h-[300px] bg-gradient-to-b from-red-600/30 to-red-900/80 rounded-[40px] border-4 border-red-500/40 shadow-[0_0_80px_rgba(220,38,38,0.3)] backdrop-blur-md overflow-visible flex items-center justify-center">
               {/* Top Tubes */}
               <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-28 flex justify-between px-2">
                   <div className="w-3.5 h-12 bg-gradient-to-b from-transparent to-red-600 rounded-t-full border-x border-t border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
                   <div className="w-3.5 h-16 bg-gradient-to-b from-transparent to-red-600 rounded-t-full border-x border-t border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.8)] -mt-4"></div>
                   <div className="w-3.5 h-12 bg-gradient-to-b from-transparent to-red-600 rounded-t-full border-x border-t border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
               </div>
               
               {/* Heart shaped SVG tube exiting from bottom right and curving up */}
               <svg className="absolute -right-32 bottom-0 w-[150px] h-[200px] overflow-visible pointer-events-none" viewBox="0 0 100 200">
                  <path d="M 0 160 C 50 160, 80 180, 100 150 C 120 120, 80 80, 100 50 C 120 20, 140 60, 100 90 C 80 110, 50 120, 0 120" stroke="url(#redGlowGrad)" strokeWidth="4" fill="none" filter="drop-shadow(0 0 8px rgba(220,38,38,0.9))" />
                  <defs>
                     <linearGradient id="redGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#991b1b" />
                     </linearGradient>
                  </defs>
               </svg>

               {/* Bottom hanging tubes */}
               <div className="absolute -bottom-8 left-6 w-3 h-10 bg-gradient-to-t from-transparent to-red-700 rounded-b-full shadow-[0_0_10px_rgba(220,38,38,0.8)] border-x border-b border-red-500/50" />
               <div className="absolute -bottom-10 left-16 w-3 h-12 bg-gradient-to-t from-transparent to-red-700 rounded-b-full shadow-[0_0_10px_rgba(220,38,38,0.8)] border-x border-b border-red-500/50" />

               {/* Inner Label */}
               <div className="bg-[#f0f0f0] w-[170px] h-[200px] rounded-[20px] flex flex-col items-center justify-center shadow-inner relative z-10 p-4">
                   <Droplet className="w-8 h-8 text-red-600 fill-red-600 drop-shadow-md mb-2" />
                   <h4 className="text-zinc-900 font-black text-[11px] text-center leading-snug mb-1">DONATE BLOOD<br/>SAVE LIVES</h4>
                   <div className="flex items-center gap-1 my-2">
                       <div className="w-4 h-[1px] bg-zinc-400"></div>
                       <Heart className="w-3 h-3 text-red-500" />
                       <div className="w-4 h-[1px] bg-zinc-400"></div>
                   </div>
                   <div className="w-full h-8 flex flex-col justify-end border-b border-zinc-400 pb-2 mb-2">
                      <div className="w-full flex gap-1 justify-center">
                         <div className="w-1 h-6 bg-zinc-800"></div>
                         <div className="w-2 h-6 bg-zinc-800"></div>
                         <div className="w-1 h-6 bg-zinc-800"></div>
                         <div className="w-3 h-6 bg-zinc-800"></div>
                         <div className="w-1 h-6 bg-zinc-800"></div>
                         <div className="w-2 h-6 bg-zinc-800"></div>
                         <div className="w-1 h-6 bg-zinc-800"></div>
                      </div>
                   </div>
                   <p className="text-[8px] text-zinc-600 font-bold uppercase w-full text-center tracking-widest">EVERY DROP COUNTS</p>
               </div>
           </div>
        </div>

        {/* Text Details */}
        <div className="relative z-10 mb-8">
           <h2 className="text-4xl font-extrabold text-white mb-2">
             Organize a<br/><span className="text-red-500">Blood Camp</span>
           </h2>
           <p className="text-zinc-400 text-sm max-w-xs leading-relaxed">
             Fill the details and our team will help you organize a successful and impactful blood camp.
           </p>
        </div>

        {/* Stats Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-3">
           <div className="bg-[#0a0a0a] border border-zinc-900/80 rounded-2xl p-4 flex items-center gap-3">
              <Users className="w-6 h-6 text-red-500/80" />
              <div>
                 <div className="text-white font-bold text-sm">850+</div>
                 <div className="text-[10px] text-zinc-500">Camps Organized</div>
              </div>
           </div>
           <div className="bg-[#0a0a0a] border border-zinc-900/80 rounded-2xl p-4 flex items-center gap-3">
              <Droplet className="w-6 h-6 text-red-500/80 fill-red-500/20" />
              <div>
                 <div className="text-white font-bold text-sm">1,25,000+</div>
                 <div className="text-[10px] text-zinc-500">Lives Impacted</div>
              </div>
           </div>
           <div className="bg-[#0a0a0a] border border-zinc-900/80 rounded-2xl p-4 flex items-center gap-3">
              <Building2 className="w-6 h-6 text-red-500/80" />
              <div>
                 <div className="text-white font-bold text-sm">50+</div>
                 <div className="text-[10px] text-zinc-500">Partner Hospitals</div>
              </div>
           </div>
           <div className="bg-[#0a0a0a] border border-zinc-900/80 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-red-500/80" />
              <div>
                 <div className="text-white font-bold text-sm">100%</div>
                 <div className="text-[10px] text-zinc-500">Safe & Secure</div>
              </div>
           </div>
        </div>
      </div>

      {/* RIGHT PANEL (FORM) */}
      <div className="w-full lg:w-7/12 p-6 md:p-12 lg:p-16 flex flex-col items-center justify-center relative bg-[#09090b] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-20 min-h-screen">
        
        <div className="w-full max-w-xl">
           
           {/* Stepper Header */}
           {currentStep < 5 && (
           <div className="flex items-center justify-between mb-16 relative">
              <div className="absolute left-0 top-6 w-full h-[1px] bg-zinc-800 -z-10 border-t border-dashed border-zinc-700" />
              
              {steps.map((step) => {
                 const isActive = step.num === currentStep;
                 const isPassed = step.num < currentStep;
                 return (
                   <div key={step.num} className="flex flex-col items-center gap-3 bg-[#09090b] px-2">
                      <div className={`w-12 h-12 rounded-full border-[1.5px] flex items-center justify-center text-sm font-bold transition-all duration-300
                        ${isActive ? 'border-red-500 text-red-500 bg-red-950/20 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 
                          isPassed ? 'border-red-900 text-red-500 bg-red-950/10' : 'border-zinc-800 text-zinc-600 bg-[#0a0a0a]'}`}
                      >
                         {isPassed ? <CheckCircle className="w-5 h-5" /> : `0${step.num}`}
                      </div>
                      <span className={`text-[11px] font-bold ${isActive ? 'text-red-500' : 'text-zinc-500'}`}>
                         {step.title}
                      </span>
                   </div>
                 );
              })}
           </div>
           )}

           {/* Form Area */}
           <div className="mb-10 min-h-[300px]">
             
             {errorMsg && (
               <div className="mb-6 px-4 py-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-sm font-medium">
                 {errorMsg}
               </div>
             )}

             {currentStep === 1 && (
               <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold text-white mb-8">
                     Let's start with your<br/><span className="text-red-500">personal information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-500"><User className="h-4 w-4" /></div>
                       <input className={inputCls} name="organizerName" placeholder="Enter full name" value={form.organizerName} onChange={handleChange} required />
                       <label className="absolute -top-2.5 left-4 bg-[#09090b] px-1 text-[10px] font-bold text-zinc-500">Organizer Name *</label>
                     </div>
                     <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-500"><Phone className="h-4 w-4" /></div>
                       <input className={inputCls} name="phone" placeholder="Enter phone number" value={form.phone} onChange={handleChange} required />
                       <label className="absolute -top-2.5 left-4 bg-[#09090b] px-1 text-[10px] font-bold text-zinc-500">Phone Number *</label>
                     </div>
                     <div className="relative md:col-span-2 mt-2">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-500"><Mail className="h-4 w-4" /></div>
                       <input className={inputCls} name="email" type="email" placeholder="Enter email address" value={form.email} onChange={handleChange} required />
                       <label className="absolute -top-2.5 left-4 bg-[#09090b] px-1 text-[10px] font-bold text-zinc-500">Email Address *</label>
                       <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1.5 pl-1"><Lock className="w-3 h-3" /> Your information is safe with us and will not be shared.</p>
                     </div>
                  </div>
               </div>
             )}

             {currentStep === 2 && (
               <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold text-white mb-8">
                     Tell us about your<br/><span className="text-red-500">organization</span>
                  </h3>
                  <div className="mb-6">
                    <label className="text-zinc-400 text-xs font-bold mb-3 block pl-1">Organization Type *</label>
                    <div className="flex flex-wrap gap-3">
                      {['Personal', 'College', 'Corporate', 'NGO', 'Society'].map(type => (
                        <button
                          key={type} type="button"
                          onClick={() => handleSelect('organizationType', type)}
                          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            form.organizationType === type 
                            ? 'bg-red-600/20 text-red-500 border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.15)]' 
                            : 'bg-zinc-900/30 text-zinc-400 border border-zinc-800 hover:bg-zinc-800/80 hover:text-white'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative mt-6">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-500"><Building2 className="h-4 w-4" /></div>
                    <input className={inputCls} name="organizationName" placeholder="Enter organization name" value={form.organizationName} onChange={handleChange} />
                    <label className="absolute -top-2.5 left-4 bg-[#09090b] px-1 text-[10px] font-bold text-zinc-500">Organization Name (Optional)</label>
                  </div>
               </div>
             )}

             {currentStep === 3 && (
               <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold text-white mb-8">
                     Provide the<br/><span className="text-red-500">camp details</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                     <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-500"><Calendar className="h-4 w-4" /></div>
                       <input className={`${inputCls} appearance-none cursor-pointer [color-scheme:dark]`} name="preferredDate" type="date" value={form.preferredDate} onChange={handleChange} required />
                       <label className="absolute -top-2.5 left-4 bg-[#09090b] px-1 text-[10px] font-bold text-zinc-500">Preferred Date *</label>
                     </div>
                     <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-500"><Clock className="h-4 w-4" /></div>
                       <input className={inputCls} name="preferredTime" placeholder="e.g. 10:00 AM - 4:00 PM" value={form.preferredTime} onChange={handleChange} />
                       <label className="absolute -top-2.5 left-4 bg-[#09090b] px-1 text-[10px] font-bold text-zinc-500">Preferred Time (Optional)</label>
                     </div>
                     <div className="relative mt-2">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-500"><Globe className="h-4 w-4" /></div>
                       <select className={`${inputCls} appearance-none cursor-pointer`} name="state" value={form.state} onChange={handleChange} required>
                         <option value="">Select State *</option>
                         {INDIAN_STATES.map(st => (
                           <option key={st} value={st}>{st}</option>
                         ))}
                       </select>
                       <label className="absolute -top-2.5 left-4 bg-[#09090b] px-1 text-[10px] font-bold text-zinc-500">State *</label>
                     </div>
                     <div className="relative mt-2">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-500"><MapPin className="h-4 w-4" /></div>
                       <input className={inputCls} name="city" placeholder="Enter City *" value={form.city} onChange={handleChange} required />
                       <label className="absolute -top-2.5 left-4 bg-[#09090b] px-1 text-[10px] font-bold text-zinc-500">City *</label>
                     </div>
                     <div className="relative md:col-span-2 mt-2">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-500"><MapPin className="h-4 w-4" /></div>
                       <input className={inputCls} name="address" placeholder="Enter full address *" value={form.address} onChange={(e) => {
                         const val = e.target.value;
                         setForm(prev => ({ ...prev, address: val, area: val }));
                       }} required />
                       <label className="absolute -top-2.5 left-4 bg-[#09090b] px-1 text-[10px] font-bold text-zinc-500">Area / Full Address *</label>
                     </div>
                     <div className="relative md:col-span-2 mt-2">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-500"><MapPin className="h-4 w-4" /></div>
                       <input className={inputCls} name="pincode" placeholder="Enter Pincode (Optional)" value={form.pincode} onChange={handleChange} />
                       <label className="absolute -top-2.5 left-4 bg-[#09090b] px-1 text-[10px] font-bold text-zinc-500">Pincode</label>
                     </div>
                  </div>

                  <div className="mb-6 mt-2">
                    <label className="text-zinc-400 text-xs font-bold mb-3 block pl-1">Expected Donors *</label>
                    <div className="flex flex-wrap gap-3">
                      {['10-25', '25-50', '50-100', '100-200', '200+'].map(range => (
                        <button
                          key={range} type="button"
                          onClick={() => handleSelect('expectedDonors', range)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            form.expectedDonors === range 
                            ? 'bg-red-600/20 text-red-500 border border-red-500/50' 
                            : 'bg-zinc-900/30 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="text-zinc-400 text-xs font-bold mb-3 block pl-1">Do you have a venue available? *</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleSelect('venueAvailable', true)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                          form.venueAvailable 
                          ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/50' 
                          : 'bg-zinc-900/30 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {form.venueAvailable && <CheckCircle className="w-3.5 h-3.5" />} Yes, I have
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelect('venueAvailable', false)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                          !form.venueAvailable 
                          ? 'bg-red-600/20 text-red-500 border border-red-500/50' 
                          : 'bg-zinc-900/30 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {!form.venueAvailable && <CheckCircle className="w-3.5 h-3.5" />} No, need help
                      </button>
                    </div>
                  </div>
               </div>
             )}

             {currentStep === 4 && (
               <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold text-white mb-8">
                     Review and <span className="text-red-500">submit</span>
                  </h3>
                  
                  {/* Summary Block */}
                  <div className="bg-[#0a0a0a]/50 border border-zinc-800 rounded-2xl p-6 mb-6 text-sm">
                      <div className="grid grid-cols-2 gap-y-4">
                        <div><span className="text-zinc-500 text-xs block mb-1">Name</span><span className="text-white">{form.organizerName || '-'}</span></div>
                        <div><span className="text-zinc-500 text-xs block mb-1">Phone</span><span className="text-white">{form.phone || '-'}</span></div>
                        <div className="col-span-2"><span className="text-zinc-500 text-xs block mb-1">Email</span><span className="text-white">{form.email || '-'}</span></div>
                        <div><span className="text-zinc-500 text-xs block mb-1">Organization</span><span className="text-white">{form.organizationType} {form.organizationName ? `(${form.organizationName})` : ''}</span></div>
                        <div><span className="text-zinc-500 text-xs block mb-1">Date</span><span className="text-white">{form.preferredDate || '-'}</span></div>
                        <div><span className="text-zinc-500 text-xs block mb-1">State</span><span className="text-white">{form.state || '-'}</span></div>
                        <div><span className="text-zinc-500 text-xs block mb-1">City</span><span className="text-white">{form.city || '-'}</span></div>
                        <div className="col-span-2"><span className="text-zinc-500 text-xs block mb-1">Address</span><span className="text-white">{form.address || '-'}</span></div>
                        {form.pincode && <div><span className="text-zinc-500 text-xs block mb-1">Pincode</span><span className="text-white">{form.pincode}</span></div>}
                      </div>
                  </div>

                  <div className="relative mt-4">
                    <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none text-red-500"><MessageSquare className="h-4 w-4" /></div>
                    <textarea className={`${inputCls} resize-none min-h-[100px] pl-11 pt-4`} name="message" placeholder="Any special requirements or messages for our team?" value={form.message} onChange={handleChange} />
                    <label className="absolute -top-2.5 left-4 bg-[#09090b] px-1 text-[10px] font-bold text-zinc-500">Additional Details (Optional)</label>
                  </div>
               </div>
             )}

             {currentStep === 5 && (
                <div className="animate-fade-in flex flex-col items-center justify-center text-center py-10">
                   <div className="w-20 h-20 bg-emerald-950/30 border border-emerald-500/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                      <CheckCircle className="w-10 h-10 text-emerald-500" />
                   </div>
                   <h3 className="text-2xl font-bold text-white mb-3">Enquiry Submitted!</h3>
                   <p className="text-zinc-400 text-sm max-w-sm mb-8 leading-relaxed">
                     Thank you for your initiative. Our team will review your request and contact you within 24-48 hours.
                   </p>
                   <Link to="/" className="px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-bold text-sm hover:bg-zinc-800 transition-colors">
                      Back to Home
                   </Link>
                </div>
             )}
           </div>

           {/* Footer Navigation */}
           {currentStep < 5 && (
           <div className="flex items-center justify-between pt-6 border-t border-zinc-900">
             <button
               type="button"
               onClick={prevStep}
               disabled={currentStep === 1 || loading}
               className="flex items-center gap-2 px-6 py-3 rounded-xl text-zinc-400 font-bold text-sm border border-zinc-800 hover:bg-zinc-900 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
             >
               <ArrowLeft className="w-4 h-4" /> Back
             </button>
             
             {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 rounded-xl text-white font-bold text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:-translate-y-0.5"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
             ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 rounded-xl text-white font-bold text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Enquiry"} <ArrowRight className="w-4 h-4" />
                </button>
             )}
           </div>
           )}

           {currentStep < 5 && (
              <div className="mt-8 text-center text-zinc-500 text-sm">
                Already registered?{" "}
                <Link to="/organizer-login" className="text-red-500 hover:text-red-400 hover:underline font-bold transition-all ml-1">
                  Organizer Login
                </Link>
              </div>
           )}

        </div>
      </div>
      
      {/* Basic Fade In animation CSS */}
      <style>{`
         .animate-fade-in {
            animation: fadeIn 0.4s ease-out forwards;
         }
         @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
         }
      `}</style>
    </div>
  );
};

export default OrganizerEnquiry;