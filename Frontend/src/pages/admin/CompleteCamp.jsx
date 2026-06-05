import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CompleteCamp = () => {
  const { campId } = useParams();
  const navigate = useNavigate();
  const [camp, setCamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [totalDonors, setTotalDonors] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [checkedInDonors, setCheckedInDonors] = useState(''); // Comma separated list of donor IDs for simplicity
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const fetchCamp = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`/api/camps/${campId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCamp(res.data);
      } catch (err) {
        setError('Failed to load camp details');
      } finally {
        setLoading(false);
      }
    };
    fetchCamp();
  }, [campId]);

  const handlePhotoChange = (e) => {
    setPhotos(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('totalDonors', totalDonors);
      formData.append('totalUnitsCollected', totalUnits);
      
      const donorArray = checkedInDonors.split(',').map(d => d.trim()).filter(d => d);
      formData.append('checkedInDonors', JSON.stringify(donorArray));

      photos.forEach(photo => {
        formData.append('photos', photo);
      });

      // Adjust route if necessary: we built /api/camps/:campId/complete 
      // where :campId could be the generated ID like RDC... or _id
      await axios.patch(`/api/camps/${camp.campId || camp._id}/complete`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('Camp marked as completed! Emails sent successfully.');
      navigate('/admin'); // Or wherever admin goes back
    } catch (err) {
      alert(err.response?.data?.message || 'Error completing camp');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!camp) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 bg-white rounded-xl shadow-md border">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Mark Camp as Complete</h1>
      
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h2 className="font-semibold text-lg">{camp.title || camp.name}</h2>
        <p className="text-gray-600">ID: {camp.campId || camp._id}</p>
        <p className="text-gray-600">Date: {new Date(camp.date).toDateString()}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Donors Attended</label>
            <input 
              type="number" 
              required
              min="0"
              className="w-full p-2 border rounded focus:ring-red-500 focus:border-red-500"
              value={totalDonors}
              onChange={e => setTotalDonors(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Units Collected</label>
            <input 
              type="number" 
              required
              min="0"
              className="w-full p-2 border rounded focus:ring-red-500 focus:border-red-500"
              value={totalUnits}
              onChange={e => setTotalUnits(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Checked In Donor IDs (Comma separated)</label>
          <p className="text-xs text-gray-500 mb-2">Provide MongoDB Object IDs of users who donated to issue certificates.</p>
          <textarea 
            rows="3"
            className="w-full p-2 border rounded focus:ring-red-500 focus:border-red-500"
            placeholder="6a1bfb26..., 6a1bfb27..."
            value={checkedInDonors}
            onChange={e => setCheckedInDonors(e.target.value)}
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Camp Photos (Max 10)</label>
          <input 
            type="file" 
            multiple
            accept="image/*"
            className="w-full p-2 border rounded bg-gray-50"
            onChange={handlePhotoChange}
          />
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {submitting ? 'Processing and Sending Emails...' : 'Complete Camp & Send Certificates'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompleteCamp;
