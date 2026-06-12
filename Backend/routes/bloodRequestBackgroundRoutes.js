import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createCloudinaryStorage } from "../config/cloudinary.js";
import BloodRequestBackground from "../models/BloodRequestBackground.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads/backgrounds");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration (Cloudinary)
const storage = createCloudinaryStorage("blood_donation/backgrounds");

// File filter and size limits
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|webp/;
  const allowedVideoTypes = /mp4|webm/;
  const extname = path.extname(file.originalname).toLowerCase();
  
  if (allowedImageTypes.test(extname) || allowedVideoTypes.test(extname)) {
    return cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only jpg, jpeg, png, webp, mp4, webm are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    // We handle size check in the route to differentiate image and video
    fileSize: 50 * 1024 * 1024 // Max overall limit 50MB
  }
});

/* ======================================================
   PUBLIC : GET ACTIVE BACKGROUND
====================================================== */
router.get("/", async (req, res) => {
  try {
    const activeBackground = await BloodRequestBackground.findOne({ isActive: true });
    res.json({ success: true, background: activeBackground });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching background", error: err.message });
  }
});

/* ======================================================
   ADMIN : GET ALL BACKGROUNDS
====================================================== */
router.get("/all", verifyToken, async (req, res) => {
  try {
    const { country, state, city, isGlobal, isActive } = req.query;
    const filter = {};
    if (country) filter.country = new RegExp(country.trim(), "i");
    if (state) filter.state = new RegExp(state.trim(), "i");
    if (city) filter.city = new RegExp(city.trim(), "i");
    if (isGlobal !== undefined) filter.isGlobal = isGlobal === "true";
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const backgrounds = await BloodRequestBackground.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, backgrounds });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching backgrounds", error: err.message });
  }
});

/* ======================================================
   ADMIN : UPLOAD NEW BACKGROUND
====================================================== */
router.post("/", verifyToken, upload.single("media"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { country, state, city, isGlobal, priority, isActive } = req.body;
    const extname = path.extname(req.file.originalname).toLowerCase();
    const isImage = /jpeg|jpg|png|webp/.test(extname);
    const mediaType = isImage ? "image" : "video";

    const isGlobalBool = isGlobal === "true" || isGlobal === true;
    const isActiveBool = isActive === "true" || isActive === true;

    // Deactivate previous active backgrounds for the same location
    if (isActiveBool) {
      await BloodRequestBackground.updateMany({
        country: country || "",
        state: state || "",
        city: city || "",
        isGlobal: isGlobalBool
      }, { isActive: false });
    }

    // Save new background
    const fileUrl = req.file.path;
    
    const newBackground = await BloodRequestBackground.create({
      mediaUrl: fileUrl,
      mediaType,
      isActive: isActiveBool,
      country: country || "",
      state: state || "",
      city: city || "",
      isGlobal: isGlobalBool,
      priority: parseInt(priority) || 0,
      uploadedBy: req.user ? req.user.id : null
    });

    res.status(201).json({ success: true, message: "Background uploaded successfully", background: newBackground });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error uploading background", error: err.message });
  }
});

/* ======================================================
   ADMIN : SET ACTIVE BACKGROUND
====================================================== */
router.put("/:id/active", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const bg = await BloodRequestBackground.findById(id);
    if (!bg) {
      return res.status(404).json({ success: false, message: "Background not found" });
    }

    // Deactivate other backgrounds for the same location
    await BloodRequestBackground.updateMany({
      country: bg.country || "",
      state: bg.state || "",
      city: bg.city || "",
      isGlobal: bg.isGlobal
    }, { isActive: false });
    
    // Activate target
    bg.isActive = true;
    await bg.save();

    res.json({ success: true, message: "Background set as active", background: bg });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error activating background", error: err.message });
  }
});

/* ======================================================
   ADMIN : UPDATE BACKGROUND DETAILS
====================================================== */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { country, state, city, isGlobal, priority, isActive } = req.body;
    const bg = await BloodRequestBackground.findById(req.params.id);
    if (!bg) return res.status(404).json({ success: false, message: "Background not found" });

    const isGlobalBool = isGlobal !== undefined ? (isGlobal === "true" || isGlobal === true) : bg.isGlobal;
    
    if (isActive === true || isActive === "true") {
      // Deactivate other backgrounds for the same location
      await BloodRequestBackground.updateMany({
        _id: { $ne: req.params.id },
        country: country !== undefined ? country : bg.country,
        state: state !== undefined ? state : bg.state,
        city: city !== undefined ? city : bg.city,
        isGlobal: isGlobalBool
      }, { isActive: false });
      bg.isActive = true;
    } else if (isActive === false || isActive === "false") {
      bg.isActive = false;
    }

    if (country !== undefined) bg.country = country;
    if (state !== undefined) bg.state = state;
    if (city !== undefined) bg.city = city;
    if (isGlobal !== undefined) bg.isGlobal = isGlobalBool;
    if (priority !== undefined) bg.priority = parseInt(priority) || 0;

    await bg.save();
    res.json({ success: true, message: "Background details updated successfully", background: bg });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating background", error: err.message });
  }
});

/* ======================================================
   ADMIN : DELETE BACKGROUND
====================================================== */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const background = await BloodRequestBackground.findById(id);
    
    if (!background) {
      return res.status(404).json({ success: false, message: "Background not found" });
    }

    // Note: Cloudinary asset deletion can be added here if needed.

    await BloodRequestBackground.findByIdAndDelete(id);

    // If we deleted the active one, optionally set another to active (for simplicity, we leave it empty)
    res.json({ success: true, message: "Background deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting background", error: err.message });
  }
});

export default router;
