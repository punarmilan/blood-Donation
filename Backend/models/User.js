import mongoose from "mongoose";
import { normalizeLocation } from "../utils/normalize.js";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true }, // Not required for donors using mobile only
  mobile: { type: String, required: true, unique: true },
  password: { type: String }, // For organizers
  bloodGroup: { type: String, required: true },
  city: { type: String },
  role: { 
    type: String, 
    enum: ['donor', 'recipient', 'organizer', 'admin', 'blood_bank'],
    default: 'donor' 
  },
  organizationType: { type: String },
  organizationName: { type: String },
  mustChangePassword: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isAvailable: { 
    type: Boolean, 
    default: function() {
      return this.role === 'donor' ? true : undefined;
    } 
  },
  
  // WhatsApp connection metadata for organizers
  whatsappConnected: { type: Boolean, default: false },
  whatsappSessionId: { type: String, default: null },
  whatsappNumber: { type: String, default: null },

  totalDonations: { 
    type: Number, 
    default: function() {
      return this.role === 'donor' ? 0 : undefined;
    } 
  },
  badge: { 
    type: String, 
    default: function() {
      return this.role === 'donor' ? "new donor" : undefined;
    } 
  },
  donationHistory: { 
    type: Array, 
    default: function() {
      return this.role === 'donor' ? [] : undefined;
    } 
  },
  nextEligibleDate: { type: Date },
  
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  lastDonationDate: { type: Date },
  nextEligibleDonationDate: { type: Date },
  donationEligibilityStatus: { type: String },
  donationGapDays: { type: Number },
  daysRemaining: { type: Number },

  // Added Basic Profile / Location / Availability Fields
  address: { type: String },
  state: { type: String },
  normalizedState: { type: String },
  city: { type: String },
  normalizedCity: { type: String },
  pincode: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  availableForEmergency: { 
    type: Boolean, 
    default: function() {
      return this.role === 'donor' ? true : undefined;
    } 
  },
  canTravelDistance: { type: Number, enum: [5, 10, 20] },
  preferredContactMethod: { 
    type: String, 
    enum: ['Call', 'WhatsApp', 'SMS'], 
    default: function() {
      return this.role === 'donor' ? 'Call' : undefined;
    } 
  },
  emergencyContactName: { type: String },
  emergencyContactNumber: { type: String },
  profileCompleted: { type: Boolean, default: false },
  locationAdded: { type: Boolean, default: false },

  health: {
    weight: { type: Number, min: 30, max: 200 },
    height: { type: Number, min: 100, max: 250 },
    age: { type: Number, min: 18, max: 65 },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    bmi: { type: Number },
    emergencyContactName: { type: String, trim: true },
    emergencyContactNumber: { type: String, match: [/^(?:\+91|91)?[6-9]\d{9}$/, 'Please enter a valid Indian mobile number'] },
    hemoglobinLevel: { type: Number, min: 5, max: 20 },
    sugarLevel: { type: Number, min: 40, max: 400 },
    updatedAt: { type: Date }
  },
  healthSuggestionReport: {
    healthSummary: { type: String },
    suggestionLevel: { type: String },
    keyObservations: [{ type: String }],
    lifestyleSuggestions: [{ type: String }],
    bloodDonationSuggestion: { type: String },
    doctorAdvice: { type: String },
    importantNote: { type: String },
    generatedAt: { type: Date }
  },
  healthReport: {
    fileUrl: { type: String },
    fileName: { type: String },
    fileType: { type: String },
    fileSize: { type: Number },
    reportType: { type: String },
    reportDate: { type: Date },
    uploadedAt: { type: Date }
  }
}, { timestamps: true });

userSchema.pre("save", function(next) {
  if (this.isModified("state") || this.isModified("normalizedState")) {
    this.normalizedState = normalizeLocation(this.state);
  }
  if (this.isModified("city") || this.isModified("normalizedCity")) {
    this.normalizedCity = normalizeLocation(this.city);
  }
  next();
});

export default mongoose.model("User", userSchema);
