
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PlantInfo, ChatMessage } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PLANT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    commonName: { type: Type.STRING, description: "Common name of the plant" },
    scientificName: { type: Type.STRING, description: "Botanical scientific name" },
    family: { type: Type.STRING, description: "Plant family" },
    origin: { type: Type.STRING, description: "Native region of the plant" },
    description: { type: Type.STRING, description: "Detailed description of the plant's appearance and characteristics" },
    toxicity: {
      type: Type.OBJECT,
      properties: {
        isToxic: { type: Type.BOOLEAN, description: "Whether the plant is toxic to humans/pets" },
        details: { type: Type.STRING, description: "Specific toxicity details (e.g. causes skin irritation)" }
      },
      required: ["isToxic", "details"]
    },
    care: {
      type: Type.OBJECT,
      properties: {
        water: { type: Type.STRING, description: "Watering frequency and method" },
        light: { type: Type.STRING, description: "Lighting requirements" },
        soil: { type: Type.STRING, description: "Soil type preferences" },
        humidity: { type: Type.STRING, description: "Humidity needs" },
        fertilizer: { type: Type.STRING, description: "Fertilization schedule" }
      },
      required: ["water", "light", "soil", "humidity", "fertilizer"]
    },
    funFact: { type: Type.STRING, description: "An interesting botanical fact about this plant" }
  },
  required: ["commonName", "scientificName", "family", "origin", "description", "toxicity", "care", "funFact"]
};

export const identifyPlant = async (base64Image: string): Promise<PlantInfo> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          { text: "Identify the plant in this image. Provide highly detailed and accurate botanical information. Use scientific terminology where appropriate but keep the description engaging." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: PLANT_SCHEMA
      }
    });

    if (!response.text) {
      throw new Error("No identification data received.");
    }

    return JSON.parse(response.text) as PlantInfo;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to identify the plant. Please try a clearer photo.");
  }
};

export const searchPlantByName = async (query: string): Promise<PlantInfo> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for detailed botanical information about the plant called: "${query}". Provide highly accurate data including scientific name, family, origin, care instructions, and toxicity.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: PLANT_SCHEMA
      }
    });

    if (!response.text) {
      throw new Error("No plant data found for this query.");
    }

    return JSON.parse(response.text) as PlantInfo;
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw new Error("I couldn't find detailed info for that plant. Try a more specific name.");
  }
};

export const chatWithExpert = async (message: string, history: ChatMessage[], currentPlant?: PlantInfo): Promise<string> => {
  try {
    const systemInstruction = `You are a world-class botanical expert and plant care specialist at LeafID. 
    Your goal is to provide accurate, friendly, and scientifically sound advice about plants. 
    Keep responses concise but informative. 
    ${currentPlant ? `The user is currently looking at a ${currentPlant.commonName} (${currentPlant.scientificName}).` : ""}
    If you don't know something about a plant, admit it and suggest consulting a local nursery.`;

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction,
      },
    });

    const response = await chat.sendMessage({ message });
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having trouble connecting to my botanical database right now.";
  }
};
