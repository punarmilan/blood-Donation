import express from 'express';
import mongoose from 'mongoose';
import BloodUnit from '../models/BloodUnit.js';
import { generateUnitId } from '../utils/generateUnitId.js';
import { isValidTransition } from '../utils/statusTransitions.js';
import { verifyToken } from './authRoutes.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { expiryDays } from '../config/expiryConfig.js';

const router = express.Router();

const isTerminalStatus = (status) => {
  return ['Used', 'Transfused', 'Discarded'].includes(status);
};

// API 1: Create Blood Unit
router.post('/create', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const {
      donorName, donorMobile, donorBloodGroup,
      bloodGroup, component, volumeML, bagNumber,
      collectionDate, storageLocation, fridgeNumber,
      shelfNumber, donorId
    } = req.body;

    const unitId = await generateUnitId(bloodGroup, component);
    const days = expiryDays[component] || 35;
    const expiry = new Date(collectionDate || Date.now());
    expiry.setDate(expiry.getDate() + days);

    const unit = await BloodUnit.create({
      unitId,
      bloodBankId: req.user.id,
      donorId: donorId || null,
      donorName,
      donorMobile,
      donorBloodGroup,
      bloodGroup,
      component,
      volumeML,
      bagNumber,
      collectionDate: collectionDate || new Date(),
      expiryDate: expiry,
      storageLocation,
      fridgeNumber,
      shelfNumber,
      currentStatus: 'Collected',
      testStatus: 'Pending',
      qrCode: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/blood-units/${unitId}`,
      history: [{
        status: 'Collected',
        action: 'Blood Unit Created',
        note: `Unit ${unitId} collected`,
        updatedBy: req.user.id,
        updatedByRole: req.user.role,
        updatedAt: new Date()
      }]
    });

    res.status(201).json({ success: true, unit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 2: Get All Blood Units
router.get('/', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const { 
      bloodGroup, component, testStatus, 
      currentStatus, expiryStatus, search,
      page = 1, limit = 20
    } = req.query;

    let query = {};
    
    if (req.user.role === 'blood_bank' || req.user.role === 'bloodbank') {
      query.bloodBankId = req.user.id;
    }
    
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (component) query.component = component;
    if (testStatus) query.testStatus = testStatus;
    if (currentStatus) query.currentStatus = currentStatus;
    
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 3);
    
    if (expiryStatus === 'expiring_soon') {
      query.expiryDate = { $lte: threeDaysLater, $gt: now };
      query.currentStatus = 'Available';
    }
    if (expiryStatus === 'expired') {
      query.expiryDate = { $lt: now };
    }
    
    if (search) {
      query.$or = [
        { unitId: { $regex: search, $options: 'i' } },
        { donorName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const total = await BloodUnit.countDocuments(query);
    const units = await BloodUnit.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    res.json({ 
      success: true, 
      units,
      pagination: { total, page: Number(page), limit: Number(limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 14: QR Unit Details (Public Safe - NO AUTH)
router.get('/qr/:unitId', async (req, res) => {
  try {
    const unit = await BloodUnit.findOne({ unitId: req.params.unitId });
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found' });
    
    res.json({
      success: true,
      unit: {
        unitId: unit.unitId,
        bloodGroup: unit.bloodGroup,
        component: unit.component,
        currentStatus: unit.currentStatus,
        testStatus: unit.testStatus,
        expiryDate: unit.expiryDate,
        collectionDate: unit.collectionDate
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 15: Reports
router.get('/reports', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    let matchQuery = {};
    if (req.user.role === 'blood_bank' || req.user.role === 'bloodbank') {
      matchQuery.bloodBankId = new mongoose.Types.ObjectId(req.user.id);
    }

    const counts = await BloodUnit.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: '$currentStatus',
        count: { $sum: 1 }
      }}
    ]);

    const stats = {
      totalCollected: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalAvailable: 0,
      totalReserved: 0,
      totalIssued: 0,
      totalUsed: 0,
      totalExpired: 0,
      totalDiscarded: 0
    };

    counts.forEach(({ _id, count }) => {
      if (_id === 'Collected') stats.totalCollected = count;
      if (_id === 'Available') stats.totalAvailable = count;
      if (_id === 'Reserved') stats.totalReserved = count;
      if (_id === 'Issued') stats.totalIssued = count;
      if (_id === 'Used' || _id === 'Transfused') stats.totalUsed += count;
      if (_id === 'Expired') stats.totalExpired = count;
      if (_id === 'Discarded') stats.totalDiscarded = count;
    });

    stats.totalPassed = await BloodUnit.countDocuments({ ...matchQuery, testStatus: 'Passed' });
    stats.totalFailed = await BloodUnit.countDocuments({ ...matchQuery, testStatus: 'Failed' });

    const bgDistribution = await BloodUnit.aggregate([
      { $match: { ...matchQuery, currentStatus: 'Available' } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } }
    ]);
    const bloodGroupWise = {};
    ['A+','A-','B+','B-','AB+','AB-','O+','O-'].forEach(bg => { bloodGroupWise[bg] = 0; });
    bgDistribution.forEach(({ _id, count }) => { if (bloodGroupWise[_id] !== undefined) bloodGroupWise[_id] = count; });

    const compDistribution = await BloodUnit.aggregate([
      { $match: { ...matchQuery, currentStatus: 'Available' } },
      { $group: { _id: '$component', count: { $sum: 1 } } }
    ]);
    const componentWise = {};
    ['Whole Blood','RBC','Platelets','Plasma'].forEach(c => { componentWise[c] = 0; });
    compDistribution.forEach(({ _id, count }) => { if (componentWise[_id] !== undefined) componentWise[_id] = count; });

    res.json({
      success: true,
      stats,
      bloodGroupWise,
      componentWise
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 3: Get Single Blood Unit
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const isMongoId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: req.params.id } : { unitId: req.params.id };
    const unit = await BloodUnit.findOne(query);
    
    if (!unit) return res.status(404).json({ 
      success: false, message: 'Unit not found' 
    });

    let responseData = unit.toObject();
    
    if (req.user.role === 'donor') {
      responseData = {
        unitId: unit.unitId,
        bloodGroup: unit.bloodGroup,
        component: unit.component,
        collectionDate: unit.collectionDate,
        currentStatus: unit.currentStatus,
        testStatus: unit.testStatus
      };
    } else if (req.user.role === 'recipient') {
      responseData = {
        unitId: unit.unitId,
        bloodGroup: unit.bloodGroup,
        component: unit.component,
        currentStatus: unit.currentStatus,
        issuedToHospital: unit.issuedToHospital
      };
    }

    res.json({ success: true, unit: responseData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 4: Start Testing
router.put('/:id/testing/start', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const unit = await BloodUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found' });
    
    if (!isValidTransition(unit.currentStatus, 'Testing Pending')) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid transition from ${unit.currentStatus} to Testing Pending` 
      });
    }
    
    unit.currentStatus = 'Testing Pending';
    unit.testingStartedAt = new Date();
    unit.history.push({
      status: 'Testing Pending',
      action: 'Testing Started',
      note: 'Lab screening initialized',
      updatedBy: req.user.id,
      updatedByRole: req.user.role,
      updatedAt: new Date()
    });
    
    await unit.save();
    res.json({ success: true, unit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 5: Update Testing
router.put('/:id/testing/update', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const unit = await BloodUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found' });
    
    if (unit.currentStatus !== 'Testing Pending') {
      return res.status(400).json({ 
        success: false,
        message: 'Unit must be in Testing Pending status to update test details' 
      });
    }
    
    const testFields = [
      'hivTest','hepatitisBTest','hepatitisCTest',
      'syphilisTest','malariaTest','aboRhVerification',
      'hemoglobinChecked','testRemarks','testedBy',
      'labReportFileUrl'
    ];
    
    testFields.forEach(field => {
      if (req.body[field] !== undefined) {
        unit[field] = req.body[field];
      }
    });
    
    unit.history.push({
      status: unit.currentStatus,
      action: 'Testing Updated',
      note: `Tests updated by ${req.body.testedBy || req.user.id}`,
      updatedBy: req.user.id,
      updatedByRole: req.user.role,
      updatedAt: new Date()
    });
    
    await unit.save();
    res.json({ success: true, unit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 6: Finalize Testing
router.put('/:id/testing/finalize', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const unit = await BloodUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found' });
    
    if (unit.currentStatus !== 'Testing Pending') {
      return res.status(400).json({ 
        success: false,
        message: 'Unit must be in Testing Pending status to finalize' 
      });
    }

    const diseaseTests = [
      unit.hivTest, unit.hepatitisBTest, unit.hepatitisCTest,
      unit.syphilisTest, unit.malariaTest
    ];
    
    const allNegative = diseaseTests.every(t => t === 'Negative');
    const aboVerified = unit.aboRhVerification === 'Verified';
    const noPending = diseaseTests.every(t => t !== 'Pending');
    
    if (!noPending || unit.aboRhVerification === 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'All screening tests must be completed (no Pending) before final validation'
      });
    }
    
    unit.testedAt = new Date();
    
    if (allNegative && aboVerified) {
      unit.testStatus = 'Passed';
      unit.currentStatus = 'Available';
      unit.history.push({
        status: 'Available',
        action: 'Testing Passed — Available',
        note: 'All tests negative, ABO/Rh verified',
        updatedBy: req.user.id,
        updatedByRole: req.user.role,
        updatedAt: new Date()
      });
    } else {
      unit.testStatus = 'Failed';
      unit.currentStatus = 'Discarded';
      
      const failReasons = [];
      if (!allNegative) {
        const positives = ['hivTest','hepatitisBTest','hepatitisCTest',
          'syphilisTest','malariaTest']
          .filter(t => unit[t] === 'Positive');
        failReasons.push(`Positive: ${positives.join(', ')}`);
      }
      if (!aboVerified) failReasons.push('ABO/Rh Mismatch');
      
      unit.history.push({
        status: 'Discarded',
        action: 'Testing Failed — Discarded',
        note: failReasons.join('; '),
        updatedBy: req.user.id,
        updatedByRole: req.user.role,
        updatedAt: new Date()
      });
    }
    
    await unit.save();
    res.json({ 
      success: true, 
      unit,
      result: unit.testStatus 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 9: Reserve Unit
router.put('/:id/reserve', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const unit = await BloodUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found' });
    
    if (unit.testStatus !== 'Passed' || unit.currentStatus !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Only Passed + Available units can be reserved'
      });
    }
    
    if (unit.expiryDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reserve expired unit'
      });
    }
    
    const { requestId, reservedBy, reservationExpiresAt } = req.body;
    
    unit.currentStatus = 'Reserved';
    unit.reservedForRequestId = requestId;
    unit.reservedAt = new Date();
    unit.reservedBy = reservedBy || req.user.id;
    unit.reservationExpiresAt = reservationExpiresAt || null;
    
    unit.history.push({
      status: 'Reserved',
      action: 'Unit Reserved',
      note: `Reserved for request ID/Ref ${requestId}`,
      updatedBy: req.user.id,
      updatedByRole: req.user.role,
      updatedAt: new Date()
    });
    
    await unit.save();
    res.json({ success: true, unit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 10: Issue Blood
router.put('/:id/issue', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const unit = await BloodUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found' });
    
    if (unit.currentStatus !== 'Reserved') {
      return res.status(400).json({
        success: false,
        message: 'Only Reserved units can be issued'
      });
    }
    
    const {
      issuedToHospital, hospitalAddress, receiverName,
      receiverMobile, transportMode, issuedBy, issueRemarks
    } = req.body;
    
    unit.currentStatus = 'Issued';
    unit.issuedToHospital = issuedToHospital;
    unit.hospitalAddress = hospitalAddress;
    unit.receiverName = receiverName;
    unit.receiverMobile = receiverMobile;
    unit.transportMode = transportMode;
    unit.issuedBy = issuedBy || req.user.id;
    unit.issueRemarks = issueRemarks;
    unit.issuedAt = new Date();
    
    unit.history.push({
      status: 'Issued',
      action: 'Blood Issued to Hospital',
      note: `Issued to ${issuedToHospital} via ${transportMode}`,
      updatedBy: req.user.id,
      updatedByRole: req.user.role,
      updatedAt: new Date()
    });
    
    await unit.save();
    res.json({ success: true, unit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 11: Mark Used/Transfused
router.put('/:id/used', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const unit = await BloodUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found' });
    
    if (unit.currentStatus !== 'Issued') {
      return res.status(400).json({
        success: false,
        message: 'Only Issued units can be marked as Used/Transfused'
      });
    }
    
    const { transfusionConfirmedBy, finalStatusRemarks, status } = req.body;
    const finalStatus = status === 'Transfused' ? 'Transfused' : 'Used';
    
    unit.currentStatus = finalStatus;
    unit.usedAt = new Date();
    unit.usedBy = req.user.id;
    unit.transfusionConfirmedBy = transfusionConfirmedBy;
    unit.finalStatusRemarks = finalStatusRemarks;
    
    unit.history.push({
      status: finalStatus,
      action: `Blood ${finalStatus}`,
      note: `Confirmed by ${transfusionConfirmedBy}`,
      updatedBy: req.user.id,
      updatedByRole: req.user.role,
      updatedAt: new Date()
    });
    
    await unit.save();
    res.json({ success: true, unit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 12: Mark Expired
router.put('/:id/expired', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const unit = await BloodUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found' });
    
    if (isTerminalStatus(unit.currentStatus)) {
      return res.status(400).json({ success: false, message: 'Unit already in terminal status' });
    }

    unit.currentStatus = 'Expired';
    unit.history.push({
      status: 'Expired',
      action: 'Unit Marked Expired',
      note: `Expired on ${unit.expiryDate}`,
      updatedBy: req.user.id,
      updatedByRole: req.user.role,
      updatedAt: new Date()
    });
    
    await unit.save();
    res.json({ success: true, unit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 13: Discard Unit
router.put('/:id/discard', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const unit = await BloodUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found' });
    
    if (isTerminalStatus(unit.currentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Unit already in terminal status'
      });
    }
    
    unit.currentStatus = 'Discarded';
    unit.finalStatusRemarks = req.body.reason;
    unit.history.push({
      status: 'Discarded',
      action: 'Unit Discarded',
      note: req.body.reason || 'Manually discarded',
      updatedBy: req.user.id,
      updatedByRole: req.user.role,
      updatedAt: new Date()
    });
    
    await unit.save();
    res.json({ success: true, unit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
