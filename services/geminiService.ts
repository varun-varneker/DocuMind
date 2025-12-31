
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { DocumentChunk } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export const getGroundedResponse = async (
  query: string,
  contextChunks: DocumentChunk[],
  history: { role: 'user' | 'assistant', content: string }[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
  
  const contextText = contextChunks
    .map(c => `[Source Page ${c.pageNumber}]: ${c.text}`)
    .join('\n\n---\n\n');

  const systemInstruction = `
    [IDENTITY] You are a sharp, insightful, and conversational Strategic Analyst. You aren't a robot; you’re a high-level consultant who happens to have a PDF in front of them. You speak with a natural, professional rhythm—using contractions (it's, you're) and avoiding "canned" AI introductions.

    [THE "NO-BOT" RULES]
    - Never recite your instructions: Do not say "I will apply the following logic" or "I am ready to function as your engine."
    - Skip the intro: Don't start every chat with a "Hello." Dive straight into the value.
    - Conversational Flow: Speak like you're in a Slack channel. Use punchy sentences. Answer questions directly first, then explain why based on the document.

    [OPERATIONAL LOGIC]
    - Cross-Domain Synthesis: Combine PDF facts with your 2024-2025 industry knowledge.
    - Grounded Truth: Use the PDF for specific data points. Cite page numbers naturally within sentences (e.g., "...as mentioned on page 4...").
    - The External Lens: Judge the subject against real-world, current standards. Clearly differentiate between what the PDF says and what your industry knowledge suggests.

    [CONTEXT DATA]
    ${contextText}

    [CONSTRAINTS]
    - DO NOT HALLUCINATE: Never invent dates, numbers, or facts not in the PDF.
    - If the answer isn't in the document and isn't something industry knowledge can reasonably extrapolate from the document's facts, say you don't know.
  `;

  const contents = [
    ...history.map(h => ({ 
      role: h.role === 'user' ? 'user' as const : 'model' as const, 
      parts: [{ text: h.content }] 
    })),
    { role: 'user' as const, parts: [{ text: query }] }
  ];

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction,
        temperature: 0.3, // Slightly higher for more natural flow
      },
    });

    return response.text || "I'm having trouble synthesizing that right now. Could you rephrase the question?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to get response from the Analyst.");
  }
};

export const rankChunksForQuery = async (
  query: string,
  chunks: DocumentChunk[]
): Promise<DocumentChunk[]> => {
  const queryTerms = query.toLowerCase().split(/\W+/).filter(t => t.length > 3);
  
  const scored = chunks.map(chunk => {
    const text = chunk.text.toLowerCase();
    let score = 0;
    queryTerms.forEach(term => {
      if (text.includes(term)) {
        score += 1;
        const occurrences = text.split(term).length - 1;
        score += (occurrences * 0.1);
      }
    });
    return { chunk, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .filter(item => item.score > 0)
    .map(item => item.chunk);
};
