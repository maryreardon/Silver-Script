import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TUTOR_SYSTEM_INSTRUCTION = `
You are "SilverScript", a patient, kind, and encouraging coding tutor specifically designed for senior citizens (ages 65+).
Your goal is to explain programming concepts using real-world analogies that seniors can relate to (e.g., cooking recipes for algorithms, filing cabinets for databases, address books for variables).
1. Speak clearly and simply. Avoid technical jargon unless you explain it immediately.
2. Be very polite and supportive. Use phrases like "That's a great question!", "Take your time", and "You're doing wonderful".
3. Keep explanations concise but thorough.
4. When generating lesson content, structure it with clear headings and bullet points.
5. If the user seems confused, offer to explain it in a different way.
`;

export const generateLessonContent = async (topicTitle: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a beginner-friendly coding lesson about "${topicTitle}".
      
      Structure the lesson as follows:
      1. **Introduction**: What is this concept? (Use an analogy).
      2. **Why it matters**: A simple explanation of why computers need this.
      3. **Real World Example**: Connect it to daily life (e.g., a recipe, a car, a library).
      4. **Simple Code Example**: Show a very simple snippet (Python or Pseudo-code) and explain it line by line.
      5. **Summary**: A one-sentence takeaway.
      
      Format using Markdown. Keep the tone warm, respectful, and encouraging for a senior audience.`,
      config: {
        systemInstruction: TUTOR_SYSTEM_INSTRUCTION,
        temperature: 0.3,
      }
    });

    return response.text || "I apologize, I couldn't generate the lesson at this moment. Please try again.";
  } catch (error) {
    console.error("Error generating lesson:", error);
    return "We are having trouble connecting to the library. Please check your internet connection or try again later.";
  }
};

export const sendChatMessage = async (
  history: ChatMessage[],
  newMessage: string,
  currentContext: string
): Promise<string> => {
  try {
    // We construct a chat history for the model
    // In a real app, we would use ai.chats.create and maintain the session object.
    // For this stateless implementation, we'll append context to the prompt or use a fresh chat each turn with history context if needed.
    // To keep it simple and robust, we'll use a single generateContent call with the conversation context.

    const conversationString = history.map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text}`).join('\n');
    
    const prompt = `
    Current Lesson Context: ${currentContext.substring(0, 500)}... (context truncated)
    
    Conversation History:
    ${conversationString}
    
    Student: ${newMessage}
    Tutor:`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: TUTOR_SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "I didn't quite catch that. Could you say it again?";
  } catch (error) {
    console.error("Error in chat:", error);
    return "I'm having a little trouble thinking right now. Let's try that again.";
  }
};
