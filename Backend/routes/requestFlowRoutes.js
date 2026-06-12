import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import BloodRequest from '../models/BloodRequest.js';
import BloodUnit from '../models/BloodUnit.js';
import Payment from '../models/Payment.js';
import pricingConfig from '../config/pricingConfig.js';
import razorpay from '../config/razorpay.js';
import { verifyToken } from './authRoutes.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { sendMessage } from '../whatsapp/waClient.js';

const router = express.Router();

// Helper to generate OTP & send WhatsApp to recipient
async function generateAndSendOtp(request, recipientMobile) {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  request.handoverOtp = await bcrypt.hash(otp, 10);
  request.otp = otp; // Save plain text OTP for UI display
  request.otpGeneratedAt = new Date();
  request.otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  request.otpAttempts = 0;
  await request.save();

  const waMessage = `🔐 *Pickup OTP: ${otp}*\nYeh OTP blood bank operator ko batayein jab blood lene jaayein. Valid 24 hours. Kisi aur se share NA karein.\n_Raktdaan_`;
  await sendMessage(recipientMobile, waMessage);
  return otp;
}

// Fetch request helper
async function getRequestByParamId(paramId) {
  const query = {};
  if (mongoose.Types.ObjectId.isValid(paramId)) {
    query._id = paramId;
  } else {
    query.requestId = paramId;
  }
  return await BloodRequest.findOne(query).populate('recipient', 'name mobile');
}

/* ======================================================
   STEP 2: ACCEPT REQUEST
====================================================== */
router.put('/:requestId/accept', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const request = await getRequestByParamId(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // Status jump check
    if (request.status !== 'pending' && request.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Only pending or active requests can be accepted.' });
    }

    request.status = 'accepted';
    request.acceptedByBloodBankId = req.user.id;
    request.acceptedAt = new Date();
    request.statusHistory.push({
      status: 'accepted',
      action: 'Request Accepted',
      note: 'Blood bank accepted the request',
      updatedBy: req.user.id,
      updatedByRole: req.user.role
    });

    await request.save();

    // Send WhatsApp notification
    const recipientMobile = request.requesterMobile || (request.recipient && request.recipient.mobile) || '';
    if (recipientMobile) {
      const waMessage = `✅ *Request Accepted!*\nAapki blood request ${request.requestId} accept ho gayi hai.\nBlood bank jald units reserve karega.\n_Raktdaan_`;
      await sendMessage(recipientMobile, waMessage);
    }

    res.json({ success: true, message: 'Request accepted successfully', data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ======================================================
   STEP 3: RESERVE UNITS
====================================================== */
router.put('/:requestId/reserve', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const { unitIds } = req.body;
    const request = await getRequestByParamId(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Request must be accepted before reserving units' });
    }

    if (!unitIds || unitIds.length !== request.units) {
      return res.status(400).json({ success: false, message: `Must select exactly ${request.units} units` });
    }

    // Verification gate for units
    for (const unitId of unitIds) {
      const unit = await BloodUnit.findById(unitId);
      if (!unit) return res.status(404).json({ success: false, message: `Unit ${unitId} not found` });
      if (unit.testStatus !== 'Passed' || unit.currentStatus !== 'Available') {
        return res.status(400).json({ success: false, message: `Unit ${unit.unitId} is not Passed and Available` });
      }
      if (unit.expiryDate < new Date()) {
        return res.status(400).json({ success: false, message: `Unit ${unit.unitId} has expired` });
      }
    }

    // Commit Reservation
    for (const unitId of unitIds) {
      const unit = await BloodUnit.findById(unitId);
      unit.currentStatus = 'Reserved';
      unit.reservedForRequestId = request.requestId;
      unit.reservedAt = new Date();
      unit.reservedBy = req.user.id;
      unit.history.push({
        status: 'Reserved',
        action: 'Unit Reserved',
        note: `Reserved for request ID ${request.requestId}`,
        updatedBy: req.user.id,
        updatedByRole: req.user.role
      });
      await unit.save();
    }

    request.status = 'reserved';
    request.reservedUnitIds = unitIds;
    request.reservedAt = new Date();
    request.statusHistory.push({
      status: 'reserved',
      action: 'Units Reserved',
      note: `${unitIds.length} units reserved`,
      updatedBy: req.user.id,
      updatedByRole: req.user.role
    });

    await request.save();

    const recipientMobile = request.requesterMobile || (request.recipient && request.recipient.mobile) || '';
    if (recipientMobile) {
      const waMessage = `🩸 *Units Reserved!*\n${request.units} unit(s) aapke liye reserve ho gayi hain.\nProcessing fee pay karke pickup ki taiyari karein.\n_Raktdaan_`;
      await sendMessage(recipientMobile, waMessage);
    }

    res.json({ success: true, message: 'Units reserved successfully', data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ======================================================
   STEP 4: MARK CROSS-MATCH DONE
====================================================== */
router.put('/:requestId/cross-match', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const { crossMatchBy, crossMatchRemarks } = req.body;
    const request = await getRequestByParamId(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.status !== 'reserved') {
      return res.status(400).json({ success: false, message: 'Request must be reserved to perform cross-match' });
    }

    request.crossMatchDone = true;
    request.crossMatchBy = crossMatchBy || req.user.id;
    request.crossMatchRemarks = crossMatchRemarks || '';
    request.crossMatchAt = new Date();

    request.statusHistory.push({
      status: request.status,
      action: 'Cross-match Completed',
      note: `Cross-match performed by ${crossMatchBy}`,
      updatedBy: req.user.id,
      updatedByRole: req.user.role
    });

    // Check Auto-transition to ready_for_pickup
    if (request.crossMatchDone && request.documentsVerified && request.paymentStatus === 'paid') {
      request.status = 'ready_for_pickup';
      request.statusHistory.push({
        status: 'ready_for_pickup',
        action: 'Status Transition',
        note: 'Gates complete, ready for pickup. OTP generated.',
        updatedBy: req.user.id,
        updatedByRole: req.user.role
      });
      const recipientMobile = request.requesterMobile || (request.recipient && request.recipient.mobile) || '';
      await generateAndSendOtp(request, recipientMobile);
    } else {
      await request.save();
    }

    res.json({ success: true, message: 'Cross-match marked done', data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ======================================================
   STEP 5: VERIFY DOCUMENTS
====================================================== */
router.put('/:requestId/verify-documents', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const { requisitionSlipVerified, patientIdVerified, receiverIdVerified } = req.body;
    const request = await getRequestByParamId(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // Check status limits
    const allowed = ['reserved', 'ready_for_pickup', 'accepted'];
    if (!allowed.includes(request.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status for verifying documents' });
    }

    request.requisitionSlipVerified = !!requisitionSlipVerified;
    request.patientIdVerified = !!patientIdVerified;
    request.receiverIdVerified = !!receiverIdVerified;

    if (requisitionSlipVerified && patientIdVerified && receiverIdVerified) {
      request.documentsVerified = true;
      request.documentsVerifiedBy = req.user.id;
      request.documentsVerifiedAt = new Date();
    } else {
      request.documentsVerified = false;
    }

    request.statusHistory.push({
      status: request.status,
      action: 'Documents Checked',
      note: `Verified: slips=${!!requisitionSlipVerified}, patientId=${!!patientIdVerified}, receiverId=${!!receiverIdVerified}`,
      updatedBy: req.user.id,
      updatedByRole: req.user.role
    });

    // Check Auto-transition to ready_for_pickup
    if (request.crossMatchDone && request.documentsVerified && request.paymentStatus === 'paid') {
      request.status = 'ready_for_pickup';
      request.statusHistory.push({
        status: 'ready_for_pickup',
        action: 'Status Transition',
        note: 'Gates complete, ready for pickup. OTP generated.',
        updatedBy: req.user.id,
        updatedByRole: req.user.role
      });
      const recipientMobile = request.requesterMobile || (request.recipient && request.recipient.mobile) || '';
      await generateAndSendOtp(request, recipientMobile);
    } else {
      await request.save();
    }

    res.json({ success: true, message: 'Documents checklist updated', data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ======================================================
   STEP 6A: CREATE PAYMENT ORDER
====================================================== */
router.post('/:requestId/create-payment', verifyToken, async (req, res) => {
  try {
    const request = await getRequestByParamId(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Payment is already completed' });
    }

    // Component mapping
    const componentKey = request.component === 'Whole Blood' || request.component === 'RBC' || request.component === 'Platelets' || request.component === 'Plasma' ? request.component : 'Whole Blood';
    const rate = pricingConfig.bloodProcessingFee[componentKey] || 1100;
    const amount = rate * request.units;

    const receiptId = 'PAY' + Date.now();
    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: receiptId,
      notes: { requestId: request.requestId }
    });

    // Save Payment record
    const payment = await Payment.create({
      paymentId: receiptId,
      razorpayOrderId: order.id,
      purpose: 'blood_request_fee',
      requestId: request._id,
      payerId: req.user.id,
      payerName: request.patientName,
      payerMobile: request.requesterMobile || (request.recipient && request.recipient.mobile) || '',
      amount,
      amountPaise: amount * 100,
      currency: 'INR',
      status: 'created'
    });

    res.json({
      success: true,
      orderId: order.id,
      amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_SNw35MkokY8h1y',
      payerName: request.patientName,
      payerMobile: request.requesterMobile || (request.recipient && request.recipient.mobile) || ''
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ======================================================
   STEP 6B: VERIFY PAYMENT
====================================================== */
router.post('/:requestId/verify-payment', verifyToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const request = await getRequestByParamId(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '5swKLrcRVYl1bc512r868sqP')
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    if (expectedSignature !== razorpay_signature) {
      payment.status = 'failed';
      payment.failureReason = 'Signature verification failed';
      await payment.save();
      return res.status(400).json({ success: false, message: 'Signature verification failed' });
    }

    // Success
    payment.status = 'paid';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paidAt = new Date();
    await payment.save();

    request.paymentStatus = 'paid';
    request.paymentAmount = payment.amount;
    request.paidAt = new Date();
    request.paymentId = payment._id;

    request.statusHistory.push({
      status: request.status,
      action: 'Payment Successful',
      note: `Paid ₹${payment.amount}. Razorpay ID: ${razorpay_payment_id}`,
      updatedBy: req.user.id,
      updatedByRole: req.user.role
    });

    // Check Auto-transition to ready_for_pickup
    if (request.crossMatchDone && request.documentsVerified && request.paymentStatus === 'paid') {
      request.status = 'ready_for_pickup';
      request.statusHistory.push({
        status: 'ready_for_pickup',
        action: 'Status Transition',
        note: 'Gates complete, ready for pickup. OTP generated.',
        updatedBy: req.user.id,
        updatedByRole: req.user.role
      });
      const recipientMobile = request.requesterMobile || (request.recipient && request.recipient.mobile) || '';
      await generateAndSendOtp(request, recipientMobile);
    } else {
      await request.save();
    }

    // Send WhatsApp notification
    const recipientMobile = request.requesterMobile || (request.recipient && request.recipient.mobile) || '';
    if (recipientMobile) {
      const waMessage = `✅ *Payment Successful!*\nAmount: ₹${payment.amount}\nRequest: ${request.requestId}\nPayment ID: ${razorpay_payment_id}\n_Raktdaan_`;
      await sendMessage(recipientMobile, waMessage);
    }

    res.json({ success: true, message: 'Payment verified successfully', data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ======================================================
   STEP 7: VERIFY OTP + ISSUE
====================================================== */
router.put('/:requestId/verify-otp-issue', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const { otp, receiverName, receiverMobile, transportMode } = req.body;
    const request = await getRequestByParamId(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.status !== 'ready_for_pickup') {
      return res.status(400).json({ success: false, message: 'Request must be in ready_for_pickup status' });
    }

    // Gate Check
    if (!request.crossMatchDone || !request.documentsVerified || request.paymentStatus !== 'paid') {
      return res.status(400).json({ success: false, message: 'All checks (cross-match, documents, payment) must be completed' });
    }

    if (new Date() > request.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    if (request.otpAttempts >= 5) {
      return res.status(429).json({ success: false, message: 'Too many incorrect OTP attempts. Contact support.' });
    }

    const valid = await bcrypt.compare(otp, request.handoverOtp);
    if (!valid) {
      request.otpAttempts++;
      await request.save();
      return res.status(400).json({ success: false, message: `Invalid OTP. Attempts remaining: ${5 - request.otpAttempts}` });
    }

    // Process Reserved Units
    for (const unitId of request.reservedUnitIds) {
      const unit = await BloodUnit.findById(unitId);
      if (unit) {
        unit.currentStatus = 'Issued';
        unit.issuedToHospital = request.hospital;
        unit.receiverName = receiverName;
        unit.receiverMobile = receiverMobile;
        unit.transportMode = transportMode;
        unit.issuedAt = new Date();
        unit.issuedBy = req.user.id;
        unit.history.push({
          status: 'Issued',
          action: 'Issued to Hospital',
          note: `Handed over to ${receiverName}`,
          updatedBy: req.user.id,
          updatedByRole: req.user.role
        });
        await unit.save();
      }
    }

    request.status = 'issued';
    request.receiverName = receiverName;
    request.receiverMobile = receiverMobile;
    request.issuedAt = new Date();
    request.statusHistory.push({
      status: 'issued',
      action: 'Blood Units Issued',
      note: `Issued to ${receiverName} (${receiverMobile}) via ${transportMode}`,
      updatedBy: req.user.id,
      updatedByRole: req.user.role
    });

    await request.save();

    const recipientMobile = request.requesterMobile || (request.recipient && request.recipient.mobile) || '';
    if (recipientMobile) {
      const waMessage = `🩸 *Blood Issued!*\n${request.units} unit(s) issue ho gayi hain.\nReceiver: ${receiverName}\nHospital pohochne ke baad transfusion confirm hoga.\n_Raktdaan_`;
      await sendMessage(recipientMobile, waMessage);
    }

    res.json({ success: true, message: 'Blood units issued successfully', data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ======================================================
   STEP 8: CONFIRM TRANSFUSION / COMPLETE
====================================================== */
router.put('/:requestId/complete', verifyToken, roleMiddleware(['admin', 'blood_bank']), async (req, res) => {
  try {
    const { transfusionConfirmedBy, finalRemarks } = req.body;
    const request = await getRequestByParamId(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.status !== 'issued') {
      return res.status(400).json({ success: false, message: 'Request must be in issued status to mark completed' });
    }

    // Set units status to Transfused
    for (const unitId of request.reservedUnitIds) {
      const unit = await BloodUnit.findById(unitId);
      if (unit) {
        unit.currentStatus = 'Transfused';
        unit.usedAt = new Date();
        unit.usedBy = req.user.id;
        unit.transfusionConfirmedBy = transfusionConfirmedBy;
        unit.finalStatusRemarks = finalRemarks || '';
        unit.history.push({
          status: 'Transfused',
          action: 'Transfusion Completed',
          note: `Confirmed by ${transfusionConfirmedBy}`,
          updatedBy: req.user.id,
          updatedByRole: req.user.role
        });
        await unit.save();
      }
    }

    request.status = 'completed';
    request.completedAt = new Date();
    request.transfusionConfirmedBy = transfusionConfirmedBy;
    request.statusHistory.push({
      status: 'completed',
      action: 'Request Completed',
      note: `Transfusion confirmed by ${transfusionConfirmedBy}. ${finalRemarks || ''}`,
      updatedBy: req.user.id,
      updatedByRole: req.user.role
    });

    await request.save();

    const recipientMobile = request.requesterMobile || (request.recipient && request.recipient.mobile) || '';
    if (recipientMobile) {
      const waMessage = `❤️ *Request Completed*\nTransfusion successfully confirm hua.\nJald swasth ho jaaiye! 🙏\n_Raktdaan_`;
      await sendMessage(recipientMobile, waMessage);
    }

    res.json({ success: true, message: 'Transfusion confirmed and request completed', data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ======================================================
   GET: REQUEST FLOW STATUS
====================================================== */
router.get('/:requestId', verifyToken, async (req, res) => {
  try {
    const request = await getRequestByParamId(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // Check ownership for recipient
    if (req.user.role === 'recipient') {
      const isOwner = request.recipient && request.recipient._id.toString() === req.user.id;
      const isRequester = request.requesterUserId && request.requesterUserId.toString() === req.user.id;
      if (!isOwner && !isRequester) {
        return res.status(403).json({ success: false, message: 'Access denied. You do not own this request.' });
      }
    }

    // Populate reservedUnits
    const populatedUnits = await BloodUnit.find({ _id: { $in: request.reservedUnitIds } });
    
    // Format units based on role (hide donor and testing details from recipient)
    const formattedUnits = populatedUnits.map(unit => {
      if (req.user.role === 'recipient') {
        return {
          unitId: unit.unitId,
          bloodGroup: unit.bloodGroup,
          component: unit.component,
          expiryDate: unit.expiryDate
        };
      }
      return unit;
    });

    const responseData = request.toObject();
    responseData.reservedUnits = formattedUnits;

    res.json({ success: true, data: responseData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
