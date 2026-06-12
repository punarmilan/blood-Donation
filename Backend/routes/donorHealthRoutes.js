import express from 'express';
import multer from 'multer';
import path from 'path';
import User from '../models/User.js';
import { verifyToken } from './authRoutes.js';
import cloudinary from '../config/cloudinary.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { calculateDonationEligibility } from '../utils/badgeCalculator.js';

const router = express.Router();

// Cloudinary Storage Configuration for Health Reports
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blood_donation/health_reports',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf']
  }
});

// Multer File Filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG and PNG files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadReport = upload.single('healthReportFile');

// Get health details
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('health bloodGroup healthReport gender lastDonationDate nextEligibleDonationDate donationEligibilityStatus donationGapDays daysRemaining');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      data: {
        health: user.health || {},
        bloodGroup: user.bloodGroup,
        healthReport: user.healthReport || null,
        gender: user.gender,
        lastDonationDate: user.lastDonationDate,
        nextEligibleDonationDate: user.nextEligibleDonationDate,
        donationEligibilityStatus: user.donationEligibilityStatus,
        donationGapDays: user.donationGapDays,
        daysRemaining: user.daysRemaining
      }
    });
  } catch (error) {
    console.error('Error fetching health details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update health details
router.put('/', verifyToken, (req, res, next) => {
  uploadReport(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File size must be less than 5MB' });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
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
      sugarLevel,
      reportType,
      reportDate,
      lastDonationDate
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validation
    if (!weight || Number(weight) < 30 || Number(weight) > 200) {
      return res.status(400).json({ success: false, message: 'Weight must be between 30 and 200 kg' });
    }
    if (!height || Number(height) < 100 || Number(height) > 250) {
      return res.status(400).json({ success: false, message: 'Height must be between 100 and 250 cm' });
    }
    if (!age || Number(age) < 18 || Number(age) > 65) {
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

    if (!hemoglobinLevel || Number(hemoglobinLevel) < 5 || Number(hemoglobinLevel) > 20) {
      return res.status(400).json({ success: false, message: 'Hemoglobin level must be between 5 and 20 g/dL' });
    }

    if (sugarLevel !== undefined && sugarLevel !== null && sugarLevel !== '') {
      const numSugar = Number(sugarLevel);
      if (numSugar < 40 || numSugar > 400) {
        return res.status(400).json({ success: false, message: 'Sugar level must be between 40 and 400 mg/dL' });
      }
    }

    // Report validations
    const hasExistingReport = user.healthReport && user.healthReport.fileUrl;
    if (reportType && !req.file && !hasExistingReport) {
      return res.status(400).json({ success: false, message: 'Report file is required if report type is selected' });
    }
    if (req.file && (!reportType || reportType.trim() === '')) {
      return res.status(400).json({ success: false, message: 'Report type is required if file is uploaded' });
    }
    if (reportDate) {
      const parsedDate = new Date(reportDate);
      if (parsedDate > new Date()) {
        return res.status(400).json({ success: false, message: 'Report Date cannot be in the future' });
      }
    }
    if (lastDonationDate) {
      const parsedLastDate = new Date(lastDonationDate);
      if (parsedLastDate > new Date()) {
        return res.status(400).json({ success: false, message: 'Last donation date cannot be in the future' });
      }
    }

    // Calculate BMI
    const heightInMeters = Number(height) / 100;
    const calculatedBmi = Number(weight) / (heightInMeters * heightInMeters);
    const roundedBmi = parseFloat(calculatedBmi.toFixed(1));

    // Update user root fields
    user.bloodGroup = bloodGroup;

    // Calculate eligibility
    const eligibility = calculateDonationEligibility(gender, lastDonationDate);
    user.gender = gender;
    user.lastDonationDate = lastDonationDate ? new Date(lastDonationDate) : undefined;
    user.nextEligibleDonationDate = eligibility.nextEligibleDate ? new Date(eligibility.nextEligibleDate) : undefined;
    user.nextEligibleDate = eligibility.nextEligibleDate ? new Date(eligibility.nextEligibleDate) : undefined;
    user.donationEligibilityStatus = eligibility.status;
    user.donationGapDays = eligibility.gapDays;
    user.daysRemaining = eligibility.daysRemaining;

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

    // Update health report fields
    if (req.file) {
      user.healthReport = {
        fileUrl: req.file.path,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        reportType: reportType,
        reportDate: reportDate ? new Date(reportDate) : new Date(),
        uploadedAt: new Date()
      };
    } else if (reportType !== undefined) {
      // Update text fields only if no new file is uploaded
      user.healthReport = {
        fileUrl: user.healthReport?.fileUrl,
        fileName: user.healthReport?.fileName,
        fileType: user.healthReport?.fileType,
        fileSize: user.healthReport?.fileSize,
        reportType: reportType || user.healthReport?.reportType,
        reportDate: reportDate ? new Date(reportDate) : user.healthReport?.reportDate,
        uploadedAt: user.healthReport?.uploadedAt || new Date()
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Health details and report saved successfully',
      data: {
        health: user.health,
        bloodGroup: user.bloodGroup,
        healthReport: user.healthReport,
        gender: user.gender,
        lastDonationDate: user.lastDonationDate,
        nextEligibleDonationDate: user.nextEligibleDonationDate,
        donationEligibilityStatus: user.donationEligibilityStatus,
        donationGapDays: user.donationGapDays,
        daysRemaining: user.daysRemaining
      }
    });

  } catch (error) {
    console.error('Error updating health details:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate data found.' });
    }
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

export default router;
