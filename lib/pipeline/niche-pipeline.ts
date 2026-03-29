// TEDAR — Niche Scout Pipeline
// Full pipeline: keyword → channel discovery → LLM ranking → video scanning → outlier detection → DB storage

import { searchChannels } from '../youtube/search';
import { buildChannelRankerPrompt } from '../prompts/channel-ranker';
import { generateLLMResponse, stripJsonFences } from '../llm/provider';
import { getChannelVideos } from '../youtube/channel';
import { detectOutliers } from '../youtube/outlier';
import {
  upsertNiche, upsertChannel, upsertVideo,
  createPipelineRun, updatePipelineRun, insertNicheSnapshot,
} from '../supabase';
import { DEFAULT_CONFIG } from '../config';
import { NichePipelineResult, RankedChannel, OutlierResult } from '../types';

export async function runNichePipeline(keyword: string): Promise<NichePipelineResult> {
  const runId = await createPipelineRun('niche', keyword);
  const nicheId = await upsertNiche({ name: keyword, keywords: [keyword], channelCount: 0 });

  const candidates = await searchChannels(keyword);

  const { systemPrompt, userMessage } = buildChannelRankerPrompt(keyword, candidates);
  const llmResponse = await generateLLMResponse(systemPrompt, userMessage);
  const rankedChannels: RankedChannel[] = JSON.parse(stripJsonFences(llmResponse.text));

  await updatePipelineRun(runId, { channelsFound: rankedChannels.length });

  const topChannels = rankedChannels.slice(0, DEFAULT_CONFIG.maxChannelsToScan);
  let totalVideos = 0;
  let allOutliers: OutlierResult[] = [];

  for (const channel of topChannels) {
    const channelDbId = await upsertChannel({
      youtubeChannelId: channel.youtubeChannelId,
      channelName: channel.channelName,
      channelUrl: channel.channelUrl,
      nicheId,
      relevanceScore: channel.relevanceScore,
    });

    const videos = await getChannelVideos(channel.youtubeChannelId, DEFAULT_CONFIG.maxVideosPerChannel);
    const outliers = detectOutliers(videos, channel.channelName, DEFAULT_CONFIG);
    allOutliers = [...allOutliers, ...outliers];
    totalVideos += videos.length;

    for (const video of videos) {
      const outlier = outliers.find(o => o.video.youtubeVideoId === video.youtubeVideoId);
      await upsertVideo({
        ...video,
        channelId: channelDbId,
        outlierScore: outlier?.outlierScore,
        outlierCategory: outlier?.outlierCategory,
      });
    }

    await updatePipelineRun(runId, { videosScanned: totalVideos, outliersFound: allOutliers.length });
  }

  const sortedOutliers = allOutliers
    .sort((a, b) => b.outlierScore - a.outlierScore)
    .map((o, i) => ({ ...o, rank: i + 1 }));

  await insertNicheSnapshot({
    nicheId,
    scannedAt: new Date().toISOString(),
    channelCount: topChannels.length,
    avgOutlierScore: sortedOutliers.length > 0
      ? sortedOutliers.reduce((sum, o) => sum + o.outlierScore, 0) / sortedOutliers.length
      : 0,
    totalVideosScanned: totalVideos,
    totalOutliersFound: sortedOutliers.length,
  });

  await updatePipelineRun(runId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  });

  return {
    runId,
    inputType: 'niche',
    inputValue: keyword,
    channelsScanned: topChannels.length,
    videosScanned: totalVideos,
    outliersFound: sortedOutliers.length,
    outliers: sortedOutliers,
    topChannels,
  };
}
