// src/services/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  // To avoid crashing the app if the key is not set, we'll log an error.
  // The UI can handle this gracefully.
  console.error("VITE_GEMINI_API_KEY is not set in the environment variables");
}

// Initialize with a check for the API key to prevent app crash
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const getGeminiModel = () => {
  if (!genAI) {
    console.error("Gemini AI not initialized. Please set VITE_GEMINI_API_KEY.");
    return null;
  }
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
};

console.log("Gemini Service Initialized (if API key is provided).");
