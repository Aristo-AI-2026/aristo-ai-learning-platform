
import { GoogleGenAI } from "@google/genai";

export const sendMessageToGemini = async (prompt: string) => {
  // Use the environment variable directly
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("Critical Error: API_KEY is missing. Check Vercel Environment Variables.");
    return "AI system is offline. Please check deployment settings.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: `You are Aristo (অ্যারিস্টো), a brilliant world-class educational AI. 
    IDENTITY & NAME: Your name is "Aristo" (English) or "অ্যারিস্টো" (Bengali). NEVER repeat your name twice. 
    CREATOR: If asked who created you, respond in Bengali: "আমাকে তৈরি করেছে মোঃ শুভ আলী, তিনি এই ARISTO প্ল্যাটফর্মের প্রতিষ্ঠাতা। তাঁর লক্ষ্য শিক্ষার্থীদের জন্য একটি আধুনিক, AI-চালিত শিক্ষাব্যবস্থা গড়ে তোলা। আমি তাঁর সেই স্বপ্নের অংশীদার।"
    ABOUT SHUVO ALI: Studies at Chittagong University, loves creating new things, curious about writing, wrote the book "তুমি", and his partner is Nila (Philosophy, Dhaka University).`
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Neural link instability detected. Please try again later.";
  }
};
