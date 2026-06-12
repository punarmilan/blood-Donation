import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createCloudinaryStorage } from "../config/cloudinary.js";
import SuccessStory from "../models/SuccessStory.js";

const router = express.Router();

// Define directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads/success-stories");

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration (Cloudinary)
const storage = createCloudinaryStorage("blood_donation/success_stories");

// Allow specific file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, and WEBP are allowed."));
  }
};

const upload = multer({ storage, fileFilter });

// 1. Upload Media Endpoint
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded or invalid file type." });
  }
  const fileUrl = req.file.path;
  res.json({ success: true, fileUrl });
});

// 2. Get All Items (Optional filter by active)
router.get("/", async (req, res) => {
  try {
    const { active, country, state, city, isGlobal, isActive } = req.query;
    const filter = {};
    if (active === 'true' || isActive === 'true') {
      filter.isActive = true;
    } else if (isActive === 'false') {
      filter.isActive = false;
    }
    if (country) filter.country = new RegExp(country.trim(), "i");
    if (state) filter.state = new RegExp(state.trim(), "i");
    if (city) filter.city = new RegExp(city.trim(), "i");
    if (isGlobal !== undefined) filter.isGlobal = isGlobal === "true";

    const items = await SuccessStory.find(filter).sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Create Item
router.post("/", async (req, res) => {
  try {
    const { 
      name, initials, subtitle, review, image, displayOrder, isActive,
      country, state, city, isGlobal, priority
    } = req.body;
    
    const newItem = new SuccessStory({
      name,
      initials,
      subtitle,
      review,
      image,
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
      country: country || "",
      state: state || "",
      city: city || "",
      isGlobal: isGlobal === "true" || isGlobal === true,
      priority: parseInt(priority) || 0,
    });

    await newItem.save();
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Update Item
router.put("/:id", async (req, res) => {
  try {
    const updatedItem = await SuccessStory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, data: updatedItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Delete Item
router.delete("/:id", async (req, res) => {
  try {
    const deletedItem = await SuccessStory.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    res.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
