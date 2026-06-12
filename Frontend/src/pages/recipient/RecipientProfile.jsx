import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { 
  User, Phone, Mail, Droplet, MapPin, 
  Activity, LogOut, ChevronRight, FileText, 
  AlertCircle, ShieldCheck, Heart
} from "lucide-react";
import { toast } from "react-hot-toast";

const RecipientProfile = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, logout, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate("/login");
      return;
    }
    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser, authLoading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/recipient/profile");
      if (res.data.success) {
        setProfile(res.data.user);
        const reqList = res.data.requests || [];
        setRequests(reqList);
        if (reqList.length > 0) {
          const latestReq = reqList[0];
          if (latestReq.requestId) {
            navigate(`/request-status/${latestReq.requestId}`, { replace: true });
            return;
          }
        }
      }
    } catch (error) {
      console.error("Profile load error:", error);
      toast.error(error.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToDonor = async () => {
    try {
      setConverting(true);
      const res = await api.patch("/users/convert-to-donor");

      if (res.data.success) {
        // Save updated user to localStorage and update AuthContext
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setCurrentUser(res.data.user);
        
        // Dispatch event in case other components are listening
        window.dispatchEvent(new Event("userUpdated"));

        toast.success("Congratulations! You are now registered as a donor.");
        navigate("/donor/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Convert to donor error:", error);
      toast.error(error.response?.data?.message || "Conversion failed");
    } finally {
      setConverting(false);
      setShowConfirmModal(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Profile Not Found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-4 md:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="bg-zinc-950/80 border border-zinc-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-red-600/10 border border-red-600/30 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Recipient Profile</h1>
              <p className="text-zinc-500 text-sm mt-1">Manage your active blood requests and profile settings.</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl transition-all flex items-center gap-2 border border-zinc-800"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Profile details grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Details Card */}
          <div className="md:col-span-2 bg-zinc-950/80 border border-zinc-900 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md space-y-6">
            <h2 className="text-lg font-bold text-white border-b border-zinc-900 pb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              <span>Personal Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Full Name</span>
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-600" />
                  {profile.name || "N/A"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Phone Number</span>
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-zinc-600" />
                  +91 {profile.mobile || "N/A"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Email Address</span>
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-600" />
                  {profile.email || "N/A"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">City</span>
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-zinc-600" />
                  {profile.city || "N/A"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Blood Group</span>
                <p className="text-sm font-black text-red-500 flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-red-500 fill-red-500/20" />
                  {profile.bloodGroup || "N/A"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Account Role</span>
                <p className="text-sm font-semibold text-white capitalize flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-zinc-600" />
                  {profile.role}
                </p>
              </div>
            </div>
          </div>

          {/* Become a Donor Card */}
          <div className="bg-gradient-to-b from-red-950/20 to-zinc-950/50 border border-red-900/30 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Heart className="w-40 h-40 text-red-500" />
            </div>
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-500 fill-red-500/10" />
              </div>
              <h2 className="text-xl font-bold text-white">Become a Donor</h2>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Your single donation can save up to 3 lives. Switch to a donor account and start contributing to emergency requests around you.
              </p>
            </div>
            <button
              onClick={() => setShowConfirmModal(true)}
              className="mt-6 w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-red-900/40 hover:-translate-y-0.5"
            >
              Convert to Donor
            </button>
          </div>
        </div>

        {/* Blood Requests Section */}
        <div className="bg-zinc-950/80 border border-zinc-900 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-zinc-900 pb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-500" />
            <span>Your Blood Requests</span>
          </h2>

          {requests.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-semibold">No blood requests created yet.</p>
              <p className="text-xs text-zinc-600 mt-1">If you need blood, you can create a new request form.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="bg-[#0c0c0e] border border-zinc-900/80 hover:border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0">
                      <span className="text-red-500 font-extrabold text-sm">{req.bloodGroup}</span>
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">
                        Request for {req.patientName || "Patient"}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Hospital: {req.hospital || "N/A"} | Units: {req.units || 1}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          req.status === "completed" ? "bg-emerald-500" :
                          req.status === "accepted" ? "bg-sky-500" : "bg-amber-500"
                        }`} />
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">{req.status}</span>
                      </div>
                    </div>
                  </div>

                  {req.requestId && (
                    <button
                      onClick={() => navigate(`/request-status/${req.requestId}`)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>View Status</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-[#0d0d10] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-fade-in text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-red-500 fill-red-500/10" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Become a Donor?</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Are you sure you want to become a donor? After conversion, you will be able to accept blood requests and help save lives.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                disabled={converting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-bold text-sm rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                disabled={converting}
                onClick={handleConvertToDonor}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/40"
              >
                {converting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Yes, Convert</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipientProfile;
