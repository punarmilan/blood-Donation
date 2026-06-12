import express from "express";
import multer from "multer";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import BloodBank from "../models/BloodBank.js";
import BloodRequest from "../models/BloodRequest.js";
import OrganizerEnquiry from "../models/OrganizerEnquiry.js";
import Notification from "../models/Notification.js";
import Admin from "../models/Admin.js";
import { verifyToken, verifyBloodBank } from "../middleware/authMiddleware.js";

const router = express.Router();

const normalizeInventory = (inventory) => {
  const groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const normalized = {};
  for (const group of groups) {
    const raw = inventory ? inventory[group] : null;
    if (typeof raw === 'number') {
      normalized[group] = {
        wholeBlood: raw,
        redCells: 0,
        platelets: 0,
        plasma: 0
      };
    } else if (raw && typeof raw === 'object') {
      normalized[group] = {
        wholeBlood: typeof raw.wholeBlood === 'number' ? raw.wholeBlood : (parseInt(raw.wholeBlood, 10) || 0),
        redCells: typeof raw.redCells === 'number' ? raw.redCells : (parseInt(raw.redCells, 10) || 0),
        platelets: typeof raw.platelets === 'number' ? raw.platelets : (parseInt(raw.platelets, 10) || 0),
        plasma: typeof raw.plasma === 'number' ? raw.plasma : (parseInt(raw.plasma, 10) || 0)
      };
    } else {
      normalized[group] = {
        wholeBlood: 0,
        redCells: 0,
        platelets: 0,
        plasma: 0
      };
    }
  }
  return normalized;
};

const getInventorySummary = (inventory) => {
  const summary = [];
  const groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  for (const group of groups) {
    const raw = inventory ? inventory[group] : null;
    let total = 0;
    if (typeof raw === 'number') {
      total = raw;
    } else if (raw && typeof raw === 'object') {
      total = (parseInt(raw.wholeBlood, 10) || 0) +
        (parseInt(raw.redCells, 10) || 0) +
        (parseInt(raw.platelets, 10) || 0) +
        (parseInt(raw.plasma, 10) || 0);
    }
    if (total > 0) {
      summary.push({
        bloodGroup: group,
        totalUnits: total
      });
    }
  }
  return summary;
};

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
   BLOOD BANK: VERIFY INVITATION TOKEN
====================================================== */
router.get("/verify-invite-token", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required." });
    }

    const bloodBank = await BloodBank.findOne({ inviteToken: token, status: "invited" });
    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Invalid or expired registration link. Please contact admin." });
    }

    if (bloodBank.inviteTokenUsed) {
      return res.status(400).json({ success: false, message: "Invalid or expired registration link. Please contact admin." });
    }

    if (new Date() > bloodBank.inviteTokenExpires) {
      return res.status(400).json({ success: false, message: "Invalid or expired registration link. Please contact admin." });
    }

    res.json({
      success: true,
      data: {
        bloodBankName: bloodBank.name,
        managerName: bloodBank.managerName,
        email: bloodBank.email,
        mobile: bloodBank.mobile,
        city: bloodBank.city,
        licenseNumber: bloodBank.licenseNumber
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error verifying token", error: error.message });
  }
});

/* ======================================================
   BLOOD BANK: REGISTER (multipart/form-data)
====================================================== */
router.post("/register", upload.single("licenseDocument"), async (req, res) => {
  try {
    const {
      inviteToken,
      address,
      fullAddress,
      city,
      state,
      pincode,
      emergencyContact,
      emergencyContactNumber,
      openingTime,
      closingTime,
      available24x7,
      is24x7Available,
      latitude,
      longitude,
    } = req.body;

    if (!inviteToken) {
      return res.status(400).json({ success: false, message: "Invitation token is required." });
    }

    const bloodBank = await BloodBank.findOne({ inviteToken, status: "invited" });
    if (!bloodBank || bloodBank.inviteTokenUsed || new Date() > bloodBank.inviteTokenExpires) {
      return res.status(400).json({ success: false, message: "Invalid or expired registration link. Please contact admin." });
    }

    const finalAddress = address || fullAddress;
    const finalEmergencyContact = emergencyContact || emergencyContactNumber;
    const is24x7 = available24x7 === "true" || available24x7 === true || is24x7Available === "true" || is24x7Available === true;

    if (!finalAddress || !city || !state || !pincode || !finalEmergencyContact) {
      return res.status(400).json({ success: false, message: "All required registration fields must be completed." });
    }

    if (!is24x7 && (!openingTime || !closingTime)) {
      return res.status(400).json({ success: false, message: "Opening and closing times are required if not 24x7." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "License document is required." });
    }

    bloodBank.address = finalAddress;
    bloodBank.city = city;
    bloodBank.state = state;
    bloodBank.pincode = pincode;
    bloodBank.emergencyContact = finalEmergencyContact;
    bloodBank.openingTime = is24x7 ? "" : openingTime;
    bloodBank.closingTime = is24x7 ? "" : closingTime;
    bloodBank.available24x7 = is24x7;
    bloodBank.licenseDocumentUrl = `/uploads/blood-bank-licenses/${req.file.filename}`;
    bloodBank.status = "pending";
    bloodBank.inviteTokenUsed = true;

    if (latitude && longitude) {
      bloodBank.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    await bloodBank.save();
    res.status(200).json({ success: true, message: "Registration submitted successfully. Your request is pending admin approval." });
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

router.get("/me", verifyBloodBank, async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.bloodBank.id).select("-password -passwordSetupToken -passwordSetupTokenExpires");
    if (!bloodBank) return res.status(404).json({ success: false, message: "Blood bank not found" });

    const bbObj = bloodBank.toObject();
    bbObj.inventory = normalizeInventory(bloodBank.inventory);

    res.json({ success: true, data: bbObj });
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
    const criticalStockAlerts = [];

    for (const group of groups) {
      if (inventory[group] !== undefined) {
        const val = inventory[group];
        if (typeof val === 'object') {
          // Component based
          if (!bloodBank.inventory[group] ||
            typeof bloodBank.inventory[group] === 'number' ||
            typeof bloodBank.inventory[group] !== 'object' ||
            typeof bloodBank.inventory[group].wholeBlood === 'undefined') {
            bloodBank.inventory[group] = { wholeBlood: 0, redCells: 0, platelets: 0, plasma: 0 };
          }
          for (const comp of ["wholeBlood", "redCells", "platelets", "plasma"]) {
            if (val[comp] !== undefined) {
              const compVal = parseInt(val[comp], 10);
              if (isNaN(compVal) || compVal < 0) {
                return res.status(400).json({ success: false, message: `Inventory units for ${group} ${comp} cannot be negative` });
              }
              const oldVal = bloodBank.inventory[group][comp] || 0;
              bloodBank.inventory[group][comp] = compVal;
              if (compVal < 3 && oldVal >= 3) {
                criticalStockAlerts.push(`${group} (${comp}): ${compVal} units (was ${oldVal})`);
              } else if (compVal < 3 && oldVal < 3 && compVal !== oldVal) {
                // value changed but still critical
                criticalStockAlerts.push(`${group} (${comp}): ${compVal} units`);
              }
            }
          }
        } else {
          // Legacy direct number support (e.g. from older search requests)
          const numVal = parseInt(val, 10);
          if (isNaN(numVal) || numVal < 0) {
            return res.status(400).json({ success: false, message: "Inventory units cannot be negative" });
          }
          bloodBank.inventory[group] = {
            wholeBlood: numVal,
            redCells: 0,
            platelets: 0,
            plasma: 0
          };
          if (numVal < 3) {
            criticalStockAlerts.push(`${group} (Whole Blood): ${numVal} units`);
          }
        }
      }
    }

    bloodBank.lastInventoryUpdated = new Date();
    // Mark modified for mixed/nested object
    bloodBank.markModified('inventory');
    await bloodBank.save();

    const normalized = normalizeInventory(bloodBank.inventory);

    // Trigger Notification if newly critical or changed
    if (criticalStockAlerts.length > 0) {
      const message = `Critical stock alert for ${bloodBank.name}: The following components are below 3 units: ${criticalStockAlerts.join(", ")}.`;

      // Check if there is an existing unread notification with the same title/message
      const existingNotification = await Notification.findOne({
        userId: bloodBank._id,
        type: "critical_stock",
        isRead: false
      });

      if (!existingNotification) {
        // Send to Blood Bank
        await Notification.create({
          userId: bloodBank._id,
          title: "⚠️ Critical Stock Alert",
          message,
          type: "critical_stock"
        });

        // Send to Admin
        const admins = await Admin.find({});
        for (const admin of admins) {
          await Notification.create({
            userId: admin._id,
            title: `⚠️ Critical Stock: ${bloodBank.name}`,
            message,
            type: "critical_stock"
          });
        }
      }
    }

    res.json({ success: true, message: "Inventory updated successfully", data: normalized, lastUpdated: bloodBank.lastInventoryUpdated });
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

    if (!request.otp) {
      request.otp = Math.floor(1000 + Math.random() * 9000).toString();
    }

    await request.save();

    // Create Notification for the recipient
    await Notification.create({
      userId: request.recipient,
      title: "✅ Request Accepted by Blood Bank",
      message: `Your blood request has been accepted by ${req.bloodBank.name || "a Blood Bank"}. Check your dashboard for details.`,
      type: "request_accepted",
      bloodRequestId: request._id
    });

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
        query.$or = [
          { [`inventory.${bloodGroup}`]: { $gt: 0 } },
          { [`inventory.${bloodGroup}.wholeBlood`]: { $gt: 0 } },
          { [`inventory.${bloodGroup}.redCells`]: { $gt: 0 } },
          { [`inventory.${bloodGroup}.platelets`]: { $gt: 0 } },
          { [`inventory.${bloodGroup}.plasma`]: { $gt: 0 } }
        ];
      }
    }

    const bloodBanks = await BloodBank.find(query).select("-password -passwordSetupToken -passwordSetupTokenExpires").sort({ lastInventoryUpdated: -1 });

    const data = bloodBanks.map((bb) => {
      const bbObj = bb.toObject();
      bbObj.inventorySummary = getInventorySummary(bbObj.inventory);
      return bbObj;
    });

    res.json({ success: true, count: data.length, data });
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
        matchQuery.$or = [
          { [`inventory.${bloodGroup}`]: { $gt: 0 } },
          { [`inventory.${bloodGroup}.wholeBlood`]: { $gt: 0 } },
          { [`inventory.${bloodGroup}.redCells`]: { $gt: 0 } },
          { [`inventory.${bloodGroup}.platelets`]: { $gt: 0 } },
          { [`inventory.${bloodGroup}.plasma`]: { $gt: 0 } }
        ];
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
      bb.inventorySummary = getInventorySummary(bb.inventory);
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

/* ======================================================
   BLOOD BANK: GET ASSIGNED CAMP ENQUIRIES
====================================================== */
router.get("/camp-enquiries", verifyBloodBank, async (req, res) => {
  try {
    const list = await OrganizerEnquiry.find({ assignedBloodBank: req.bloodBank.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching assigned camps", error: error.message });
  }
});

/* ======================================================
   BLOOD BANK: RESPOND TO CAMP ENQUIRY ASSIGNMENT
====================================================== */
router.put("/camp-enquiries/:id/response", verifyBloodBank, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, resourcesConfirmed } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'accepted' or 'rejected'" });
    }

    const enquiry = await OrganizerEnquiry.findOne({ _id: id, assignedBloodBank: req.bloodBank.id });
    if (!enquiry) {
      return res.status(404).json({ success: false, message: "Assigned camp enquiry not found" });
    }

    enquiry.bloodBankStatus = status;
    enquiry.bloodBankNotes = notes || "";
    enquiry.resourcesConfirmed = status === 'accepted' ? !!resourcesConfirmed : false;
    enquiry.bloodBankResponseAt = new Date();
    await enquiry.save();

    res.json({ success: true, message: `Camp enquiry ${status} successfully`, data: enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error updating response", error: error.message });
  }
});

export default router;
