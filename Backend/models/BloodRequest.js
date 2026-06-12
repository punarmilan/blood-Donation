import mongoose from "mongoose";
import { normalizeLocation } from "../utils/normalize.js";

const bloodRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requesterUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  patientName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  bloodComponent: { type: String },
  units: { type: Number, required: true },
  unitsNeeded: { type: Number },
  hospital: { type: String, required: true },
  hospitalName: { type: String },
  hospitalArea: { type: String },
  city: { type: String },
  normalizedCity: { type: String },
  state: { type: String },
  normalizedState: { type: String },
  pincode: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  urgency: { type: String }, // "urgent" or "planned"
  neededBy: { type: String }, // "today/tomorrow/2-3days/week"
  neededDateTime: { type: Date },
  additionalInfo: { type: String },
  requesterMobile: { type: String },
  
  status: { 
    type: String, 
    enum: ['pending','accepted','reserved','ready_for_pickup','issued','completed','rejected','cancelled','active'],
    default: 'pending' 
  },
  notifiedDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  acceptedByBloodBank: { type: mongoose.Schema.Types.ObjectId, ref: "BloodBank" },
  acceptedByBloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Step 2 — Accept (User ref)
  acceptedAt: { type: Date },
  otp: { type: String },
  adminSeenAt: { type: Date },
  donorsNotifiedAt: { type: Date },
  fulfilledAt: { type: Date },
  completedAt: { type: Date },

  // Step 3 — Reservation
  reservedUnitIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BloodUnit' }],
  reservedAt: { type: Date },

  // Step 4 — Cross-match
  crossMatchDone: { type: Boolean, default: false },
  crossMatchBy: { type: String },
  crossMatchAt: { type: Date },
  crossMatchRemarks: { type: String },

  // Step 5 — Documents
  documentsVerified: { type: Boolean, default: false },
  requisitionSlipVerified: { type: Boolean, default: false },
  patientIdVerified: { type: Boolean, default: false },
  receiverIdVerified: { type: Boolean, default: false },
  documentsVerifiedBy: { type: String },
  documentsVerifiedAt: { type: Date },

  // Step 6 — Payment
  paymentStatus: {
    type: String,
    enum: ['not_required','pending','paid','failed'],
    default: 'pending'
  },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  paymentAmount: { type: Number },
  paidAt: { type: Date },

  // Step 7 — OTP + Issue
  handoverOtp: { type: String },          // hashed with bcrypt
  otpGeneratedAt: { type: Date },
  otpExpiresAt: { type: Date },
  otpAttempts: { type: Number, default: 0 },
  receiverName: { type: String },
  receiverMobile: { type: String },
  issuedAt: { type: Date },

  // Step 8 — Completion
  transfusionConfirmedBy: { type: String },

  // Audit
  statusHistory: [{
    status: String,
    action: String,
    note: String,
    updatedBy: String,
    updatedByRole: String,
    updatedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

bloodRequestSchema.pre("save", function(next) {
  if (this.isModified("state") || this.isModified("normalizedState")) {
    this.normalizedState = normalizeLocation(this.state);
  }
  if (this.isModified("city") || this.isModified("normalizedCity")) {
    this.normalizedCity = normalizeLocation(this.city);
  }
  next();
});

export default mongoose.model("BloodRequest", bloodRequestSchema);
