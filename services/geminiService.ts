import { GoogleGenAI } from "@google/genai";

export const generateSeoMetadata = async (filename: string, mimeType: string, apiKey: string): Promise<{ alt: string, desc: string }> => {
  try {
    if (!apiKey) throw new Error("No API Key provided");

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      I have an image file named "${filename}" with type "${mimeType}".
      Act as an SEO expert.
      1. Generate a concise, descriptive SEO "alt text" (max 12 words).
      2. Generate a short caption/description useful for a blog post (max 25 words).
      
      Return ONLY a valid JSON object like this:
      {
        "alt": "...",
        "desc": "..."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return { alt: filename, desc: 'No description generated.' };

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini SEO Error:", error);
    return {
      alt: filename.split('.')[0].replace(/-/g, ' '),
      desc: 'Optimization complete (AI features unavailable).'
    };
  }
};