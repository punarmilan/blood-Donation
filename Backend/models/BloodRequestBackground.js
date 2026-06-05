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
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

export default mongoose.model("BloodRequestBackground", bloodRequestBackgroundSchema);
