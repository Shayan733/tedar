// TEDAR — Read-only database queries for the dashboard
// All write operations are in lib/supabase.ts. This file handles reads only.
// Uses the anon client (not admin) — reads are safe with anon key.

import { supabase } from './supabase';
import { PipelineRun, OutlierResult, VideoData, OutlierCategory } from './types';
import { DEFAULT_CONFIG } from './config';

export async function getPipelineRun(runId: string): Promise<PipelineRun | null> {
  const { data, error } = await supabase
    .from('pipeline_runs')
    .select('*')
    .eq('id', runId)
    .single();
  if (error) return null;
  return {
    id: data.id as string,
    inputType: data.input_type as PipelineRun['inputType'],
    inputValue: data.input_value as string,
    channelsFound: data.channels_found as number,
    videosScanned: data.videos_scanned as number,
    outliersFound: data.outliers_found as number,
    analysesCompleted: data.analyses_completed as number,
    briefsGenerated: data.briefs_generated as number,
    status: data.status as PipelineRun['status'],
    errorMessage: data.error_message as string | undefined,
    startedAt: data.started_at as string | undefined,
    completedAt: data.completed_at as string | undefined,
  };
}

export async function getOutliersForRun(runId: string): Promise<OutlierResult[]> {
  // Get the pipeline run to find related channels/niche
  const run = await getPipelineRun(runId);
  if (!run) return [];

  const { data, error } = await supabase
    .from('videos')
    .select('*, channels(channel_name, channel_url, avg_views)')
    .gte('outlier_score', DEFAULT_CONFIG.flagThreshold)
    .order('outlier_score', { ascending: false });

  if (error || !data) return [];

  return data.map((v, i) => {
    const channel = v.channels as { channel_name: string; channel_url: string; avg_views: number } | null;
    const video: VideoData = {
      id: v.id as string,
      youtubeVideoId: v.youtube_video_id as string,
      channelId: v.channel_id as string,
      title: v.title as string,
      description: v.description as string | undefined,
      url: v.url as string,
      viewCount: v.view_count as number,
      likeCount: v.like_count as number | undefined,
      commentCount: v.comment_count as number | undefined,
      durationSeconds: v.duration_seconds as number | undefined,
      publishedAt: v.published_at as string | undefined,
      thumbnailUrl: v.thumbnail_url as string | undefined,
      tags: v.tags as string[] | undefined,
      outlierScore: v.outlier_score as number,
      outlierCategory: v.outlier_category as OutlierCategory,
      hasTranscript: v.has_transcript as boolean,
      hasAnalysis: v.has_analysis as boolean,
      channelName: channel?.channel_name,
      channelUrl: channel?.channel_url,
    };
    return {
      video,
      outlierScore: v.outlier_score as number,
      outlierCategory: v.outlier_category as OutlierCategory,
      channelAvgViews: channel?.avg_views ?? 0,
      channelName: channel?.channel_name ?? 'Unknown',
      rank: i + 1,
    };
  });
}

export async function getRecentRuns(limit: number): Promise<PipelineRun[]> {
  const { data, error } = await supabase
    .from('pipeline_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(r => ({
    id: r.id as string,
    inputType: r.input_type as PipelineRun['inputType'],
    inputValue: r.input_value as string,
    channelsFound: r.channels_found as number,
    videosScanned: r.videos_scanned as number,
    outliersFound: r.outliers_found as number,
    analysesCompleted: r.analyses_completed as number,
    briefsGenerated: r.briefs_generated as number,
    status: r.status as PipelineRun['status'],
    errorMessage: r.error_message as string | undefined,
    startedAt: r.started_at as string | undefined,
    completedAt: r.completed_at as string | undefined,
  }));
}
