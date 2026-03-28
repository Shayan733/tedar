// TEDAR — Model-agnostic LLM wrapper
// Every part of the app calls THIS function — never the provider files directly.
// To switch AI provider: change LLM_PROVIDER in .env.local. Nothing else changes.

import { LLMResponse } from '../types';
import { generateWithGemini } from './gemini';

// Strips markdown code fences that LLMs sometimes add despite being told not to.
// e.g. ```json\n[...]\n``` → [...]
export function stripJsonFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

export async function generateLLMResponse(
  systemPrompt: string,
  userMessage: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<LLMResponse> {
  const provider = process.env.LLM_PROVIDER ?? 'gemini';

  // options are accepted for future use but Gemini reads from config by default
  void options;

  switch (provider) {
    case 'gemini':
      return generateWithGemini(systemPrompt, userMessage);
    case 'claude':
      throw new Error('Claude provider not yet implemented. Set LLM_PROVIDER=gemini in .env.local');
    case 'openai':
      throw new Error('OpenAI provider not yet implemented. Set LLM_PROVIDER=gemini in .env.local');
    default:
      throw new Error(`Unknown LLM provider: "${provider}". Valid options: gemini, claude, openai`);
  }
}
