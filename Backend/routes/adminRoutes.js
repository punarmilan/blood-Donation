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
import HomeContent from "../models/HomeContent.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { getIo } from "../socket.js";
import BloodBank from "../models/BloodBank.js";
import { sendEmail } from "../utils/sendEmail.js";
import { emailTemplates } from "../utils/emailTemplates.js";
import crypto from "crypto";
import { normalizeLocation } from "../utils/normalize.js";
import { hashToken } from "../utils/tokenUtils.js";

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

    const updatedOrg = await User.findByIdAndUpdate(
      id,
      { name, mobile: phone, isActive },
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
    const deletedOrg = await User.findByIdAndDelete(id);

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
    const organizers = await User.find({ role: "organizer" })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const camps = await Camp.find({ organizer: { $in: organizers.map(o => o._id) } }).lean();

    const organizersWithCamps = organizers.map(org => {
      org.camps = camps.filter(c => c.organizer?.toString() === org._id.toString());
      org.phone = org.mobile;
      return org;
    });

    res.json(organizersWithCamps);
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
   ADMIN: GET ALL USERS
====================================================== */
router.get("/users", verifyToken, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
    const { calculateDonationEligibility } = await import("../utils/badgeCalculator.js");
    const processedUsers = users.map(user => {
      if (user.role === "donor") {
        const gender = user.gender || user.health?.gender || "Male";
        const eligibility = calculateDonationEligibility(gender, user.lastDonationDate);
        return {
          ...user,
          donationEligibilityStatus: eligibility.status,
          nextEligibleDonationDate: eligibility.nextEligibleDate,
          daysRemaining: eligibility.daysRemaining,
          donationGapDays: eligibility.gapDays
        };
      }
      return user;
    });
    res.json(processedUsers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});
/* ======================================================
   ADMIN: GET ALL BLOOD REQUESTS
====================================================== */
router.get("/blood-requests", verifyToken, async (req, res) => {
  try {
    const { state, city, bloodGroup, urgency, status } = req.query;
    const filter = {};
    if (state) filter.state = new RegExp(`^${state.trim()}$`, "i");
    if (city) filter.city = new RegExp(`^${city.trim()}$`, "i");
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (urgency) filter.urgency = urgency;
    if (status) filter.status = status;

    const requests = await BloodRequest.find(filter)
      .populate("recipient", "name mobile")
      .populate("acceptedBy", "name mobile state city")
      .populate("acceptedByBloodBank", "name mobile managerName")
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

    // Clear donor and bloodbank assignment fields if status is reverted to active or pending
    if (status === "active" || status === "pending") {
      request.acceptedBy = undefined;
      request.acceptedByBloodBank = undefined;
      request.acceptedAt = undefined;
      request.completedAt = undefined;
      if (status === "active") {
        request.otp = Math.floor(1000 + Math.random() * 9000).toString();
      } else {
        request.otp = undefined;
      }
    }

    // Update timestamps based on status
    let newlyActivated = false;
    if (status === "active") {
      if (!request.donorsNotifiedAt) {
        request.adminSeenAt = new Date();
        request.donorsNotifiedAt = new Date();
        newlyActivated = true;
      }
    } else if (status === "fulfilled" && !request.fulfilledAt) {
      request.fulfilledAt = new Date();
    }

    await request.save();

    // If just activated, create notifications and emit socket events
    if (newlyActivated || (status === "active" && !request.donorsNotifiedAt)) {
      try {
        const requestState = (request.state || "").trim();
        const reqStateNorm = request.normalizedState || normalizeLocation(request.state);
        const reqCityNorm = request.normalizedCity || normalizeLocation(request.city);

        // Find donors in same state only
        let stateDonors = [];
        if (reqStateNorm) {
          stateDonors = await User.find({
            role: "donor",
            isAvailable: true,
            bloodGroup: request.bloodGroup,
            _id: { $ne: request.recipient },
            normalizedState: reqStateNorm
          });
        } else {
          stateDonors = await User.find({
            role: "donor",
            isAvailable: true,
            bloodGroup: request.bloodGroup,
            _id: { $ne: request.recipient }
          });
        }

        // Priority 1: Same city donors
        const sameCityDonors = stateDonors.filter(
          donor => (donor.normalizedCity || normalizeLocation(donor.city)) === reqCityNorm
        );

        let matchingDonors = [];
        if (sameCityDonors.length > 0) {
          if (sameCityDonors.length >= 3) {
            matchingDonors = sameCityDonors;
          } else {
            matchingDonors = stateDonors;
          }
        } else {
          matchingDonors = stateDonors;
        }

        // Avoid duplicate notifications for same request
        const alreadyNotified = new Set((request.notifiedDonors || []).map(id => id.toString()));
        matchingDonors = matchingDonors.filter(d => !alreadyNotified.has(d._id.toString()));

        const io = getIo();
        const locationStr = `${request.city || ""}${requestState ? ", " + requestState : ""}`;

        if (matchingDonors.length > 0) {
          const notifications = matchingDonors.map(donor => ({
            userId: donor._id,
            donorId: donor._id,
            bloodRequestId: request._id,
            requestId: request._id,
            title: "🚨 Emergency Blood Request",
            message: `${request.patientName} urgently needs ${request.bloodGroup} blood at ${request.hospitalName || request.hospital}, ${locationStr}.`,
            state: request.state,
            city: request.city,
            bloodGroup: request.bloodGroup,
            type: "emergency_blood_request",
            isRead: false
          }));

          await Notification.insertMany(notifications);

          if (io) {
            matchingDonors.forEach(donor => {
              io.to(donor._id.toString()).emit("newEmergencyRequest", {
                title: "🚨 Emergency Blood Request",
                message: `${request.patientName} urgently needs ${request.bloodGroup} blood at ${request.hospitalName || request.hospital}, ${locationStr}.`,
                requestId: request.requestId,
                state: requestState,
                bloodGroup: request.bloodGroup,
              });
            });
          }

          request.notifiedDonors = [...new Set([...(request.notifiedDonors || []), ...matchingDonors.map(d => d._id)])];
          await request.save();
        }

        // Blood banks: same state or city
        const matchingBloodBanks = requestState
          ? await BloodBank.find({ status: "approved", $or: [{ state: new RegExp(`^${requestState}$`, "i") }, { city: new RegExp(`^${(request.city||"").trim()}$`, "i") }] })
          : await BloodBank.find({ status: "approved" });

        if (matchingBloodBanks.length > 0) {
          const bbNotifications = matchingBloodBanks.map(bb => ({
            userId: bb._id,
            bloodRequestId: request._id,
            title: "\ud83d\udea8 Emergency Blood Request (Blood Bank)",
            message: `${request.patientName} urgently needs ${request.bloodGroup} blood at ${request.hospitalName || request.hospital}, ${locationStr}.`,
            type: "emergency_blood_request",
          }));

          await Notification.insertMany(bbNotifications);

          if (io) {
            matchingBloodBanks.forEach(bb => {
              io.to(bb._id.toString()).emit("newEmergencyRequest", {
                title: "\ud83d\udea8 Emergency Blood Request (Blood Bank)",
                message: `${request.patientName} urgently needs ${request.bloodGroup} blood at ${request.hospitalName || request.hospital}, ${locationStr}.`,
                requestId: request.requestId,
                state: requestState,
              });
            });
          }
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
   ADMIN: MANUALLY TRIGGER NOTIFICATIONS FOR BLOOD REQUEST
====================================================== */
router.post("/blood-requests/:id/notify", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Support both requestId (string) and MongoDB _id
    let request = await BloodRequest.findOne({ requestId: id });
    if (!request) {
      request = await BloodRequest.findById(id).catch(() => null);
    }
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const io = getIo();
    const requestState = (request.state || "").trim();
    const isUrgent = request.urgency === "urgent" || request.urgency === "emergency";

    const reqStateNorm = request.normalizedState || normalizeLocation(request.state);
    const reqCityNorm = request.normalizedCity || normalizeLocation(request.city);

    // Find donors in same state only
    let stateDonors = [];
    if (reqStateNorm) {
      stateDonors = await User.find({
        role: "donor",
        isAvailable: true,
        bloodGroup: request.bloodGroup,
        _id: { $ne: request.recipient },
        normalizedState: reqStateNorm
      });
    } else {
      stateDonors = await User.find({
        role: "donor",
        isAvailable: true,
        bloodGroup: request.bloodGroup,
        _id: { $ne: request.recipient }
      });
    }

    // Priority 1: Same city donors
    const sameCityDonors = stateDonors.filter(
      donor => (donor.normalizedCity || normalizeLocation(donor.city)) === reqCityNorm
    );

    let matchingDonors = [];
    if (sameCityDonors.length > 0) {
      if (sameCityDonors.length >= 3) {
        matchingDonors = sameCityDonors;
      } else {
        matchingDonors = stateDonors;
      }
    } else {
      matchingDonors = stateDonors;
    }

    // Avoid duplicate notifications for same request
    const alreadyNotified = new Set((request.notifiedDonors || []).map(id => id.toString()));
    matchingDonors = matchingDonors.filter(d => !alreadyNotified.has(d._id.toString()));

    const notifications = [];
    const locationStr = `${request.city}${requestState ? ", " + requestState : ""}`;

    if (matchingDonors.length > 0) {
      matchingDonors.forEach(donor => {
        notifications.push({
          userId: donor._id,
          donorId: donor._id,
          bloodRequestId: request._id,
          requestId: request._id,
          title: "🚨 Emergency Blood Request (Admin Re-notify)",
          message: `${request.patientName} urgently needs ${request.bloodGroup} blood at ${request.hospitalName || request.hospital}, ${locationStr}.`,
          state: request.state,
          city: request.city,
          bloodGroup: request.bloodGroup,
          type: "emergency_blood_request",
          isRead: false
        });
      });

      await Notification.insertMany(notifications);
      request.notifiedDonors = [...new Set([...(request.notifiedDonors || []), ...matchingDonors.map(d => d._id)])];
      request.donorsNotifiedAt = new Date();
      await request.save();

      if (io) {
        matchingDonors.forEach(donor => {
          io.to(donor._id.toString()).emit("newEmergencyRequest", {
            title: "🚨 Emergency Blood Request (Admin Re-notify)",
            message: `${request.patientName} urgently needs ${request.bloodGroup} blood at ${request.hospitalName || request.hospital}, ${locationStr}.`,
            requestId: request.requestId,
            state: requestState,
            bloodGroup: request.bloodGroup,
          });
        });
      }
    }

    // Blood banks: same state or same city
    const matchingBloodBanks = requestState
      ? await BloodBank.find({
          status: "approved",
          $or: [
            { state: new RegExp(`^${requestState}$`, "i") },
            { city: new RegExp(`^${(request.city || "").trim()}$`, "i") }
          ]
        })
      : await BloodBank.find({ status: "approved" });

    if (matchingBloodBanks.length > 0) {
      const bbNotifications = matchingBloodBanks.map(bb => ({
        userId: bb._id,
        bloodRequestId: request._id,
        title: "\ud83d\udea8 Emergency Blood Request (Blood Bank - Admin Re-notify)",
        message: `${request.patientName} urgently needs ${request.bloodGroup} blood at ${request.hospitalName || request.hospital}, ${locationStr}.`,
        type: "emergency_blood_request",
      }));

      await Notification.insertMany(bbNotifications);

      if (io) {
        matchingBloodBanks.forEach(bb => {
          io.to(bb._id.toString()).emit("newEmergencyRequest", {
            title: "\ud83d\udea8 Emergency Blood Request (Blood Bank - Admin Re-notify)",
            message: `${request.patientName} urgently needs ${request.bloodGroup} blood at ${request.hospitalName || request.hospital}, ${locationStr}.`,
            requestId: request.requestId,
            state: requestState,
          });
        });
      }
    }

    res.json({
      success: true,
      notifiedCount: matchingDonors.length + matchingBloodBanks.length,
      donorCount: matchingDonors.length,
      bloodBankCount: matchingBloodBanks.length,
      message: `Notified ${matchingDonors.length} donors and ${matchingBloodBanks.length} blood banks in ${requestState || "India"}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error triggering manual notification", error: err.message });
  }
});



/* ======================================================
   ADMIN: LIST ALL ORGANIZER ENQUIRIES
====================================================== */
router.get("/enquiries", verifyToken, async (req, res) => {
  try {
    const list = await OrganizerEnquiry.find()
      .populate("assignedBloodBank", "name email mobile")
      .sort({ createdAt: -1 });
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

// ✅ ASSIGN BLOOD BANK TO ENQUIRY
router.put("/enquiries/:id/assign-bloodbank", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { bloodBankId } = req.body;

    if (!bloodBankId) {
      return res.status(400).json({ message: "Blood Bank ID is required" });
    }

    const enquiry = await OrganizerEnquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    enquiry.assignedBloodBank = bloodBankId;
    enquiry.bloodBankStatus = "pending";
    enquiry.resourcesConfirmed = false;
    await enquiry.save();

    // Create Notification for the assigned Blood Bank
    try {
      await Notification.create({
        userId: bloodBankId,
        title: "📋 New Camp Assignment",
        message: `You have been assigned to verify and confirm resources for a camp request by ${enquiry.organizerName}.`,
        type: "camp_assignment"
      });

      // Socket Emit if blood bank is online
      const io = getIo();
      io.to(bloodBankId.toString()).emit("newCampAssignment", {
        title: "📋 New Camp Assignment",
        message: `You have been assigned to verify and confirm resources for a camp request by ${enquiry.organizerName}.`,
      });
    } catch (notifErr) {
      console.error("Error sending notification to Blood Bank:", notifErr);
    }

    // Populate blood bank details before returning
    const updated = await OrganizerEnquiry.findById(id).populate("assignedBloodBank", "name email mobile");

    res.json({ message: "Blood Bank assigned successfully", enquiry: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error during assignment", error: err.message });
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
    const enquiry = await OrganizerEnquiry.findById(id).populate("assignedBloodBank");

    if (!enquiry || enquiry.status !== "pending") {
      return res.status(400).json({ message: "Invalid enquiry" });
    }

    if (enquiry.bloodBankStatus !== "accepted" || !enquiry.resourcesConfirmed) {
      return res.status(400).json({ message: "Enquiry cannot be approved until the assigned Blood Bank accepts and confirms resource availability." });
    }

    // 1) Create Camp
    const camp = await Camp.create({
      name: enquiry.campName || enquiry.organizationName,
      title: enquiry.campName || enquiry.organizationName,
      location: enquiry.campLocation || enquiry.area,
      venue: enquiry.campLocation || enquiry.area,
      area: enquiry.area,
      date: enquiry.campDate || enquiry.preferredDate,
      time: enquiry.preferredTime || "TBA",
      organizerName: enquiry.organizerName,
      organizerContact: enquiry.phone,
      hospitalName: enquiry.hospitalName || (enquiry.assignedBloodBank ? enquiry.assignedBloodBank.name : "N/A"),
      proName: enquiry.proName || (enquiry.assignedBloodBank ? enquiry.assignedBloodBank.managerName : "N/A"),
      enquiry: enquiry._id,
      state: enquiry.state || "Maharashtra",
      city: enquiry.city || "Pune",
      address: enquiry.address || enquiry.area || "TBA",
      pincode: enquiry.pincode || "",
    });

    // Send targeted notification to donors in the camp's state
    try {
      const io = req.app.get("socketio");
      const User = (await import("../models/User.js")).default;
      const Notification = (await import("../models/Notification.js")).default;
      
      const targetStateNormalized = camp.normalizedState || (camp.state ? camp.state.trim().toLowerCase() : "");
      
      const donors = await User.find({
        role: "donor",
        $or: [
          { normalizedState: targetStateNormalized },
          { state: new RegExp(`^${(camp.state || "").trim()}$`, "i") }
        ]
      });

      if (donors.length > 0) {
        const notificationPromises = donors.map(async (donor) => {
          const notif = await Notification.create({
            userId: donor._id,
            type: "camp_approved",
            message: `New blood donation camp "${camp.title}" has been arranged at ${camp.venue}, ${camp.city}, ${camp.state} on ${new Date(camp.date).toLocaleDateString("en-IN")}.`,
            isRead: false
          });
          if (io) {
            io.to(donor._id.toString()).emit("new_notification", notif);
          }
        });
        await Promise.all(notificationPromises);
      }
    } catch (notifErr) {
      console.error("Error creating camp notifications:", notifErr);
    }

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

/* ======================================================
   ADMIN: BLOOD BANK MANAGEMENT
====================================================== */

router.get("/blood-banks/pending", verifyToken, async (req, res) => {
  try {
    const bloodBanks = await BloodBank.find({ status: "pending" }).select("-password -passwordSetupToken -passwordSetupTokenExpires");
    res.json({ success: true, data: bloodBanks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

router.get("/blood-banks", verifyToken, async (req, res) => {
  try {
    const { status, city, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (city) query.city = new RegExp(city, "i");
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { licenseNumber: new RegExp(search, "i") },
      ];
    }
    const bloodBanks = await BloodBank.find(query).select("-password -passwordSetupToken -passwordSetupTokenExpires");
    res.json({ success: true, data: bloodBanks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

router.get("/blood-banks/:id", verifyToken, async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.params.id).select("-password -passwordSetupToken -passwordSetupTokenExpires");
    if (!bloodBank) return res.status(404).json({ success: false, message: "Blood bank not found" });
    res.json({ success: true, data: bloodBank });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

/* ======================================================
   ADMIN: INVITE/ADD BLOOD BANK
====================================================== */
router.post("/blood-banks/invite", verifyToken, async (req, res) => {
  try {
    const { bloodBankName, managerName, email, mobile, city, licenseNumber } = req.body;

    if (!bloodBankName || !managerName || !email || !mobile || !city || !licenseNumber) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const normalizedEmail = email.toLowerCase();

    // Check duplicates
    const duplicate = await BloodBank.findOne({
      $or: [
        { email: normalizedEmail },
        { mobile },
        { licenseNumber }
      ]
    });

    if (duplicate) {
      let field = "Invite details";
      if (duplicate.email === normalizedEmail) field = "Email";
      else if (duplicate.mobile === mobile) field = "Mobile number";
      else if (duplicate.licenseNumber === licenseNumber) field = "License number";
      return res.status(400).json({ success: false, message: `${field} is already registered.` });
    }

    const inviteToken = crypto.randomBytes(32).toString("hex");
    const inviteTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newBank = new BloodBank({
      name: bloodBankName,
      managerName,
      email: normalizedEmail,
      mobile,
      city,
      licenseNumber,
      status: "invited",
      inviteToken,
      inviteTokenExpires,
      isVerified: false
    });

    await newBank.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const inviteLink = `${frontendUrl}/blood-bank/register?inviteToken=${inviteToken}`;

    await sendEmail({
      to: normalizedEmail,
      subject: "Blood Bank Registration Invitation",
      html: emailTemplates.bloodBankInvite(bloodBankName, managerName, licenseNumber, inviteLink)
    });

    res.status(201).json({ success: true, message: "Invitation sent successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error inviting blood bank", error: error.message });
  }
});

const handleApproveBloodBank = async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.params.id);
    if (!bloodBank) return res.status(404).json({ success: false, message: "Blood bank not found" });
    if (bloodBank.status === "approved") return res.status(400).json({ success: false, message: "Already approved" });

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashToken(token);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const setupLink = `${frontendUrl}/blood-bank/set-password?token=${token}&email=${encodeURIComponent(bloodBank.email)}`;

    bloodBank.status = "approved";
    bloodBank.isVerified = true;
    bloodBank.passwordToken = hashedToken;
    bloodBank.passwordTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    bloodBank.passwordSetupToken = token;
    bloodBank.passwordSetupTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    bloodBank.approvedAt = new Date();
    bloodBank.approvedBy = req.admin.id;

    // Track status history
    if (!bloodBank.statusHistory) {
      bloodBank.statusHistory = [];
    }
    bloodBank.statusHistory.push({
      status: "approved",
      action: "Admin Approval",
      note: "Registration approved by Admin. Sent password setup link.",
      updatedBy: "Admin",
      updatedAt: new Date(),
    });

    await bloodBank.save();

    await sendEmail({
      to: bloodBank.email,
      subject: "Your Blood Bank Account Has Been Approved",
      html: emailTemplates.bloodBankApproval(bloodBank.name, bloodBank.managerName, bloodBank.email, setupLink),
    });

    res.json({ success: true, message: "Blood bank approved and password setup email sent." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

router.put("/blood-banks/:id/approve", verifyToken, handleApproveBloodBank);
router.post("/blood-banks/:id/approve", verifyToken, handleApproveBloodBank);

const handleRejectBloodBank = async (req, res) => {
  try {
    const { rejectionReason, reason } = req.body;
    const finalReason = rejectionReason || reason;
    if (!finalReason) return res.status(400).json({ success: false, message: "Rejection reason required" });

    const bloodBank = await BloodBank.findById(req.params.id);
    if (!bloodBank) return res.status(404).json({ success: false, message: "Blood bank not found" });
    if (bloodBank.status === "rejected") return res.status(400).json({ success: false, message: "Already rejected" });

    bloodBank.status = "rejected";
    bloodBank.isVerified = false;
    bloodBank.rejectionReason = finalReason;
    bloodBank.rejectedAt = new Date();
    bloodBank.rejectedBy = req.admin.id;

    await bloodBank.save();

    await sendEmail({
      to: bloodBank.email,
      subject: "Blood Bank Registration Rejected",
      html: emailTemplates.bloodBankRejection(bloodBank.name, bloodBank.managerName, finalReason),
    });

    res.json({ success: true, message: "Blood bank rejected and email sent." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

router.put("/blood-banks/:id/reject", verifyToken, handleRejectBloodBank);
router.post("/blood-banks/:id/reject", verifyToken, handleRejectBloodBank);

/* ======================================================
   ADMIN : HOME CONTENT CRUD (LOCATION-BASED UI/UX)
====================================================== */

// 1. Get all home contents (with filters)
router.get("/home-content", verifyToken, async (req, res) => {
  try {
    const { country, state, city, isGlobal, isActive } = req.query;
    const filter = {};
    if (country) filter.country = new RegExp(country.trim(), "i");
    if (state) filter.state = new RegExp(state.trim(), "i");
    if (city) filter.city = new RegExp(city.trim(), "i");
    if (isGlobal !== undefined) filter.isGlobal = isGlobal === "true";
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const list = await HomeContent.find(filter).sort({ priority: -1, updatedAt: -1 });
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching home contents", error: err.message });
  }
});

// 2. Create home content
router.post("/home-content", verifyToken, async (req, res) => {
  try {
    const content = new HomeContent(req.body);
    await content.save();
    res.status(201).json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error creating home content", error: err.message });
  }
});

// 3. Update home content
router.put("/home-content/:id", verifyToken, async (req, res) => {
  try {
    const updated = await HomeContent.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "Content not found" });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating home content", error: err.message });
  }
});

// 5. Delete home content
router.delete("/home-content/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await HomeContent.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Content not found" });
    res.json({ success: true, message: "Content deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting home content", error: err.message });
  }
});

export default router;
