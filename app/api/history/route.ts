// TEDAR — Analysis history API route
// Merged from DP-YT-PIPELINE's /analysis-history endpoint: returns every
// analysis run ever made for a video, oldest first. Read-only.

import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisHistory } from '@/lib/supabase-history';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const videoId = request.nextUrl.searchParams.get('videoId')?.trim();
  if (!videoId) {
    return NextResponse.json(
      { error: 'videoId query parameter is required', code: 'INVALID_ID' },
      { status: 400 }
    );
  }

  try {
    const runs = await getAnalysisHistory(videoId);
    return NextResponse.json({
      data: { videoId, totalRuns: runs.length, runs },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
