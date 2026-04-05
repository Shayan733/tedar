// TEDAR — Scout Scan endpoint
// Step 2 of progressive niche mode: scan a single channel → return outliers
// Called once per channel in the frontend loop. No LLM call.

import { NextRequest, NextResponse } from 'next/server';
import { getChannelVideos } from '@/lib/youtube/channel';
import { detectOutliers } from '@/lib/youtube/outlier';
import { upsertChannel, upsertVideo } from '@/lib/supabase';
import { DEFAULT_CONFIG } from '@/lib/config';
import { OutlierResult } from '@/lib/types';

export const maxDuration = 30;

interface ScanBody {
  youtubeChannelId: string;
  channelName: string;
  channelUrl?: string;
  nicheId?: string;
  relevanceScore?: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: ScanBody;
  try {
    body = (await req.json()) as ScanBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { youtubeChannelId, channelName, channelUrl, nicheId, relevanceScore } = body;
  if (!youtubeChannelId || !channelName) {
    return NextResponse.json({ error: 'youtubeChannelId and channelName are required' }, { status: 400 });
  }

  try {
    const channelDbId = await upsertChannel({
      youtubeChannelId,
      channelName,
      channelUrl: channelUrl ?? `https://www.youtube.com/channel/${youtubeChannelId}`,
      nicheId,
      relevanceScore,
    });

    const videos = await getChannelVideos(youtubeChannelId, DEFAULT_CONFIG.maxVideosPerChannel);
    const outliers = detectOutliers(videos, channelName, DEFAULT_CONFIG);
    const sortedOutliers: OutlierResult[] = outliers
      .sort((a, b) => b.outlierScore - a.outlierScore)
      .map((o, i) => ({ ...o, rank: i + 1 }));

    for (const video of videos) {
      const outlier = sortedOutliers.find(o => o.video.youtubeVideoId === video.youtubeVideoId);
      await upsertVideo({
        ...video,
        channelId: channelDbId,
        outlierScore: outlier?.outlierScore,
        outlierCategory: outlier?.outlierCategory,
      });
    }

    return NextResponse.json({ data: sortedOutliers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
