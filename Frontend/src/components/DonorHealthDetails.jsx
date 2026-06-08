import React, { useState, useEffect } from 'react';
import { Activity, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const DonorHealthDetails = ({ currentUser, onUpdate, readOnly = false }) => {
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    gender: '',
    bloodGroup: currentUser?.bloodGroup || '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    hemoglobinLevel: '',
    sugarLevel: ''
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchHealthDetails();
  }, []);

  const fetchHealthDetails = async () => {
    try {
      setFetching(true);
      setError(null);
      const res = await api.get('/donor/health');
      if (res.data.success && res.data.data) {
        const { health, bloodGroup } = res.data.data;
        if (health && Object.keys(health).length > 0) {
          setFormData({
            weight: health.weight || '',
            height: health.height || '',
            age: health.age || '',
            gender: health.gender || '',
            bloodGroup: bloodGroup || '',
            emergencyContactName: health.emergencyContactName || '',
            emergencyContactNumber: health.emergencyContactNumber || '',
            hemoglobinLevel: health.hemoglobinLevel || '',
            sugarLevel: health.sugarLevel || ''
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch health details:', err);
      // We don't need to show an error if it's just empty/not set yet
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(false);
  };

  const calculateBMI = () => {
    if (formData.weight && formData.height) {
      const w = parseFloat(formData.weight);
      const h = parseFloat(formData.height) / 100;
      if (h > 0) {
        return (w / (h * h)).toFixed(1);
      }
    }
    return '0.0';
  };

  const getBMIStatus = (bmi) => {
    const num = parseFloat(bmi);
    if (num === 0) return { label: 'N/A', color: 'bg-gray-100 text-gray-600' };
    if (num < 18.5) return { label: 'Underweight', color: 'bg-blue-100 text-blue-700' };
    if (num >= 18.5 && num <= 24.9) return { label: 'Normal', color: 'bg-emerald-100 text-emerald-700' };
    if (num >= 25 && num <= 29.9) return { label: 'Overweight', color: 'bg-orange-100 text-orange-700' };
    return { label: 'Obese', color: 'bg-red-100 text-red-700' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await api.put('/donor/health', formData);
      if (res.data.success) {
        setSuccess(true);
        if (onUpdate) onUpdate(); // Callback to refresh dashboard data if needed
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update health details. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const currentBMI = calculateBMI();
  const bmiStatus = getBMIStatus(currentBMI);

  if (fetching) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#E74C3C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
        <div className="bg-red-50 p-2 rounded-xl border border-red-100">
          <Activity className="text-red-500 w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Health Details</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="text-emerald-500 w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700">Health details updated successfully!</p>
        </div>
      )}

      {/* HEALTH SUMMARY BADGES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-center items-center text-center">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">BMI</span>
          <span className="text-2xl font-bold text-gray-900">{currentBMI}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${bmiStatus.color}`}>
            {bmiStatus.label}
          </span>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-center items-center text-center">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">Blood Group</span>
          <span className="text-2xl font-bold text-red-600">{formData.bloodGroup || '-'}</span>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-center items-center text-center">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">Hemoglobin</span>
          <span className="text-2xl font-bold text-gray-900">{formData.hemoglobinLevel || '-'}</span>
          <span className="text-[10px] text-gray-500 font-medium mt-1">g/dL</span>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-center items-center text-center">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">Weight</span>
          <span className="text-2xl font-bold text-gray-900">{formData.weight || '-'}</span>
          <span className="text-[10px] text-gray-500 font-medium mt-1">kg</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Physical Vitals */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Physical Vitals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Weight (kg) *</label>
              <input 
                type="number" 
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                min="30" max="200" step="0.1"
                required
                disabled={readOnly}
                className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 transition-colors ${readOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} 
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Height (cm) *</label>
              <input 
                type="number" 
                name="height"
                value={formData.height}
                onChange={handleChange}
                min="100" max="250"
                required
                disabled={readOnly}
                className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 transition-colors ${readOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} 
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Age *</label>
              <input 
                type="number" 
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="18" max="65"
                required
                disabled={readOnly}
                className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 transition-colors ${readOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} 
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Gender *</label>
              <select 
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                disabled={readOnly}
                className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 transition-colors ${readOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Blood Profile */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 mt-2">Blood Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Blood Group *</label>
              <select 
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                required
                disabled={readOnly}
                className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 transition-colors ${readOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              >
                <option value="">Select Blood Group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Hemoglobin Level (g/dL) *</label>
              <input 
                type="number" 
                name="hemoglobinLevel"
                value={formData.hemoglobinLevel}
                onChange={handleChange}
                min="5" max="20" step="0.1"
                required
                disabled={readOnly}
                className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 transition-colors ${readOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} 
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Sugar Level (mg/dL) - Optional</label>
              <input 
                type="number" 
                name="sugarLevel"
                value={formData.sugarLevel}
                onChange={handleChange}
                min="40" max="400"
                disabled={readOnly}
                className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 transition-colors ${readOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} 
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 mt-2">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Contact Name *</label>
              <input 
                type="text" 
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                required
                disabled={readOnly}
                className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 transition-colors ${readOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} 
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Contact Number *</label>
              <input 
                type="text" 
                name="emergencyContactNumber"
                value={formData.emergencyContactNumber}
                onChange={handleChange}
                required
                placeholder="10-digit mobile number"
                disabled={readOnly}
                className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 transition-colors ${readOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} 
              />
            </div>
          </div>
        </div>

        {!readOnly && (
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white font-medium transition-all shadow-sm ${
                loading ? 'bg-red-400 cursor-not-allowed' : 'bg-[#E74C3C] hover:bg-red-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save size={18} />
                  Save Health Details
                </span>
              )}
            </button>
          </div>
        )}

      </form>
    </div>
  );
};

export default DonorHealthDetails;
