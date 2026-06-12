import "dotenv/config";
import mongoose from "mongoose";
import { GoogleGenAI } from "@google/genai";
import User from "./models/User.js";

const mongoURI = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

mongoose.connect(mongoURI, { dbName })
  .then(async () => {
    console.log("Connected to MongoDB");
    const user = await User.findOne({ mobile: "8767605792" });
    if (!user) {
      console.log("User not found.");
      mongoose.disconnect();
      return;
    }
    console.log("Found user:", user.name);

    const { health, bloodGroup } = user;
    const age = health.age;
    const gender = health.gender;
    const height = health.height;
    const weight = health.weight;
    const bmi = health.bmi || (weight / ((height / 100) * (height / 100))).toFixed(1);
    const hemoglobin = health.hemoglobinLevel || "Not provided";
    const sugarLevel = health.sugarLevel || "Not provided";

    const hasReport = user.healthReport && user.healthReport.fileUrl;
    const reportType = hasReport ? user.healthReport.reportType : "None";
    const reportDate = hasReport && user.healthReport.reportDate 
      ? new Date(user.healthReport.reportDate).toLocaleDateString("en-US") 
      : "None";

    const prompt = `
    Analyze the following donor health data and provide general health suggestions in Hindi/Hinglish (simple language).

    Donor Data:
    - Age: ${age}
    - Gender: ${gender}
    - Height: ${height} cm
    - Weight: ${weight} kg
    - BMI: ${bmi}
    - Blood Group: ${bloodGroup}
    - Hemoglobin Level: ${hemoglobin} g/dL
    - Sugar Level: ${sugarLevel} mg/dL
    - Uploaded Health Report Type: ${reportType}
    - Uploaded Health Report Date: ${reportDate}

    Strict Safety Instructions:
    1. DO NOT diagnose any disease (e.g. do not say "you have diabetes" or "you have heart disease").
    2. DO NOT prescribe any medicine (e.g. do not say "take this medicine").
    3. DO NOT say the donor is 100% fit (e.g. do not write "100% fit").
    4. DO NOT give final blood donation approval (e.g. do not write "definitely donate").
    5. Always advise the donor that final blood donation approval is decided only after medical screening by medical staff at the camp.
    6. If values seem concerning, advise routine doctor consultation.
    7. Agar User ne Health Report upload ki hai (Report Type is not 'None'), toh description/healthSummary me user ke upload kiye hue report type (jaise ${reportType}) ko acknowledge karein aur batayein ki unki report check ki ja chuki hai aur save ho gayi hai. User ko regular verification ke liye apni physical report camp me carry karne ki advice dein.
    8. Response MUST be in the following JSON format strictly:
    {
      "healthSummary": "General summary of stats and general wellness suggestions in Hinglish/Hindi",
      "suggestionLevel": "Good | Needs Attention | Consult Doctor",
      "keyObservations": ["Key observation 1 in Hindi", "Key observation 2 in Hindi"],
      "lifestyleSuggestions": ["Suggestion 1 in Hindi", "Suggestion 2 in Hindi"],
      "bloodDonationSuggestion": "Blood donation advice in Hindi, emphasizing doctor's screening is final",
      "doctorAdvice": "Advice to check with doctor in Hindi if needed, or routine checkups",
      "importantNote": "Ye sirf general health suggestion hai. Ye medical diagnosis ya treatment nahi hai. Blood donation ka final decision doctor/medical staff karega."
    }
    `;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    console.log("Calling Gemini...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    console.log("Gemini Response text:");
    console.log(response.text);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("Error:", err);
  });
