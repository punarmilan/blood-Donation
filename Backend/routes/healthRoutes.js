import express from "express";
import { GoogleGenAI } from "@google/genai";
import User from "../models/User.js";
import { verifyToken } from "./authRoutes.js";

const router = express.Router();

// Initialize GoogleGenAI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// POST /api/health/ai-suggestion
router.post("/ai-suggestion", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if required health details exist
    const { health, bloodGroup } = user;
    if (!health || !health.weight || !health.height || !health.age || !health.gender || !bloodGroup) {
      return res.status(400).json({ success: false, message: "Please complete your health details first." });
    }

    // Prepare prompt using donor health data
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

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    let resultJson;
    try {
      resultJson = JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse Gemini response:", response.text);
      return res.status(500).json({ success: false, message: "Failed to generate health report. Please try again." });
    }

    // Safety filter & replacements
    const unsafePairs = [
      { regex: /100%\s*fit/gi, replacement: "general wellness values normal" },
      { regex: /definitely\s*donate/gi, replacement: "may donate subject to medical checkup" },
      { regex: /no\s*need\s*doctor/gi, replacement: "consult doctor for regular checkup" },
      { regex: /take\s*this\s*medicine/gi, replacement: "consult a registered practitioner" },
      { regex: /you\s*have\s*diabetes/gi, replacement: "sugar levels are elevated, check with doctor" },
      { regex: /you\s*have\s*heart\s*disease/gi, replacement: "cardiac evaluation recommended" }
    ];

    // Helper to recursively apply safety filter to string fields
    const applySafetyFilter = (obj) => {
      if (typeof obj === "string") {
        let filtered = obj;
        unsafePairs.forEach(({ regex, replacement }) => {
          filtered = filtered.replace(regex, replacement);
        });
        return filtered;
      } else if (Array.isArray(obj)) {
        return obj.map(item => applySafetyFilter(item));
      } else if (obj !== null && typeof obj === "object") {
        const newObj = {};
        for (const key in obj) {
          newObj[key] = applySafetyFilter(obj[key]);
        }
        return newObj;
      }
      return obj;
    };

    const safeResult = applySafetyFilter(resultJson);

    // Hardcode importantNote to be 100% compliant
    safeResult.importantNote = "Ye sirf general health suggestion hai. Ye medical diagnosis ya treatment nahi hai. Blood donation ka final decision doctor/medical staff karega.";

    // Save to user database
    user.healthSuggestionReport = {
      healthSummary: safeResult.healthSummary,
      suggestionLevel: safeResult.suggestionLevel,
      keyObservations: safeResult.keyObservations,
      lifestyleSuggestions: safeResult.lifestyleSuggestions,
      bloodDonationSuggestion: safeResult.bloodDonationSuggestion,
      doctorAdvice: safeResult.doctorAdvice,
      importantNote: safeResult.importantNote,
      generatedAt: new Date()
    };

    await user.save();

    res.status(200).json({
      success: true,
      data: user.healthSuggestionReport
    });

  } catch (error) {
    console.error("Error generating AI health suggestion:", error);
    res.status(500).json({ success: false, message: "Server error or AI service temporarily unavailable" });
  }
});

// GET /api/health/ai-suggestion (to fetch previous suggestion report if available)
router.get("/ai-suggestion", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("healthSuggestionReport");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({
      success: true,
      data: user.healthSuggestionReport || null
    });
  } catch (error) {
    console.error("Error fetching AI suggestion:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
