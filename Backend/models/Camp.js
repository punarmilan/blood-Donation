import mongoose from "mongoose";

const campSchema = new mongoose.Schema({
  campId: { type: String, unique: true },  // RDC2026001
  name: { type: String }, // Added to satisfy legacy unique index
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enquiry: { type: mongoose.Schema.Types.ObjectId, ref: 'OrganizerEnquiry' },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  venue: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, default: 'Pune' },
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
}, { timestamps: true });

export default mongoose.model("Camp", campSchema);
