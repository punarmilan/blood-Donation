import cron from "node-cron";
import BloodBank from "../models/BloodBank.js";
import { sendEmail } from "../utils/sendEmail.js";

const job = cron.schedule("0 8 * * *", async () => {
  console.log("Running Blood Bank license validity checker...");
  const now = new Date();
  
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  try {
    // 1. Expiring in 30 days — notify blood bank + admin
    const expiringSoon = await BloodBank.find({
      status: "active",
      licenseExpiryDate: { $lte: thirtyDays, $gt: now }
    });

    for (const bank of expiringSoon) {
      const remainingDays = Math.ceil((new Date(bank.licenseExpiryDate) - now) / (1000 * 60 * 60 * 24));
      
      // Notify blood bank
      await sendEmail({
        to: bank.email,
        subject: `⚠️ Raktdaan — License Expiring in ${remainingDays} Days`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #e67e22;">License Renewal Action Required</h2>
            <p>Hello ${bank.managerName},</p>
            <p>Your license for <strong>${bank.name}</strong> will expire on <strong>${new Date(bank.licenseExpiryDate).toDateString()}</strong> (${remainingDays} days remaining).</p>
            <p>Please contact the administrator or upload a renewed license document as soon as possible to avoid account suspension.</p>
            <p>Regards,<br/>Raktdaan Team</p>
          </div>
        `
      });

      // Notify admin
      const adminEmails = process.env.ADMIN_EMAILS || "admin@raktdaan.online";
      await sendEmail({
        to: adminEmails,
        subject: `⚠️ License Expiring Soon: ${bank.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>License Expiring Soon</h2>
            <p>The blood bank <strong>${bank.name}</strong>'s license will expire in ${remainingDays} days on ${new Date(bank.licenseExpiryDate).toDateString()}.</p>
          </div>
        `
      });
    }

    // 2. Already expired — auto suspend and notify
    const expiredList = await BloodBank.find({
      status: "active",
      licenseExpiryDate: { $lt: now }
    });

    if (expiredList.length > 0) {
      const expiredIds = expiredList.map(bank => bank._id);
      
      await BloodBank.updateMany(
        { _id: { $in: expiredIds } },
        { 
          $set: { status: "suspended" },
          $push: { 
            statusHistory: {
              status: "suspended",
              action: "Auto-suspended — license expired",
              note: "License expired. Account auto-suspended by System.",
              updatedBy: "System",
              updatedAt: now
            }
          }
        }
      );

      for (const bank of expiredList) {
        // Send email to bank
        await sendEmail({
          to: bank.email,
          subject: "❌ Raktdaan — Account Auto-Suspended (License Expired)",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #dc2626;">Account Suspended</h2>
              <p>Hello ${bank.managerName},</p>
              <p>Your blood bank account for <strong>${bank.name}</strong> has been auto-suspended because your license expired on ${new Date(bank.licenseExpiryDate).toDateString()}.</p>
              <p>Please contact the administrator to submit a valid license and reactivate your account.</p>
              <p>Regards,<br/>Raktdaan Team</p>
            </div>
          `
        });

        // Send email to admin
        const adminEmails = process.env.ADMIN_EMAILS || "admin@raktdaan.online";
        await sendEmail({
          to: adminEmails,
          subject: `❌ Auto-Suspended: ${bank.name} (License Expired)`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2>Blood Bank Suspended</h2>
              <p>The active status of <strong>${bank.name}</strong> has been changed to suspended because their license expired on ${new Date(bank.licenseExpiryDate).toDateString()}.</p>
            </div>
          `
        });
      }
      console.log(`Auto-suspended ${expiredList.length} blood banks due to expired licenses.`);
    }
  } catch (err) {
    console.error("Error running Blood Bank license validity checker:", err);
  }
});

export default job;
