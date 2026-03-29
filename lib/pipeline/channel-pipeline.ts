// TEDAR — Channel Scout Pipeline
// Scans a single channel by URL — skips discovery and LLM ranking steps.

import { google } from 'googleapis';
import { resolveChannelId, getChannelVideos } from '../youtube/channel';
import { detectOutliers } from '../youtube/outlier';
import { upsertChannel, upsertVideo, createPipelineRun, updatePipelineRun } from '../supabase';
import { DEFAULT_CONFIG } from '../config';
import { ChannelPipelineResult } from '../types';

// Fetch channel title from YouTube — getChannelVideos doesn't populate channelName on VideoData
async function fetchChannelName(youtubeChannelId: string): Promise<string> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return 'Unknown Channel';
  const youtube = google.youtube({ version: 'v3', auth: apiKey });
  const response = await youtube.channels.list({ part: ['snippet'], id: [youtubeChannelId] });
  return response.data.items?.[0]?.snippet?.title ?? 'Unknown Channel';
}

export async function runChannelPipeline(channelUrl: string): Promise<ChannelPipelineResult> {
  const runId = await createPipelineRun('channel', channelUrl);

  const youtubeChannelId = await resolveChannelId(channelUrl);
  const videos = await getChannelVideos(youtubeChannelId, DEFAULT_CONFIG.maxVideosPerChannel);

  // getChannelVideos does not populate channelName on VideoData — fetch it directly
  const channelName = await fetchChannelName(youtubeChannelId);

  const channelDbId = await upsertChannel({
    youtubeChannelId,
    channelName,
    channelUrl,
  });

  const outliers = detectOutliers(videos, channelName, DEFAULT_CONFIG);
  const sortedOutliers = outliers
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

  await updatePipelineRun(runId, {
    channelsFound: 1,
    videosScanned: videos.length,
    outliersFound: sortedOutliers.length,
    status: 'completed',
    completedAt: new Date().toISOString(),
  });

  return {
    runId,
    inputType: 'channel',
    inputValue: channelUrl,
    channelName,
    videosScanned: videos.length,
    outliersFound: sortedOutliers.length,
    outliers: sortedOutliers,
  };
}
