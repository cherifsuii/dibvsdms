import { GoogleGenAI } from "@google/genai";
import { KNOWLEDGE_BASE } from '../data/knowledgeBase';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function generateResponse(userQuery: string): Promise<{ answer: string; source: string; }> {
    const model = "gemini-2.5-flash";

    const prompt = `
System Instruction: You are an expert academic advisor for ENSTP, the École Nationale Supérieure des Travaux Publics in Algeria. Your sole purpose is to help students choose between the DMS (Département des Matériaux et Structures) and DIB (Département des Infrastructures de Base) departments.

**CRITICAL INSTRUCTIONS:**
1.  **Use ONLY the provided context below.** Do not use any external knowledge.
2.  **Analyze the user's query language.** If the query is in French, respond in French. If in English, respond in English. If mixed, choose the dominant language.
3.  **Respond in a JSON format.** Your entire response must be a single JSON object with two keys:
    - "answer": A string containing the user-facing response. The response should be helpful, encouraging, and use clear markdown formatting (bolding, lists). Never use H1 tags or '#' markdown.
    - "source": A string containing the title of the *most relevant section* from the context used to generate the answer. Be as specific as possible (e.g., "Section 5.1: DMS-Specific Engineering Modules", "Section 9.3: DIB Graduate Predominant Sectors", or "Section 13: Detailed Semester Breakdown").
4.  **If the answer is not in the context**, the "answer" should state that you cannot find the information in the provided guide, and the "source" should be "N/A".

--- CONTEXT: KNOWLEDGE BASE ---
${KNOWLEDGE_BASE}
--- END OF CONTEXT ---

User Query: "${userQuery}"

Based on the context provided, generate the JSON response.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        
        let responseText = response.text.trim();
        // The model may wrap the JSON in a markdown block, so we extract it.
        if (responseText.startsWith('```json')) {
            responseText = responseText.substring(7, responseText.length - 3).trim();
        }

        try {
            const parsed = JSON.parse(responseText);
            if (parsed.answer && parsed.source) {
                return {
                    answer: parsed.answer,
                    source: parsed.source,
                };
            }
            // If parsing succeeds but keys are missing, fall through to the error state.
        } catch (e) {
            console.error("Failed to parse JSON from model response:", responseText);
            // Fallback: return the raw text if JSON parsing fails, as it might still be useful.
            return {
                answer: "I received a response, but it had a formatting issue. Here is the raw text:\n\n" + responseText,
                source: "Source not identified due to formatting error.",
            };
        }

        // This should not be reached if parsing is successful, but it's a safe fallback.
        return {
            answer: "An unexpected formatting error occurred in the response.",
            source: "N/A",
        };

    } catch (error: any) {
        console.error("Gemini API call failed:", error);

        // Default user-friendly error message
        let userFriendlyError = "I'm sorry, an unexpected error occurred. Please try again later.";

        if (error && error.message) {
            const errorMessage = error.message.toLowerCase();

            // Check for specific error types and provide tailored user-facing messages
            if (errorMessage.includes('api key not valid')) {
                // Critical configuration error
                userFriendlyError = "I'm unable to connect to the AI service due to a configuration issue (invalid API key). Please notify the application administrator.";
            } else if (errorMessage.includes('safety')) {
                // Content was blocked by safety filters
                userFriendlyError = "The response was blocked by the safety filter. This can sometimes happen with general questions. Please try rephrasing your query.";
            } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
                // Rate limit exceeded due to high traffic
                userFriendlyError = "The service is currently busy. Please wait a few moments before trying again.";
            } else if (errorMessage.includes('500') || errorMessage.includes('503') || errorMessage.includes('server error') || errorMessage.includes('internal error')) {
                // Temporary server-side issue
                userFriendlyError = "The AI service is experiencing a temporary problem. I'm sorry for the inconvenience. Please try again in a little while.";
            } else if (errorMessage.includes('fetch failed') || errorMessage.includes('network')) {
                // Client-side network problem
                userFriendlyError = "It seems there's a network issue. Please check your internet connection and try sending your message again.";
            }
        }
        
        throw new Error(userFriendlyError);
    }
}