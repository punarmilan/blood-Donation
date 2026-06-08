import express from "express";
import BloodRequest from "../models/BloodRequest.js";
import { verifyToken } from "./authRoutes.js";

const router = express.Router();

// Generate Request ID helper
const generateRequestId = async () => {
  const year = new Date().getFullYear();
  let unique = false;
  let requestId = "";
  
  while (!unique) {
    const randomDigits = Math.floor(100 + Math.random() * 900); // 3 digits
    requestId = `RD${year}${randomDigits}`;
    const existing = await BloodRequest.findOne({ requestId });
    if (!existing) unique = true;
  }
  return requestId;
};

// @route   POST /api/request/create
// @desc    Create a new blood request
// @access  Private
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { patientName, bloodGroup, units, hospital, city, urgency, neededBy, additionalInfo } = req.body;
    
    // Validate required
    if (!patientName || !bloodGroup || !units || !hospital) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    const requestId = await generateRequestId();

    const newRequest = new BloodRequest({
      requestId,
      recipient: req.user.id,
      patientName,
      bloodGroup,
      units,
      hospital,
      city,
      urgency,
      neededBy,
      additionalInfo,
      status: "pending"
    });

    await newRequest.save();

    res.status(201).json({ success: true, message: "Request created successfully", data: newRequest });
  } catch (error) {
    console.error("Create request error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   GET /api/request/my-requests
// @desc    Get all requests by logged in user
// @access  Private
router.get("/my-requests", verifyToken, async (req, res) => {
  try {
    const requests = await BloodRequest.find({ recipient: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   GET /api/request/my-donations
// @desc    Get all requests accepted or completed by logged in donor
// @access  Private
router.get("/my-donations", verifyToken, async (req, res) => {
  try {
    const requests = await BloodRequest.find({ acceptedBy: req.user.id }).sort({ acceptedAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   GET /api/request/active
// @desc    Get all active/pending emergency requests
// @access  Public or Private (Donors)
router.get("/active", async (req, res) => {
  try {
    const requests = await BloodRequest.find({ status: { $in: ["active"] } })
      .populate("recipient", "name mobile")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   GET /api/request/:requestId
// @desc    Get single request status by ID
// @access  Public (for WhatsApp sharing tracking)
router.get("/:requestId", async (req, res) => {
  try {
    const request = await BloodRequest.findOne({ requestId: req.params.requestId })
      .select("-otp")
      .populate("recipient", "name mobile")
      .populate("acceptedBy", "name mobile");
      
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   PATCH /api/request/:requestId/status
// @desc    Update request status (Admin only in real app, but for now open or protected)
// @access  Private
router.patch("/:requestId/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    const request = await BloodRequest.findOne({ requestId: req.params.requestId });
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    request.status = status;
    
    // Update timestamps based on status
    if (status === "active" && !request.donorsNotifiedAt) {
      request.adminSeenAt = new Date();
      request.donorsNotifiedAt = new Date();
    } else if (status === "fulfilled" && !request.fulfilledAt) {
      request.fulfilledAt = new Date();
    }

    await request.save();
    
    res.status(200).json({ success: true, message: "Status updated", data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   PATCH /api/request/:requestId/accept
// @desc    Accept a blood request by a donor
// @access  Private
router.patch("/:requestId/accept", verifyToken, async (req, res) => {
  try {
    const request = await BloodRequest.findOne({ requestId: req.params.requestId });
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (request.status === "completed" || request.status === "accepted" || request.acceptedBy) {
      return res.status(400).json({ success: false, message: "Request already accepted or completed" });
    }

    request.acceptedBy = req.user.id;
    request.status = "accepted";
    request.acceptedAt = new Date();
    request.otp = Math.floor(1000 + Math.random() * 9000).toString();

    await request.save();

    // Create Notification for the recipient
    const Notification = (await import("../models/Notification.js")).default;
    await Notification.create({
      userId: request.recipient,
      title: "✅ Request Accepted",
      message: "Your blood request has been accepted by a donor. Check your dashboard for their contact details.",
      type: "request_accepted",
      bloodRequestId: request._id
    });

    res.status(200).json({ success: true, message: "Request accepted successfully", data: request });
  } catch (error) {
    console.error("Accept error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   POST /api/request/:requestId/verify-otp
// @desc    Verify OTP to complete the donation
// @access  Private
router.post("/:requestId/verify-otp", verifyToken, async (req, res) => {
  try {
    const { otp } = req.body;
    const request = await BloodRequest.findOne({ requestId: req.params.requestId });

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (request.status !== "accepted") {
      return res.status(400).json({ success: false, message: "Request is not in accepted state" });
    }

    if (request.acceptedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Only the assigned donor can verify OTP" });
    }

    if (request.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    request.status = "completed";
    request.completedAt = new Date();
    // clear OTP if you want, but fine to keep for records or clear
    // request.otp = undefined;

    await request.save();

    // Create Notification for the recipient that donation is complete
    const Notification = (await import("../models/Notification.js")).default;
    await Notification.create({
      userId: request.recipient,
      title: "🩸 Donation Completed",
      message: "The donor has successfully completed the blood donation. Thank you!",
      type: "donation_completed",
      bloodRequestId: request._id
    });

    res.status(200).json({ success: true, message: "OTP Verified successfully, donation completed!", data: request });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
