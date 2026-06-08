import express from 'express';
import mongoose from 'mongoose';
import { sendMessage, getOrganizerConnectionStatus } from '../whatsapp/waClient.js';
import messages from '../whatsapp/waMessages.js';
import { verifyOrganizerToken } from '../middleware/authMiddleware.js';
import Camp from '../models/Camp.js';

const router = express.Router();

// Check WhatsApp connection status
router.get('/status', verifyOrganizerToken, (req, res) => {
  res.json({ connected: getOrganizerConnectionStatus(req.organizer._id.toString()) });
});

// Share camp on WhatsApp — organizer button click
router.post('/share-camp', verifyOrganizerToken, async (req, res) => {
  try {
    const { campId, phone } = req.body;
    const organizerId = req.organizer._id.toString();

    const query = { $or: [{ campId: campId }] };
    if (mongoose.Types.ObjectId.isValid(campId)) {
      query.$or.push({ _id: campId });
    }
    const camp = await Camp.findOne(query);
    if (!camp) return res.status(404).json({ success: false, message: 'Camp not found' });

    const msg = messages.campShare(
      camp.title || camp.name,
      new Date(camp.date).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }),
      `${camp.venue || camp.location}, ${camp.city || ''}`,
      camp.campId || camp._id
    );

    const sent = await sendMessage(organizerId, phone, msg);
    res.json({ success: sent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Share overall report — organizer button click  
router.post('/share-report', verifyOrganizerToken, async (req, res) => {
  try {
    const { phone, totalCamps, totalDonors, totalUnits, totalLives } = req.body;
    const organizerId = req.organizer._id.toString();

    const msg = 
`\uD83E\uDE78 *Mera Blood Donation Impact Report*

*Saare camps ka summary:*
\uD83C\uDFD5\uFE0F Total camps: ${totalCamps}
\uD83D\uDC65 Total donors: ${totalDonors}
\uD83D\uDC89 Units collected: ${totalUnits}
\u2764\uFE0F Lives saved: ${totalLives}

Meri zariye itne logon ki zindagi bachi!

*#BloodDonation #Raktdaan #SaveLives*`;

    const sent = await sendMessage(organizerId, phone, msg);
    res.json({ success: sent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generic message send — QR poster share, etc.
router.post('/send-message', verifyOrganizerToken, async (req, res) => {
  try {
    const { phone, message } = req.body;
    const organizerId = req.organizer._id.toString();

    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone aur message required hain' });
    }
    const sent = await sendMessage(organizerId, phone, message);
    res.json({ success: sent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
