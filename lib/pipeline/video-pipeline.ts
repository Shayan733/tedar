// TEDAR — Video URL Pipeline
// Fetches metadata for a single video and saves it to the database.
// No outlier scoring — no channel baseline available for standalone videos.
// Decode analysis is Phase 3. decoderAvailable is always false here.

import { getVideoData } from '../youtube/metadata';
import { upsertVideo, createPipelineRun, updatePipelineRun } from '../supabase';
import { VideoPipelineResult } from '../types';

export async function runVideoPipeline(videoUrl: string): Promise<VideoPipelineResult> {
  const runId = await createPipelineRun('video', videoUrl);

  const video = await getVideoData(videoUrl);
  // channelId from getVideoData is the YouTube channel ID string, not a Supabase UUID.
  // Video URL mode has no channel DB record, so omit channelId to avoid FK violation.
  const { channelId: _ytChannelId, ...videoWithoutChannelId } = video;
  await upsertVideo(videoWithoutChannelId);

  await updatePipelineRun(runId, {
    videosScanned: 1,
    status: 'completed',
    completedAt: new Date().toISOString(),
  });

  return {
    runId,
    inputType: 'video',
    inputValue: videoUrl,
    video: videoWithoutChannelId,
    decoderAvailable: false,
  };
}
