// TEDAR — Audience Decode API route (streaming)
// Accepts a videoId (Supabase UUID), fetches top comments live from YouTube,
// runs the audience-reaction analysis, and streams progress via SSE.

import { NextRequest, NextResponse } from 'next/server';
import { decodeAudience } from '@/lib/audience';
import { createStreamResponse } from '@/lib/streaming';

export const maxDuration = 60; // Vercel function timeout for comments fetch + LLM call

interface AudienceBody {
  videoId: string;       // Supabase UUID — NOT the YouTube video ID
  forceRefresh?: boolean;
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: AudienceBody;
  try {
    body = (await request.json()) as AudienceBody;
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
    const result = await decodeAudience(videoId, {
      forceRefresh,
      onProgress: (message) => send({ type: 'progress', message }),
    });

    send({ type: 'result', data: result });
  });
}
