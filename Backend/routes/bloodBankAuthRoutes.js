import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import BloodBank from "../models/BloodBank.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { generateToken, hashToken } from "../utils/tokenUtils.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendMessage } from "../whatsapp/waClient.js";

const router = express.Router();

// Ensure local upload directory exists
const uploadDir = path.join(process.cwd(), "uploads", "licenses");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `license-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
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
      cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG, JPEG, and PNG files are allowed"));
    }
  },
});

// IP-based Login Rate Limiter (Max 5 attempts per 15 min per IP)
const loginAttempts = new Map();
function rateLimitLogin(req, res, next) {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;

  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, []);
  }

  const attempts = loginAttempts.get(ip).filter((timestamp) => now - timestamp < windowMs);

  if (attempts.length >= 5) {
    return res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again after 15 minutes.",
    });
  }

  attempts.push(now);
  loginAttempts.set(ip, attempts);
  next();
}

/* ======================================================
   API 1: Admin Invite
   POST /api/blood-bank/invite
   Auth: admin only
====================================================== */
router.post("/invite", verifyToken, async (req, res) => {
  try {
    const { managerName, email, mobile, city, licenseNumber } = req.body;
    const name = req.body.name || req.body.bloodBankName;

    if (!name || !managerName || !email || !mobile || !city || !licenseNumber) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicates in active or pending states
    const duplicate = await BloodBank.findOne({
      $or: [{ email: normalizedEmail }, { mobile }, { licenseNumber }],
    });

    if (duplicate) {
      let field = "Invite details";
      if (duplicate.email === normalizedEmail) field = "Email";
      else if (duplicate.mobile === mobile) field = "Mobile number";
      else if (duplicate.licenseNumber === licenseNumber) field = "License number";
      return res.status(400).json({ success: false, message: `${field} already exists.` });
    }

    const rawToken = generateToken();
    const hashedToken = hashToken(rawToken);

    const newBank = new BloodBank({
      name,
      managerName,
      email: normalizedEmail,
      mobile,
      city,
      licenseNumber,
      inviteToken: hashedToken,
      inviteTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      inviteTokenUsed: false,
      invitedBy: req.admin.id,
      invitedAt: new Date(),
      status: "invited",
      statusHistory: [
        {
          status: "invited",
          action: "Invited by admin",
          note: `Registration invite sent to ${normalizedEmail}`,
          updatedBy: req.admin.email || "Admin",
          updatedAt: new Date(),
        },
      ],
    });

    await newBank.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const inviteLink = `${frontendUrl}/blood-bank/register?inviteToken=${rawToken}`;

    await sendEmail({
      to: normalizedEmail,
      subject: "Raktdaan — Blood Bank Registration Invitation",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Blood Bank Registration Invitation</h2>
          <p>Hello ${managerName},</p>
          <p>You have been invited to register <strong>${name}</strong> on the Raktdaan platform.</p>
          <p>Please complete your registration form using the link below:</p>
          <p><a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #E24B4A; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Register Now</a></p>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${inviteLink}</p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">Note: This link will expire in 7 days.</p>
        </div>
      `,
    });

    res.status(201).json({ success: true, message: "Invitation sent successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error inviting blood bank", error: error.message });
  }
});

/* ======================================================
   API 2: Verify Invite Token
   GET /api/blood-bank/verify-invite?token=xxxx
   No auth
====================================================== */
router.get("/verify-invite", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required." });
    }

    const hashed = hashToken(token);
    const bloodBank = await BloodBank.findOne({ inviteToken: hashed });

    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Invalid invitation link." });
    }

    if (bloodBank.inviteTokenUsed) {
      return res.status(400).json({ success: false, message: "Link already used." });
    }

    if (new Date() > bloodBank.inviteTokenExpiresAt) {
      return res.status(410).json({ success: false, message: "Link expired — admin se naya invite maango." });
    }

    res.json({
      success: true,
      data: {
        name: bloodBank.name,
        managerName: bloodBank.managerName,
        email: bloodBank.email,
        mobile: bloodBank.mobile,
        city: bloodBank.city,
        licenseNumber: bloodBank.licenseNumber,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error verifying token", error: error.message });
  }
});

/* ======================================================
   API 3: Submit Registration
   POST /api/blood-bank/register
   No auth — token validates
====================================================== */
router.post("/register", upload.single("licenseDocument"), async (req, res) => {
  try {
    const {
      inviteToken,
      address,
      state,
      pincode,
      latitude,
      longitude,
      emergencyContact,
      is24x7,
      openTime,
      closeTime,
      licenseExpiryDate,
    } = req.body;

    if (!inviteToken) {
      return res.status(400).json({ success: false, message: "Invitation token is required." });
    }

    const hashed = hashToken(inviteToken);
    const bloodBank = await BloodBank.findOne({ inviteToken: hashed });

    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Invalid invitation link." });
    }
    if (bloodBank.inviteTokenUsed) {
      return res.status(400).json({ success: false, message: "Link already used." });
    }
    if (new Date() > bloodBank.inviteTokenExpiresAt) {
      return res.status(410).json({ success: false, message: "Link expired — admin se naya invite maango." });
    }

    // Server side field validation
    if (!address || !state || !pincode || !emergencyContact || !licenseExpiryDate) {
      return res.status(400).json({ success: false, message: "All required registration fields must be completed." });
    }

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ success: false, message: "Pincode exactly 6 digits ka hona chahiye." });
    }

    if (!/^\d{10}$/.test(emergencyContact)) {
      return res.status(400).json({ success: false, message: "Emergency Contact 10 digits ka hona chahiye." });
    }

    const expiryDate = new Date(licenseExpiryDate);
    if (expiryDate <= new Date()) {
      return res.status(400).json({ success: false, message: "License expired hai — valid license chahiye." });
    }

    if (latitude && (parseFloat(latitude) < -90 || parseFloat(latitude) > 90)) {
      return res.status(400).json({ success: false, message: "Latitude -90 to 90 range mein hona chahiye." });
    }

    if (longitude && (parseFloat(longitude) < -180 || parseFloat(longitude) > 180)) {
      return res.status(400).json({ success: false, message: "Longitude -180 to 180 range mein hona chahiye." });
    }

    const is24x7Bool = is24x7 === "true" || is24x7 === true;
    if (!is24x7Bool && (!openTime || !closeTime)) {
      return res.status(400).json({ success: false, message: "Opening and closing times are required if not 24x7." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "License document is required." });
    }

    // Update BloodBank doc
    bloodBank.address = address;
    bloodBank.state = state;
    bloodBank.pincode = pincode;
    bloodBank.latitude = latitude ? parseFloat(latitude) : undefined;
    bloodBank.longitude = longitude ? parseFloat(longitude) : undefined;
    bloodBank.location = {
      type: "Point",
      coordinates: [longitude ? parseFloat(longitude) : 0, latitude ? parseFloat(latitude) : 0],
    };
    bloodBank.emergencyContact = emergencyContact;
    bloodBank.is24x7 = is24x7Bool;
    bloodBank.openTime = is24x7Bool ? "" : openTime;
    bloodBank.closeTime = is24x7Bool ? "" : closeTime;
    bloodBank.licenseExpiryDate = expiryDate;
    bloodBank.licenseDocumentUrl = `/uploads/licenses/${req.file.filename}`;
    bloodBank.status = "pending";
    bloodBank.inviteTokenUsed = true;
    bloodBank.registeredAt = new Date();

    bloodBank.statusHistory.push({
      status: "pending",
      action: "Registration submitted",
      note: "Form details and license document uploaded",
      updatedBy: "Blood Bank",
      updatedAt: new Date(),
    });

    await bloodBank.save();

    // Email to blood bank
    await sendEmail({
      to: bloodBank.email,
      subject: "Raktdaan — Registration Pending Verification",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #E24B4A;">Registration Received</h2>
          <p>Hello ${bloodBank.managerName},</p>
          <p>We have successfully received the registration request for <strong>${bloodBank.name}</strong>.</p>
          <p>Our administration team will verify the details and license documents within 24-48 hours.</p>
          <p>Once approved, you will receive an email to configure your account password.</p>
          <p>Regards,<br/>Raktdaan Team</p>
        </div>
      `,
    });

    // Email to admin
    const adminEmails = process.env.ADMIN_EMAILS || "admin@raktdaan.online";
    await sendEmail({
      to: adminEmails,
      subject: `New Blood Bank Registration Pending: ${bloodBank.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Pending Review Notification</h2>
          <p>A new blood bank <strong>${bloodBank.name}</strong> has completed the registration flow and is pending admin approval.</p>
          <p><strong>License Number:</strong> ${bloodBank.licenseNumber}</p>
          <p><strong>City:</strong> ${bloodBank.city}</p>
          <p>Please log in to the admin panel to review and approve/reject this request.</p>
        </div>
      `,
    });

    res.json({ success: true, message: "Registration submitted successfully. Pending admin verification." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error during registration", error: error.message });
  }
});

/* ======================================================
   API 8: Verify Password Token
   GET /api/blood-bank/verify-password-token?token=xxxx&email=xxxx
   No auth
====================================================== */
router.get("/verify-password-token", async (req, res) => {
  try {
    const { token, email } = req.query;
    if (!token || !email) {
      return res.status(400).json({ success: false, message: "Token and email are required." });
    }

    const hashed = hashToken(token);
    const bloodBank = await BloodBank.findOne({
      email: email.toLowerCase().trim(),
      passwordToken: hashed,
    });

    if (!bloodBank || new Date() > bloodBank.passwordTokenExpiresAt) {
      return res.status(400).json({ success: false, message: "Invalid or expired setup link." });
    }

    res.json({ success: true, valid: true, name: bloodBank.name });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error verifying token", error: error.message });
  }
});

/* ======================================================
   API 4: Admin — List Blood Banks
   GET /api/blood-bank/all?status=pending
   Auth: admin
====================================================== */
router.get("/all", verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    const bloodBanks = await BloodBank.find(filter)
      .select("-password -passwordToken -passwordTokenExpiresAt")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bloodBanks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error listing blood banks", error: error.message });
  }
});

/* ======================================================
   API 5: Admin — View Single
   GET /api/blood-bank/:id
   Auth: admin
====================================================== */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.params.id)
      .select("-password -passwordToken -passwordTokenExpiresAt");

    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Blood bank not found." });
    }

    res.json({ success: true, data: bloodBank });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error retrieving details", error: error.message });
  }
});

/* ======================================================
   API 6: Admin — Approve
   PUT /api/blood-bank/:id/approve
   Auth: admin
====================================================== */
router.put("/:id/approve", verifyToken, async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.params.id);
    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Blood bank not found." });
    }

    if (bloodBank.status !== "pending") {
      return res.status(400).json({ success: false, message: "Status must be pending to approve." });
    }

    const rawToken = generateToken();
    const hashed = hashToken(rawToken);

    bloodBank.status = "approved";
    bloodBank.passwordToken = hashed;
    bloodBank.passwordTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    bloodBank.verifiedBy = req.admin.id;
    bloodBank.verifiedAt = new Date();

    bloodBank.statusHistory.push({
      status: "approved",
      action: "Approved by admin",
      note: "Account approved; password setup link issued.",
      updatedBy: req.admin.email || "Admin",
      updatedAt: new Date(),
    });

    await bloodBank.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const setupLink = `${frontendUrl}/blood-bank/set-password?token=${rawToken}&email=${encodeURIComponent(bloodBank.email)}`;

    // Send Approval Email
    await sendEmail({
      to: bloodBank.email,
      subject: "Your Blood Bank Account Has Been Approved",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #22c55e;">Account Approved!</h2>
          <p>Hello ${bloodBank.managerName},</p>
          <p>Congratulations! Your blood bank registration for <strong>${bloodBank.name}</strong> has been approved.</p>
          <p>Please setup your secure login password using the link below:</p>
          <p><a href="${setupLink}" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Set Password</a></p>
          <p>This link is valid for 24 hours.</p>
        </div>
      `,
    });

    // Optional WhatsApp Notify via Baileys (2-argument format using first connected client)
    try {
      const waMessage = `✅ *Raktdaan — Account Approved!*\n\nAapka blood bank *${bloodBank.name}* approve ho gaya hai. Email pe password set karne ka link bheja gaya hai.\n\n_Raktdaan Team_`;
      await sendMessage(bloodBank.mobile, waMessage);
    } catch (waErr) {
      console.warn("WhatsApp notification failed to send:", waErr.message);
    }

    res.json({ success: true, message: "Blood bank approved successfully. Setup email sent." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error during approval", error: error.message });
  }
});

/* ======================================================
   API 7: Admin — Reject
   PUT /api/blood-bank/:id/reject
   Auth: admin
====================================================== */
router.put("/:id/reject", verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: "Rejection reason is required." });
    }

    const bloodBank = await BloodBank.findById(req.params.id);
    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Blood bank not found." });
    }

    if (bloodBank.status !== "pending") {
      return res.status(400).json({ success: false, message: "Only pending requests can be rejected." });
    }

    const newRawToken = generateToken();
    const newHashedToken = hashToken(newRawToken);

    bloodBank.status = "rejected";
    bloodBank.rejectionReason = reason;
    bloodBank.rejectionCount += 1;
    // Generate new invite token to let them correct details and re-submit
    bloodBank.inviteToken = newHashedToken;
    bloodBank.inviteTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    bloodBank.inviteTokenUsed = false;

    bloodBank.statusHistory.push({
      status: "rejected",
      action: "Rejected by admin",
      note: `Reason: ${reason}`,
      updatedBy: req.admin.email || "Admin",
      updatedAt: new Date(),
    });

    await bloodBank.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const reapplyLink = `${frontendUrl}/blood-bank/register?inviteToken=${newRawToken}`;

    await sendEmail({
      to: bloodBank.email,
      subject: "Blood Bank Registration Update — Rejected",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #dc2626;">Registration Rejected</h2>
          <p>Hello ${bloodBank.managerName},</p>
          <p>Your blood bank registration for <strong>${bloodBank.name}</strong> was not approved at this time.</p>
          <blockquote style="border-left: 4px solid #dc2626; padding-left: 10px; margin: 20px 0; font-style: italic;">
            Reason: ${reason}
          </blockquote>
          <p>Aap details sahi karke dobara apply kar sakte hain:</p>
          <p><a href="${reapplyLink}" style="display: inline-block; padding: 12px 24px; background-color: #E24B4A; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Re-apply Form</a></p>
        </div>
      `,
    });

    res.json({ success: true, message: "Registration rejected and feedback email sent." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error during rejection", error: error.message });
  }
});


/* ======================================================
   API 9: Set Password
   POST /api/blood-bank/set-password
   No auth — token validates
====================================================== */
router.post("/set-password", async (req, res) => {
  try {
    const { token, email, password, confirmPassword } = req.body;

    if (!token || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    // Password rules server-side validation
    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!complexityRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, and 1 number.",
      });
    }

    const hashedToken = hashToken(token);
    const bloodBank = await BloodBank.findOne({
      email: email.toLowerCase().trim(),
      passwordToken: hashedToken,
    });

    if (!bloodBank || new Date() > bloodBank.passwordTokenExpiresAt) {
      return res.status(400).json({ success: false, message: "Invalid or expired setup link." });
    }

    // Encrypt password and activate account
    const salt = await bcrypt.genSalt(10);
    bloodBank.password = await bcrypt.hash(password, salt);
    bloodBank.status = "active";
    bloodBank.passwordSetAt = new Date();
    bloodBank.passwordToken = null; // Single-use invalidation
    bloodBank.passwordTokenExpiresAt = null;

    bloodBank.statusHistory.push({
      status: "active",
      action: "Password set",
      note: "Account activated successfully.",
      updatedBy: "Blood Bank",
      updatedAt: new Date(),
    });

    await bloodBank.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const loginLink = `${frontendUrl}/blood-bank/login`;

    await sendEmail({
      to: bloodBank.email,
      subject: "Raktdaan — Account Activated",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #22c55e;">Account Active!</h2>
          <p>Hello ${bloodBank.managerName},</p>
          <p>Your password has been successfully configured. Your account is now active.</p>
          <p>You can now log in to the dashboard:</p>
          <p><a href="${loginLink}" style="display: inline-block; padding: 12px 24px; background-color: #E24B4A; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Login Now</a></p>
        </div>
      `,
    });

    res.json({ success: true, message: "Password set successfully. Account is now active." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error configuring password", error: error.message });
  }
});

/* ======================================================
   API 10: Login
   POST /api/blood-bank/login
====================================================== */
router.post("/login", rateLimitLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const bloodBank = await BloodBank.findOne({ email: email.toLowerCase().trim() });
    if (!bloodBank) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    // Status checks
    if (bloodBank.status === "invited" || bloodBank.status === "pending") {
      return res.status(403).json({ success: false, message: "Account abhi verify nahi hua." });
    }
    if (bloodBank.status === "rejected") {
      return res.status(403).json({ success: false, message: "Registration rejected — email check karein." });
    }
    if (bloodBank.status === "approved") {
      return res.status(403).json({ success: false, message: "Pehle password set karein." });
    }
    if (bloodBank.status === "suspended") {
      return res.status(403).json({ success: false, message: "Account suspended — admin se contact karein." });
    }
    if (bloodBank.status === "blocked") {
      return res.status(403).json({ success: false, message: "Account blocked." });
    }

    const isMatch = await bcrypt.compare(password, bloodBank.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: bloodBank._id, email: bloodBank.email, role: "bloodbank", bloodBankId: bloodBank._id },
      process.env.JWT_SECRET || "dev_secret_only",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      bloodBank: {
        id: bloodBank._id,
        name: bloodBank.name,
        email: bloodBank.email,
        city: bloodBank.city,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error during login", error: error.message });
  }
});

/* ======================================================
   API 11: Resend Invite (admin)
   POST /api/blood-bank/:id/resend-invite
   Auth: admin
====================================================== */
router.post("/:id/resend-invite", verifyToken, async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.params.id);
    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Blood bank not found." });
    }

    const rawToken = generateToken();
    const hashed = hashToken(rawToken);

    bloodBank.inviteToken = hashed;
    bloodBank.inviteTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    bloodBank.inviteTokenUsed = false;

    bloodBank.statusHistory.push({
      status: bloodBank.status,
      action: "Invitation resent",
      note: "Invitation link resent by admin.",
      updatedBy: req.admin.email || "Admin",
      updatedAt: new Date(),
    });

    await bloodBank.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const inviteLink = `${frontendUrl}/blood-bank/register?inviteToken=${rawToken}`;

    await sendEmail({
      to: bloodBank.email,
      subject: "Raktdaan — Blood Bank Registration Invitation (Resend)",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Registration Invite Link Updated</h2>
          <p>Hello ${bloodBank.managerName},</p>
          <p>Admin has resent the registration link for <strong>${bloodBank.name}</strong>.</p>
          <p><a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #E24B4A; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Complete Registration Now</a></p>
          <p>This link is valid for 7 days.</p>
        </div>
      `,
    });

    res.json({ success: true, message: "Invitation link resent successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error resending invite", error: error.message });
  }
});

/* ======================================================
   API 12: Admin — Suspend Blood Bank
   PUT /api/blood-bank/:id/suspend
   Auth: admin
====================================================== */
router.put("/:id/suspend", verifyToken, async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.params.id);
    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Blood bank not found." });
    }

    bloodBank.status = "suspended";
    bloodBank.statusHistory.push({
      status: "suspended",
      action: "Suspended by admin",
      note: req.body.note || "Account suspended by Administrator.",
      updatedBy: req.admin.email || "Admin",
      updatedAt: new Date(),
    });

    await bloodBank.save();
    res.json({ success: true, message: "Blood bank account suspended successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error suspending blood bank", error: error.message });
  }
});

/* ======================================================
   API 13: Admin — Reactivate Blood Bank
   PUT /api/blood-bank/:id/reactivate
   Auth: admin
====================================================== */
router.put("/:id/reactivate", verifyToken, async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.params.id);
    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Blood bank not found." });
    }

    bloodBank.status = "active";
    bloodBank.statusHistory.push({
      status: "active",
      action: "Reactivated by admin",
      note: "Account reactivated by Administrator.",
      updatedBy: req.admin.email || "Admin",
      updatedAt: new Date(),
    });

    await bloodBank.save();
    res.json({ success: true, message: "Blood bank account reactivated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error reactivating blood bank", error: error.message });
  }
});

/* ======================================================
   API 14: Admin — Update Status Directly
   PUT /api/blood-bank/:id/status
   Auth: admin
====================================================== */
router.put("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowedStatuses = ["invited", "pending", "approved", "active", "rejected", "suspended"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}` });
    }

    const bloodBank = await BloodBank.findById(req.params.id);
    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Blood bank not found." });
    }

    const oldStatus = bloodBank.status;
    bloodBank.status = status;

    // Handle audit logs
    bloodBank.statusHistory.push({
      status: status,
      action: "Manual Status Override",
      note: note || `Status changed from ${oldStatus} to ${status} by admin override.`,
      updatedBy: req.admin.email || "Admin",
      updatedAt: new Date(),
    });

    if (status === "active") {
      bloodBank.isVerified = true;
      if (!bloodBank.verifiedAt) {
        bloodBank.verifiedAt = new Date();
        bloodBank.verifiedBy = req.admin.id;
      }
    }

    await bloodBank.save();
    res.json({ success: true, message: `Status updated to ${status} successfully.`, data: bloodBank });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error updating status", error: error.message });
  }
});

export default router;
