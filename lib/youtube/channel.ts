// TEDAR — Fetch videos from a YouTube channel
// Step 3 of the Scout: pull the most recent N videos from a channel.

import { google, youtube_v3 } from 'googleapis';
import { VideoData } from '../types';

function getYouTubeClient() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not set in environment variables');
  return google.youtube({ version: 'v3', auth: apiKey });
}

// Accepts: full URL, @handle, or raw channel ID
export async function resolveChannelId(input: string): Promise<string> {
  const youtube = getYouTubeClient();

  // Already a raw channel ID (starts with UC and ~24 chars)
  if (/^UC[\w-]{22}$/.test(input)) return input;

  // Extract @handle from URL or use as-is
  const handleMatch = input.match(/@([\w.-]+)/);
  const handle = handleMatch ? `@${handleMatch[1]}` : input;

  const response = await youtube.channels.list({
    part: ['id'],
    forHandle: handle.replace('@', ''),
  });

  const channelId = response.data.items?.[0]?.id;
  if (!channelId) throw new Error(`Could not resolve channel ID for: ${input}`);
  return channelId;
}

export async function getChannelVideos(
  channelId: string,
  maxResults: number
): Promise<VideoData[]> {
  const youtube = getYouTubeClient();

  // Step 1: get the uploads playlist ID for this channel
  const channelResponse = await youtube.channels.list({
    part: ['contentDetails', 'statistics'],
    id: [channelId],
  });

  const channelItem = channelResponse.data.items?.[0];
  if (!channelItem) throw new Error(`Channel not found: ${channelId}`);

  const uploadsPlaylistId = channelItem.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error(`No uploads playlist for channel: ${channelId}`);

  // Step 2: get video IDs from the uploads playlist
  // YouTube API returns max 50 per request — paginate to collect up to maxResults
  const videoIds: string[] = [];
  let pageToken: string | null | undefined = undefined;

  while (videoIds.length < maxResults) {
    const remaining = maxResults - videoIds.length;
    const playlistResponse: youtube_v3.Schema$PlaylistItemListResponse = (
      await youtube.playlistItems.list({
        part: ['contentDetails'],
        playlistId: uploadsPlaylistId,
        maxResults: Math.min(remaining, 50),
        ...(pageToken ? { pageToken } : {}),
      })
    ).data;

    const pageIds = (playlistResponse.items ?? [])
      .map((item: youtube_v3.Schema$PlaylistItem) => item.contentDetails?.videoId)
      .filter((id: string | null | undefined): id is string => !!id);

    videoIds.push(...pageIds);

    const nextPage = playlistResponse.nextPageToken;
    if (!nextPage || pageIds.length === 0) break;
    pageToken = nextPage;
  }

  if (videoIds.length === 0) return [];

  // Step 3: fetch full metadata in batches of 50 (YouTube videos.list limit)
  const allItems: youtube_v3.Schema$Video[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const videosResponse = await youtube.videos.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      id: batch,
    });
    allItems.push(...(videosResponse.data.items ?? []));
  }

  return allItems.map((item: youtube_v3.Schema$Video) => {
    const stats = item.statistics ?? {};
    const snippet = item.snippet ?? {};

    // Parse ISO 8601 duration to seconds
    const durationSeconds = parseDuration(item.contentDetails?.duration ?? '');

    return {
      youtubeVideoId: item.id!,
      channelId,
      title: snippet.title ?? '',
      description: snippet.description ?? '',
      url: `https://www.youtube.com/watch?v=${item.id}`,
      viewCount: parseInt(stats.viewCount ?? '0', 10),
      likeCount: stats.likeCount ? parseInt(stats.likeCount, 10) : undefined,
      commentCount: stats.commentCount ? parseInt(stats.commentCount, 10) : undefined,
      durationSeconds,
      publishedAt: snippet.publishedAt ?? undefined,
      thumbnailUrl: snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url ?? undefined,
      tags: snippet.tags ?? [],
      hasTranscript: false,
      hasAnalysis: false,
    };
  });
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? '0', 10);
  const minutes = parseInt(match[2] ?? '0', 10);
  const seconds = parseInt(match[3] ?? '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}
