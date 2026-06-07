import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Calendar, Share2, AlertCircle, Droplet, Clock, MapPin, Search } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function CampRegistration() {
  const { campId } = useParams();
  const [camp, setCamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    name: '',
    mobile: '',
    bloodGroup: '',
    age: '',
    timeSlot: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetch(`/api/public/camp/${campId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setCamp(d.camp);
        else setError(d.message);
      })
      .catch(() => setError('Camp load nahi hua'))
      .finally(() => setLoading(false));
  }, [campId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.name || !form.mobile || !form.bloodGroup || !form.age || !form.timeSlot) {
      setFormError('Sab fields fill karo');
      return;
    }
    if (form.mobile.length !== 10) {
      setFormError('Valid 10 digit mobile number daalo');
      return;
    }
    if (form.age < 18 || form.age > 65) {
      setFormError('Age 18-65 ke beech honi chahiye');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/camp/${campId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.registration);
      } else {
        setFormError(data.message);
      }
    } catch (err) {
      setFormError('Kuch error aaya — dobara try karo');
    } finally {
      setSubmitting(false);
    }
  };

  const addToCalendar = () => {
    if (!camp) return;
    const start = new Date(camp.date).toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(camp.title)}&dates=${start}/${start}&details=${encodeURIComponent('Blood Donation Camp - ' + camp.venue)}&location=${encodeURIComponent(camp.venue + ', ' + camp.city)}`;
    window.open(url, '_blank');
  };

  const shareWithFriends = () => {
    const msg = `🩸 Blood Donation Camp!\n\n${camp.title}\n📅 Date: ${new Date(camp.date).toDateString()}\n📍 Venue: ${camp.venue}, ${camp.city}\n\nAao aur ek zindagi bachao!\nRegister: https://blooddonation.store/camps/${campId}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#E24B4A]/30 border-t-[#E24B4A] rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading camp details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isExpired = error.includes('khatam');
    const isFull = error.includes('bhar');
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full">
          <div className="text-6xl mb-4">
            {isExpired ? '⏰' : isFull ? '😔' : '😕'}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{error}</h2>
          <p className="text-gray-500 text-sm mb-8">
            {isExpired
              ? 'Yeh camp complete ho gaya. Agli baar zaroor aaiye!'
              : isFull
              ? 'Agli baar pehle register karo!'
              : 'Link galat hai ya camp available nahi hai.'}
          </p>
          <a
            href="https://blooddonation.store"
            className="inline-block px-6 py-3 bg-[#E24B4A] text-white font-bold rounded-xl hover:bg-[#C23B3A] transition"
          >
            Raktdaan pe jaao
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-inner">
            <Check className="w-10 h-10 stroke-[3]" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-500 mb-8">Aapka slot confirm ho gaya hai</p>

          <div className="bg-gray-50 rounded-xl p-5 text-left mb-8 border border-gray-100">
            {[
              { label: 'Name', value: success.name },
              { label: 'Camp', value: success.campTitle },
              { label: 'Date', value: success.date },
              { label: 'Venue', value: success.venue },
              { label: 'Time slot', value: success.timeSlot },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2.5 border-b border-gray-200 last:border-0">
                <span className="text-gray-500 text-sm">{label}</span>
                <span className="font-semibold text-gray-900 text-sm text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mb-6">
            <button onClick={addToCalendar} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition shadow-sm">
              <Calendar className="w-4 h-4" /> Calendar
            </button>
            <button onClick={shareWithFriends} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#1DA851] rounded-xl text-white font-bold transition shadow-sm">
              <Share2 className="w-4 h-4" /> Invite
            </button>
          </div>

          <div className="bg-red-50/50 rounded-xl p-4 text-left border border-red-100">
            <h4 className="text-red-800 font-bold text-xs flex items-center gap-1.5 mb-2 uppercase tracking-wide">
              <AlertCircle className="w-4 h-4" /> Yaad rakhein
            </h4>
            <ul className="space-y-1">
              {['Khali pet mat aaiye', 'Paani pee ke aaiye', 'ID proof saath laiye'].map(tip => (
                <li key={tip} className="text-red-600 text-xs flex items-center gap-2 font-medium">
                  <div className="w-1 h-1 bg-red-400 rounded-full"></div> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#E24B4A] to-[#C23B3A] pt-12 pb-20 px-6 text-center text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40L40 0H20L0 20M40 40V20L20 40" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Droplet className="w-4 h-4" /> Blood Donation Camp
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">{camp.title}</h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm font-medium opacity-90 mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(camp.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {camp.venue}, {camp.city}
            </div>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2 rounded-xl text-sm font-bold border border-white/20 shadow-xl">
            <span className="text-2xl">{camp.slotsLeft}</span> slots bache
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-xl mx-auto -mt-8 px-4 relative z-20">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl shadow-red-900/5 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            Register for free
          </h3>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Full name <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Aapka naam"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E24B4A] focus:bg-white focus:border-transparent outline-none transition font-medium text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Mobile number <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium">+91</span>
                </div>
                <input
                  type="tel"
                  placeholder="10 digit number"
                  value={form.mobile}
                  onChange={e => setForm(p => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E24B4A] focus:bg-white focus:border-transparent outline-none transition font-medium text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Blood group <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {BLOOD_GROUPS.map(bg => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, bloodGroup: bg }))}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                      form.bloodGroup === bg
                        ? 'border-[#E24B4A] bg-[#E24B4A] text-white shadow-md shadow-red-500/20'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Age <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  placeholder="18-65"
                  min="18"
                  max="65"
                  value={form.age}
                  onChange={e => setForm(p => ({ ...p, age: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E24B4A] focus:bg-white focus:border-transparent outline-none transition font-medium text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Time slot <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={form.timeSlot}
                    onChange={e => setForm(p => ({ ...p, timeSlot: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E24B4A] focus:bg-white focus:border-transparent outline-none transition font-medium text-gray-900 appearance-none pr-10"
                  >
                    <option value="">Select slot</option>
                    {camp.timeSlots?.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                  <Clock className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-3 animate-in fade-in zoom-in duration-200">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm font-medium text-red-700">{formError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg ${
                submitting 
                  ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-[#E24B4A] hover:bg-[#C23B3A] shadow-red-500/30'
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Register ho raha hai...
                </div>
              ) : (
                'Register for free'
              )}
            </button>

            <p className="text-center text-xs font-medium text-gray-400 pt-2">
              Free hai • No account needed • WhatsApp confirmation milegi
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
