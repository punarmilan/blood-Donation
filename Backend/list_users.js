import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";

const mongoURI = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

mongoose.connect(mongoURI, { dbName })
  .then(async () => {
    const users = await User.find();
    console.log(`Total users: ${users.length}`);
    users.forEach(u => {
      console.log(`Id: ${u._id}, Name: ${u.name}, Mobile: ${u.mobile}, Role: ${u.role}, HasHealth: ${u.health ? !!u.health.weight : false}, HealthReport: ${u.healthReport ? JSON.stringify(u.healthReport) : 'None'}`);
    });
    mongoose.disconnect();
  })
  .catch(err => console.error(err));
