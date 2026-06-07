import mongoose from "mongoose";

const BloodBankSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    bloodGroupsAvailable: {
      type: [String],
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    openStatus: {
      type: String,
      enum: ["open", "closed", "unknown"],
      default: "unknown",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  { timestamps: true }
);

BloodBankSchema.index({ location: "2dsphere" });

const BloodBank = mongoose.model("BloodBank", BloodBankSchema);
export default BloodBank;
