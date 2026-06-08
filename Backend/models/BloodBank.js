import mongoose from "mongoose";

const BloodBankSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    managerName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    emergencyContact: {
      type: String,
      trim: true,
    },
    openingTime: {
      type: String,
    },
    closingTime: {
      type: String,
    },
    available24x7: {
      type: Boolean,
      default: false,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    licenseDocumentUrl: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "bloodbank",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "blocked"],
      default: "pending",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      default: null,
    },
    passwordSetupToken: {
      type: String,
    },
    passwordSetupTokenExpires: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    inventory: {
      "A+": { type: Number, default: 0 },
      "A-": { type: Number, default: 0 },
      "B+": { type: Number, default: 0 },
      "B-": { type: Number, default: 0 },
      "O+": { type: Number, default: 0 },
      "O-": { type: Number, default: 0 },
      "AB+": { type: Number, default: 0 },
      "AB-": { type: Number, default: 0 },
    },
    lastInventoryUpdated: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

BloodBankSchema.index({ location: "2dsphere" });

const BloodBank = mongoose.model("BloodBank", BloodBankSchema);
export default BloodBank;
