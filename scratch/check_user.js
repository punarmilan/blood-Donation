import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "../Backend/.env" });

const MONGO_URI = "mongodb://BloodDonation:BloodDonation@ac-mmgrtvt-shard-00-00.ymftpbd.mongodb.net:27017,ac-mmgrtvt-shard-00-01.ymftpbd.mongodb.net:27017,ac-mmgrtvt-shard-00-02.ymftpbd.mongodb.net:27017/?ssl=true&replicaSet=atlas-13pch8-shard-0&authSource=admin&retryWrites=true&w=majority";

const userSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  role: String,
  bloodGroup: String,
}, { strict: false });

const User = mongoose.model("User", userSchema, "users");

async function run() {
  await mongoose.connect(MONGO_URI, { dbName: "Raktdaan" });
  console.log("Connected to DB");
  const user = await User.findOne({ mobile: "2323243314" });
  console.log("User by mobile:", user);
  
  const allUsers = await User.find({}).limit(10);
  console.log("Some users:", allUsers.map(u => ({ name: u.name, mobile: u.mobile })));
  
  await mongoose.disconnect();
}

run().catch(console.error);
