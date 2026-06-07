import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";

import http from "http";
import { initSocket } from "./socket.js";
import connectDB from "./config/db.js";
import { initializeAdmin } from "./models/Admin.js";
import { createCloudinaryStorage } from "./config/cloudinary.js";

import donorRoutes from "./routes/donorRoutes.js";
import campRoutes from "./routes/campRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import organizerEnquiryRoutes from "./routes/organizerEnquiryRoutes.js";
import organizerRoutes from "./routes/organizerRoutes.js";
import impactGalleryRoutes from "./routes/impactGalleryRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import successStoryRoutes from "./routes/successStoryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import waRoutes from "./routes/waRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import bloodRequestBackgroundRoutes from "./routes/bloodRequestBackgroundRoutes.js";
import { connectToWhatsApp } from "./whatsapp/waClient.js";

const app = express();
app.set("trust proxy", 1); // Trust reverse proxy to get correct protocol (https)
const server = http.createServer(app);
initSocket(server);

app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://blooddonation.store",
        "https://www.blooddonation.store",
      ];

      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);

      if (
        allowed.includes(origin) || 
        origin.startsWith("http://192.168.") ||
        origin.startsWith("http://localhost:")
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploads statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Theme Settings Server-side Persistence
const settingsFile = path.join(__dirname, "uploads", "themeSettings.json");
const getThemeSettings = () => {
  try {
    if (fs.existsSync(settingsFile)) {
      return JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading theme settings:", e);
  }
  return { bgType: "gradient", bgUrl: "" };
};

const saveThemeSettings = (settings) => {
  try {
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving theme settings:", e);
  }
};

app.get("/api/admin/theme", (req, res) => {
  res.json(getThemeSettings());
});

app.post("/api/admin/theme", (req, res) => {
  const { bgType, bgUrl } = req.body;
  const settings = { bgType: bgType || "gradient", bgUrl: bgUrl || "" };
  saveThemeSettings(settings);
  res.json({ success: true, settings });
});

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration (Cloudinary)
const storage = createCloudinaryStorage("blood_donation/admin_uploads");

const upload = multer({ storage });

// File Upload Endpoint
app.post("/api/admin/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  // req.file.path contains the Cloudinary URL
  const fileUrl = req.file.path;
  res.json({ success: true, fileUrl, filename: req.file.filename });
});

// ✅ DB connect + admin init (no server wrapping)
connectDB()
  .then(() => {
    initializeAdmin();
    connectToWhatsApp();
  })
  .catch((err) => {
    console.error("❌ DB init failed:", err.message);
    process.exit(1);
  });

// Test route
app.get("/", (req, res) => res.send("✅ Blood Donation Backend is running!"));

// Routes
app.use("/api/donors", donorRoutes);
app.use("/api/camps", campRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/organizer-enquiry", organizerEnquiryRoutes);
app.use("/api/organizer", organizerRoutes);
app.use("/api/impact-gallery", impactGalleryRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/success-stories", successStoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/request", requestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/wa", waRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/blood-request-background", bloodRequestBackgroundRoutes);

// SERVE FRONTEND IN PRODUCTION (Hostinger Ready)
const frontendPath = path.join(__dirname, "../Frontend/dist");
app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Server start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default app;
