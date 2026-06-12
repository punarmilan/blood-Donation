import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

console.log("Loaded GEMINI_API_KEY:", JSON.stringify(process.env.GEMINI_API_KEY));

const key = process.env.GEMINI_API_KEY || "";
const cleanKey = key.trim();

console.log("Cleaned GEMINI_API_KEY:", JSON.stringify(cleanKey));

const ai = new GoogleGenAI({ apiKey: cleanKey });

async function run() {
  try {
    console.log("Calling Gemini API...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello, tell me a 1-sentence health tip.",
    });
    console.log("Response text:", response.text);
  } catch (error) {
    console.error("Gemini API Error:", error);
  }
}

run();
