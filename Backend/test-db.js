import mongoose from "mongoose";
import Organizer from "./models/Organizer.js";
import User from "./models/User.js";

const MONGO_URI = "mongodb://BloodDonation:BloodDonation@ac-mmgrtvt-shard-00-00.ymftpbd.mongodb.net:27017,ac-mmgrtvt-shard-00-01.ymftpbd.mongodb.net:27017,ac-mmgrtvt-shard-00-02.ymftpbd.mongodb.net:27017/Raktdaan?ssl=true&replicaSet=atlas-13pch8-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("Connected");
    const orgs = await Organizer.countDocuments();
    const userOrgs = await User.countDocuments({ role: "organizer" });
    const users = await User.countDocuments();
    console.log("Organizers count:", orgs);
    console.log("User (role: organizer) count:", userOrgs);
    console.log("Total Users count:", users);
    
    if (orgs > 0) {
      console.log("First org:", await Organizer.findOne());
    }
    if (userOrgs > 0) {
      console.log("First user org:", await User.findOne({role: "organizer"}));
    }
    process.exit(0);
  })
  .catch(err => {
    console.log(err);
    process.exit(1);
  });
