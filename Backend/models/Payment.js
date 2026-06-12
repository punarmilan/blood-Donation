import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true },     // 'PAY'+Date.now()
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  purpose: { type: String, enum: ['blood_request_fee','camp_fee'], default: 'blood_request_fee' },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest' },
  payerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  payerName: String,
  payerMobile: String,
  amount: { type: Number, required: true },      // rupees
  amountPaise: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['created','paid','failed','refunded'],
    default: 'created'
  },
  paidAt: Date,
  failureReason: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Payment", paymentSchema);
