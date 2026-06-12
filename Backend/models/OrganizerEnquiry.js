import mongoose from "mongoose";

const organizerEnquirySchema = new mongoose.Schema({
  organizerName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  organizationType: { 
    type: String, 
    enum: ['personal', 'college', 'ngo', 'corporate', 'society'],
    required: true 
  },
  organizationName: { type: String },
  preferredDate: { type: Date, required: true },
  preferredTime: { type: String },
  area: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  pincode: { type: String },
  expectedDonors: { type: String }, // Changing to string for ranges like "10-25"
  venueAvailable: { type: Boolean, default: false },
  message: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending' 
  },
  adminNote: { type: String },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  assignedBloodBank: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank' },
  bloodBankStatus: { 
    type: String, 
    enum: ['none', 'pending', 'accepted', 'rejected'], 
    default: 'none' 
  },
  bloodBankNotes: { type: String },
  bloodBankResponseAt: { type: Date },
  resourcesConfirmed: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("OrganizerEnquiry", organizerEnquirySchema);
