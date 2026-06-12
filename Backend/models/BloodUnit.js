import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  status: String,
  action: String,
  note: String,
  updatedBy: String,
  updatedByRole: String,
  updatedAt: { type: Date, default: Date.now }
});

const bloodUnitSchema = new mongoose.Schema({
  unitId: { 
    type: String, 
    unique: true
  },
  qrCode: { type: String },
  
  bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  donorName: { type: String, required: true },
  donorMobile: { type: String, required: true },
  donorBloodGroup: { type: String },
  
  bloodGroup: { 
    type: String, 
    enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'],
    required: true 
  },
  component: { 
    type: String,
    enum: ['Whole Blood','RBC','Platelets','Plasma'],
    required: true 
  },
  
  collectionDate: { type: Date, required: true },
  expiryDate: { type: Date },
  volumeML: { type: Number },
  bagNumber: { type: String },
  
  storageLocation: { type: String },
  fridgeNumber: { type: String },
  shelfNumber: { type: String },
  
  testStatus: { 
    type: String,
    enum: ['Pending','Passed','Failed'],
    default: 'Pending'
  },
  testingStartedAt: { type: Date },
  testedAt: { type: Date },
  testedBy: { type: String },
  hivTest: { 
    type: String,
    enum: ['Pending','Negative','Positive'],
    default: 'Pending'
  },
  hepatitisBTest: { 
    type: String,
    enum: ['Pending','Negative','Positive'],
    default: 'Pending'
  },
  hepatitisCTest: { 
    type: String,
    enum: ['Pending','Negative','Positive'],
    default: 'Pending'
  },
  syphilisTest: { 
    type: String,
    enum: ['Pending','Negative','Positive'],
    default: 'Pending'
  },
  malariaTest: { 
    type: String,
    enum: ['Pending','Negative','Positive'],
    default: 'Pending'
  },
  aboRhVerification: { 
    type: String,
    enum: ['Pending','Verified','Mismatch'],
    default: 'Pending'
  },
  hemoglobinChecked: { 
    type: String,
    default: 'Yes'
  },
  testRemarks: { type: String },
  labReportFileUrl: { type: String },
  
  currentStatus: {
    type: String,
    enum: [
      'Collected',
      'Testing Pending',
      'Available',
      'Reserved',
      'Issued',
      'Used',
      'Transfused',
      'Expired',
      'Discarded'
    ],
    default: 'Collected'
  },
  
  reservedForRequestId: { type: String },
  reservedAt: { type: Date },
  reservedBy: { type: String },
  reservationExpiresAt: { type: Date },
  
  issuedToHospital: { type: String },
  hospitalAddress: { type: String },
  issuedAt: { type: Date },
  issuedBy: { type: String },
  receiverName: { type: String },
  receiverMobile: { type: String },
  transportMode: {
    type: String
  },
  issueRemarks: { type: String },
  
  usedAt: { type: Date },
  usedBy: { type: String },
  transfusionConfirmedBy: { type: String },
  finalStatusRemarks: { type: String },
  
  history: [historySchema]
}, { timestamps: true });

export default mongoose.model('BloodUnit', bloodUnitSchema);
