import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Tent, FileText, Image as ImageIcon, Users, LogOut, KeyRound, Droplet, Download } from 'lucide-react';
import organizerService from '../../services/organizerService';

const Gallery = () => {
  const [completedCamps, setCompletedCamps] = useState([]);
  const [selectedCampId, setSelectedCampId] = useState('all');
  const [loading, setLoading] = useState(true);
  
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const navigate = useNavigate();

  // Fetch all camps and filter completed ones
  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const data = await organizerService.getMyCamps();
        
        if (data && data.length > 0) {
          const completed = data.filter(c => c.status === 'completed' && c.photos && c.photos.length > 0);
          setCompletedCamps(completed);
        }
      } catch (err) {
        console.error("Error fetching camps", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCamps();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('organizer-token');
    localStorage.removeItem('user');
    navigate('/organizer-login');
  };

  // Compile photos to show
  const photosToShow = selectedCampId === 'all' 
    ? completedCamps.flatMap(c => c.photos.map(p => ({ url: p, campTitle: c.title || c.name, campDate: c.date, campId: c._id })))
    : completedCamps.filter(c => c._id === selectedCampId).flatMap(c => c.photos.map(p => ({ url: p, campTitle: c.title || c.name, campDate: c.date, campId: c._id })));

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row font-sans relative">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-[#1C1C28] text-gray-300 flex-col h-screen fixed top-0 left-0 z-40">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-red-500 rounded-full p-2"><Droplet className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="text-white font-bold text-xl leading-tight">Raktdaan</h1>
              <p className="text-xs text-gray-400">Organizer Panel</p>
            </div>
          </div>
          <p className="text-xs font-semibold tracking-wider text-gray-500 mb-4 px-2">MAIN</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <Link to="/organizer-dashboard/dashboard" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-gray-400 hover:text-white hover:bg-white/5">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link to="/organizer-dashboard/my-camps" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-gray-400 hover:text-white hover:bg-white/5">
            <Tent className="w-5 h-5" /> My Camps
          </Link>
          <Link to="/organizer-dashboard/registrations" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-gray-400 hover:text-white hover:bg-white/5">
            <Users className="w-5 h-5" /> Registrations
          </Link>
          <Link to="/organizer-dashboard/reports" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-gray-400 hover:text-white hover:bg-white/5">
            <FileText className="w-5 h-5" /> Reports
          </Link>
          <Link to="/organizer-dashboard/gallery" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition bg-[#E74C3C] text-white shadow-sm">
            <ImageIcon className="w-5 h-5" /> Gallery
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 mt-auto">
          <Link to="/organizer/change-password" className="w-full flex items-center gap-3 hover:bg-white/5 p-3 rounded-xl transition text-gray-400 hover:text-white mb-2">
            <KeyRound className="w-5 h-5" />
            <span className="font-medium">Change Password</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center justify-between hover:bg-white/5 p-3 rounded-xl transition group">
            <div className="flex items-center gap-3 text-left">
              <div className="bg-red-500/20 text-red-500 font-bold w-10 h-10 rounded-full flex items-center justify-center">
                {user.name ? user.name.charAt(0).toUpperCase() : 'O'}
              </div>
              <div>
                <p className="text-white text-sm font-semibold truncate w-24">{user.name || 'Organizer'}</p>
                <p className="text-xs text-gray-500">Personal</p>
              </div>
            </div>
            <LogOut className="w-5 h-5 text-gray-500 group-hover:text-red-400 transition" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-10 w-full md:w-[calc(100%-16rem)] md:ml-64">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* SECTION 1 - HEADER ROW */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Camp Gallery</h2>
              <p className="text-sm text-gray-500 mt-1">Memories from your successful blood drives</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select 
                className="bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E24B4A] focus:border-transparent font-medium w-full md:w-64"
                value={selectedCampId}
                onChange={(e) => setSelectedCampId(e.target.value)}
                disabled={loading || completedCamps.length === 0}
              >
                <option value="all">All Camps ({completedCamps.length})</option>
                {completedCamps.map(camp => (
                  <option key={camp._id} value={camp._id}>
                    {camp.title || camp.name} ({new Date(camp.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-500">Loading gallery...</div>
          ) : photosToShow.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm mt-8">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <ImageIcon className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No photos available yet</h3>
              <p className="text-gray-500 max-w-md">
                Complete a blood donation camp and wait for the admin to upload photos of the drive. They will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-8">
              {photosToShow.map((photo, i) => (
                <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                  {/* Image */}
                  <img 
                    src={photo.url} 
                    alt="Camp Memory" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out" 
                  />
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  
                  {/* Details (on hover) */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-white font-bold text-sm leading-tight mb-1">{photo.campTitle}</p>
                    <p className="text-gray-300 text-xs font-medium">{new Date(photo.campDate).toLocaleDateString()}</p>
                  </div>
                  
                  {/* Download icon */}
                  <a 
                    href={photo.url} 
                    download
                    target="_blank" 
                    rel="noreferrer"
                    className="absolute top-3 right-3 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white hover:text-gray-900 transition opacity-0 group-hover:opacity-100"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Gallery;
