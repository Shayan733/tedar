// TEDAR — Refresh video stats from YouTube
// Merged from DP-YT-PIPELINE's /refresh-stats: re-fetches live view/like/
// comment counts, updates the video row, and appends a snapshot so
// performance over time is never lost.

import { supabaseAdmin, insertVideoSnapshot } from './supabase';
import { getVideoById } from './supabase-decoder';

export interface RefreshedStats {
  videoId: string;
  viewCount: number;
  likeCount: number | null;
  commentCount: number | null;
  refreshedAt: string;
}

export async function refreshVideoStats(videoId: string): Promise<RefreshedStats> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not set');

  const video = await getVideoById(videoId);
  if (!video) throw new Error('Video not found.');

  const params = new URLSearchParams({
    id: video.youtubeVideoId,
    part: 'statistics',
    key: apiKey,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);

  const data = await res.json() as {
    items?: { statistics?: { viewCount?: string; likeCount?: string; commentCount?: string } }[];
  };
  const stats = data.items?.[0]?.statistics;
  if (!stats) throw new Error('Video no longer available on YouTube.');

  const viewCount = parseInt(stats.viewCount ?? '0', 10);
  const likeCount = stats.likeCount ? parseInt(stats.likeCount, 10) : null;
  const commentCount = stats.commentCount ? parseInt(stats.commentCount, 10) : null;
  const refreshedAt = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from('videos')
    .update({ view_count: viewCount, like_count: likeCount, comment_count: commentCount })
    .eq('id', videoId);
  if (error) throw new Error(`Failed to update stats for video ${videoId}: ${error.message}`);

  await insertVideoSnapshot({
    videoId,
    scannedAt: refreshedAt,
    viewCount,
    likeCount: likeCount ?? undefined,
    commentCount: commentCount ?? undefined,
  });

  return { videoId, viewCount, likeCount, commentCount, refreshedAt };
}
