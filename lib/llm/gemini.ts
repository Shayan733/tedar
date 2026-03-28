// TEDAR — Gemini LLM implementation
// This is the ONLY file that imports @google/generative-ai directly.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLM_TEMPERATURE, LLM_MAX_TOKENS } from '../config';
import { LLMResponse } from '../types';

const MODEL_ID = 'gemini-2.5-flash'; // NEVER change this to gemini-2.0-flash

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment variables');
  return new GoogleGenerativeAI(apiKey);
}

async function attempt(systemPrompt: string, userMessage: string): Promise<LLMResponse> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: LLM_TEMPERATURE,
      maxOutputTokens: LLM_MAX_TOKENS,
    },
  });

  const result = await model.generateContent(userMessage);
  const response = result.response;
  const text = response.text();
  const tokensUsed = response.usageMetadata?.totalTokenCount;

  return { text, tokensUsed };
}

export async function generateWithGemini(
  systemPrompt: string,
  userMessage: string
): Promise<LLMResponse> {
  try {
    return await attempt(systemPrompt, userMessage);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // Rate limit: wait 60s and retry once
    if (message.includes('429') || message.toLowerCase().includes('quota')) {
      console.warn('Gemini rate limit hit — waiting 60s before retry...');
      await new Promise((resolve) => setTimeout(resolve, 60000));
      return await attempt(systemPrompt, userMessage);
    }

    // Malformed response: retry once immediately
    if (message.toLowerCase().includes('parse') || message.toLowerCase().includes('json')) {
      console.warn('Gemini parse error — retrying once...');
      return await attempt(systemPrompt, userMessage);
    }

    throw new Error(`Gemini error: ${message}`);
  }
}
