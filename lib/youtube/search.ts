// TEDAR — YouTube channel search by keyword
// Step 1 of the Scout: find up to 50 candidate channels for a niche keyword.

import { google } from 'googleapis';
import { ChannelSearchResult } from '../types';
import { YOUTUBE_MAX_RESULTS } from '../config';

function getYouTubeClient() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not set in environment variables');
  return google.youtube({ version: 'v3', auth: apiKey });
}

export async function searchChannels(keyword: string): Promise<ChannelSearchResult[]> {
  const youtube = getYouTubeClient();

  let response;
  try {
    response = await youtube.search.list({
      part: ['snippet'],
      q: keyword,
      type: ['channel'],
      maxResults: YOUTUBE_MAX_RESULTS,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('quotaExceeded')) {
      throw new Error('YouTube API quota exceeded. Resets at midnight Pacific (8am UK time).');
    }
    throw new Error(`YouTube search failed: ${message}`);
  }

  const items = response.data.items ?? [];

  return items
    .filter((item) => item.id?.channelId && item.snippet?.channelTitle)
    .map((item) => ({
      youtubeChannelId: item.id!.channelId!,
      channelName: item.snippet!.channelTitle!,
      channelUrl: `https://www.youtube.com/channel/${item.id!.channelId}`,
      description: item.snippet?.description ?? '',
      thumbnailUrl: item.snippet?.thumbnails?.default?.url ?? undefined,
    }));
}
