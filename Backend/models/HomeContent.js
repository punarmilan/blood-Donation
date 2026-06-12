import mongoose from "mongoose";

const homeContentSchema = new mongoose.Schema(
  {
    country: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    isGlobal: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    heroHeadline: { type: String, required: true },
    heroSubtitle: { type: String, required: true },
    heroButtonText: { type: String, default: "Find Donors" },
    heroSecondaryButtonText: { type: String, default: "Become a Donor" },
    homeBackgroundVideo: { type: String, default: "" },
    homeBackgroundImage: { type: String, default: "" },
    emergencyBannerText: { type: String, default: "" },
    localImpactText: { type: String, default: "" },
    localDonorCount: { type: Number, default: 0 },
    localBloodBankCount: { type: Number, default: 0 },
    preferredLanguage: { type: String, default: "English" }
  },
  { timestamps: true }
);

export default mongoose.model("HomeContent", homeContentSchema);
