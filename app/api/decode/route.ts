// TEDAR — Decode API route
// Receives a video URL, runs the Decoder pipeline, returns the analysis.
// Checks cache first — only calls the LLM if the video hasn't been decoded yet.

import { NextRequest, NextResponse } from 'next/server';
import { decodeVideo } from '@/lib/analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const videoUrl = body.videoUrl;
    const forceRefresh = body.forceRefresh === true;

    if (!videoUrl || typeof videoUrl !== 'string') {
      return NextResponse.json(
        { error: 'Video URL is required', code: 'INVALID_URL' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const { result, cached } = await decodeVideo(videoUrl, { forceRefresh });
    const processingTimeMs = Date.now() - startTime;

    return NextResponse.json({
      data: result,
      meta: { processingTimeMs, cached },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { error: message, code: 'DECODE_FAILED' },
      { status: 500 }
    );
  }
}
