import mongoose from "mongoose";

const MONGO_URI = "mongodb://BloodDonation:BloodDonation@ac-mmgrtvt-shard-00-00.ymftpbd.mongodb.net:27017,ac-mmgrtvt-shard-00-01.ymftpbd.mongodb.net:27017,ac-mmgrtvt-shard-00-02.ymftpbd.mongodb.net:27017/?ssl=true&replicaSet=atlas-13pch8-shard-0&authSource=admin&retryWrites=true&w=majority";

async function dropIndex() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: "Raktdaan" });
    console.log("Connected to MongoDB.");
    const db = mongoose.connection.db;
    try {
      await db.collection("users").dropIndex("email_1");
      console.log("Successfully dropped email_1 index.");
    } catch (err) {
      console.log("Index might not exist or another error:", err.message);
    }
    await mongoose.disconnect();
    console.log("Disconnected.");
  } catch (err) {
    console.error(err);
  }
}

dropIndex();
