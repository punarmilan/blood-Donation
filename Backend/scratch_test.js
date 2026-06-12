import mongoose from "mongoose";
import Camp from "./models/Camp.js";
import OrganizerEnquiry from "./models/OrganizerEnquiry.js";
import BloodBank from "./models/BloodBank.js";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/raktdaan";

mongoose.connect(mongoURI)
  .then(async () => {
    console.log("Connected to MongoDB");
    const camp = await Camp.findOne({ campId: "RDC20266506" })
      .populate({
        path: "enquiry",
        populate: {
          path: "assignedBloodBank"
        }
      });
    console.log("Camp:", JSON.stringify(camp, null, 2));
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("Error connecting to MongoDB:", err);
  });
