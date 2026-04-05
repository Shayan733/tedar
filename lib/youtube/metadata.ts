// TEDAR — Fetch metadata for a single YouTube video
// Uses direct fetch to YouTube Data API v3 (edge-compatible — no googleapis dependency).

import { VideoData } from '../types';

function extractVideoId(url: string): string {
  const m = url.match(/[?&]v=([^&]+)/); if (m) return m[1];
  const s = url.match(/youtu\.be\/([^?&]+)/); if (s) return s[1];
  const e = url.match(/\/embed\/([^?&]+)/); if (e) return e[1];
  if (/^[\w-]{11}$/.test(url)) return url;
  throw new Error(`Could not extract video ID from: ${url}`);
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] ?? '0', 10)) * 3600
       + (parseInt(match[2] ?? '0', 10)) * 60
       + (parseInt(match[3] ?? '0', 10));
}

interface YTVideoItem {
  id?: string;
  snippet?: {
    title?: string; description?: string; channelId?: string;
    publishedAt?: string; tags?: string[];
    thumbnails?: { high?: { url?: string }; default?: { url?: string } };
  };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  contentDetails?: { duration?: string };
}

export async function getVideoData(videoUrl: string): Promise<VideoData> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not set');

  const videoId = extractVideoId(videoUrl);
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data = await res.json() as { items?: YTVideoItem[] };

  const item = data.items?.[0];
  if (!item) throw new Error(`Video not found: ${videoUrl}`);

  const stats = item.statistics ?? {};
  const snippet = item.snippet ?? {};

  return {
    youtubeVideoId: item.id ?? videoId,
    channelId: snippet.channelId ?? undefined,
    title: snippet.title ?? '',
    description: snippet.description ?? '',
    url: `https://www.youtube.com/watch?v=${item.id ?? videoId}`,
    viewCount: parseInt(stats.viewCount ?? '0', 10),
    likeCount: stats.likeCount ? parseInt(stats.likeCount, 10) : undefined,
    commentCount: stats.commentCount ? parseInt(stats.commentCount, 10) : undefined,
    durationSeconds: parseDuration(item.contentDetails?.duration ?? ''),
    publishedAt: snippet.publishedAt ?? undefined,
    thumbnailUrl: snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url ?? undefined,
    tags: snippet.tags ?? [],
    hasTranscript: false,
    hasAnalysis: false,
  };
}
