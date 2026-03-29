// TEDAR — Groq LLM implementation
// This is the ONLY file that imports groq-sdk directly.
// Model: llama-3.3-70b-versatile — fast, free tier, reliable JSON output

import Groq from 'groq-sdk';
import { LLM_TEMPERATURE, LLM_MAX_TOKENS } from '../config';
import { LLMResponse } from '../types';

const MODEL_ID = 'llama-3.3-70b-versatile';

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set in environment variables');
  return new Groq({ apiKey });
}

export async function generateWithGroq(
  systemPrompt: string,
  userMessage: string
): Promise<LLMResponse> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: MODEL_ID,
    temperature: LLM_TEMPERATURE,
    max_tokens: LLM_MAX_TOKENS,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? '';
  const tokensUsed = completion.usage?.total_tokens;

  return { text, tokensUsed };
}
