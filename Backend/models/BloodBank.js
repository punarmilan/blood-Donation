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
    city: {
      type: String,
      required: true,
      trim: true,
    },

    // Invite token (security)
    inviteToken: { type: String },          // SHA-256 hashed
    inviteTokenExpiresAt: { type: Date },   // now + 7 days
    inviteTokenUsed: { type: Boolean, default: false },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invitedAt: { type: Date },

    // From registration form (blood bank fills)
    address: { type: String },
    state: { type: String },
    pincode: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    emergencyContact: { type: String },
    is24x7: { type: Boolean, default: false },
    openTime: { type: String },             // "09:00"
    closeTime: { type: String },            // "20:00"
    licenseExpiryDate: { type: Date },
    licenseDocumentUrl: { type: String },   // uploaded file path
    registeredAt: { type: Date },

    // Legacy support fields
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
    role: {
      type: String,
      default: "bloodbank",
    },

    // Admin verification
    status: {
      type: String,
      enum: ['invited','pending','approved','rejected','active','suspended','blocked'],
      default: 'invited'
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    rejectionCount: { type: Number, default: 0 },

    // Password setup token
    passwordToken: { type: String },        // SHA-256 hashed
    passwordTokenExpiresAt: { type: Date }, // now + 24 hours
    password: { type: String },             // bcrypt hashed
    passwordSetAt: { type: Date },

    // Audit
    statusHistory: [{
      status: String,
      action: String,
      note: String,
      updatedBy: String,
      updatedAt: { type: Date, default: Date.now }
    }],

    inventory: {
      "A+": {
        wholeBlood: { type: Number, default: 0 },
        redCells: { type: Number, default: 0 },
        platelets: { type: Number, default: 0 },
        plasma: { type: Number, default: 0 },
      },
      "A-": {
        wholeBlood: { type: Number, default: 0 },
        redCells: { type: Number, default: 0 },
        platelets: { type: Number, default: 0 },
        plasma: { type: Number, default: 0 },
      },
      "B+": {
        wholeBlood: { type: Number, default: 0 },
        redCells: { type: Number, default: 0 },
        platelets: { type: Number, default: 0 },
        plasma: { type: Number, default: 0 },
      },
      "B-": {
        wholeBlood: { type: Number, default: 0 },
        redCells: { type: Number, default: 0 },
        platelets: { type: Number, default: 0 },
        plasma: { type: Number, default: 0 },
      },
      "O+": {
        wholeBlood: { type: Number, default: 0 },
        redCells: { type: Number, default: 0 },
        platelets: { type: Number, default: 0 },
        plasma: { type: Number, default: 0 },
      },
      "O-": {
        wholeBlood: { type: Number, default: 0 },
        redCells: { type: Number, default: 0 },
        platelets: { type: Number, default: 0 },
        plasma: { type: Number, default: 0 },
      },
      "AB+": {
        wholeBlood: { type: Number, default: 0 },
        redCells: { type: Number, default: 0 },
        platelets: { type: Number, default: 0 },
        plasma: { type: Number, default: 0 },
      },
      "AB-": {
        wholeBlood: { type: Number, default: 0 },
        redCells: { type: Number, default: 0 },
        platelets: { type: Number, default: 0 },
        plasma: { type: Number, default: 0 },
      },
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
