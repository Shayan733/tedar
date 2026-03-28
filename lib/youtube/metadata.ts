// TEDAR — Fetch metadata for a single YouTube video
// Used when a user pastes a specific video URL (Mode 3 input).

import { google } from 'googleapis';
import { VideoData } from '../types';

function getYouTubeClient() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not set in environment variables');
  return google.youtube({ version: 'v3', auth: apiKey });
}

function extractVideoId(url: string): string {
  // Standard: https://www.youtube.com/watch?v=VIDEO_ID
  const standardMatch = url.match(/[?&]v=([^&]+)/);
  if (standardMatch) return standardMatch[1];

  // Short: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];

  // Embed: https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/\/embed\/([^?&]+)/);
  if (embedMatch) return embedMatch[1];

  // Raw ID (11 chars, alphanumeric + - _)
  if (/^[\w-]{11}$/.test(url)) return url;

  throw new Error(`Could not extract video ID from: ${url}`);
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? '0', 10);
  const minutes = parseInt(match[2] ?? '0', 10);
  const seconds = parseInt(match[3] ?? '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function getVideoData(videoUrl: string): Promise<VideoData> {
  const youtube = getYouTubeClient();
  const videoId = extractVideoId(videoUrl);

  const response = await youtube.videos.list({
    part: ['snippet', 'statistics', 'contentDetails'],
    id: [videoId],
  });

  const item = response.data.items?.[0];
  if (!item) throw new Error(`Video not found: ${videoUrl}`);

  const stats = item.statistics ?? {};
  const snippet = item.snippet ?? {};

  return {
    youtubeVideoId: item.id!,
    channelId: snippet.channelId ?? undefined,
    title: snippet.title ?? '',
    description: snippet.description ?? '',
    url: `https://www.youtube.com/watch?v=${item.id}`,
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
