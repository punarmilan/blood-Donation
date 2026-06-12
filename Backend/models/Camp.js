import mongoose from "mongoose";
import { normalizeLocation } from "../utils/normalize.js";

const campSchema = new mongoose.Schema({
  campId: { type: String, unique: true },  // RDC2026001
  name: { type: String }, // Added to satisfy legacy unique index
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enquiry: { type: mongoose.Schema.Types.ObjectId, ref: 'OrganizerEnquiry' },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String },
  venue: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, default: 'Pune' },
  normalizedCity: { type: String },
  state: { type: String },
  normalizedState: { type: String },
  pincode: { type: String },
  expectedDonors: { type: String },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  registeredDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  checkedInDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalDonors: { type: Number, default: 0 },
  totalUnitsCollected: { type: Number, default: 0 },
  photos: [{ type: String }],
  completedAt: { type: Date },
  location: { type: String },
  hospitalName: { type: String },
  proName: { type: String },
  organizerName: { type: String },
  organizerContact: { type: String },
  address: { type: String },
  startTime: { type: String },
  endTime: { type: String },
  description: { type: String },
  contactNumber: { type: String },
  maxSlots: { type: Number, default: 200 },
  registeredCount: { type: Number, default: 0 },
}, { timestamps: true });

campSchema.pre("save", function(next) {
  if (this.isModified("state") || this.isModified("normalizedState")) {
    this.normalizedState = normalizeLocation(this.state);
  }
  if (this.isModified("city") || this.isModified("normalizedCity")) {
    this.normalizedCity = normalizeLocation(this.city);
  }
  next();
});

export default mongoose.model("Camp", campSchema);
