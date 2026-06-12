// TEDAR — Stats refresh API route
// Re-fetches live YouTube stats for one video and appends a performance
// snapshot. Merged from DP-YT-PIPELINE's /refresh-stats.

import { NextRequest, NextResponse } from 'next/server';
import { refreshVideoStats } from '@/lib/refresh-stats';

export const maxDuration = 30;

interface RefreshBody {
  videoId: string; // Supabase UUID
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: RefreshBody;
  try {
    body = (await request.json()) as RefreshBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body', code: 'INVALID_BODY' },
      { status: 400 }
    );
  }

  if (!body.videoId || typeof body.videoId !== 'string' || !body.videoId.trim()) {
    return NextResponse.json(
      { error: 'videoId (Supabase UUID) is required', code: 'INVALID_ID' },
      { status: 400 }
    );
  }

  try {
    const stats = await refreshVideoStats(body.videoId);
    return NextResponse.json({ data: stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    const status = message.includes('not found') || message.includes('no longer available') ? 404 : 500;
    return NextResponse.json({ error: message, code: 'REFRESH_FAILED' }, { status });
  }
}
