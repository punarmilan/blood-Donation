import express from "express";
import bcrypt from "bcrypt";
import OrganizerEnquiry from "../models/OrganizerEnquiry.js";
import User from "../models/User.js";
import Camp from "../models/Camp.js";
import transporter from "../config/emailConfig.js";
import { emailTemplates } from "../utils/emailTemplates.js";
import { generateTempPassword, generateCampId } from "../utils/generateId.js";
import { verifyToken } from "./authRoutes.js"; // Assuming authMiddleware exports verifyToken, or it's from authRoutes

const router = express.Router();

// 1. Submit Enquiry (Public)
router.post("/submit", async (req, res) => {
  try {
    const { organizerName, phone, email, organizationType, organizationName, preferredDate, preferredTime, area, expectedDonors, venueAvailable, message } = req.body;

    const enquiry = new OrganizerEnquiry({
      organizerName, phone, email, 
      organizationType: organizationType ? organizationType.toLowerCase() : 'personal', 
      organizationName, preferredDate, preferredTime, area, expectedDonors, venueAvailable, message
    });
    await enquiry.save();

    // Send confirmation email to organizer
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER || process.env.EMAIL_USER,
        to: email,
        subject: "Raktdaan - Aapki Camp Request Mili! ✅",
        html: emailTemplates.enquiryConfirmation(organizerName, enquiry)
      });
      // Optionally notify admin via email
      await transporter.sendMail({
        from: process.env.SMTP_USER || process.env.EMAIL_USER,
        to: process.env.SMTP_USER || process.env.EMAIL_USER, // sending to admin's own email for now
        subject: `New Camp Request - ${organizerName} - ${area}`,
        html: emailTemplates.newEnquiryAlert(organizerName, enquiry)
      });
    } catch (emailErr) {
      console.error("Email send failed (Submit):", emailErr);
    }

    res.status(201).json({ success: true, message: "Enquiry submitted successfully", data: enquiry });
  } catch (err) {
    res.status(400).json({ success: false, message: "Invalid enquiry data", error: err.message });
  }
});

// 2. Admin - Get All Enquiries
// Assume verifyToken middleware is applied (add role check in production)
router.get("/all", verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const enquiries = await OrganizerEnquiry.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, enquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// 3. Admin - Approve Enquiry
router.patch("/:id/approve", verifyToken, async (req, res) => {
  try {
    const enquiryId = req.params.id;
    const enquiry = await OrganizerEnquiry.findById(enquiryId);
    
    if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
    if (enquiry.status !== "pending") return res.status(400).json({ success: false, message: "Enquiry already processed" });

    enquiry.status = "approved";
    enquiry.approvedAt = new Date();

    // Generate temp password and hash it
    const tempPassword = req.body.password || generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Create User account for Organizer
    let organizer = await User.findOne({ $or: [{ email: enquiry.email }, { mobile: enquiry.phone }] });
    let isExistingUser = false;
    if (!organizer) {
      organizer = new User({
        name: enquiry.organizerName,
        email: enquiry.email,
        mobile: enquiry.phone,
        password: hashedPassword,
        bloodGroup: "Unknown", // Required in User schema, set default
        role: "organizer",
        organizationType: enquiry.organizationType,
        organizationName: enquiry.organizationName,
        mustChangePassword: true
      });
      await organizer.save();
    } else {
      isExistingUser = true;
      // If user exists, upgrade role and set new temp password
      organizer.role = "organizer";
      organizer.password = hashedPassword;
      organizer.mustChangePassword = true;
      if (!organizer.email) organizer.email = enquiry.email; // Save email if missing
      await organizer.save();
    }

    // Create the Upcoming Camp
    const campId = generateCampId();
    const newCamp = new Camp({
      campId,
      name: campId, // Pass unique name to bypass legacy DB index error
      organizer: organizer._id,
      enquiry: enquiry._id,
      title: `${enquiry.organizationName || enquiry.organizerName} Blood Drive`,
      date: enquiry.preferredDate || new Date(), // Fallback if TBA
      venue: enquiry.area || "TBA",
      area: enquiry.area || "TBA",
      expectedDonors: enquiry.expectedDonors || "Not specified",
      status: "upcoming"
    });
    await newCamp.save();

    // Also save in legacy Organizer collection
    const { default: Organizer } = await import("../models/Organizer.js");
    let legacyOrganizer = await Organizer.findOne({ email: enquiry.email });
    if (!legacyOrganizer) {
      legacyOrganizer = new Organizer({
        name: enquiry.organizerName,
        email: enquiry.email,
        phone: enquiry.phone,
        password: hashedPassword,
        camps: [newCamp._id]
      });
      await legacyOrganizer.save();
    } else {
      legacyOrganizer.camps.push(newCamp._id);
      await legacyOrganizer.save();
    }

    await enquiry.save();

    // Send Approval Email to Organizer
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER || process.env.EMAIL_USER,
        to: enquiry.email,
        subject: "🎉 Camp Approved - Login Credentials",
        html: emailTemplates.approvalEmail(enquiry.organizerName, newCamp, enquiry.email, tempPassword)
      });
    } catch (emailErr) {
      console.error("Email send failed (Approval):", emailErr);
    }

    res.status(200).json({ 
      success: true, 
      message: "Enquiry approved, credentials sent",
      type: isExistingUser ? "existing_user" : "new_user",
      organizerLogin: {
        email: enquiry.email,
        password: tempPassword
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// 4. Admin - Reject Enquiry
router.patch("/:id/reject", verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const enquiry = await OrganizerEnquiry.findById(req.params.id);
    
    if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
    if (enquiry.status !== "pending") return res.status(400).json({ success: false, message: "Enquiry already processed" });

    enquiry.status = "rejected";
    enquiry.rejectedAt = new Date();
    enquiry.adminNote = reason;
    await enquiry.save();

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER || process.env.EMAIL_USER,
        to: enquiry.email,
        subject: "Raktdaan - Camp Request Update",
        html: emailTemplates.rejectionEmail(enquiry.organizerName, reason)
      });
    } catch (emailErr) {
      console.error("Email send failed (Rejection):", emailErr);
    }

    res.status(200).json({ success: true, message: "Enquiry rejected" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

export default router;
