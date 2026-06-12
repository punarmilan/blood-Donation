import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  bloodRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "BloodRequest" },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "BloodRequest" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  state: { type: String },
  city: { type: String },
  bloodGroup: { type: String },
  type: { type: String, default: "emergency_blood_request" },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
