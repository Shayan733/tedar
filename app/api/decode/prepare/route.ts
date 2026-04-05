// TEDAR — Decode Prepare endpoint
// Fetches video metadata + transcript and saves to DB. No LLM call.
// Called by the client immediately on landing on the decode page (~5 seconds).

import { NextRequest, NextResponse } from 'next/server';
import { prepareVideo } from '@/lib/analysis';

export const maxDuration = 30; // Vercel function timeout

type ErrorCode =
  | 'INVALID_URL'
  | 'VIDEO_NOT_FOUND'
  | 'NO_TRANSCRIPT'
  | 'TRANSCRIPT_FETCH_FAILED'
  | 'INTERNAL_ERROR';

function classifyError(err: unknown): { code: ErrorCode; status: number } {
  const msg = err instanceof Error ? err.message : '';

  if (
    msg.includes('private') ||
    msg.includes('deleted') ||
    msg.includes('unavailable') ||
    msg.includes('not found')
  ) {
    return { code: 'VIDEO_NOT_FOUND', status: 404 };
  }

  if (msg.includes('does not have captions')) {
    return { code: 'NO_TRANSCRIPT', status: 404 };
  }

  if (
    msg.includes('server region') ||
    msg.includes('Could not fetch') ||
    msg.includes('try again')
  ) {
    return { code: 'TRANSCRIPT_FETCH_FAILED', status: 503 };
  }

  return { code: 'INTERNAL_ERROR', status: 500 };
}

interface PrepareBody {
  videoUrl: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: PrepareBody;
  try {
    body = (await req.json()) as PrepareBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body', code: 'INVALID_URL' },
      { status: 400 }
    );
  }

  const { videoUrl } = body;

  if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.trim()) {
    return NextResponse.json(
      { error: 'videoUrl is required', code: 'INVALID_URL' },
      { status: 400 }
    );
  }

  const startTime = Date.now();

  try {
    const prepared = await prepareVideo(videoUrl);

    return NextResponse.json({
      data: {
        videoId: prepared.videoId,
        youtubeVideoId: prepared.youtubeVideoId,
        videoData: prepared.videoData,
        transcript: prepared.transcript,
        wordCount: prepared.wordCount,
        existingAnalysisId: prepared.existingAnalysisId,
      },
      meta: {
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (err) {
    const { code, status } = classifyError(err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: message, code }, { status });
  }
}
