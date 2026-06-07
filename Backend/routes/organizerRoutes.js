import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../models/User.js";
import Camp from "../models/Camp.js";
import Donor from "../models/Donor.js";
import CampRegistration from "../models/CampRegistration.js";

import { verifyOrganizerToken } from "../middleware/authMiddleware.js";

const router = express.Router();
/* ======================================================
   GET ORGANIZER PROFILE
====================================================== */
router.get("/profile", verifyOrganizerToken, async (req, res) => {
  try {
    const organizer = await User.findById(req.organizer._id).select("-password");
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }
    res.json(organizer);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
/* ======================================================
   ORGANIZER LOGIN
====================================================== */
router.post("/login", async (req, res) => {
  // Use /api/auth/organizer-login instead. Kept for backwards compatibility just in case.
  res.status(404).json({ message: "Please use /api/auth/organizer-login" });
});

/* ======================================================
   GET ALL MY CAMPS
====================================================== */
router.get("/my-camps", verifyOrganizerToken, async (req, res) => {
  try {
    const camps = await Camp.find({ organizer: req.organizer._id }).sort({ date: -1 });
    res.json(camps);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch camps", error: err.message });
  }
});

/* ======================================================
   GET SINGLE CAMP DETAIL
====================================================== */
router.get("/camp/:campId", verifyOrganizerToken, async (req, res) => {
  try {
    const { campId } = req.params;
    let query = mongoose.Types.ObjectId.isValid(campId) ? { _id: campId } : { campId: campId };
    
    // Find the camp and populate registeredDonors
    const camp = await Camp.findOne(query).populate('registeredDonors', 'name bloodGroup createdAt');
    
    if (!camp) {
      return res.status(404).json({ success: false, message: "Camp not found" });
    }

    // Security check: ensure camp belongs to the logged-in organizer
    if (camp.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized access to this camp" });
    }

    // Format the registered donors array (Logged-in Users)
    const userDonors = camp.registeredDonors.map(donor => {
      // Get first name + last initial
      const nameParts = donor.name ? donor.name.split(' ') : ['Unknown'];
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      const formattedName = lastName ? `${firstName} ${lastName.charAt(0)}.` : firstName;

      return {
        _id: donor._id,
        name: formattedName,
        bloodGroup: donor.bloodGroup || 'Unknown',
        registeredAt: donor.createdAt // Using createdAt as fallback for registration time
      };
    });

    // Source 2: Public CampRegistration donors (WhatsApp link se aaye)
    const campRegistrations = await CampRegistration.find({
      $or: [
        { campId: camp.campId },
        { camp: camp._id }
      ]
    }).sort({ createdAt: -1 });

    const publicDonors = campRegistrations.map(reg => {
      const nameParts = reg.name ? reg.name.split(' ') : ['Unknown'];
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      const formattedName = lastName ? `${firstName} ${lastName.charAt(0)}.` : firstName;

      return {
        _id: reg._id,
        name: formattedName,
        bloodGroup: reg.bloodGroup || 'Unknown',
        registeredAt: reg.createdAt
      };
    });

    const formattedDonors = [...publicDonors, ...userDonors];

    res.json({
      success: true,
      camp: {
        _id: camp._id,
        campId: camp.campId,
        title: camp.title || camp.name,
        date: camp.date,
        venue: camp.venue || camp.location,
        city: camp.city || 'Unknown',
        area: camp.area || camp.location || 'Unknown',
        expectedDonors: camp.expectedDonors || 'N/A',
        totalSlots: 50, // Mocking total slots since it's not strictly a schema field in the format required
        status: camp.status || 'upcoming',
        registeredDonors: formattedDonors,
        registeredCount: formattedDonors.length,
        createdAt: camp.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch camp details", error: err.message });
  }
});


/* ======================================================
   GET DONORS (BY CAMP ID)
====================================================== */
router.get("/my-donors", verifyOrganizerToken, async (req, res) => {
  try {
    const { campId } = req.query;

    if (!campId) {
      return res.status(400).json({ message: "campId is required" });
    }

    const camp = await Camp.findById(campId);
    if (!camp || camp.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access to this camp" });
    }

    const donors = await Donor.find({ camp: campId }).sort({ createdAt: -1 });
    res.json(donors);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch donors", error: err.message });
  }
});

/* ======================================================
   UPDATE DONOR (Only for own camp)
====================================================== */
router.put("/donor/:id", verifyOrganizerToken, async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);

    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    const camp = await Camp.findById(donor.camp);
    if (!camp || camp.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({ message: "Unauthorized donor access" });
    }

    Object.assign(donor, req.body);
    await donor.save();

    res.json({ message: "Donor updated", donor });
  } catch (err) {
    res.status(500).json({ message: "Failed to update donor", error: err.message });
  }
});

/* ======================================================
   DELETE DONOR (Only for own camp)
====================================================== */
router.delete("/donor/:id", verifyOrganizerToken, async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);

    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    const camp = await Camp.findById(donor.camp);
    if (!camp || camp.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({ message: "Unauthorized donor access" });
    }

    await donor.deleteOne();
    res.json({ message: "Donor deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete donor", error: err.message });
  }
});

/* ======================================================
   GET REGISTRATIONS FOR A SPECIFIC CAMP
====================================================== */
router.get("/registrations/:campId", verifyOrganizerToken, async (req, res) => {
  try {
    const { campId } = req.params;
    let query = mongoose.Types.ObjectId.isValid(campId) ? { _id: campId } : { campId: campId };
    
    // Find the camp and populate registeredDonors (logged-in users)
    const camp = await Camp.findOne(query).populate('registeredDonors', 'name bloodGroup createdAt');
    
    if (!camp) {
      return res.status(404).json({ success: false, message: "Camp not found" });
    }

    // Security check
    if (camp.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized access to this camp" });
    }

    // Source 1: Logged-in User donors
    const userDonors = (camp.registeredDonors || []).map(donor => {
      const bg = donor.bloodGroup || 'Unknown';
      return {
        _id: donor._id,
        name: donor.name || 'Unknown',
        bloodGroup: bg,
        mobile: null,
        registeredAt: donor.createdAt,
        status: 'confirmed',
        source: 'user'
      };
    });

    // Source 2: Public CampRegistration donors (WhatsApp link se aaye)
    const campRegistrations = await CampRegistration.find({
      $or: [
        { campId: camp.campId },
        { camp: camp._id }
      ]
    }).sort({ createdAt: -1 });

    const publicDonors = campRegistrations.map(reg => ({
      _id: reg._id,
      name: reg.name,
      bloodGroup: reg.bloodGroup,
      mobile: reg.mobile,
      timeSlot: reg.timeSlot,
      age: reg.age,
      registeredAt: reg.createdAt,
      status: reg.status,
      source: 'public'
    }));

    // Merge both lists
    const allDonors = [...publicDonors, ...userDonors];

    // Calculate stats
    const bloodGroupBreakdown = {};
    let confirmedCount = 0;

    allDonors.forEach(donor => {
      const bg = donor.bloodGroup || 'Unknown';
      if (bg !== 'Unknown') {
        bloodGroupBreakdown[bg] = (bloodGroupBreakdown[bg] || 0) + 1;
      }
      if (donor.status === 'confirmed' || donor.status === 'registered') confirmedCount++;
    });

    const totalRegistered = allDonors.length;
    const totalSlots = camp.totalSlots || (camp.expectedDonors ? parseInt(camp.expectedDonors) : 100) || 100;
    const slotsLeft = Math.max(0, totalSlots - totalRegistered);
    const progressPercent = Math.min(100, (totalRegistered / totalSlots) * 100);

    res.json({
      success: true,
      camp: {
        campId: camp.campId || camp._id,
        title: camp.title || camp.name,
        date: camp.date,
        venue: camp.venue || camp.location,
        city: camp.city || 'Unknown',
        totalSlots,
        status: camp.status || 'upcoming'
      },
      stats: {
        totalRegistered,
        confirmed: confirmedCount,
        slotsLeft,
        totalSlots,
        progressPercent,
        bloodGroupBreakdown
      },
      donors: allDonors
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch registrations", error: err.message });
  }
});


/* ======================================================
   GET REPORTS FOR ORGANIZER DASHBOARD
====================================================== */
router.get('/reports', verifyOrganizerToken, async (req, res) => {
  try {
    const camps = await Camp.find({ organizer: req.organizer._id })
      .populate('registeredDonors', 'bloodGroup name')
      .sort({ date: -1 });

    let totalDonors = 0, totalUnits = 0;
    const completedCamps = camps.filter(c => c.status === 'completed');

    const campsData = await Promise.all(camps.map(async (camp) => {
      // Fetch public registrations for this camp
      const publicRegs = await CampRegistration.find({
        $or: [{ campId: camp.campId }, { camp: camp._id }]
      });

      // Combine user donors + public registrations
      const userDonorCount = camp.registeredDonors?.length || 0;
      const publicDonorCount = publicRegs.length;
      const totalRegistered = userDonorCount + publicDonorCount;

      // Blood group breakdown from both sources
      const bloodGroupBreakdown = {};
      const groups = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
      groups.forEach(g => bloodGroupBreakdown[g] = 0);

      camp.registeredDonors?.forEach(d => {
        if (d.bloodGroup && bloodGroupBreakdown[d.bloodGroup] !== undefined)
          bloodGroupBreakdown[d.bloodGroup]++;
      });
      publicRegs.forEach(r => {
        if (r.bloodGroup && bloodGroupBreakdown[r.bloodGroup] !== undefined)
          bloodGroupBreakdown[r.bloodGroup]++;
      });

      const totalSlots = camp.totalSlots || (camp.expectedDonors ? parseInt(camp.expectedDonors) : 100) || 100;
      const slotsLeft = Math.max(0, totalSlots - totalRegistered);

      if (camp.status === 'completed') {
        const donorsAttended = camp.totalDonors || totalRegistered;
        const unitsCollected = camp.totalUnitsCollected || Math.round(donorsAttended * 0.45);
        const livesSaved = unitsCollected * 3;
        const attendancePercent = totalRegistered > 0
          ? Math.round((donorsAttended / totalRegistered) * 100) : 0;

        totalDonors += donorsAttended;
        totalUnits += unitsCollected;

        return {
          campId: camp.campId || camp._id,
          title: camp.title || camp.name,
          date: camp.date,
          venue: camp.venue || camp.location,
          city: camp.city || '',
          status: camp.status,
          totalSlots,
          totalRegistered,
          slotsLeft,
          stats: { donorsAttended, unitsCollected, livesSaved, attendancePercent, bloodGroupBreakdown },
          hasCertificate: true
        };
      }

      // For upcoming/ongoing — show registration data
      totalDonors += totalRegistered;

      return {
        campId: camp.campId || camp._id,
        title: camp.title || camp.name,
        date: camp.date,
        venue: camp.venue || camp.location,
        city: camp.city || '',
        status: camp.status,
        totalSlots,
        totalRegistered,
        slotsLeft,
        stats: {
          donorsAttended: totalRegistered,
          unitsCollected: 0,
          livesSaved: 0,
          attendancePercent: 0,
          bloodGroupBreakdown
        },
        hasCertificate: false
      };
    }));

    res.json({
      success: true,
      overall: {
        totalCamps: camps.length,
        completedCamps: completedCamps.length,
        upcomingCamps: camps.filter(c => c.status === 'upcoming').length,
        totalDonors,
        totalUnits,
        totalLivesSaved: totalUnits * 3
      },
      camps: campsData
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


export default router;
