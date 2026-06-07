import express from "express";
import BloodBank from "../models/BloodBank.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ======================================================
   PUBLIC: GET NEARBY BLOOD BANKS
====================================================== */
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng, radius = 20, bloodGroup, search } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: "Latitude and longitude are required" });
    }

    const radiusInMeters = parseFloat(radius) * 1000;
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    if (isNaN(userLat) || isNaN(userLng) || isNaN(radiusInMeters)) {
      return res.status(400).json({ success: false, message: "Invalid coordinates or radius" });
    }

    // Build the query
    const matchQuery = { status: "active" };

    if (bloodGroup && bloodGroup !== "All") {
      matchQuery.bloodGroupsAvailable = bloodGroup;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      matchQuery.$or = [
        { name: searchRegex },
        { address: searchRegex }
      ];
    }

    const bloodBanks = await BloodBank.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [userLng, userLat] },
          distanceField: "distanceMeters",
          maxDistance: radiusInMeters,
          query: matchQuery,
          spherical: true,
        },
      },
    ]);

    // Format the response and convert distance to KM
    const data = bloodBanks.map((bb) => {
      return {
        _id: bb._id,
        name: bb.name,
        address: bb.address,
        phone: bb.phone,
        email: bb.email,
        bloodGroupsAvailable: bb.bloodGroupsAvailable,
        status: bb.status,
        openStatus: bb.openStatus,
        distanceKm: Number((bb.distanceMeters / 1000).toFixed(2)),
        location: bb.location,
      };
    });

    res.json({
      success: true,
      count: data.length,
      radiusKm: parseFloat(radius),
      userLocation: { lat: userLat, lng: userLng },
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error fetching nearby blood banks", error: err.message });
  }
});

/* ======================================================
   ADMIN: GET ALL BLOOD BANKS
====================================================== */
router.get("/admin/all", verifyToken, async (req, res) => {
  try {
    const bloodBanks = await BloodBank.find().sort({ createdAt: -1 });
    res.json({ success: true, data: bloodBanks });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

/* ======================================================
   ADMIN: CREATE BLOOD BANK
====================================================== */
router.post("/admin", verifyToken, async (req, res) => {
  try {
    const { name, address, phone, email, bloodGroupsAvailable, status, openStatus, latitude, longitude } = req.body;

    if (!name || !address || !phone || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: "Required fields are missing" });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: "Invalid latitude or longitude values" });
    }

    const bloodBank = await BloodBank.create({
      name,
      address,
      phone,
      email,
      bloodGroupsAvailable: Array.isArray(bloodGroupsAvailable) ? bloodGroupsAvailable : [],
      status: status || "active",
      openStatus: openStatus || "unknown",
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
    });

    res.status(201).json({ success: true, message: "Blood bank added successfully", data: bloodBank });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error adding blood bank", error: err.message });
  }
});

/* ======================================================
   ADMIN: UPDATE BLOOD BANK
====================================================== */
router.put("/admin/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, bloodGroupsAvailable, status, openStatus, latitude, longitude } = req.body;

    if (!name || !address || !phone || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: "Required fields are missing" });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: "Invalid latitude or longitude values" });
    }

    const updated = await BloodBank.findByIdAndUpdate(
      id,
      {
        name,
        address,
        phone,
        email,
        bloodGroupsAvailable: Array.isArray(bloodGroupsAvailable) ? bloodGroupsAvailable : [],
        status,
        openStatus,
        location: {
          type: "Point",
          coordinates: [lng, lat],
        },
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Blood bank not found" });
    }

    res.json({ success: true, message: "Blood bank updated successfully", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating blood bank", error: err.message });
  }
});

/* ======================================================
   ADMIN: DELETE BLOOD BANK
====================================================== */
router.delete("/admin/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await BloodBank.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Blood bank not found" });
    }

    res.json({ success: true, message: "Blood bank deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting blood bank", error: err.message });
  }
});

/* ======================================================
   ADMIN: TOGGLE STATUS
====================================================== */
router.patch("/admin/:id/status", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const bloodBank = await BloodBank.findById(id);

    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Blood bank not found" });
    }

    bloodBank.status = bloodBank.status === "active" ? "inactive" : "active";
    await bloodBank.save();

    res.json({ success: true, message: "Status updated successfully", data: bloodBank });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error toggling status", error: err.message });
  }
});

/* ======================================================
   ADMIN: GEOCODE ADDRESS
====================================================== */
router.post("/admin/geocode", verifyToken, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ success: false, message: "Address is required" });
    }

    const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ success: false, message: "Google Geocoding API key is missing on the server" });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      const { lat, lng } = result.geometry.location;
      const formattedAddress = result.formatted_address;

      return res.json({
        success: true,
        formattedAddress,
        lat,
        lng,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Geocoding failed to find coordinates for the provided address",
        googleStatus: data.status,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Geocoding error", error: err.message });
  }
});

export default router;
