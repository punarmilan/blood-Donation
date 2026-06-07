import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true }, // Not required for donors using mobile only
  mobile: { type: String, required: true, unique: true },
  password: { type: String }, // For organizers
  bloodGroup: { type: String, required: true },
  city: { type: String },
  role: { 
    type: String, 
    enum: ['donor', 'recipient', 'organizer', 'admin'],
    default: 'donor' 
  },
  organizationType: { type: String },
  organizationName: { type: String },
  mustChangePassword: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  totalDonations: { type: Number, default: 0 },
  badge: { type: String, default: "new donor" },
  donationHistory: { type: Array, default: [] },
  nextEligibleDate: { type: Date },
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
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
