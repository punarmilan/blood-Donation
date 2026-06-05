import express from 'express'
import mongoose from 'mongoose'
import Donor from '../models/Donor.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()
// Create donor
router.post('/', async (req, res) => {
  try {
    const {
      name,
      dob,
      age,
      weight,
      bloodGroup,
      email,
      phone,
      address,
      camp,
      remark
    } = req.body;

    // Basic validation
    if (!name || !dob || !weight || !bloodGroup || !phone || !camp) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!mongoose.Types.ObjectId.isValid(camp)) {
      return res.status(400).json({ message: 'Invalid Camp ID' });
    }

    // Optionally confirm camp exists (recommended)
    if (typeof Camp !== 'undefined') {
      const campExists = await Camp.findById(camp);
      if (!campExists) {
        return res.status(400).json({ message: 'Referenced camp not found' });
      }
    }

    // Normalize numeric fields
    const numericWeight = Number(weight);
    const numericAge = age ? Number(age) : null;

    const donorData = {
      name: name.trim(),
      dob: new Date(dob),
      age: numericAge,
      weight: numericWeight,
      bloodGroup,
      email: email ? email.trim() : '',
      phone: phone.trim(),
      address: address ? address.trim() : '',
      camp,
      remark: remark || ''
    };

    const newDonor = new Donor(donorData);
    const saved = await newDonor.save();

    // return created donor
    return res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating donor:', err);
    // Turn known validation errors into 400
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message, errors: err.errors });
    }
    return res.status(500).json({ message: 'Error creating donor', error: err.message });
  }
});
// Get all donors
router.get('/', verifyToken, async (req, res) => {
  try {
    const donors = await Donor.find().sort({ createdAt: -1 })
    res.json(donors)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching donors', error: err.message })
  }
})

// Get donors by camp
router.get('/camp/:campId', verifyToken, async (req, res) => {
  try {
    const { campId } = req.params
    if (!mongoose.Types.ObjectId.isValid(campId)) return res.status(400).json({ message: 'Invalid Camp ID' })

    const donors = await Donor.find({ camp: campId }).sort({ name: 1 })
    res.json(donors)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching donors', error: err.message })
  }
})

// Update donor
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid Donor ID' })

    const donor = await Donor.findByIdAndUpdate(id, req.body, { new: true })
    if (!donor) return res.status(404).json({ message: 'Donor not found' })

    res.json({ message: 'Donor updated successfully', donor })
  } catch (err) {
    res.status(500).json({ message: 'Error updating donor', error: err.message })
  }
})

// Delete donor
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid Donor ID' })

    const donor = await Donor.findByIdAndDelete(id)
    if (!donor) return res.status(404).json({ message: 'Donor not found' })

    res.json({ message: 'Donor deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Error deleting donor', error: err.message })
  }
})

// Get single donor
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid Donor ID' })

    const donor = await Donor.findById(id)
    if (!donor) return res.status(404).json({ message: 'Donor not found' })

    res.json(donor)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching donor', error: err.message })
  }
})

export default router
