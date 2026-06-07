import express from 'express';
import mongoose from 'mongoose';
import Camp from '../models/Camp.js';
import CampRegistration from '../models/CampRegistration.js';
import { sendMessage } from '../whatsapp/waClient.js';
import messages from '../whatsapp/waMessages.js';

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
    const now = new Date();
    // find camps that are either upcoming or active, where date is not past today's end
    now.setHours(0,0,0,0);
    const camps = await Camp.find({
      date: { $gte: now },
      status: { $nin: ['completed', 'cancelled'] }
    }).sort({ date: 1 }).limit(10);
    
    res.json({ success: true, data: camps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
