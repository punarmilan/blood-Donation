import express from "express";
import multer from "multer";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import BloodBank from "../models/BloodBank.js";
import BloodRequest from "../models/BloodRequest.js";
import { verifyToken, verifyBloodBank } from "../middleware/authMiddleware.js";

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads", "blood-bank-licenses");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `license-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);
    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG, JPEG, and PNG files are allowed"));
    }
  },
});

/* ======================================================
   BLOOD BANK: REGISTER (multipart/form-data)
====================================================== */
router.post("/register", upload.single("licenseDocument"), async (req, res) => {
  try {
    const {
      bloodBankName,
      managerName,
      email,
      mobile,
      licenseNumber,
      address,
      city,
      state,
      pincode,
      emergencyContact,
      openingTime,
      closingTime,
      available24x7,
      latitude,
      longitude,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "License document is required" });
    }

    // Check duplicates
    const existingEmail = await BloodBank.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ success: false, message: "Email already registered" });

    const existingMobile = await BloodBank.findOne({ mobile });
    if (existingMobile) return res.status(400).json({ success: false, message: "Mobile number already registered" });

    const existingLicense = await BloodBank.findOne({ licenseNumber });
    if (existingLicense) return res.status(400).json({ success: false, message: "License number already registered" });

    const bb = new BloodBank({
      name: bloodBankName,
      managerName,
      email: email.toLowerCase(),
      mobile,
      licenseNumber,
      address,
      city,
      state,
      pincode,
      emergencyContact,
      openingTime,
      closingTime,
      available24x7: available24x7 === "true" || available24x7 === true,
      licenseDocumentUrl: `/uploads/blood-bank-licenses/${req.file.filename}`,
      status: "pending",
      isVerified: false,
    });

    if (latitude && longitude) {
      bb.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    await bb.save();
    res.status(201).json({ success: true, message: "Blood bank registration submitted successfully. Please wait for admin approval." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error during registration", error: error.message });
  }
});

/* ======================================================
   BLOOD BANK: SET PASSWORD
====================================================== */
router.post("/set-password", async (req, res) => {
  try {
    const { email, token, password, confirmPassword } = req.body;

    if (!email || !token || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    }

    const bloodBank = await BloodBank.findOne({ email: email.toLowerCase(), status: "approved" });

    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Blood bank not found or not approved" });
    }

    if (bloodBank.passwordSetupToken !== token || new Date() > bloodBank.passwordSetupTokenExpires) {
      return res.status(400).json({ success: false, message: "Invalid or expired setup link" });
    }

    const salt = await bcrypt.genSalt(10);
    bloodBank.password = await bcrypt.hash(password, salt);
    bloodBank.passwordSetupToken = undefined;
    bloodBank.passwordSetupTokenExpires = undefined;

    await bloodBank.save();
    res.json({ success: true, message: "Password set successfully. You can now login." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error setting password", error: error.message });
  }
});

/* ======================================================
   BLOOD BANK: LOGIN
====================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const bloodBank = await BloodBank.findOne({ email: email.toLowerCase() });
    if (!bloodBank) return res.status(400).json({ success: false, message: "Invalid credentials" });

    if (bloodBank.status === "pending") return res.status(403).json({ success: false, message: "Your registration is pending admin approval." });
    if (bloodBank.status === "rejected") return res.status(403).json({ success: false, message: "Your registration was rejected. Please contact admin." });
    if (bloodBank.status === "blocked") return res.status(403).json({ success: false, message: "Your account has been blocked." });

    if (!bloodBank.password) {
      return res.status(403).json({ success: false, message: "Please set your password using the link sent to your email." });
    }

    const isMatch = await bcrypt.compare(password, bloodBank.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: bloodBank._id, role: "bloodbank" }, process.env.JWT_SECRET || "dev_secret_only", { expiresIn: "7d" });

    res.json({
      success: true,
      token,
      bloodBank: {
        id: bloodBank._id,
        name: bloodBank.name,
        email: bloodBank.email,
        managerName: bloodBank.managerName,
        isVerified: bloodBank.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error during login", error: error.message });
  }
});

/* ======================================================
   BLOOD BANK: GET PROFILE (Auth)
====================================================== */
router.get("/me", verifyBloodBank, async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.bloodBank.id).select("-password -passwordSetupToken -passwordSetupTokenExpires");
    if (!bloodBank) return res.status(404).json({ success: false, message: "Blood bank not found" });

    res.json({ success: true, data: bloodBank });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

/* ======================================================
   BLOOD BANK: GET ALL BLOOD REQUESTS
====================================================== */
router.get("/requests", verifyBloodBank, async (req, res) => {
  try {
    const requests = await BloodRequest.find()
      .populate("recipient", "name mobile")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching requests", error: error.message });
  }
});

/* ======================================================
   BLOOD BANK: UPDATE INVENTORY (Auth)
====================================================== */
router.put("/inventory", verifyBloodBank, async (req, res) => {
  try {
    const { inventory } = req.body;
    
    if (!inventory || typeof inventory !== 'object') {
      return res.status(400).json({ success: false, message: "Invalid inventory data" });
    }

    const bloodBank = await BloodBank.findById(req.bloodBank.id);
    if (!bloodBank) return res.status(404).json({ success: false, message: "Blood bank not found" });

    const groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    
    for (const group of groups) {
      if (inventory[group] !== undefined) {
        const val = parseInt(inventory[group], 10);
        if (isNaN(val) || val < 0) {
          return res.status(400).json({ success: false, message: "Inventory units cannot be negative" });
        }
        bloodBank.inventory[group] = val;
      }
    }

    bloodBank.lastInventoryUpdated = new Date();
    await bloodBank.save();

    res.json({ success: true, message: "Inventory updated successfully", data: bloodBank.inventory, lastUpdated: bloodBank.lastInventoryUpdated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error updating inventory", error: error.message });
  }
});

/* ======================================================
   BLOOD BANK: ACCEPT BLOOD REQUEST
====================================================== */
router.put("/requests/:requestId/accept", verifyBloodBank, async (req, res) => {
  try {
    const request = await BloodRequest.findOne({ requestId: req.params.requestId });
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    
    if (request.status !== "active" && request.status !== "pending") {
      return res.status(400).json({ success: false, message: "Request is already accepted or completed." });
    }

    request.status = "accepted";
    request.acceptedByBloodBank = req.bloodBank.id;
    request.acceptedAt = new Date();
    
    await request.save();
    res.json({ success: true, message: "Request accepted successfully", data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error while accepting request", error: error.message });
  }
});

/* ======================================================
   PUBLIC: GET APPROVED BLOOD BANKS (Search/Nearby)
====================================================== */
router.get("/search", async (req, res) => {
  try {
    const { city, bloodGroup } = req.query;

    const query = { status: "approved", isVerified: true };

    if (city) {
      query.city = new RegExp(city, "i");
    }

    if (bloodGroup) {
      // Validate blood group
      const validGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
      if (validGroups.includes(bloodGroup)) {
        query[`inventory.${bloodGroup}`] = { $gt: 0 };
      }
    }

    const bloodBanks = await BloodBank.find(query).select("-password -passwordSetupToken -passwordSetupTokenExpires").sort({ lastInventoryUpdated: -1 });

    res.json({ success: true, count: bloodBanks.length, data: bloodBanks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error searching blood banks", error: error.message });
  }
});

// Legacy nearby support
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

    const matchQuery = { status: "approved", isVerified: true };

    if (bloodGroup && bloodGroup !== "All") {
      const validGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
      if (validGroups.includes(bloodGroup)) {
        matchQuery[`inventory.${bloodGroup}`] = { $gt: 0 };
      }
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      matchQuery.$or = [
        { name: searchRegex },
        { address: searchRegex },
        { city: searchRegex }
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
      {
        $project: {
          password: 0,
          passwordSetupToken: 0,
          passwordSetupTokenExpires: 0
        }
      }
    ]);

    const data = bloodBanks.map((bb) => {
      bb.distanceKm = Number((bb.distanceMeters / 1000).toFixed(2));
      return bb;
    });

    res.json({
      success: true,
      count: data.length,
      radiusKm: parseFloat(radius),
      userLocation: { lat: userLat, lng: userLng },
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching nearby blood banks", error: error.message });
  }
});

export default router;
