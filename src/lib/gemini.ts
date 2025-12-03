// src/lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

/**
 * Call Google Gemini 2.0 Flash for text-based AI tasks
 * Supports structured JSON outputs for expense categorization
 */
export async function callGemini(prompt: string): Promise<string> {
  try {
    // Use gemini-1.5-flash model with JSON mode for better compatibility
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
      }
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error("Empty response from Gemini");
    }
    
    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(`Gemini failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Call Gemini with vision capabilities for receipt scanning
 * Accepts image data and extracts expense information
 */
export async function callGeminiVision(
  prompt: string,
  imageData: string // base64 encoded image
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
      }
    });

    // Parse the base64 image data
    const imageParts = [
      {
        inlineData: {
          data: imageData.split(",")[1] || imageData, // Remove data:image/png;base64, prefix if present
          mimeType: "image/jpeg",
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error("Empty response from Gemini Vision");
    }
    
    return text;
  } catch (error) {
    console.error("Gemini Vision API error:", error);
    throw new Error(`Gemini Vision failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Categorize an expense using Gemini AI
 */
export async function categorizeExpense(merchant: string, amount: number): Promise<string> {
  const prompt = `Categorize this expense into one of these categories: Food, Transport, Shopping, Entertainment, Bills, Health, Other.
  
Merchant: ${merchant}
Amount: $${amount}

Return ONLY a JSON object with this format:
{
  "category": "category_name",
  "confidence": "high|medium|low"
}`;

  const response = await callGemini(prompt);
  try {
    const parsed = JSON.parse(response);
    return parsed.category || "Other";
  } catch {
    // If JSON parsing fails, try to extract category from text
    return "Other";
  }
}
