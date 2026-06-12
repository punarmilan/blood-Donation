import express from "express";
import jwt from "jsonwebtoken";
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

// @route   GET /api/request/live
// @desc    Get live active requests for a state
// @access  Public
router.get("/live", async (req, res) => {
  try {
    const { state } = req.query;
    if (!state) {
      return res.status(400).json({ success: false, message: "State is required" });
    }

    const requests = await BloodRequest.find({
      state: new RegExp(`^${state.trim()}$`, "i"),
      status: "active"
    })
    .populate("recipient", "name mobile")
    .sort({ createdAt: -1 });

    // Sort urgent first
    requests.sort((a, b) => {
      const aUrgent = a.urgency === "urgent" || a.urgency === "emergency";
      const bUrgent = b.urgency === "urgent" || b.urgency === "emergency";
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Limit results for home page (return top 6)
    const limited = requests.slice(0, 6);

    res.json({ success: true, data: limited });
  } catch (err) {
    console.error("Live blood requests error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   GET /api/request/all-live
// @desc    Get all active requests with filters
// @access  Public
router.get("/all-live", async (req, res) => {
  try {
    const { state, city, bloodGroup, urgency, status } = req.query;
    const filter = {};
    
    // Status filter - defaults to active
    filter.status = status || "active";

    if (state) {
      filter.state = new RegExp(`^${state.trim()}$`, "i");
    }
    if (city) {
      filter.city = new RegExp(`^${city.trim()}$`, "i");
    }
    if (bloodGroup) {
      filter.bloodGroup = bloodGroup;
    }
    if (urgency) {
      filter.urgency = urgency;
    }

    const requests = await BloodRequest.find(filter)
      .populate("recipient", "name mobile")
      .sort({ createdAt: -1 });

    // Sort urgent first
    requests.sort((a, b) => {
      const aUrgent = a.urgency === "urgent" || a.urgency === "emergency";
      const bUrgent = b.urgency === "urgent" || b.urgency === "emergency";
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({ success: true, data: requests });
  } catch (err) {
    console.error("All live requests error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   POST /api/request/create
// @desc    Create a new blood request
// @access  Private
router.post("/create", verifyToken, async (req, res) => {
  try {
    const {
      patientName,
      bloodGroup,
      bloodComponent,
      units,
      unitsNeeded,
      hospital,
      hospitalName,
      hospitalArea,
      city,
      state,
      pincode,
      latitude,
      longitude,
      urgency,
      neededBy,
      neededDateTime,
      additionalInfo
    } = req.body;

    const finalState = state ? state.trim() : "";
    if (!patientName || !bloodGroup || !bloodComponent || (!units && !unitsNeeded) || (!hospital && !hospitalName) || !finalState) {
      return res.status(400).json({ success: false, message: "Please provide all required fields, including State and Blood Component." });
    }

    const User = (await import("../models/User.js")).default;
    const requester = await User.findById(req.user.id);
    const requesterMobile = requester ? requester.mobile : "";

    const requestId = await generateRequestId();

    const newRequest = new BloodRequest({
      requestId,
      recipient: req.user.id,
      requesterUserId: req.user.id,
      patientName,
      bloodGroup,
      bloodComponent,
      units: units || unitsNeeded,
      unitsNeeded: unitsNeeded || units,
      hospital: hospital || hospitalName,
      hospitalName: hospitalName || hospital,
      hospitalArea,
      city,
      state: finalState,
      pincode,
      latitude,
      longitude,
      urgency,
      neededBy,
      neededDateTime: neededDateTime ? new Date(neededDateTime) : undefined,
      additionalInfo,
      requesterMobile,
      status: "pending"
    });

    await newRequest.save();

    // Update the user's role to 'recipient'
    await User.findByIdAndUpdate(req.user.id, { role: "recipient" });

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
// @desc    Get active emergency requests for the logged-in donor (state + bloodGroup filtered)
// @access  Private (Donors)
router.get("/active", verifyToken, async (req, res) => {
  try {
    const User = (await import("../models/User.js")).default;
    const { normalizeLocation } = await import("../utils/normalize.js");

    const donor = await User.findById(req.user.id);
    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor not found" });
    }

    const donorStateNorm = donor.normalizedState || normalizeLocation(donor.state);
    const donorBloodGroup = donor.bloodGroup;

    // Build filter: active status + same state + same bloodGroup
    const filter = { status: "active" };

    if (donorStateNorm) {
      filter.normalizedState = donorStateNorm;
    }

    if (donorBloodGroup) {
      filter.bloodGroup = donorBloodGroup;
    }

    const requests = await BloodRequest.find(filter)
      .populate("recipient", "name mobile")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Active requests error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   GET /api/request/:requestId
// @desc    Get single request status by ID
// @access  Public (for WhatsApp sharing tracking)
router.get("/:requestId", async (req, res) => {
  try {
    const request = await BloodRequest.findOne({ requestId: req.params.requestId })
      .populate("recipient", "name mobile")
      .populate("acceptedBy", "name mobile state city");
      
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const requestObj = request.toObject();
    
    // Check if the user is authorized to see the OTP (recipient or accepted donor)
    let isAuthorized = false;
    const authHeader = req.header("Authorization");
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (token) {
        try {
          const JWT_SECRET = process.env.JWT_SECRET || "raktdaan-super-secret-key";
          const verified = jwt.verify(token, JWT_SECRET);
          const userId = verified.id || verified._id;
          
          const isRecipient = request.recipient && request.recipient._id.toString() === userId;
          const isDonor = request.acceptedBy && request.acceptedBy._id.toString() === userId;
          
          if (isRecipient || isDonor) {
            isAuthorized = true;
          }
        } catch (err) {
          // Ignore verification errors for public requests
        }
      }
    }

    if (!isAuthorized) {
      delete requestObj.otp;
    }

    res.status(200).json({ success: true, data: requestObj });
  } catch (error) {
    console.error("Get request status error:", error);
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

    const User = (await import("../models/User.js")).default;
    const user = await User.findById(req.user.id);
    if (user && user.nextEligibleDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextEligible = new Date(user.nextEligibleDate);
      nextEligible.setHours(0, 0, 0, 0);
      if (today < nextEligible) {
        const formattedDate = nextEligible.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        return res.status(400).json({ 
          success: false, 
          message: `You are not eligible to donate right now. Next eligible date: ${formattedDate}` 
        });
      }
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

    const isDonor = request.acceptedBy && request.acceptedBy.toString() === req.user.id;
    const isBloodBank = request.acceptedByBloodBank && request.acceptedByBloodBank.toString() === req.user.id;

    if (!isDonor && !isBloodBank) {
      return res.status(403).json({ success: false, message: "Only the assigned donor or blood bank can verify OTP" });
    }

    if (request.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    request.status = "completed";
    request.completedAt = new Date();

    await request.save();

    // Update donor eligibility if it was a user donor
    if (request.acceptedBy) {
      try {
        const User = (await import("../models/User.js")).default;
        const { calculateBadge, calculateDonationEligibility } = await import("../utils/badgeCalculator.js");
        const donor = await User.findById(request.acceptedBy);
        if (donor) {
          donor.totalDonations = (donor.totalDonations || 0) + 1;
          donor.badge = calculateBadge(donor.totalDonations);

          const donationDate = new Date();
          const donorGender = donor.gender || donor.health?.gender || "Male";
          const eligibility = calculateDonationEligibility(donorGender, donationDate);

          donor.lastDonationDate = donationDate;
          donor.nextEligibleDonationDate = eligibility.nextEligibleDate ? new Date(eligibility.nextEligibleDate) : undefined;
          donor.nextEligibleDate = eligibility.nextEligibleDate ? new Date(eligibility.nextEligibleDate) : undefined;
          donor.donationEligibilityStatus = eligibility.status;
          donor.donationGapDays = eligibility.gapDays;
          donor.daysRemaining = eligibility.daysRemaining;

          donor.donationHistory = donor.donationHistory || [];
          donor.donationHistory.push({
            requestId: request.requestId,
            date: donationDate,
            venue: request.hospital || request.city || "Direct Patient Donation"
          });

          await donor.save();
        }
      } catch (err) {
        console.error("Error updating donor eligibility after OTP verification:", err);
      }
    }

    // Create Notification for the recipient that donation is complete
    const Notification = (await import("../models/Notification.js")).default;
    const partyName = isBloodBank ? "blood bank" : "donor";
    await Notification.create({
      userId: request.recipient,
      title: "🩸 Donation Completed",
      message: `The ${partyName} has successfully completed the blood donation. Thank you!`,
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
