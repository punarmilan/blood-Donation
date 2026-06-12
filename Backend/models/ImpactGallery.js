import mongoose from "mongoose";

const impactGallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    date: { type: String },
    category: {
      type: String,
      enum: [
        "Camp Setup",
        "Registration",
        "Blood Collection",
        "Volunteers",
        "Medical Team",
        "Certificates",
        "Group Photos",
      ],
      required: true,
    },
    mediaType: { type: String, enum: ["image", "video"], required: true },
    mediaUrl: { type: String, required: true },
    featured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    country: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    isGlobal: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ImpactGallery = mongoose.model("ImpactGallery", impactGallerySchema);
export default ImpactGallery;
