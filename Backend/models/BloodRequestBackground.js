import mongoose from "mongoose";

const bloodRequestBackgroundSchema = new mongoose.Schema(
  {
    mediaUrl: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    country: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    isGlobal: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

export default mongoose.model("BloodRequestBackground", bloodRequestBackgroundSchema);
