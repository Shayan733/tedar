// TEDAR — Model-agnostic LLM wrapper
// Every part of the app calls THIS function — never the provider files directly.
// To switch AI provider: change LLM_PROVIDER in .env.local. Nothing else changes.

import { LLMResponse } from '../types';
import { generateWithGemini } from './gemini';
import { generateWithGroq } from './groq';

// Strips markdown code fences that LLMs sometimes add despite being told not to.
// e.g. ```json\n[...]\n``` → [...]
export function stripJsonFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

export type LLMProvider = 'groq' | 'gemini' | 'claude' | 'openai';

export async function generateLLMResponse(
  systemPrompt: string,
  userMessage: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    provider?: LLMProvider;  // explicit override — avoids mutating process.env per call
  }
): Promise<LLMResponse> {
  const provider = options?.provider ?? process.env.LLM_PROVIDER ?? 'gemini';

  switch (provider) {
    case 'groq':
      return generateWithGroq(systemPrompt, userMessage, options);
    case 'gemini':
      return generateWithGemini(systemPrompt, userMessage, options);
    case 'claude':
      throw new Error('Claude provider not yet implemented.');
    case 'openai':
      throw new Error('OpenAI provider not yet implemented.');
    default:
      throw new Error(`Unknown LLM provider: "${provider}". Valid options: groq, gemini`);
  }
}
