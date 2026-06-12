import "dotenv/config";
import mongoose from "mongoose";
import BloodRequest from "./models/BloodRequest.js";

const mongoURI = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

mongoose.connect(mongoURI, { dbName })
  .then(async () => {
    const reqs = await BloodRequest.find();
    console.log(`Total requests: ${reqs.length}`);
    reqs.forEach(r => {
      console.log(`Id: ${r.requestId}, Patient: ${r.patientName}, RecipientId: ${r.recipient}, BloodGroup: ${r.bloodGroup}, Status: ${r.status}`);
    });
    mongoose.disconnect();
  })
  .catch(err => console.error(err));
