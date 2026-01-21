
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getMotivationalMessage = async (userName: string, level: number) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a high-end RPG game narrator. The player ${userName} is currently Level ${level}. 
      Give them a short, 1-sentence epic motivational message to start their school day. 
      Use gaming terminology like 'quests', 'buffs', 'XP', 'boss level'.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The journey of a thousand levels begins with a single quest.";
  }
};

export const analyzeAssignments = async (assignments: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these school assignments: ${JSON.stringify(assignments)}. 
      Which one should be the 'Daily Boss' (highest priority)? 
      Return the answer in JSON format with fields: 'title', 'reason', 'strategy'.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            reason: { type: Type.STRING },
            strategy: { type: Type.STRING }
          },
          required: ['title', 'reason', 'strategy']
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return null;
  }
};
