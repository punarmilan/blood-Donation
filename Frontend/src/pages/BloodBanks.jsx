import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, GeoJSON } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { Search, MapPin, Droplet, Phone, Navigation, AlertCircle, RefreshCw, X } from "lucide-react";
import "./BloodBanks.css";

// Fix default Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icon for blood banks (red marker)
const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for user (blue marker)
const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper component to change map center and bounds dynamically
function MapUpdater({ userLocation, bloodBanks, activeBankRoute, routeData }) {
  const map = useMap();
  useEffect(() => {
    if (routeData && activeBankRoute && userLocation) {
      const bounds = L.latLngBounds([userLocation.lat, userLocation.lng]);
      bounds.extend([activeBankRoute.location.coordinates[1], activeBankRoute.location.coordinates[0]]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (userLocation && bloodBanks.length > 0) {
      const bounds = L.latLngBounds([userLocation.lat, userLocation.lng]);
      bloodBanks.forEach((bank) => {
        bounds.extend([bank.location.coordinates[1], bank.location.coordinates[0]]);
      });
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 12);
    }
  }, [userLocation, bloodBanks, map, activeBankRoute, routeData]);
  return null;
}

export default function BloodBanks() {
  const [userLocation, setUserLocation] = useState(null);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const [radius, setRadius] = useState(20);
  const [bloodGroup, setBloodGroup] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedBank, setSelectedBank] = useState(null);

  // Routing state
  const [routeData, setRouteData] = useState(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [activeBankRoute, setActiveBankRoute] = useState(null);

  // Default to Pune if not found initially
  const defaultCenter = { lat: 18.5204, lng: 73.8567 };

  const getUserLocation = () => {
    setError(null);
    setPermissionDenied(false);
    setLoading(true);

    if (!navigator.geolocation) {
      setError("Your browser does not support location services.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        fetchBloodBanks(latitude, longitude, radius, bloodGroup, searchQuery);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDenied(true);
          setError("Location permission is required to show nearby blood banks.");
        } else {
          setError("Failed to get your location.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const fetchBloodBanks = async (lat, lng, r, bg, sq) => {
    try {
      setLoading(true);
      const res = await axios.get("/api/blood-banks/nearby", {
        params: {
          lat,
          lng,
          radius: r,
          bloodGroup: bg,
          search: sq,
        },
      });
      let fetchedBanks = res.data.data || [];

      // Fetch actual driving distances in a single request using OSRM Table API
      if (fetchedBanks.length > 0) {
        try {
          const coords = [`${lng},${lat}`];
          fetchedBanks.forEach(b => coords.push(`${b.location.coordinates[0]},${b.location.coordinates[1]}`));
          const coordsString = coords.join(';');
          
          const destIndices = Array.from({length: fetchedBanks.length}, (_, i) => i + 1).join(';');
          const tableUrl = `https://router.project-osrm.org/table/v1/driving/${coordsString}?sources=0&destinations=${destIndices}&annotations=distance`;
          
          const tableRes = await axios.get(tableUrl);
          if (tableRes.data && tableRes.data.distances && tableRes.data.distances[0]) {
            const distances = tableRes.data.distances[0]; // Array of distances in meters
            fetchedBanks = fetchedBanks.map((bank, index) => {
              const meters = distances[index];
              if (meters) {
                bank.distanceKm = (meters / 1000).toFixed(2); // Overwrite aerial with driving
              } else {
                // If route not found, keep aerial distance but format it
                bank.distanceKm = Number(bank.distanceKm).toFixed(2);
              }
              return bank;
            });
          }
        } catch (tableErr) {
          console.error("Failed to fetch driving distances from OSRM table", tableErr);
          // Fallback to formatting aerial distance
          fetchedBanks = fetchedBanks.map(bank => {
             bank.distanceKm = Number(bank.distanceKm).toFixed(2);
             return bank;
          });
        }
      }

      setBloodBanks(fetchedBanks);
    } catch (err) {
      setError("Failed to fetch nearby blood banks. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectionsClick = async (e, bank) => {
    e.stopPropagation();
    if (!userLocation) {
      setError("Please allow location access to get directions.");
      return;
    }
    
    // Check if we already have this route
    if (activeBankRoute?._id === bank._id && routeData) {
      return;
    }

    setIsRouting(true);
    setRouteError(null);
    setActiveBankRoute(bank);
    setSelectedBank(bank);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${bank.location.coordinates[0]},${bank.location.coordinates[1]}?overview=full&geometries=geojson`;
      const response = await axios.get(url);
      
      if (response.data && response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        setRouteData({
          geometry: route.geometry,
          distanceKm: (route.distance / 1000).toFixed(2),
          durationMin: Math.ceil(route.duration / 60)
        });
      } else {
        setRouteError("Could not calculate route.");
      }
    } catch (err) {
      setRouteError("Error fetching route. Please try again.");
    } finally {
      setIsRouting(false);
    }
  };

  useEffect(() => {
    getUserLocation();
    // eslint-disable-next-line
  }, []);

  // Debounced search & filter
  useEffect(() => {
    if (!userLocation) return;
    const timer = setTimeout(() => {
      fetchBloodBanks(userLocation.lat, userLocation.lng, radius, bloodGroup, searchQuery);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [radius, bloodGroup, searchQuery]);

  return (
    <div className="bloodbanks-page">
      <div className="bloodbanks-hero">
        <div className="hero-content">
          <h1 className="hero-title">Nearby Blood Banks</h1>
          <p className="hero-subtitle">
            Showing active blood banks within {radius} km of your current location.
          </p>
        </div>
      </div>

      <div className="bloodbanks-container">
        {/* FILTERS */}
        <div className="filters-section">
          <div className="filter-group search-group">
            <Search className="filter-icon" />
            <input
              type="text"
              placeholder="Search blood bank or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <Droplet className="filter-icon" />
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Blood Groups</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <MapPin className="filter-icon" />
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="filter-select"
            >
              <option value={5}>5 km Radius</option>
              <option value={10}>10 km Radius</option>
              <option value={20}>20 km Radius</option>
              <option value={30}>30 km Radius</option>
              <option value={50}>50 km Radius</option>
            </select>
          </div>
          
          <button onClick={getUserLocation} className="btn-retry" title="Refresh Location">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* ERROR / PERMISSION DENIED */}
        {error && (
          <div className="error-banner">
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="error-text">{error}</p>
              {permissionDenied && (
                <button onClick={getUserLocation} className="btn-retry-text">
                  Retry Location
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bloodbanks-content">
          {/* LIST SECTION */}
          <div className="bloodbanks-list custom-scrollbar">
            <div className="list-header">
              <h2>{bloodBanks.length} Blood Banks Found</h2>
            </div>

            {loading && !bloodBanks.length && (
              <div className="loading-state">
                <div className="skeleton-card"></div>
                <div className="skeleton-card"></div>
                <div className="skeleton-card"></div>
              </div>
            )}

            {!loading && bloodBanks.length === 0 && !error && (
              <div className="empty-state">
                <MapPin className="w-12 h-12 text-zinc-600 mb-4" />
                <h3>No blood banks found</h3>
                <p>Try increasing the radius or searching a different area.</p>
              </div>
            )}

            {bloodBanks.map((bank) => (
              <div 
                key={bank._id} 
                className={`bank-card ${selectedBank?._id === bank._id ? 'selected' : ''}`}
                onClick={() => setSelectedBank(bank)}
              >
                <div className="bank-card-header">
                  <h3 className="bank-name">{bank.name}</h3>
                  <span className="bank-distance" title="Driving Distance">
                    {bank.distanceKm} km
                  </span>
                </div>
                
                <p className="bank-address">{bank.address}</p>
                
                <div className="bank-tags">
                  <span className={`status-badge ${bank.openStatus}`}>
                    {bank.openStatus.toUpperCase()}
                  </span>
                </div>

                <div className="blood-groups">
                  {bank.bloodGroupsAvailable.length > 0 ? (
                    bank.bloodGroupsAvailable.map(bg => (
                      <span key={bg} className="bg-chip">{bg}</span>
                    ))
                  ) : (
                    <span className="text-zinc-500 text-sm">Blood groups not updated</span>
                  )}
                </div>

                <div className="bank-actions">
                  <a href={`tel:${bank.phone}`} className="btn-call" onClick={(e) => e.stopPropagation()}>
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                  <button 
                    className="btn-directions"
                    onClick={(e) => handleDirectionsClick(e, bank)}
                  >
                    <Navigation className="w-4 h-4" />
                    Directions
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* MAP SECTION */}
          <div className="bloodbanks-map" style={{ zIndex: 1 }}>
            
            {/* Overlay for routing loading state */}
            {isRouting && (
              <div className="map-loading-overlay">
                <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                <p>Calculating Route...</p>
              </div>
            )}

            {/* Route Information Panel */}
            {routeData && activeBankRoute && (
              <div className="route-panel-container">
                <div className="route-panel">
                  <div className="route-panel-header">
                    <div className="route-panel-title">
                      <Navigation className="w-5 h-5 text-red-500" /> Route Info
                    </div>
                    <button className="btn-close-panel" onClick={() => { setRouteData(null); setActiveBankRoute(null); }}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="route-panel-body">
                    <div className="route-locations">
                      <div className="route-line-connector"></div>
                      <div className="route-location-item">
                        <MapPin className="w-5 h-5 text-blue-500 route-location-icon" />
                        <div className="route-location-text">
                          <h4>Origin</h4>
                          <p>Your Location</p>
                        </div>
                      </div>
                      <div className="route-location-item">
                        <MapPin className="w-5 h-5 text-red-500 route-location-icon" />
                        <div className="route-location-text">
                          <h4>Destination</h4>
                          <p>{activeBankRoute.name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="route-stats-grid">
                      <div className="route-stat">
                        <span className="route-stat-label">Driving Dist.</span>
                        <span className="route-stat-value">{routeData.distanceKm} KM</span>
                      </div>
                      <div className="route-stat">
                        <span className="route-stat-label">Est. Time</span>
                        <span className="route-stat-value">{routeData.durationMin} Min</span>
                      </div>
                    </div>

                    {routeError && (
                      <p className="text-red-500 text-sm mb-3">{routeError}</p>
                    )}

                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation?.lat},${userLocation?.lng}&destination=${activeBankRoute.location.coordinates[1]},${activeBankRoute.location.coordinates[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-start-nav"
                    >
                      Start Navigation ↗
                    </a>
                  </div>
                </div>
              </div>
            )}

            <MapContainer 
              center={[userLocation?.lat || defaultCenter.lat, userLocation?.lng || defaultCenter.lng]} 
              zoom={userLocation ? 12 : 6} 
              style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapUpdater userLocation={userLocation} bloodBanks={bloodBanks} activeBankRoute={activeBankRoute} routeData={routeData} />

              {/* User Location Marker */}
              {userLocation && (
                <>
                  <Marker position={[userLocation.lat, userLocation.lng]} icon={blueIcon}>
                    <Popup>You are here</Popup>
                  </Marker>
                  <Circle
                    center={[userLocation.lat, userLocation.lng]}
                    radius={radius * 1000}
                    pathOptions={{ color: '#e50914', fillColor: '#e50914', fillOpacity: 0.1, weight: 2 }}
                  />
                </>
              )}

              {/* Drawn Route */}
              {routeData && activeBankRoute && (
                <GeoJSON 
                  key={activeBankRoute._id} 
                  data={routeData.geometry} 
                  style={{ color: '#dc2626', weight: 4, opacity: 0.8 }} 
                />
              )}

              {/* Blood Bank Markers */}
              {bloodBanks.map((bank) => (
                <Marker
                  key={bank._id}
                  position={[bank.location.coordinates[1], bank.location.coordinates[0]]}
                  icon={redIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedBank(bank);
                    },
                  }}
                >
                  <Popup>
                    <div className="map-info-window">
                      <h4 className="info-title">{bank.name}</h4>
                      <p className="info-address">{bank.address}</p>
                      <p className="info-distance">Distance: {bank.distanceKm} km</p>
                      <div className="info-actions">
                        <a href={`tel:${bank.phone}`} className="info-btn-call">Call</a>
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${bank.location.coordinates[1]},${bank.location.coordinates[0]}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="info-btn-dir"
                        >
                          Directions
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
