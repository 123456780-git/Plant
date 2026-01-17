
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { PlantInfo, ChatMessage } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Utility to extract JSON from a string that might contain markdown code blocks.
 */
const extractJson = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON Extraction Error:", e, "Original text:", text);
    throw new Error("Failed to parse botanical data from the response.");
  }
};

const JSON_PROMPT_INSTRUCTION = `
Return the analysis as a raw JSON object with the following structure:
{
  "commonName": "string",
  "scientificName": "string",
  "family": "string",
  "origin": "string",
  "description": "string",
  "toxicity": { "isToxic": boolean, "details": "string" },
  "care": { "water": "string", "light": "string", "soil": "string", "humidity": "string", "fertilizer": "string" },
  "metrics": { "waterVolumeMl": "string", "maxHeightCm": "string", "optimalLuxRange": "string" },
  "diagnosis": { "status": "Healthy" | "Stressed" | "Critical", "vitals": "string", "issues": ["string"], "remedy": "string" },
  "funFact": "string",
  "relatedSpecies": [
    { "name": "string", "scientificName": "string", "reason": "string" }
  ]
}
`;

export const identifyPlant = async (base64Image: string): Promise<PlantInfo> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: `Perform a deep botanical analysis. Use real-time web data to verify species. 1. Identify species. 2. Diagnose health. 3. Provide native geographic data. 4. Suggest 3 related species. ${JSON_PROMPT_INSTRUCTION}` }
        ]
      },
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text;
    if (!text) throw new Error("Genomic parsing failed.");

    const data = extractJson(text) as PlantInfo;
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      data.groundingLinks = groundingChunks
        .filter((c: any) => c.web)
        .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
    }

    return data;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(error.message || "Specimen analysis aborted. Possible server disconnect.");
  }
};

export const searchPlantByName = async (query: string): Promise<PlantInfo> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for real-time botanical info on: "${query}". Include the latest care trends, geographic data, and 3 related species. ${JSON_PROMPT_INSTRUCTION}`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text;
    if (!text) throw new Error("No botanical match found.");
    
    const data = extractJson(text) as PlantInfo;

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      data.groundingLinks = groundingChunks
        .filter((c: any) => c.web)
        .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
    }

    return data;
  } catch (error: any) {
    console.error("Gemini Search Error:", error);
    throw new Error(error.message || "Botanical index query failed.");
  }
};

export const chatWithExpert = async (message: string, history: ChatMessage[], currentPlant?: PlantInfo): Promise<string> => {
  try {
    const systemInstruction = `You are a world-class botanical specialist. ${currentPlant ? `You are analyzing a ${currentPlant.commonName} that is currently ${currentPlant.diagnosis.status}.` : "Offer expert botanical advice."}`;
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: { systemInstruction },
    });
    const response = await chat.sendMessage({ message });
    return response.text || "Neural connection lost.";
  } catch (error) {
    return "Botanical agent is offline.";
  }
};
