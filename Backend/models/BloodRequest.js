import mongoose from "mongoose";

const bloodRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  patientName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  units: { type: Number, required: true },
  hospital: { type: String, required: true },
  city: { type: String },
  urgency: { type: String }, // "urgent" or "planned"
  neededBy: { type: String }, // "today/tomorrow/2-3days/week"
  additionalInfo: { type: String },
  status: { type: String, default: "pending" }, // "pending" -> "active" -> "accepted" -> "completed"
  notifiedDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  acceptedByBloodBank: { type: mongoose.Schema.Types.ObjectId, ref: "BloodBank" },
  acceptedAt: { type: Date },
  otp: { type: String },
  adminSeenAt: { type: Date },
  donorsNotifiedAt: { type: Date },
  fulfilledAt: { type: Date }, // Optional: keep for legacy or rename
  completedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model("BloodRequest", bloodRequestSchema);
