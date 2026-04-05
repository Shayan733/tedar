// TEDAR — Decode API route (streaming)
// Task 2C: Accepts videoId (Supabase UUID) and runs analyseVideo() only.
// prepareVideo() is handled separately by /api/decode/prepare.
// Progress messages stream via SSE as the K1 analysis runs.

import { NextRequest, NextResponse } from 'next/server';
import { analyseVideo } from '@/lib/analysis';
import { createStreamResponse } from '@/lib/streaming';

export const maxDuration = 60; // Vercel function timeout for LLM call

interface DecodeBody {
  videoId: string;       // Supabase UUID — NOT the YouTube video ID
  forceRefresh?: boolean;
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: DecodeBody;
  try {
    body = (await request.json()) as DecodeBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body', code: 'INVALID_BODY' },
      { status: 400 }
    );
  }

  const { videoId, forceRefresh = false } = body;

  if (!videoId || typeof videoId !== 'string' || !videoId.trim()) {
    return NextResponse.json(
      { error: 'videoId (Supabase UUID) is required', code: 'INVALID_ID' },
      { status: 400 }
    );
  }

  return createStreamResponse(async (send) => {
    const result = await analyseVideo(videoId, {
      forceRefresh,
      onProgress: (message) => send({ type: 'progress', message }),
    });

    send({ type: 'result', data: result });
  });
}
