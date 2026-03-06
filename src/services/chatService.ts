import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function startChatSession(history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  const model = "gemini-3.1-pro-preview";
  
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: "Eres un asistente experto en nutrición y cocina para la app NutriPlan AI. Ayudas a los usuarios con recetas, planificación de comidas y consejos de salud. Sé amable, profesional y conciso.",
    },
    history
  });

  return chat;
}

export async function sendMessage(chat: any, message: string) {
  const result = await chat.sendMessage({ message });
  return result.text;
}
