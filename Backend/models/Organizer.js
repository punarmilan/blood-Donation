import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const organizerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: "organizer" },

    // ✅ Change: Store multiple camps
    camps: [{ type: mongoose.Schema.Types.ObjectId, ref: "Camp" }],

    whatsappConnected: { type: Boolean, default: false },
    whatsappSessionId: { type: String, default: null },
    whatsappNumber: { type: String, default: null },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

organizerSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model("Organizer", organizerSchema);
