import { GoogleGenAI, Type } from "@google/genai";
import { Recipe } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function getNutritionalSuggestions(recipes: Recipe[], preferences: any) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Basado en las siguientes recetas y preferencias del usuario, proporciona 3 sugerencias nutricionales personalizadas.
    
    Recetas disponibles:
    ${recipes.map(r => `- ${r.title}: ${r.description}`).join('\n')}
    
    Preferencias del usuario:
    - Restricciones: ${preferences.dietaryRestrictions.join(', ')}
    - Meta de calorías: ${preferences.caloriesGoal}
    
    Responde en formato JSON con un array de objetos que tengan "title" y "description".
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["title", "description"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateRecipeFromPrompt(prompt: string) {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    Eres un chef experto. Genera una receta detallada basada en el prompt del usuario.
    Responde estrictamente en formato JSON con la siguiente estructura:
    {
      "title": "Nombre de la receta",
      "description": "Breve descripción",
      "ingredients": ["ingrediente 1", "ingrediente 2"],
      "instructions": ["paso 1", "paso 2"],
      "nutritionalValue": {
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0
      },
      "category": "Breakfast" | "Lunch" | "Dinner" | "Snack"
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text);
}

export async function generateMealPlanSuggestion(recipes: Recipe[], preferences: any) {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Genera un plan de comidas semanal (7 días) usando las recetas disponibles.
    
    Recetas:
    ${recipes.map(r => `ID: ${r.id}, Título: ${r.title}, Categoría: ${r.category}`).join('\n')}
    
    Preferencias:
    - Restricciones: ${preferences.dietaryRestrictions.join(', ')}
    - Meta de calorías: ${preferences.caloriesGoal}
    
    Responde en formato JSON que coincida con la estructura de MealPlan.days.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text);
}
