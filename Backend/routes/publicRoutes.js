import express from 'express';
import mongoose from 'mongoose';
import Camp from '../models/Camp.js';
import User from '../models/User.js';
import CampRegistration from '../models/CampRegistration.js';
import BloodBank from '../models/BloodBank.js';
import { sendMessage } from '../whatsapp/waClient.js';
import messages from '../whatsapp/waMessages.js';
import HomeContent from '../models/HomeContent.js';
import BloodRequestBackground from '../models/BloodRequestBackground.js';
import ImpactGallery from '../models/ImpactGallery.js';
import SuccessStory from '../models/SuccessStory.js';
import News from '../models/News.js';

const router = express.Router();

// API 1: Get camp details (public)
router.get('/camp/:campId', async (req, res) => {
  try {
    const { campId } = req.params;
    const query = { $or: [{ campId: campId }] };
    if (mongoose.Types.ObjectId.isValid(campId)) {
      query.$or.push({ _id: campId });
    }

    const camp = await Camp.findOne(query);
    
    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp nahi mila', expired: true });
    }
    
    // Expiry check: camp date ke baad
    const now = new Date();
    const campEndOfDay = new Date(camp.date);
    campEndOfDay.setHours(23, 59, 59, 999);
    if (now > campEndOfDay) {
      return res.status(410).json({ success: false, message: 'Yeh camp khatam ho gaya hai', expired: true });
    }

    // Status check
    if (camp.status === 'completed' || camp.status === 'cancelled') {
      return res.status(410).json({ success: false, message: 'Yeh camp ab available nahi hai', expired: true });
    }

    const registeredCount = camp.registeredDonors?.length || 0;
    const totalSlots = camp.totalSlots || (camp.expectedDonors ? parseInt(camp.expectedDonors) : 100) || 100;

    // Slots full check
    if (registeredCount >= totalSlots) {
      return res.status(410).json({ success: false, message: 'Camp ke saare slots bhar gaye hain', full: true });
    }
    
    // Generate time slots (9 AM to 4 PM)
    const timeSlots = [];
    for (let h = 9; h < 16; h++) {
      const hour = h > 12 ? h - 12 : h;
      const ampm = h >= 12 ? 'PM' : 'AM';
      timeSlots.push(`${hour}:00 ${ampm}`);
    }
    
    res.json({
      success: true,
      camp: {
        campId: camp.campId || camp._id,
        title: camp.title,
        date: camp.date,
        venue: camp.venue,
        city: camp.city,
        totalSlots,
        registeredCount,
        slotsLeft: totalSlots - registeredCount,
        status: camp.status,
        timeSlots
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// API 2: Register for camp (public)
router.post('/camp/:campId/register', async (req, res) => {
  try {
    const { name, mobile, bloodGroup, age, timeSlot } = req.body;
    
    // Validation
    if (!name || !mobile || !bloodGroup || !age || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Sab fields required hain' });
    }
    
    if (mobile.toString().replace(/\D/g, '').length !== 10) {
      return res.status(400).json({ success: false, message: 'Valid 10 digit mobile number daalo' });
    }
    
    if (age < 18 || age > 65) {
      return res.status(400).json({ success: false, message: 'Age 18-65 ke beech honi chahiye' });
    }
    
    const { campId } = req.params;
    const query = { $or: [{ campId: campId }] };
    if (mongoose.Types.ObjectId.isValid(campId)) {
      query.$or.push({ _id: campId });
    }

    const camp = await Camp.findOne(query);
    
    if (!camp || camp.status !== 'upcoming') {
      return res.status(400).json({ success: false, message: 'Camp available nahi hai' });
    }
    
    // Check slots available
    const registeredCount = camp.registeredDonors?.length || 0;
    if (registeredCount >= (camp.totalSlots || 100)) {
      return res.status(400).json({ success: false, message: 'Camp ke saare slots bhar gaye hain' });
    }
    
    // Check duplicate registration
    const existing = await CampRegistration.findOne({
      campId: camp.campId || camp._id.toString(),
      mobile: mobile.replace(/\D/g, '')
    });
    
    if (existing) {
      return res.status(400).json({ success: false, message: 'Is number se already register ho chuke ho' });
    }
    
    // Generate registration ID
    const registrationId = 'REG' + Date.now().toString().slice(-7);
    
    // Save registration
    const registration = await CampRegistration.create({
      registrationId,
      campId: camp.campId || camp._id.toString(),
      camp: camp._id,
      name,
      mobile: mobile.replace(/\D/g, ''),
      bloodGroup,
      age,
      timeSlot,
      status: 'registered'
    });
    
    // Add to camp's registeredDonors
    camp.registeredDonors = camp.registeredDonors || [];
    camp.registeredDonors.push(registration._id);
    await camp.save();
    
    // Send WhatsApp confirmation using Baileys
    try {
      const formattedDate = new Date(camp.date).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      const venueStr = `${camp.venue}, ${camp.city}`;
      const msg = messages.donorRegistration(name, camp.title, formattedDate, venueStr, timeSlot);
      await sendMessage(registration.mobile, msg);
    } catch (waErr) {
      console.error('WhatsApp confirmation failed:', waErr.message);
      // Registration successful even if WA fails
    }
    
    res.json({
      success: true,
      message: 'Registration successful!',
      registration: {
        registrationId,
        name,
        campTitle: camp.title,
        date: new Date(camp.date).toLocaleDateString('en-IN', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }),
        venue: `${camp.venue}, ${camp.city}`,
        timeSlot
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API to fetch all upcoming public camps
router.get('/camps', async (req, res) => {
  try {
    const { state, city } = req.query;
    const now = new Date();
    // find camps that are either upcoming or active, where date is not past today's end
    now.setHours(0,0,0,0);
    
    const filter = {
      date: { $gte: now },
      status: { $nin: ['completed', 'cancelled'] }
    };

    if (state) {
      filter.state = new RegExp(`^${state.trim()}$`, "i");
    }
    if (city) {
      filter.city = new RegExp(`^${city.trim()}$`, "i");
    }

    const camps = await Camp.find(filter).sort({ date: 1 }).limit(10);
    
    res.json({ success: true, data: camps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API to fetch landing page stats (donors, lives saved, camps organized)
router.get('/stats', async (req, res) => {
  try {
    const countDonors = await User.countDocuments({ role: 'donor' });
    const completedCamps = await Camp.find({ status: 'completed' });
    
    let totalUnits = 0;
    completedCamps.forEach(camp => {
      totalUnits += camp.totalUnitsCollected || 0;
    });
    
    const countLives = totalUnits * 3;
    const countCamps = await Camp.countDocuments();
    const countBloodBanks = await BloodBank.countDocuments();
    
    res.json({
      success: true,
      stats: {
        donors: countDonors,
        livesSaved: countLives,
        unitsDonated: totalUnits,
        camps: countCamps,
        bloodBanks: countBloodBanks
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── Location-Based Fetching Helpers ─────────────────────── */

const getLocalizedSingle = async (Model, queryParams, defaultFallback = null) => {
  const { country, state, city } = queryParams;

  // 1. Exact city match
  if (country && state && city) {
    const match = await Model.findOne({
      country: new RegExp(`^${country.trim()}$`, 'i'),
      state: new RegExp(`^${state.trim()}$`, 'i'),
      city: new RegExp(`^${city.trim()}$`, 'i'),
      isActive: true
    }).sort({ priority: -1, updatedAt: -1 });
    if (match) return match;
  }

  // 2. State match
  if (country && state) {
    const match = await Model.findOne({
      country: new RegExp(`^${country.trim()}$`, 'i'),
      state: new RegExp(`^${state.trim()}$`, 'i'),
      isActive: true
    }).sort({ priority: -1, updatedAt: -1 });
    if (match) return match;
  }

  // 3. Country match
  if (country) {
    const match = await Model.findOne({
      country: new RegExp(`^${country.trim()}$`, 'i'),
      isActive: true
    }).sort({ priority: -1, updatedAt: -1 });
    if (match) return match;
  }

  // 4. Global match
  const globalMatch = await Model.findOne({
    isGlobal: true,
    isActive: true
  }).sort({ priority: -1, updatedAt: -1 });
  if (globalMatch) return globalMatch;

  // 5. Default/Fallback
  return defaultFallback;
};

const getLocalizedList = async (Model, queryParams, findOptions = {}) => {
  const { country, state, city } = queryParams;
  const activeField = findOptions.activeField || "isActive";
  const baseQuery = { [activeField]: true };

  // Conditions array for location matching
  const conditions = [
    { isGlobal: true }
  ];

  if (country) {
    // 1. Country level match (matches country, but state is blank/null/not set)
    conditions.push({
      country: new RegExp(`^${country.trim()}$`, 'i'),
      $or: [{ state: "" }, { state: null }, { state: { $exists: false } }]
    });

    if (state) {
      // 2. State level match (matches country and state, but city is blank/null/not set)
      conditions.push({
        country: new RegExp(`^${country.trim()}$`, 'i'),
        state: new RegExp(`^${state.trim()}$`, 'i'),
        $or: [{ city: "" }, { city: null }, { city: { $exists: false } }]
      });

      if (city) {
        // 3. City level match (matches country, state, and city exactly)
        conditions.push({
          country: new RegExp(`^${country.trim()}$`, 'i'),
          state: new RegExp(`^${state.trim()}$`, 'i'),
          city: new RegExp(`^${city.trim()}$`, 'i')
        });
      }
    }
  }

  // Find all items matching any of these targeting conditions
  const list = await Model.find({
    ...baseQuery,
    $or: conditions
  }).sort({ priority: -1, updatedAt: -1 });

  // If we found targeted or global items, return them
  if (list && list.length > 0) {
    return list;
  }

  // If a location filter was specified, do not fall back to all items (to avoid leaking other locations)
  const hasLocationFilter = !!(country && country.trim()) || !!(state && state.trim()) || !!(city && city.trim());
  if (hasLocationFilter) {
    return [];
  }

  // Fallback: If no targeted or global items exist at all, return all active items as a last resort
  return await Model.find({ ...baseQuery }).sort({ updatedAt: -1 });
};

/* ── Public Localized APIs ──────────────────────── */

// @route   GET /api/public/home-content
router.get('/home-content', async (req, res) => {
  try {
    const defaultHome = {
      country: "",
      state: "",
      city: "",
      isGlobal: true,
      isActive: true,
      priority: 0,
      heroHeadline: "Save Lives, Donate Blood",
      heroSubtitle: "Connecting blood donors with recipients in real-time.",
      heroButtonText: "Find Donors",
      heroSecondaryButtonText: "Become a Donor",
      homeBackgroundVideo: "",
      homeBackgroundImage: "",
      emergencyBannerText: "Emergency blood support is available 24/7.",
      localImpactText: "Together, we have saved thousands of lives.",
      localDonorCount: 1500,
      localBloodBankCount: 25,
      preferredLanguage: "English"
    };

    const content = await getLocalizedSingle(HomeContent, req.query, defaultHome);
    res.json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/public/blood-request-background
router.get('/blood-request-background', async (req, res) => {
  try {
    const content = await getLocalizedSingle(BloodRequestBackground, req.query, null);
    res.json({ success: true, background: content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/public/impact-gallery
router.get('/impact-gallery', async (req, res) => {
  try {
    const list = await getLocalizedList(ImpactGallery, req.query);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/public/success-stories
router.get('/success-stories', async (req, res) => {
  try {
    const list = await getLocalizedList(SuccessStory, req.query);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/public/news-awareness
router.get('/news-awareness', async (req, res) => {
  try {
    const list = await getLocalizedList(News, req.query, { activeField: "published" });
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
