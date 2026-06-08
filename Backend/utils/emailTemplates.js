export const emailTemplates = {
  enquiryConfirmation: (organizerName, campDetails) => `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #E11D48;">Raktdaan - Aapki Camp Request Mili! ✅</h2>
      <p>Hello ${organizerName},</p>
      <p>Thank you for initiating a blood donation camp with Raktdaan.</p>
      <p>We have received your request for a camp at <strong>${campDetails.area}</strong> on <strong>${new Date(campDetails.preferredDate).toDateString()}</strong>.</p>
      <p>Hamare admin 24-48 ghante mein aapki request review karenge aur aapse sampark karenge.</p>
      <br/>
      <p>For any queries, contact us at: support@raktdaan.com</p>
      <p>Regards,<br/>Raktdaan Team</p>
    </div>
  `,

  newEnquiryAlert: (organizerName, campDetails) => `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #E11D48;">New Camp Request Received</h2>
      <p><strong>Organizer:</strong> ${organizerName}</p>
      <p><strong>Phone:</strong> ${campDetails.phone}</p>
      <p><strong>Email:</strong> ${campDetails.email}</p>
      <p><strong>Organization Type:</strong> ${campDetails.organizationType}</p>
      <p><strong>Area:</strong> ${campDetails.area}</p>
      <p><strong>Preferred Date:</strong> ${new Date(campDetails.preferredDate).toDateString()}</p>
      <p><strong>Expected Donors:</strong> ${campDetails.expectedDonors || 'N/A'}</p>
      <br/>
      <p>Please review this request in the Admin Panel.</p>
    </div>
  `,

  approvalEmail: (organizerName, campDetails, email, tempPassword) => `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #111; color: #eee; border-radius: 8px;">
      <h2 style="color: #E11D48;">🎉 Camp Approved - Login Credentials</h2>
      <p>Congratulations ${organizerName}, Aapka camp approve ho gaya hai!</p>
      
      <div style="background-color: #222; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Camp Details</h3>
        <p><strong>Date:</strong> ${new Date(campDetails.date).toDateString()}</p>
        <p><strong>Venue:</strong> ${campDetails.venue}</p>
        <p><strong>Area:</strong> ${campDetails.area}</p>
      </div>

      <div style="background-color: #222; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #E11D48;">
        <h3 style="margin-top: 0; color: #E11D48;">Login Credentials</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> <span style="color: #E11D48; font-weight: bold; font-size: 18px;">${tempPassword}</span></p>
      </div>

      <p>Please login to your Organizer Dashboard using the button below:</p>
      <a href="${process.env.FRONTEND_URL}/organizer-login" style="display: inline-block; padding: 10px 20px; background-color: #E11D48; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Dashboard</a>
      
      <p style="color: #ffcc00; margin-top: 20px;"><strong>⚠️ Important Note:</strong> Please login karke apna password change zaroor karein.</p>
    </div>
  `,

  rejectionEmail: (organizerName, reason) => `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #E11D48;">Raktdaan - Camp Request Update</h2>
      <p>Hello ${organizerName},</p>
      <p>We appreciate your interest in organizing a blood donation camp with Raktdaan.</p>
      <p>However, we are unable to approve your request at this time.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #E11D48; margin: 20px 0;">
        <p><strong>Reason:</strong> ${reason}</p>
      </div>
      <p>Aap future mein dobara request kar sakte hain ya kisi existing camp mein jud sakte hain.</p>
      <p>Regards,<br/>Raktdaan Team</p>
    </div>
  `,

  postCampReport: (organizerName, campDetails, stats) => `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd;">
      <div style="text-align: center; border-bottom: 2px solid #E11D48; padding-bottom: 20px; margin-bottom: 20px;">
        <h1 style="color: #E11D48; margin: 0;">Raktdaan</h1>
        <h3 style="margin: 5px 0 0 0; color: #555;">Camp Completion Report</h3>
      </div>
      
      <p><strong>Organizer:</strong> ${organizerName}</p>
      <p><strong>Camp:</strong> ${campDetails.title}</p>
      <p><strong>Date:</strong> ${new Date(campDetails.date).toDateString()}</p>
      <p><strong>Venue:</strong> ${campDetails.venue}, ${campDetails.city}</p>
      
      <div style="background-color: #fff; border: 2px dashed #E11D48; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
        <h3 style="margin-top: 0; color: #E11D48;">IMPACT SUMMARY</h3>
        <p style="font-size: 18px; margin: 10px 0;">👥 <strong>${stats.totalDonors}</strong> Donors Attended</p>
        <p style="font-size: 18px; margin: 10px 0;">🩸 <strong>${stats.totalUnitsCollected}</strong> Units Collected</p>
        <p style="font-size: 18px; margin: 10px 0; color: #E11D48;">❤️ <strong>${stats.livesSaved}</strong> Lives Saved</p>
      </div>
      
      <p style="text-align: center; font-size: 18px; font-style: italic;">"Aapke is ek kadam se ${stats.livesSaved} logon ki zindagi mein farq pada."</p>
      
      <div style="text-align: center; margin-top: 30px;">
        <p>Thank you ${organizerName} ji - Agle saal bhi? 🎂</p>
      </div>
    </div>
  `,

  donorCertificate: (donorName, campDetails, badge, nextDate) => `
    <div style="font-family: Arial, sans-serif; padding: 30px; background-color: #fff; color: #333; max-width: 600px; margin: 0 auto; border: 8px solid #E11D48; text-align: center;">
      <h1 style="color: #E11D48; margin-bottom: 5px;">CERTIFICATE OF APPRECIATION</h1>
      <p style="font-size: 16px; color: #666; margin-top: 0;">Presented by Raktdaan</p>
      
      <p style="font-size: 18px; margin-top: 40px;">This certificate is proudly presented to</p>
      <h2 style="font-size: 28px; color: #E11D48; border-bottom: 2px solid #ccc; display: inline-block; padding-bottom: 5px;">${donorName}</h2>
      
      <p style="font-size: 16px; line-height: 1.6; margin-top: 20px;">
        For your generous blood donation at the<br/>
        <strong>${campDetails.title}</strong><br/>
        held at ${campDetails.venue} on ${new Date(campDetails.date).toDateString()}.
      </p>
      
      <div style="background-color: #f8f9fa; padding: 15px; margin-top: 30px; border-radius: 5px; border-left: 4px solid #E11D48; text-align: left;">
        <p style="margin: 5px 0;"><strong>Badge Status:</strong> ${badge.toUpperCase()} DONOR</p>
        <p style="margin: 5px 0;"><strong>Next Eligible Date:</strong> ${new Date(nextDate).toDateString()}</p>
      </div>
      
      <div style="margin-top: 40px;">
        <p style="font-style: italic; color: #666;">"Your blood donation is a lifesaver."</p>
      </div>
    </div>
  `,

  bloodBankApproval: (bloodBankName, managerName, email, setupLink) => `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #111; color: #eee; border-radius: 8px;">
      <h2 style="color: #E11D48;">🎉 Blood Bank Approved</h2>
      <p>Congratulations ${managerName},</p>
      <p>Your registration for <strong>${bloodBankName}</strong> has been approved by the Admin!</p>
      
      <div style="background-color: #222; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #E11D48;">
        <h3 style="margin-top: 0; color: #E11D48;">Account Setup</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p>You can now set up your secure password to access your dashboard and manage live inventory.</p>
      </div>

      <p>Please click the button below to set your password:</p>
      <a href="${setupLink}" style="display: inline-block; padding: 10px 20px; background-color: #E11D48; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Set My Password</a>
      
      <p style="color: #ffcc00; margin-top: 20px;"><strong>⚠️ Important Note:</strong> This setup link is valid for 24 hours.</p>
    </div>
  `,

  bloodBankRejection: (bloodBankName, managerName, reason) => `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #E11D48;">Raktdaan - Blood Bank Registration Update</h2>
      <p>Hello ${managerName},</p>
      <p>We appreciate your interest in registering <strong>${bloodBankName}</strong> on the Raktdaan platform.</p>
      <p>After careful review, we are currently unable to approve your registration.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #E11D48; margin: 20px 0;">
        <p><strong>Reason:</strong> ${reason}</p>
      </div>
      <p>If you believe this was an error, please contact support.</p>
      <p>Regards,<br/>Raktdaan Team</p>
    </div>
  `
};

