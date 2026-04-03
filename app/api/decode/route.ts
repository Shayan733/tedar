// TEDAR — Decode API route (streaming)
// Streams progress events via SSE. Checks cache first — only calls LLM if needed.

import { NextRequest, NextResponse } from 'next/server';
import { decodeVideo } from '@/lib/analysis';
import { createStreamResponse } from '@/lib/streaming';

export async function POST(request: NextRequest): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body', code: 'INVALID_BODY' },
      { status: 400 }
    );
  }

  const videoUrl = body.videoUrl;
  const forceRefresh = body.forceRefresh === true;

  if (!videoUrl || typeof videoUrl !== 'string') {
    return NextResponse.json(
      { error: 'Video URL is required', code: 'INVALID_URL' },
      { status: 400 }
    );
  }

  return createStreamResponse(async (send) => {
    send({ type: 'progress', message: 'Checking cache...' });

    const { result, cached, analysisId } = await decodeVideo(videoUrl, { forceRefresh });

    if (cached) {
      send({ type: 'progress', message: 'Returning cached analysis.' });
    } else {
      send({ type: 'progress', message: 'Transcript ready. Running K1 framework analysis...' });
      send({ type: 'progress', message: 'Saving to database...' });
    }

    send({
      type: 'result',
      data: {
        data: result,
        meta: { cached, analysisId },
      },
    });
  });
}
