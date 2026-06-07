import express from 'express';
import User from '../models/User.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get health details
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('health bloodGroup');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      data: {
        health: user.health || {},
        bloodGroup: user.bloodGroup
      }
    });
  } catch (error) {
    console.error('Error fetching health details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update health details
router.put('/', verifyToken, async (req, res) => {
  try {
    const {
      weight,
      height,
      age,
      gender,
      bloodGroup,
      emergencyContactName,
      emergencyContactNumber,
      hemoglobinLevel,
      sugarLevel
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validation
    if (!weight || weight < 30 || weight > 200) {
      return res.status(400).json({ success: false, message: 'Weight must be between 30 and 200 kg' });
    }
    if (!height || height < 100 || height > 250) {
      return res.status(400).json({ success: false, message: 'Height must be between 100 and 250 cm' });
    }
    if (!age || age < 18 || age > 65) {
      return res.status(400).json({ success: false, message: 'Age must be between 18 and 65' });
    }
    if (!gender || !['Male', 'Female', 'Other'].includes(gender)) {
      return res.status(400).json({ success: false, message: 'Invalid gender' });
    }
    if (!bloodGroup || !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(bloodGroup)) {
      return res.status(400).json({ success: false, message: 'Invalid blood group' });
    }
    if (!emergencyContactName || emergencyContactName.trim() === '') {
      return res.status(400).json({ success: false, message: 'Emergency contact name is required' });
    }
    
    // Indian mobile number validation (optional +91, followed by 10 digits starting with 6-9)
    const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
    if (!emergencyContactNumber || !phoneRegex.test(emergencyContactNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid Indian mobile number for emergency contact' });
    }

    if (!hemoglobinLevel || hemoglobinLevel < 5 || hemoglobinLevel > 20) {
      return res.status(400).json({ success: false, message: 'Hemoglobin level must be between 5 and 20 g/dL' });
    }

    if (sugarLevel !== undefined && sugarLevel !== null && sugarLevel !== '') {
      const numSugar = Number(sugarLevel);
      if (numSugar < 40 || numSugar > 400) {
        return res.status(400).json({ success: false, message: 'Sugar level must be between 40 and 400 mg/dL' });
      }
    }

    // Calculate BMI
    const heightInMeters = height / 100;
    const calculatedBmi = weight / (heightInMeters * heightInMeters);
    const roundedBmi = parseFloat(calculatedBmi.toFixed(1));

    // Update user root fields
    user.bloodGroup = bloodGroup;

    // Update user health fields
    user.health = {
      weight: Number(weight),
      height: Number(height),
      age: Number(age),
      gender,
      bmi: roundedBmi,
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactNumber,
      hemoglobinLevel: Number(hemoglobinLevel),
      sugarLevel: sugarLevel ? Number(sugarLevel) : undefined,
      updatedAt: new Date()
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Health details updated successfully',
      data: {
        health: user.health,
        bloodGroup: user.bloodGroup
      }
    });

  } catch (error) {
    console.error('Error updating health details:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    // Duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate data found (maybe email or mobile is already in use by another account).' });
    }
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

export default router;
