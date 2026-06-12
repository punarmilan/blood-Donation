import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import { MapPin, Globe, Check, AlertTriangle, X } from "lucide-react";
import toast from "react-hot-toast";

const LocationSelector = ({ trigger }) => {
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem("detected_location");
    try {
      return saved ? JSON.parse(saved) : { country: "India", state: "Maharashtra", city: "Pune" };
    } catch {
      return { country: "India", state: "Maharashtra", city: "Pune" };
    }
  });

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  // Form states for manual editing
  const [countryInput, setCountryInput] = useState(location.country);
  const [stateInput, setStateInput] = useState(location.state);
  const [cityInput, setCityInput] = useState(location.city);

  // Sync inputs when location changes
  useEffect(() => {
    setCountryInput(location.country);
    setStateInput(location.state);
    setCityInput(location.city);
  }, [location]);

  // Initial detection
  useEffect(() => {
    const saved = localStorage.getItem("detected_location");
    const consent = localStorage.getItem("geo_consent");

    if (!saved) {
      if (consent === "granted") {
        detectGeoLocation();
      } else if (consent === "denied") {
        detectIPLocation();
      } else {
        // Show clean prompt asking for consent
        setShowPermissionPrompt(true);
      }
    }
  }, []);

  const detectGeoLocation = () => {
    if (!navigator.geolocation) {
      detectIPLocation();
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await api.post("/location/detect", { latitude, longitude });
          if (res.data && res.data.success) {
            const locData = res.data.data;
            saveLocation(locData);
            localStorage.setItem("geo_consent", "granted");
            toast.success(`Location detected: ${locData.city || locData.state || locData.country}`);
          } else {
            detectIPLocation();
          }
        } catch (err) {
          console.error("Geocoding failed, falling back to IP", err);
          detectIPLocation();
        } finally {
          setLoading(false);
          setShowPermissionPrompt(false);
        }
      },
      (error) => {
        console.warn("Geolocation permission denied/failed, falling back to IP", error.message);
        localStorage.setItem("geo_consent", "denied");
        detectIPLocation();
      },
      { timeout: 10000 }
    );
  };

  const detectIPLocation = async () => {
    setLoading(true);
    try {
      const res = await api.get("/location/ip-detect");
      if (res.data && res.data.success) {
        saveLocation(res.data.data);
      }
    } catch (err) {
      console.error("IP detection failed", err);
    } finally {
      setLoading(false);
      setShowPermissionPrompt(false);
    }
  };

  const saveLocation = (locData) => {
    const formatted = {
      country: locData.country || "India",
      state: locData.state || "Maharashtra",
      city: locData.city || ""
    };
    localStorage.setItem("detected_location", JSON.stringify(formatted));
    setLocation(formatted);
    window.dispatchEvent(new CustomEvent("locationChanged", { detail: formatted }));
  };

  const handleManualSave = (e) => {
    e.preventDefault();
    if (!countryInput.trim()) {
      toast.error("Country is required");
      return;
    }
    const manualLoc = {
      country: countryInput.trim(),
      state: stateInput.trim(),
      city: cityInput.trim()
    };
    saveLocation(manualLoc);
    setShowModal(false);
    toast.success("Location updated successfully!");
  };

  const displayName = location.city || location.state || location.country || "Global";

  return (
    <div className="relative z-[90] shrink-0">
      {/* Small Indicator Trigger Button */}
      {trigger ? (
        React.cloneElement(trigger, { onClick: () => setShowModal(true) })
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white hover:text-[#ff4d4d] transition-all text-xs font-semibold shadow-sm backdrop-blur-md cursor-pointer whitespace-nowrap shrink-0"
        >
          <MapPin size={13} className="text-[#ff4d4d]" />
          <span>{displayName}</span>
          <span className="text-[10px] text-zinc-300 font-normal underline ml-0.5">Change</span>
        </button>
      )}

      {/* Manual Location Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Globe size={18} className="text-[#ff4d4d]" />
                Select Your Location
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase">Country</label>
                <input
                  type="text"
                  value={countryInput}
                  onChange={(e) => setCountryInput(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#ff4d4d] transition-colors"
                  placeholder="e.g. India"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase">State / Province</label>
                <input
                  type="text"
                  value={stateInput}
                  onChange={(e) => setStateInput(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#ff4d4d] transition-colors"
                  placeholder="e.g. Maharashtra"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase">City</label>
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#ff4d4d] transition-colors"
                  placeholder="e.g. Pune"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    detectGeoLocation();
                    setShowModal(false);
                  }}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MapPin size={14} className="text-[#ff4d4d]" />
                  Auto-Detect
                </button>
                
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#ff4d4d] hover:bg-[#e60000] text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(255,77,77,0.3)]"
                >
                  <Check size={14} />
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Geolocation Permission Consent Prompt */}
      {showPermissionPrompt && createPortal(
        <div className="fixed bottom-6 right-6 z-[2000] max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl text-white space-y-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-950/40 border border-red-900/30 rounded-xl shrink-0">
              <MapPin className="text-[#ff4d4d] w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Personalize Your Experience?</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Raktdaan wants to use your location to show local blood requests, gallery updates, and blood camps near you.
              </p>
            </div>
          </div>
          <div className="flex gap-2.5 justify-end">
            <button
              onClick={() => {
                localStorage.setItem("geo_consent", "denied");
                detectIPLocation();
              }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              No, Use IP
            </button>
            <button
              onClick={() => {
                localStorage.setItem("geo_consent", "granted");
                detectGeoLocation();
              }}
              className="px-4 py-2 bg-[#ff4d4d] hover:bg-[#e60000] rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Allow Location
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LocationSelector;
