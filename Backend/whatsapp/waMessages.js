const E = {
  blood:  '\uD83E\uDE78',   // 🩸
  check:  '\u2705',          // ✅
  heart:  '\u2764\uFE0F',   // ❤️
  party:  '\uD83C\uDF89',   // 🎉
  cal:    '\uD83D\uDCC5',   // 📅
  pin:    '\uD83D\uDCCD',   // 📍
  alarm:  '\u23F0',          // ⏰
  warn:   '\u26A0\uFE0F',   // ⚠️
  lock:   '\uD83D\uDD10',   // 🔐
  medal:  '\uD83C\uDFC5',   // 🏅
  trophy: '\uD83C\uDFC6',   // 🏆
  tent:   '\u26FA',          // ⛺
  siren:  '\uD83D\uDEA8',   // 🚨
  users:  '\uD83D\uDC65',   // 👥
  drop:   '\uD83D\uDCA7',   // 💧
  phone:  '\uD83D\uDCF1',   // 📱
  mail:   '\uD83D\uDCE7',   // 📧
}

// All message templates using E.emoji:

const messages = {

  enquiryConfirmation: (organizerName, campDate, area) =>
`${E.blood} *Raktdaan — Enquiry Received*

Namaste ${organizerName} ji!

Aapki blood donation camp request mil gayi hai.

${E.cal} Preferred date: ${campDate}
${E.pin} Area: ${area}

${E.check} Hamare admin 24-48 ghante mein review karenge.

Shukriya! ${E.heart}
_Raktdaan Team_`.trim(),

  enquiryApproved: (organizerName, email, tempPassword, campDate, venue) =>
`${E.party} *Raktdaan — Camp Approved!*

Namaste ${organizerName} ji!

Aapki camp request *approve* ho gayi hai!

${E.tent} *Camp Details:*
${E.cal} Date: ${campDate}
${E.pin} Venue: ${venue}

${E.lock} *Login Credentials:*
${E.mail} Email: ${email}
Password: *${tempPassword}*

${E.phone} Login: blooddonation.store/organizer-login

${E.warn} _Password zaroor change karein._

_Raktdaan Team_`.trim(),

  enquiryRejected: (organizerName, reason) =>
`*Raktdaan — Camp Request Update*

Namaste ${organizerName} ji,

Aapki camp request approve nahi ho payi.

Reason: ${reason}

Aap dobara request kar sakte hain.

_Raktdaan Team_`.trim(),

  donorRegistration: (donorName, campTitle, campDate, venue, timeSlot) =>
`${E.check} *Registration Confirmed!*

Namaste ${donorName} ji!

${E.tent} *Camp:* ${campTitle}
${E.cal} *Date:* ${campDate}
${E.pin} *Venue:* ${venue}
${E.alarm} *Your slot:* ${timeSlot}

*Yaad rakhein:*
- Khali pet mat aaiye
- Paani pee ke aaiye
- ID proof saath laiye

Reply *YES* to confirm
Reply *NO* to cancel

${E.blood} _Raktdaan_`.trim(),

  campReminder: (donorName, campTitle, campDate, venue) =>
`${E.alarm} *Kal camp hai!*

Namaste ${donorName} ji!

Kal *${campTitle}* hai!

${E.cal} Date: ${campDate}
${E.pin} Venue: ${venue}

Reply *YES* — Main aa raha/rahi hoon
Reply *NO* — Main nahi aa sakta

_Raktdaan_`.trim(),

  campComplete: (organizerName, campTitle, donors, units, livesSaved) =>
`${E.party} *Camp Successful Raha!*

Namaste ${organizerName} ji!

*${campTitle}* bahut achha raha!

${E.users} Donors aaye: *${donors}*
${E.blood} Units collected: *${units}*
${E.heart} Lives saved: *${livesSaved}*

Certificate dashboard mein available hai.
blooddonation.store/organizer-dashboard

Aapka shukriya! ${E.trophy}
_Raktdaan Team_`.trim(),

  donorCertificate: (donorName, campTitle, campDate, badge) =>
`${E.medal} *Blood Donation Certificate*

Namaste ${donorName} ji!

*${campTitle}* mein donate karne ke liye shukriya!

${E.trophy} Badge: *${badge}*

3 mahine baad phir eligible honge.
_Raktdaan_`.trim(),

  urgentBlood: (bloodGroup, hospital, city, units) =>
`${E.siren} *URGENT — Blood Required!*

*${bloodGroup} blood* chahiye abhi!

Hospital: ${hospital}
City: ${city}
Units needed: ${units}

Donate kar sakte ho toh reply *DONATE*

_Raktdaan Emergency_`.trim(),

  campShare: (campTitle, campDate, venue, campId) =>
`${E.blood} *Blood Donation Camp!*

*${campTitle}*
${E.cal} ${campDate}
${E.pin} ${venue}

Aao aur ek zindagi bachao!
Register: blooddonation.store/camps/${campId}

_Raktdaan_`.trim(),

}

export default messages;
