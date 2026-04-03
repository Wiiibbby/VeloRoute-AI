import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface FoodSpot {
  name: string;
  description: string;
  lat: number;
  lng: number;
}

export const getFoodRecommendations = async (startQuery: string, endQuery: string): Promise<FoodSpot[]> => {
  try {
    const prompt = `I am planning a cycling route from ${startQuery} to ${endQuery}.
Please recommend 5 to 10 highly-rated local food spots along this route.
You MUST use the googleMaps tool to find real, up-to-date places.
In your response, you MUST include a JSON block formatted exactly like this:
\`\`\`json
[
  {
    "name": "Restaurant Name",
    "description": "Short description of why it's good for cyclists",
    "lat": 12.345,
    "lng": 67.890
  }
]
\`\`\`
Do not include any other text outside the JSON block if possible, or just ensure the JSON block is easily parseable. Make sure the lat and lng are numbers.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text || "";
    
    // Extract JSON block
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      return parsed as FoodSpot[];
    }
    
    // Fallback if no markdown block
    const fallbackMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (fallbackMatch) {
      const parsed = JSON.parse(fallbackMatch[0]);
      return parsed as FoodSpot[];
    }

    return [];
  } catch (error) {
    console.error("Gemini error:", error);
    return [];
  }
};
