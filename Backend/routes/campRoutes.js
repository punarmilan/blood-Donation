import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { createCloudinaryStorage } from "../config/cloudinary.js";
import Camp from "../models/Camp.js";
import Donor from "../models/Donor.js";
import Organizer from "../models/Organizer.js";
import User from "../models/User.js";
import transporter from "../config/emailConfig.js";
import { emailTemplates } from "../utils/emailTemplates.js";
import { calculateBadge, getNextEligibleDate, calculateDonationEligibility } from "../utils/badgeCalculator.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ======================================================
   1. ADD NEW CAMP + ASSIGN ORGANIZER
====================================================== */
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      name,
      location,
      date,
      organizerId,
      organizerName,
      organizerContact,
      proName,
      hospitalName,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Camp name is required" });
    }

    const existing = await Camp.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Camp already exists" });
    }

    // 1️⃣ Create Camp
    const camp = await Camp.create({
      title: name,
      name,
      venue: location || 'Unknown',
      area: location || 'Unknown',
      location,
      date,
      organizer: organizerId || null,
      organizerName,
      organizerContact,
      proName,
      hospitalName,
    });

    // 2️⃣ Assign Camp to Organizer
    if (organizerId && mongoose.Types.ObjectId.isValid(organizerId)) {
      await Organizer.findByIdAndUpdate(organizerId, {
        $push: { camps: camp._id },
      });
    }

    res.status(201).json({
      message: "Camp added and assigned successfully",
      camp,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error adding camp",
      error: err.message,
    });
  }
});

/* ======================================================
   2. PUBLIC : GET ALL CAMPS
====================================================== */
router.get("/", async (_req, res) => {
  try {
    const camps = await Camp.find()
      .populate("organizer", "name mobile email")
      .populate({
        path: "enquiry",
        populate: {
          path: "assignedBloodBank",
          select: "name managerName mobile"
        }
      })
      .sort({ date: -1 });

    const processedCamps = camps.map(camp => {
      const campObj = camp.toObject();
      if (!campObj.hospitalName || campObj.hospitalName === "N/A") {
        campObj.hospitalName = campObj.enquiry?.assignedBloodBank?.name || "N/A";
      }
      if (!campObj.proName || campObj.proName === "N/A") {
        campObj.proName = campObj.enquiry?.assignedBloodBank?.managerName || "N/A";
      }
      return campObj;
    });

    res.json(processedCamps);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching camps",
      error: err.message,
    });
  }
});

/* ======================================================
   3. ADMIN : GET ALL CAMPS WITH DONOR COUNT
====================================================== */
router.get("/with-count", verifyToken, async (_req, res) => {
  try {
    const camps = await Camp.find()
      .populate("organizer", "name mobile email")
      .populate({
        path: "enquiry",
        populate: {
          path: "assignedBloodBank",
          select: "name managerName mobile"
        }
      })
      .sort({ date: 1 });

    const { default: CampRegistration } = await import("../models/CampRegistration.js");

    const campsWithCounts = await Promise.all(
      camps.map(async (camp) => {
        const donorCount1 = await Donor.countDocuments({ camp: camp._id });
        const donorCount2 = await CampRegistration.countDocuments({
          $or: [{ camp: camp._id }, { campId: camp.campId }]
        });
        
        const campObj = camp.toObject();
        
        // Fallback for hospitalName and proName if they are missing or N/A
        if (!campObj.hospitalName || campObj.hospitalName === "N/A") {
          campObj.hospitalName = campObj.enquiry?.assignedBloodBank?.name || "N/A";
        }
        if (!campObj.proName || campObj.proName === "N/A") {
          campObj.proName = campObj.enquiry?.assignedBloodBank?.managerName || "N/A";
        }
        
        return { ...campObj, donorCount: donorCount1 + donorCount2 };
      })
    );

    res.json(campsWithCounts);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching camps",
      error: err.message,
    });
  }
});

/* ======================================================
   4. GET SINGLE CAMP
====================================================== */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    let camp;
    if (mongoose.Types.ObjectId.isValid(id)) {
      camp = await Camp.findById(id)
        .populate("organizer", "name mobile email")
        .populate({
          path: "enquiry",
          populate: {
            path: "assignedBloodBank",
            select: "name managerName mobile"
          }
        });
    } else {
      camp = await Camp.findOne({ campId: id })
        .populate("organizer", "name mobile email")
        .populate({
          path: "enquiry",
          populate: {
            path: "assignedBloodBank",
            select: "name managerName mobile"
          }
        });
    }

    if (!camp) {
      return res.status(404).json({ message: "Camp not found" });
    }

    const { default: CampRegistration } = await import("../models/CampRegistration.js");
    const donorCount1 = await Donor.countDocuments({ camp: camp._id });
    const donorCount2 = await CampRegistration.countDocuments({
      $or: [{ camp: camp._id }, { campId: camp.campId }]
    });

    const donorCount = donorCount1 + donorCount2;
    
    const campObj = camp.toObject();
    
    // Fallback for hospitalName and proName if they are missing or N/A
    if (!campObj.hospitalName || campObj.hospitalName === "N/A") {
      campObj.hospitalName = campObj.enquiry?.assignedBloodBank?.name || "N/A";
    }
    if (!campObj.proName || campObj.proName === "N/A") {
      campObj.proName = campObj.enquiry?.assignedBloodBank?.managerName || "N/A";
    }

    res.json({ ...campObj, donorCount });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching camp",
      error: err.message,
    });
  }
});

/* ======================================================
   4.1 REGISTER LOGGED-IN DONOR FOR CAMP
====================================================== */
router.post("/:id/register", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.admin?.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const camp = await Camp.findById(id);
    if (!camp) {
      return res.status(404).json({ message: "Camp not found" });
    }

    const user = await User.findById(userId);
    if (user && user.nextEligibleDate) {
      const campDate = new Date(camp.date);
      const nextEligible = new Date(user.nextEligibleDate);
      if (campDate < nextEligible) {
        const formattedDate = nextEligible.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        return res.status(400).json({ 
          message: `You are not eligible to register for this camp. You recently donated blood. Next eligible date: ${formattedDate}` 
        });
      }
    }

    // Check if donor is already registered
    if (camp.registeredDonors && camp.registeredDonors.includes(userId)) {
      return res.status(400).json({ message: "You are already registered for this camp" });
    }

    // Initialize arrays if they don't exist
    if (!camp.registeredDonors) {
      camp.registeredDonors = [];
    }

    // Check if max slots are reached
    const maxSlots = camp.maxSlots || 200;
    if (camp.registeredDonors.length >= maxSlots) {
      return res.status(400).json({ message: "Camp slots are full" });
    }

    // Register donor
    camp.registeredDonors.push(userId);
    camp.registeredCount = camp.registeredDonors.length;
    await camp.save();

    // Fetch updated/populated camp to return
    const updatedCamp = await Camp.findById(id)
      .populate("organizer", "name mobile email")
      .populate({
        path: "enquiry",
        populate: {
          path: "assignedBloodBank",
          select: "name managerName mobile"
        }
      });

    const { default: CampRegistration } = await import("../models/CampRegistration.js");
    const donorCount1 = await Donor.countDocuments({ camp: updatedCamp._id });
    const donorCount2 = await CampRegistration.countDocuments({
      $or: [{ camp: updatedCamp._id }, { campId: updatedCamp.campId }]
    });
    const donorCount = donorCount1 + donorCount2;

    res.json({
      message: "You have successfully registered for this camp.",
      camp: { ...updatedCamp.toObject(), donorCount }
    });
  } catch (err) {
    res.status(500).json({
      message: "Error registering for camp",
      error: err.message,
    });
  }
});

/* ======================================================
   5. UPDATE CAMP (INCLUDING ORGANIZER CHANGE)
====================================================== */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { organizerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Camp ID" });
    }

    const camp = await Camp.findById(id);
    if (!camp) {
      return res.status(404).json({ message: "Camp not found" });
    }

    const allowedFields = [
      "name",
      "location",
      "date",
      "organizerName",
      "organizerContact",
      "proName",
      "hospitalName",
      "status"
    ];

    const payload = {};
    for (const field of allowedFields) {
      if (field in req.body && req.body[field] !== "") {
        payload[field] = req.body[field];
      }
    }
    if (payload.name) payload.title = payload.name;
    if (payload.location) {
      payload.venue = payload.location;
      payload.area = payload.location;
    }

    // 🔁 Organizer Change Handling
    if (
      organizerId &&
      mongoose.Types.ObjectId.isValid(organizerId) &&
      String(organizerId) !== String(camp.organizerId)
    ) {
      // Remove from old organizer
      if (camp.organizerId) {
        await Organizer.findByIdAndUpdate(camp.organizerId, {
          $pull: { camps: camp._id },
        });
      }

      // Add to new organizer
      await Organizer.findByIdAndUpdate(organizerId, {
        $push: { camps: camp._id },
      });

      payload.organizerId = organizerId;
    }

    const updatedCamp = await Camp.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    ).populate("organizer", "name mobile email");

    const donorCount = await Donor.countDocuments({
      camp: updatedCamp._id,
    });

    res.json({
      message: "Camp updated successfully",
      camp: { ...updatedCamp.toObject(), donorCount },
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating camp",
      error: err.message,
    });
  }
});

/* ======================================================
   6. DELETE CAMP + REMOVE FROM ORGANIZER
====================================================== */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Camp ID" });
    }

    const camp = await Camp.findById(id);
    if (!camp) {
      return res.status(404).json({ message: "Camp not found" });
    }

    // Remove camp from organizer
    if (camp.organizerId) {
      await Organizer.findByIdAndUpdate(camp.organizerId, {
        $pull: { camps: camp._id },
      });
    }

    await Camp.findByIdAndDelete(id);

    res.json({ message: "Camp deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting camp",
      error: err.message,
    });
  }
});

/* ======================================================
   7. MARK CAMP COMPLETE
====================================================== */
const storage = createCloudinaryStorage("blood_donation/camps");
const upload = multer({ storage });

router.patch("/:campId/complete", verifyToken, upload.array("photos", 10), async (req, res) => {
  try {
    const { campId } = req.params;
    const { totalDonors, totalUnitsCollected, checkedInDonors } = req.body;
    
    let donorIds = [];
    if (checkedInDonors) {
      try {
        donorIds = JSON.parse(checkedInDonors);
      } catch (e) {
        if (Array.isArray(checkedInDonors)) {
          donorIds = checkedInDonors;
        } else {
          donorIds = [checkedInDonors];
        }
      }
    }

    const camp = await Camp.findOne({ campId: campId }).populate("organizer", "name email");
    if (!camp) return res.status(404).json({ success: false, message: "Camp not found" });
    
    if (camp.status === "completed") {
      return res.status(400).json({ success: false, message: "Camp is already marked as completed" });
    }

    const photoUrls = req.files ? req.files.map(file => file.path) : [];

    camp.status = "completed";
    camp.completedAt = new Date();
    camp.totalDonors = parseInt(totalDonors) || 0;
    camp.totalUnitsCollected = parseInt(totalUnitsCollected) || 0;
    camp.checkedInDonors = donorIds;
    if (photoUrls.length > 0) {
      camp.photos = photoUrls;
    }
    
    await camp.save();

    const livesSaved = camp.totalUnitsCollected * 3;

    // Send Post Camp Email to Organizer
    if (camp.organizer && camp.organizer.email) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: camp.organizer.email,
          subject: "🩸 Aapka Camp Successful Raha! Report Attached",
          html: emailTemplates.postCampReport(camp.organizer.name, camp, {
            totalDonors: camp.totalDonors,
            totalUnitsCollected: camp.totalUnitsCollected,
            livesSaved
          })
        });
      } catch (err) { console.error("Error sending organizer report email", err); }
    }

    // Process Donors
    if (donorIds && donorIds.length > 0) {
      for (const dId of donorIds) {
        if (!mongoose.Types.ObjectId.isValid(dId)) continue;
        const donor = await User.findById(dId);
        if (donor) {
          donor.totalDonations = (donor.totalDonations || 0) + 1;
          donor.badge = calculateBadge(donor.totalDonations);

          const donationDate = camp.date || new Date();
          const donorGender = donor.gender || donor.health?.gender || "Male";
          const eligibility = calculateDonationEligibility(donorGender, donationDate);

          donor.lastDonationDate = donationDate;
          donor.nextEligibleDonationDate = eligibility.nextEligibleDate ? new Date(eligibility.nextEligibleDate) : undefined;
          donor.nextEligibleDate = eligibility.nextEligibleDate ? new Date(eligibility.nextEligibleDate) : undefined;
          donor.donationEligibilityStatus = eligibility.status;
          donor.donationGapDays = eligibility.gapDays;
          donor.daysRemaining = eligibility.daysRemaining;
          
          donor.donationHistory.push({
            campId: camp._id,
            date: donationDate,
            venue: camp.venue || camp.location
          });
          
          await donor.save();

          // Send Certificate Email
          if (donor.email) {
            try {
              await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: donor.email,
                subject: `🏅 Aapka Blood Donation Certificate - ${camp.title || camp.name}`,
                html: emailTemplates.donorCertificate(donor.name, camp, donor.badge, nextDate)
              });
            } catch (err) { console.error("Error sending donor certificate", err); }
          }
        }
      }
    }

    res.json({ success: true, message: "Camp marked complete" });
  } catch (err) {
    console.error("Camp Complete Error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

/* ======================================================
   8. UPLOAD CAMP PHOTOS
====================================================== */
router.post("/:campId/photos", verifyToken, upload.array("photos", 10), async (req, res) => {
  try {
    const { campId } = req.params;
    
    // Support either _id or campId string
    const query = mongoose.Types.ObjectId.isValid(campId) ? { _id: campId } : { campId: campId };
    const camp = await Camp.findOne(query);
    
    if (!camp) return res.status(404).json({ success: false, message: "Camp not found" });

    const photoUrls = req.files ? req.files.map(file => file.path) : [];
    
    if (photoUrls.length === 0) {
       return res.status(400).json({ success: false, message: "No photos uploaded" });
    }

    camp.photos = [...(camp.photos || []), ...photoUrls];
    await camp.save();

    res.json({ success: true, message: "Photos uploaded successfully", photos: camp.photos });
  } catch (err) {
    console.error("Upload Camp Photos Error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

export default router;
