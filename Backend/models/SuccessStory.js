import mongoose from "mongoose";

const successStorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    initials: { type: String },
    subtitle: { type: String },
    review: { type: String, required: true },
    image: { type: String },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    country: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    isGlobal: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const SuccessStory = mongoose.model("SuccessStory", successStorySchema);
export default SuccessStory;
