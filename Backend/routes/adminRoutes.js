import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import Admin from "../models/Admin.js";
import OrganizerEnquiry from "../models/OrganizerEnquiry.js";
import Organizer from "../models/Organizer.js";
import Camp from "../models/Camp.js";
import BloodRequest from "../models/BloodRequest.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { getIo } from "../socket.js";

const router = express.Router();
// 🔑 RESET ORGANIZER PASSWORD (FOR APPROVED ENQUIRY)
router.put("/enquiries/:id/reset-password", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.trim() === "") {
      return res.status(400).json({ message: "Password required" });
    }

    const enquiry = await OrganizerEnquiry.findById(id);
    if (!enquiry || enquiry.status !== "approved") {
      return res.status(400).json({ message: "Invalid enquiry" });
    }

    const organizer = await Organizer.findById(enquiry.linkedOrganizerId);
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    const hashed = await bcrypt.hash(password, 10);
    organizer.password = hashed;
    await organizer.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ======================================================
   ADMIN: UPDATE ORGANIZER (Name, Phone, Status)
====================================================== */
router.put("/organizers/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, isActive } = req.body;

    const updatedOrg = await Organizer.findByIdAndUpdate(
      id,
      { name, phone, isActive },
      { new: true } // Return updated document
    );

    if (!updatedOrg)
      return res.status(404).json({ message: "Organizer not found" });

    res.json({
      message: "Organizer updated successfully",
      organizer: updatedOrg,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating organizer", error: err.message });
  }
});

/* ======================================================
   ADMIN: DELETE ORGANIZER
====================================================== */
router.delete("/organizers/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: Check if they have camps assigned before deleting?
    // For now, direct delete:
    const deletedOrg = await Organizer.findByIdAndDelete(id);

    if (!deletedOrg)
      return res.status(404).json({ message: "Organizer not found" });

    res.json({ message: "Organizer deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting organizer", error: err.message });
  }
});
/* ======================================================
   ADMIN: GET ALL ORGANIZERS (WITH FULL CAMP DETAILS)
====================================================== */
router.get("/organizers", verifyToken, async (req, res) => {
  try {
    // 1. Organizer.find() -> Sare organizers lao
    // 2. .select("-password") -> Password mat bhejo (security)
    // 3. .populate("camps") -> "camps" array ke IDs ko full camp data me convert karo
    const organizers = await Organizer.find()
      .select("-password")
      .populate("camps")
      .sort({ createdAt: -1 });

    res.json(organizers);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch organizers", error: err.message });
  }
});

/* ======================================================
   ADMIN: GET TOTAL USERS COUNT
====================================================== */
router.get("/users/count", verifyToken, async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Failed to count users", error: err.message });
  }
});

/* ======================================================
   ADMIN: GET ALL BLOOD REQUESTS
====================================================== */
router.get("/blood-requests", verifyToken, async (req, res) => {
  try {
    const requests = await BloodRequest.find()
      .populate("recipient", "name mobile")
      .populate("acceptedBy", "name mobile")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch blood requests", error: err.message });
  }
});

/* ======================================================
   ADMIN: UPDATE BLOOD REQUEST STATUS
====================================================== */
router.patch("/blood-requests/:id/status", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const request = await BloodRequest.findOne({ requestId: id });
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = status;
    
    // Update timestamps based on status
    let newlyActivated = false;
    if (status === "active" && !request.donorsNotifiedAt) {
      request.adminSeenAt = new Date();
      request.donorsNotifiedAt = new Date();
      newlyActivated = true;
    } else if (status === "fulfilled" && !request.fulfilledAt) {
      request.fulfilledAt = new Date();
    }

    await request.save();
    
    // If just activated, create notifications and emit socket events
    if (newlyActivated) {
      try {
        // Find matching available donors
        const matchingDonors = await User.find({
          role: "donor",
          isAvailable: true,
          bloodGroup: request.bloodGroup,
        });

        if (matchingDonors.length > 0) {
          const io = getIo();
          const notifications = matchingDonors.map(donor => ({
            userId: donor._id,
            bloodRequestId: request._id,
            title: "🚨 Emergency Blood Request",
            message: `${request.patientName} urgently needs ${request.bloodGroup} blood at ${request.hospital}, ${request.city}.`,
            type: "emergency_blood_request",
          }));

          // Bulk insert notifications
          await Notification.insertMany(notifications);

          // Emit to each online donor
          matchingDonors.forEach(donor => {
            io.to(donor._id.toString()).emit("newEmergencyRequest", {
              title: "🚨 Emergency Blood Request",
              message: `${request.patientName} urgently needs ${request.bloodGroup} blood at ${request.hospital}, ${request.city}.`,
            });
          });
          
          // Also mark these donors as notified in the request
          request.notifiedDonors = matchingDonors.map(d => d._id);
          await request.save();
        }
      } catch (notifErr) {
        console.error("Error creating notifications:", notifErr);
      }
    }

    res.json({ message: "Status updated successfully", request });
  } catch (err) {
    res.status(500).json({ message: "Error updating status", error: err.message });
  }
});

/* ======================================================
   ADMIN: LIST ALL ORGANIZER ENQUIRIES
====================================================== */
router.get("/enquiries", verifyToken, async (req, res) => {
  try {
    const list = await OrganizerEnquiry.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch enquiries" });
  }
});
// ... (Previous Approve/Reject code) ...

// ✅ UPDATE Enquiry Details (Before Approval)
router.put("/enquiries/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    // सिर्फ़ पेंडिंग या रिजेक्टेड को एडिट करने दें, अपप्रूव्ड को नहीं (Optional Logic)
    const updated = await OrganizerEnquiry.findByIdAndUpdate(
      id,
      { $set: req.body }, // जो डेटा आएगा उसे अपडेट कर दो
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Enquiry not found" });
    res.json({ message: "Enquiry updated successfully", enquiry: updated });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating enquiry", error: err.message });
  }
});

// ✅ DELETE Enquiry
router.delete("/enquiries/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await OrganizerEnquiry.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Enquiry not found" });
    res.json({ message: "Enquiry deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting enquiry", error: err.message });
  }
});

/* ======================================================
   ADMIN: APPROVE ENQUIRY (MULTI CAMP)
   - Always create NEW camp
   - Existing organizer → push camp into array
   - New organizer → create with camps array
====================================================== */
// Admin: approve enquiry -> create camp + handle organizer
router.put("/enquiries/:id/approve", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await OrganizerEnquiry.findById(id);

    if (!enquiry || enquiry.status !== "pending") {
      return res.status(400).json({ message: "Invalid enquiry" });
    }

    // 1) Create Camp
    const camp = await Camp.create({
      name: enquiry.campName,
      location: enquiry.campLocation,
      date: enquiry.campDate,
      organizerName: enquiry.organizerName,
      organizerContact: enquiry.phone,
      hospitalName: enquiry.hospitalName,
    });

    // 2) Handle Organizer
    let organizer = await Organizer.findOne({ email: enquiry.email });
    let isNewUser = false;
    let passwordUpdated = false; // To track if we changed password
    const rawPassword = req.body.password || ""; // Password sent by Admin

    if (organizer) {
      // ✅ SCENARIO: EXISTING ORGANIZER
      organizer.camps.push(camp._id);
      organizer.name = enquiry.organizerName;
      organizer.phone = enquiry.phone;

      // 🔥 NEW LOGIC: Update Password if Admin provided one
      if (rawPassword.trim() !== "") {
        const hashed = await bcrypt.hash(rawPassword, 10);
        organizer.password = hashed;
        passwordUpdated = true;
      }

      await organizer.save();
    } else {
      // ✅ SCENARIO: NEW ORGANIZER
      isNewUser = true;
      const finalPass = rawPassword || "Org@12345"; // Default if empty
      const hashed = await bcrypt.hash(finalPass, 10);

      organizer = await Organizer.create({
        name: enquiry.organizerName,
        email: enquiry.email,
        phone: enquiry.phone,
        password: hashed,
        camps: [camp._id],
      });
    }

    // 3) Update Enquiry
    enquiry.status = "approved";
    enquiry.reviewedByAdminId = req.admin?.id;
    enquiry.linkedCampId = camp._id;
    enquiry.linkedOrganizerId = organizer._id;
    await enquiry.save();

    res.json({
      message: "Approved successfully",
      organizerLogin: {
        email: organizer.email,
        password:
          isNewUser || passwordUpdated
            ? rawPassword
            : "Old Password (Not Changed)",
      },
      type: isNewUser ? "new_user" : "existing_user",
      passwordReset: passwordUpdated,
    });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});
/* ======================================================
   ADMIN: REJECT ENQUIRY
====================================================== */
router.put("/enquiries/:id/reject", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "" } = req.body;

    const enquiry = await OrganizerEnquiry.findById(id);
    if (!enquiry || enquiry.status !== "pending") {
      return res.status(400).json({ message: "Invalid enquiry" });
    }

    enquiry.status = "rejected";
    enquiry.rejectionReason = reason;
    enquiry.reviewedByAdminId = req.admin?.id || null;
    enquiry.reviewedAt = new Date();
    await enquiry.save();

    res.json({ message: "Enquiry rejected successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error during rejection" });
  }
});

/* ======================================================
   ADMIN REGISTER
====================================================== */
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ email, password: hashedPassword });

    res.status(201).json({
      message: "Admin created successfully",
      admin: { id: admin._id, email: admin.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ======================================================
   ADMIN LOGIN
====================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET || "dev_secret_only",
      { expiresIn: "7d" }
    );

    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
