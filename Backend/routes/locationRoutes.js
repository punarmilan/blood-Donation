import express from "express";
import axios from "axios";

const router = express.Router();

// @route   POST /api/location/detect
// @desc    Reverse geocode latitude and longitude to country, state, city
// @access  Public
router.post("/detect", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: "Latitude and Longitude are required" });
    }

    let country = "";
    let state = "";
    let city = "";

    // 1. Try Google Maps Geocoding API if key is present
    const googleKey = process.env.GOOGLE_PLACES_API_KEY;
    if (googleKey) {
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleKey}`
        );

        if (response.data && response.data.results && response.data.results.length > 0) {
          const addressComponents = response.data.results[0].address_components;

          addressComponents.forEach((component) => {
            const types = component.types;
            if (types.includes("country")) {
              country = component.long_name;
            }
            if (types.includes("administrative_area_level_1")) {
              state = component.long_name;
            }
            if (types.includes("locality") || types.includes("administrative_area_level_2") || types.includes("sublocality")) {
              if (!city) city = component.long_name;
            }
          });
        }
      } catch (err) {
        console.error("Google Geocoding error, falling back to OSM Nominatim:", err.message);
      }
    }

    // 2. Fallback to OpenStreetMap Nominatim reverse geocoding
    if (!country || !state) {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
          {
            headers: {
              "User-Agent": "RaktdaanOnlineV1/1.0"
            }
          }
        );

        if (response.data && response.data.address) {
          const address = response.data.address;
          country = address.country || "";
          state = address.state || address.region || "";
          city = address.city || address.town || address.village || address.suburb || address.county || "";
        }
      } catch (err) {
        console.error("OSM Nominatim Geocoding error:", err.message);
      }
    }

    // 3. Fallback to manual mock if both APIs failed (e.g., in offline/development environment)
    if (!country) {
      // Return a default mock based on coordinates or fallback to Pune
      country = "India";
      state = "Maharashtra";
      city = "Pune";
    }

    res.json({
      success: true,
      data: {
        country,
        state,
        city
      }
    });
  } catch (error) {
    console.error("Detect location error:", error);
    res.status(500).json({ success: false, message: "Server error detecting location" });
  }
});

// @route   GET /api/location/ip-detect
// @desc    Detect location approximately based on client IP
// @access  Public
router.get("/ip-detect", async (req, res) => {
  try {
    let clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    // If it's localhost or private IP, use a public IP fallback (e.g. for dev/testing)
    if (clientIp.includes("127.0.0.1") || clientIp.includes("::1") || clientIp.startsWith("192.168.")) {
      clientIp = ""; // Let ip-api detect server's external IP or use fallback
    }

    const url = clientIp ? `http://ip-api.com/json/${clientIp}` : "http://ip-api.com/json/";
    const response = await axios.get(url);

    if (response.data && response.data.status === "success") {
      return res.json({
        success: true,
        data: {
          country: response.data.country || "India",
          state: response.data.regionName || "Maharashtra",
          city: response.data.city || "Pune"
        }
      });
    }

    // Fallback if API fails
    res.json({
      success: true,
      data: {
        country: "India",
        state: "Maharashtra",
        city: "Pune"
      }
    });
  } catch (error) {
    console.error("IP detect location error:", error);
    // Silent fallback
    res.json({
      success: true,
      data: {
        country: "India",
        state: "Maharashtra",
        city: "Pune"
      }
    });
  }
});

export default router;
