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
    sugarLevel: '',
    lastDonationDate: ''
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Health report states
  const [reportType, setReportType] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [fileError, setFileError] = useState('');

  // AI Suggestion states
  const [aiReport, setAiReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    fetchHealthDetails();
    fetchAiReport();
  }, []);

  const fetchAiReport = async () => {
    try {
      const res = await api.get('/health/ai-suggestion');
      if (res.data.success && res.data.data) {
        setAiReport(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch AI report:', err);
    }
  };

  const fetchHealthDetails = async () => {
    try {
      setFetching(true);
      setError(null);
      const res = await api.get('/donor/health');
      if (res.data.success && res.data.data) {
        const { health, bloodGroup, healthReport, lastDonationDate, gender } = res.data.data;
        setFormData({
          weight: health?.weight || '',
          height: health?.height || '',
          age: health?.age || '',
          gender: gender || health?.gender || '',
          bloodGroup: bloodGroup || '',
          emergencyContactName: health?.emergencyContactName || '',
          emergencyContactNumber: health?.emergencyContactNumber || '',
          hemoglobinLevel: health?.hemoglobinLevel || '',
          sugarLevel: health?.sugarLevel || '',
          lastDonationDate: lastDonationDate ? new Date(lastDonationDate).toISOString().split('T')[0] : ''
        });
        if (healthReport) {
          setCurrentReport(healthReport);
          setReportType(healthReport.reportType || '');
          if (healthReport.reportDate) {
            setReportDate(new Date(healthReport.reportDate).toISOString().split('T')[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch health details:', err);
      // We don't need to show an error if it's just empty/not set yet
    } finally {
      setFetching(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileError('');

    // Check size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size must be less than 5MB');
      setSelectedFile(null);
      return;
    }

    // Check type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Only PDF, JPG and PNG files are allowed');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
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

    // Front-end Validations:
    if (selectedFile && (!reportType || reportType.trim() === '')) {
      setError('Report type is required if a report file is selected.');
      setLoading(false);
      return;
    }
    if (reportType && !selectedFile && !currentReport) {
      setError('Please upload a report file or remove the selected Report Type.');
      setLoading(false);
      return;
    }
    if (reportDate) {
      const today = new Date().toISOString().split('T')[0];
      if (reportDate > today) {
        setError('Report Date cannot be in the future.');
        setLoading(false);
        return;
      }
    }

    try {
      const data = new FormData();
      // Append text fields
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });

      // Append report fields
      data.append('reportType', reportType);
      data.append('reportDate', reportDate);
      
      if (selectedFile) {
        data.append('healthReportFile', selectedFile);
      }

      const res = await api.put('/donor/health', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setSuccess(true);
        if (res.data.data && res.data.data.healthReport) {
          setCurrentReport(res.data.data.healthReport);
          setSelectedFile(null);
        }
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
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Last Blood Donation Date (Optional)</label>
              <input 
                type="date" 
                name="lastDonationDate"
                value={formData.lastDonationDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                disabled={readOnly}
                className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 transition-colors ${readOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} 
              />
            </div>
          </div>
        </div>

        {/* HEALTH REPORT UPLOAD */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 mt-2">Health Report Upload</h3>
          
          <div className="space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-6">
            
            {/* Show Current Uploaded Report Card if available */}
            {currentReport && currentReport.fileUrl && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="bg-red-50 p-2.5 rounded-lg text-[#E74C3C] shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Uploaded Report</p>
                    <p className="text-sm font-bold text-gray-900 truncate max-w-[180px] sm:max-w-[300px]">{currentReport.fileName}</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Type: <span className="font-semibold text-gray-700">{currentReport.reportType}</span> | Date: <span className="font-semibold text-gray-700">{new Date(currentReport.reportDate).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <a
                    href={currentReport.fileUrl.startsWith('http') ? currentReport.fileUrl : `${import.meta.env.VITE_API_BASE_URL || ''}${currentReport.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial text-center text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl px-4 py-2 transition-colors"
                  >
                    View / Download
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      // Allow replacement by clearing currentReport but keeping UI clean
                      setCurrentReport(null);
                    }}
                    className="flex-1 sm:flex-initial text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 transition-colors"
                  >
                    Replace Report
                  </button>
                </div>
              </div>
            )}

            {/* Upload Zone */}
            {(!currentReport || !currentReport.fileUrl) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Drag and Drop File Input */}
                <div className="md:col-span-2">
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Upload Latest Health Report</label>
                  
                  <div className="relative border-2 border-dashed border-gray-200 hover:border-red-400 rounded-xl p-6 flex flex-col items-center justify-center bg-white cursor-pointer transition-colors group">
                    <input 
                      type="file"
                      id="healthReportFile"
                      name="healthReportFile"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-red-500 transition-colors mb-3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    <p className="text-sm font-bold text-gray-700">Upload PDF, JPG or PNG health report</p>
                    <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
                  </div>

                  {fileError && (
                    <p className="text-xs text-red-500 font-semibold mt-2 flex items-center gap-1 animate-pulse">
                      <AlertCircle size={12} /> {fileError}
                    </p>
                  )}

                  {/* Selected File Card */}
                  {selectedFile && (
                    <div className="mt-4 bg-white border border-gray-200 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-red-50 p-2 rounded-lg text-[#E74C3C] shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg px-2.5 py-1.5 transition-colors shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Report Type */}
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    required={!!selectedFile}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 transition-colors"
                  >
                    <option value="">Select Type</option>
                    <option value="CBC">CBC</option>
                    <option value="Sugar">Sugar</option>
                    <option value="BP">BP</option>
                    <option value="General Checkup">General Checkup</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Report Date */}
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Report Date</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

              </div>
            )}

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
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              type="button"
              disabled={aiLoading || loading}
              onClick={async () => {
                setError(null);
                setAiError(null);
                if (!formData.weight || !formData.height || !formData.age || !formData.gender || !formData.bloodGroup || !formData.hemoglobinLevel) {
                  setError("Please complete your health details first.");
                  return;
                }
                setAiLoading(true);
                try {
                  const res = await api.post('/health/ai-suggestion');
                  if (res.data.success) {
                    setAiReport(res.data.data);
                  }
                } catch (err) {
                  setAiError(err.response?.data?.message || 'Failed to generate AI suggestion. Please try again.');
                } finally {
                  setAiLoading(false);
                }
              }}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm border ${
                aiLoading ? 'bg-red-50 text-red-400 border-red-100 cursor-not-allowed' : 'bg-red-50 hover:bg-red-100 text-[#E74C3C] border-red-200'
              }`}
            >
              {aiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#E74C3C] border-t-transparent rounded-full animate-spin"></div>
                  Generating your health suggestion...
                </>
              ) : (
                <>
                  <Activity size={18} className="animate-pulse" />
                  Generate AI Health Suggestion
                </>
              )}
            </button>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white font-medium transition-all shadow-sm ${
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

      {/* AI Suggestion Error */}
      {aiError && (
        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{aiError}</p>
        </div>
      )}

      {/* AI SUGGESTION REPORT */}
      {aiReport && (
        <div className="mt-8 bg-white rounded-2xl p-6 sm:p-8 border border-red-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-[#E74C3C] to-red-500"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-gray-100 gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2 rounded-xl border border-red-100">
                <Activity className="text-red-500 w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Smart Health Suggestion Report</h3>
                <p className="text-xs text-gray-500 mt-0.5">Powered by Gemini AI • Generated at {new Date(aiReport.generatedAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                aiReport.suggestionLevel === 'Good' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                aiReport.suggestionLevel === 'Needs Attention' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                Status: {aiReport.suggestionLevel}
              </span>
            </div>
          </div>

          <div className="space-y-6 text-left">
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Health Summary</h4>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{aiReport.healthSummary}</p>
            </div>

            {aiReport.keyObservations && aiReport.keyObservations.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Key Observations</h4>
                <ul className="space-y-2">
                  {aiReport.keyObservations.map((obs, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiReport.lifestyleSuggestions && aiReport.lifestyleSuggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Lifestyle Suggestions</h4>
                <ul className="space-y-2">
                  {aiReport.lifestyleSuggestions.map((sug, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></span>
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Blood Donation Suggestion</h4>
              <p className="text-sm text-gray-700 leading-relaxed bg-red-50/30 p-4 rounded-xl border border-red-100/50">{aiReport.bloodDonationSuggestion}</p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Doctor Advice</h4>
              <p className="text-sm text-gray-700 leading-relaxed bg-amber-50/20 p-4 rounded-xl border border-amber-100/50">{aiReport.doctorAdvice}</p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 italic bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed">
                ⚠️ <strong>Disclaimer:</strong> {aiReport.importantNote}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorHealthDetails;
