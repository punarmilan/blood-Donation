import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createCloudinaryStorage } from "../config/cloudinary.js";
import ImpactGallery from "../models/ImpactGallery.js";

const router = express.Router();

// Define directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads/impact-gallery");

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration (Cloudinary)
const storage = createCloudinaryStorage("blood_donation/impact_gallery");

// Allow specific file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, WEBP, and MP4 are allowed."));
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

// 2. Get All Items
router.get("/", async (req, res) => {
  try {
    const items = await ImpactGallery.find().sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Create Item
router.post("/", async (req, res) => {
  try {
    const { title, description, location, date, category, mediaType, mediaUrl, featured, displayOrder } = req.body;
    
    // If setting as featured, optionally un-feature others
    if (featured) {
      await ImpactGallery.updateMany({}, { featured: false });
    }

    const newItem = new ImpactGallery({
      title,
      description,
      location,
      date,
      category,
      mediaType,
      mediaUrl,
      featured: featured || false,
      displayOrder: displayOrder || 0,
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
    const { featured } = req.body;
    
    // If setting as featured, un-feature others
    if (featured === true) {
      await ImpactGallery.updateMany({ _id: { $ne: req.params.id } }, { featured: false });
    }

    const updatedItem = await ImpactGallery.findByIdAndUpdate(
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
    const deletedItem = await ImpactGallery.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    res.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
