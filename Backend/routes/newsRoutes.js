import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createCloudinaryStorage } from "../config/cloudinary.js";
import News from "../models/News.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads/news");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = createCloudinaryStorage("blood_donation/news");

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only JPG, PNG, WEBP, GIF allowed."));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

/* ── Helpers ─────────────────────── */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/* ── Thumbnail Upload ─────────────── */
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });
  const fileUrl = req.file.path;
  res.json({ success: true, fileUrl });
});

/* ── POST /api/news ───────────────── */
router.post("/", async (req, res) => {
  try {
    const { 
      title, shortDescription, content, category, thumbnailUrl, published, author,
      country, state, city, isGlobal, isActive, priority
    } = req.body;
    let slug = generateSlug(title);

    // Ensure slug is unique
    const existing = await News.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const article = new News({
      title, slug, shortDescription, content, category,
      thumbnailUrl: thumbnailUrl || "",
      published: published || false,
      author: author || "Admin",
      country: country || "",
      state: state || "",
      city: city || "",
      isGlobal: isGlobal === "true" || isGlobal === true,
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
      priority: parseInt(priority) || 0,
    });

    await article.save();
    res.status(201).json({ success: true, data: article });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── GET /api/news ────────────────── */
router.get("/", async (req, res) => {
  try {
    const { published, category, country, state, city, isGlobal, isActive } = req.query;
    const filter = {};
    if (published === "true") filter.published = true;
    if (category) filter.category = category;
    if (country) filter.country = new RegExp(country.trim(), "i");
    if (state) filter.state = new RegExp(state.trim(), "i");
    if (city) filter.city = new RegExp(city.trim(), "i");
    if (isGlobal !== undefined) filter.isGlobal = isGlobal === "true";
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const articles = await News.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: articles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── GET /api/news/public ─────────── */
router.get("/public", async (req, res) => {
  try {
    const articles = await News.find({ published: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: articles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── GET /api/news/:slug ──────────── */
router.get("/:slug", async (req, res) => {
  try {
    const article = await News.findOne({ slug: req.params.slug });
    if (!article) return res.status(404).json({ success: false, message: "Article not found." });
    res.json({ success: true, data: article });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── PUT /api/news/:id ────────────── */
router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;

    // Regenerate slug if title changed
    if (updates.title) {
      let slug = generateSlug(updates.title);
      const existing = await News.findOne({ slug, _id: { $ne: req.params.id } });
      if (existing) slug = `${slug}-${Date.now()}`;
      updates.slug = slug;
    }

    // Set publishedAt if publishing for the first time
    if (updates.published === true || updates.published === "true") {
      const current = await News.findById(req.params.id);
      if (current && !current.publishedAt) updates.publishedAt = new Date();
    }

    const updated = await News.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "Article not found." });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── DELETE /api/news/:id ─────────── */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await News.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Article not found." });
    res.json({ success: true, message: "Article deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
