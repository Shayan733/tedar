// TEDAR — Input Interpreter API Route
// Classifies user input via LLM. Fast — no YouTube calls, no pipeline.
// Returns either a ready-to-run intent or a single clarifying question.

import { NextRequest, NextResponse } from 'next/server';
import { buildInputInterpreterPrompt } from '@/lib/prompts/input-interpreter';
import { generateLLMResponse, stripJsonFences } from '@/lib/llm/provider';

interface InterpretBody {
  userInput: string;
  conversationHistory?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: InterpretBody;
  try {
    body = await req.json() as InterpretBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { userInput, conversationHistory } = body;

  if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
    return NextResponse.json({ error: 'userInput is required' }, { status: 400 });
  }

  try {
    const { systemPrompt, userMessage } = buildInputInterpreterPrompt(userInput, conversationHistory);
    const llmResponse = await generateLLMResponse(systemPrompt, userMessage);
    const cleaned = stripJsonFences(llmResponse.text);

    try {
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      return NextResponse.json(parsed);
    } catch {
      // LLM returned non-JSON despite instructions — return a safe fallback
      return NextResponse.json({
        isReady: false,
        clarifyingQuestion: "I didn't quite catch that. Could you rephrase — are you looking for a niche, a channel URL, or a video URL?",
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
