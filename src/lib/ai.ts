// src/lib/ai.ts
import { callGemini as callGeminiAPI } from "./gemini";

/**
 * Main AI function - uses Google Gemini 1.5 Flash
 * All AI calls now go through Gemini for consistency and reliability
 */
export async function callAI(prompt: string) {
  try {
    return await callGeminiAPI(prompt);
  } catch (err) {
    console.error("Gemini AI error:", err);
    throw err; // Let the caller handle the error with proper fallback
  }
}
