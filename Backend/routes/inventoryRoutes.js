import express from 'express';
import mongoose from 'mongoose';
import BloodUnit from '../models/BloodUnit.js';
import { verifyToken } from './authRoutes.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/summary', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const now = new Date();
    const threeDays = new Date();
    threeDays.setDate(now.getDate() + 3);
    
    let matchQuery = {
      testStatus: 'Passed',
      currentStatus: 'Available',
      expiryDate: { $gt: now }
    };
    
    if (req.user.role === 'blood_bank' || req.user.role === 'bloodbank') {
      matchQuery.bloodBankId = new mongoose.Types.ObjectId(req.user.id);
    }

    const matrix = await BloodUnit.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: { bloodGroup: '$bloodGroup', component: '$component' },
        count: { $sum: 1 }
      }}
    ]);
    
    const totalAvailable = await BloodUnit.countDocuments(matchQuery);
    const expiringSoon = await BloodUnit.countDocuments({
      ...matchQuery,
      expiryDate: { $lte: threeDays, $gt: now }
    });
    
    let expiredQuery = {
      currentStatus: { $in: ['Available', 'Reserved'] },
      expiryDate: { $lt: now }
    };
    if (req.user.role === 'blood_bank' || req.user.role === 'bloodbank') {
      expiredQuery.bloodBankId = req.user.id;
    }
    const expired = await BloodUnit.countDocuments(expiredQuery);
    
    const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
    const components = ['Whole Blood','RBC','Platelets','Plasma'];
    
    const inventoryMatrix = {};
    bloodGroups.forEach(bg => {
      inventoryMatrix[bg] = {};
      components.forEach(comp => {
        inventoryMatrix[bg][comp] = 0;
      });
    });
    
    matrix.forEach(({ _id, count }) => {
      if (inventoryMatrix[_id.bloodGroup]) {
        inventoryMatrix[_id.bloodGroup][_id.component] = count;
      }
    });
    
    res.json({
      success: true,
      totalAvailable,
      expiringSoon,
      expired,
      matrix: inventoryMatrix
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/available-units', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const { bloodGroup, component } = req.query;
    const now = new Date();
    
    let query = {
      testStatus: 'Passed',
      currentStatus: 'Available',
      expiryDate: { $gt: now }
    };
    
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (component) query.component = component;
    if (req.user.role === 'blood_bank' || req.user.role === 'bloodbank') {
      query.bloodBankId = req.user.id;
    }
    
    const units = await BloodUnit.find(query)
      .select('unitId bloodGroup component expiryDate volumeML storageLocation bagNumber')
      .sort({ expiryDate: 1 });
    
    res.json({ success: true, units, count: units.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
