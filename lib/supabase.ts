// TEDAR — Supabase database connection and query functions
// All database operations go through this file. Never import supabase-js elsewhere.

import { createClient } from '@supabase/supabase-js';
import {
  NicheData, ChannelData, VideoData, PipelineRun,
  VideoSnapshotData, ChannelSnapshotData, NicheSnapshotData, VideoVelocitySnapshotData,
} from './types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Browser client — read operations only
export const supabase = createClient(url, anonKey);

// Server client — all write operations use this
export const supabaseAdmin = createClient(url, serviceRoleKey);

// ── Niches ────────────────────────────────────────────────────────────────────

export async function upsertNiche(niche: NicheData): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('niches')
    .upsert({ name: niche.name, keywords: niche.keywords, channel_count: niche.channelCount }, { onConflict: 'name' })
    .select('id')
    .single();
  if (error) throw new Error(`Failed to upsert niche "${niche.name}": ${error.message}`);
  return data.id as string;
}

export async function insertNicheSnapshot(snapshot: NicheSnapshotData): Promise<void> {
  const { error } = await supabaseAdmin
    .from('niche_snapshots')
    .insert({
      niche_id: snapshot.nicheId,
      scanned_at: snapshot.scannedAt,
      channel_count: snapshot.channelCount,
      avg_outlier_score: snapshot.avgOutlierScore,
      total_videos_scanned: snapshot.totalVideosScanned,
      total_outliers_found: snapshot.totalOutliersFound,
    });
  if (error) throw new Error(`Failed to insert niche snapshot for ${snapshot.nicheId}: ${error.message}`);
}

// ── Channels ──────────────────────────────────────────────────────────────────

export async function upsertChannel(channel: ChannelData): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('channels')
    .upsert({
      youtube_channel_id: channel.youtubeChannelId,
      channel_name: channel.channelName,
      channel_url: channel.channelUrl,
      subscriber_count: channel.subscriberCount,
      total_video_count: channel.totalVideoCount,
      niche_id: channel.nicheId,
      avg_views: channel.avgViews,
      relevance_score: channel.relevanceScore !== undefined ? Math.min(channel.relevanceScore, 99.99) : undefined,
      last_scanned_at: channel.lastScannedAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'youtube_channel_id' })
    .select('id')
    .single();
  if (error) throw new Error(`Failed to upsert channel "${channel.channelName}": ${error.message}`);

  const channelId = data.id as string;
  await insertChannelSnapshot({
    channelId,
    scannedAt: new Date().toISOString(),
    subscriberCount: channel.subscriberCount,
    avgViews: channel.avgViews,
    totalVideoCount: channel.totalVideoCount,
    relevanceScore: channel.relevanceScore !== undefined ? Math.min(channel.relevanceScore, 99.99) : undefined,
  });

  return channelId;
}

export async function insertChannelSnapshot(snapshot: ChannelSnapshotData): Promise<void> {
  const { error } = await supabaseAdmin
    .from('channel_snapshots')
    .insert({
      channel_id: snapshot.channelId,
      scanned_at: snapshot.scannedAt,
      subscriber_count: snapshot.subscriberCount,
      avg_views: snapshot.avgViews,
      total_video_count: snapshot.totalVideoCount,
      relevance_score: snapshot.relevanceScore,
    });
  if (error) throw new Error(`Failed to insert channel snapshot for ${snapshot.channelId}: ${error.message}`);
}

// ── Videos ────────────────────────────────────────────────────────────────────

export async function insertVideoSnapshot(snapshot: VideoSnapshotData): Promise<void> {
  const { error } = await supabaseAdmin
    .from('video_snapshots')
    .insert({
      video_id: snapshot.videoId,
      scanned_at: snapshot.scannedAt,
      view_count: snapshot.viewCount,
      like_count: snapshot.likeCount,
      comment_count: snapshot.commentCount,
      outlier_score: snapshot.outlierScore,
      outlier_category: snapshot.outlierCategory,
      channel_avg_views_at_scan: snapshot.channelAvgViewsAtScan,
    });
  if (error) throw new Error(`Failed to insert video snapshot for ${snapshot.videoId}: ${error.message}`);
}

export async function insertVideoVelocitySnapshot(snapshot: VideoVelocitySnapshotData): Promise<void> {
  const { error } = await supabaseAdmin
    .from('video_velocity_snapshots')
    .insert({
      video_id: snapshot.videoId,
      recorded_at: snapshot.recordedAt,
      interval_label: snapshot.intervalLabel,
      view_count: snapshot.viewCount,
      like_count: snapshot.likeCount,
      comment_count: snapshot.commentCount,
      outlier_score: snapshot.outlierScore,
    });
  if (error) throw new Error(`Failed to insert velocity snapshot for ${snapshot.videoId}: ${error.message}`);
}

export async function upsertVideo(video: VideoData): Promise<string> {
  const payload: Record<string, unknown> = {
    youtube_video_id: video.youtubeVideoId,
    channel_id: video.channelId,
    title: video.title,
    description: video.description,
    url: video.url,
    view_count: video.viewCount,
    like_count: video.likeCount,
    comment_count: video.commentCount,
    duration_seconds: video.durationSeconds,
    published_at: video.publishedAt,
    thumbnail_url: video.thumbnailUrl,
    tags: video.tags ?? [],
    outlier_score: video.outlierScore,
    outlier_category: video.outlierCategory,
  };

  // Select-then-update/insert so re-scans never reset has_transcript /
  // has_analysis on videos that were already decoded.
  const { data: existing } = await supabaseAdmin
    .from('videos')
    .select('id')
    .eq('youtube_video_id', video.youtubeVideoId)
    .maybeSingle();

  let videoId: string;
  if (existing) {
    videoId = existing.id as string;
    const { error } = await supabaseAdmin.from('videos').update(payload).eq('id', videoId);
    if (error) {
      console.error('upsertVideo update failed:', error);
      throw new Error(`Failed to update video "${video.title}": ${error.message}`);
    }
  } else {
    const { data, error } = await supabaseAdmin
      .from('videos')
      .insert({
        ...payload,
        has_transcript: video.hasTranscript ?? false,
        has_analysis: video.hasAnalysis ?? false,
      })
      .select('id')
      .single();
    if (error) {
      console.error('upsertVideo insert failed:', error);
      throw new Error(`Failed to insert video "${video.title}": ${error.message}`);
    }
    videoId = data.id as string;
  }
  const scannedAt = new Date().toISOString();

  // Append-only snapshot — full history of every scan, never overwritten
  await insertVideoSnapshot({
    videoId,
    scannedAt,
    viewCount: video.viewCount,
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    outlierScore: video.outlierScore,
    outlierCategory: video.outlierCategory,
  });

  // Velocity snapshot — records view count at this moment with 'latest' label
  // Phase 3 will add scheduled snapshots at 24h, 48h, 7d, 30d after publish
  await insertVideoVelocitySnapshot({
    videoId,
    recordedAt: scannedAt,
    intervalLabel: 'latest',
    viewCount: video.viewCount,
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    outlierScore: video.outlierScore,
  });

  return videoId;
}

// ── Pipeline Runs ─────────────────────────────────────────────────────────────

export async function createPipelineRun(
  inputType: PipelineRun['inputType'],
  inputValue: string
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('pipeline_runs')
    .insert({
      input_type: inputType,
      input_value: inputValue,
      channels_found: 0,
      videos_scanned: 0,
      outliers_found: 0,
      analyses_completed: 0,
      briefs_generated: 0,
      status: 'running',
    })
    .select('id')
    .single();
  if (error) {
    console.error('createPipelineRun failed:', error);
    throw new Error(`Failed to create pipeline run: ${error.message}`);
  }
  return data.id as string;
}

export async function updatePipelineRun(
  id: string,
  updates: Partial<PipelineRun>
): Promise<void> {
  const mapped: Record<string, unknown> = {};
  if (updates.channelsFound !== undefined) mapped.channels_found = updates.channelsFound;
  if (updates.videosScanned !== undefined) mapped.videos_scanned = updates.videosScanned;
  if (updates.outliersFound !== undefined) mapped.outliers_found = updates.outliersFound;
  if (updates.analysesCompleted !== undefined) mapped.analyses_completed = updates.analysesCompleted;
  if (updates.briefsGenerated !== undefined) mapped.briefs_generated = updates.briefsGenerated;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.errorMessage !== undefined) mapped.error_message = updates.errorMessage;
  if (updates.completedAt !== undefined) mapped.completed_at = updates.completedAt;

  const { error } = await supabaseAdmin.from('pipeline_runs').update(mapped).eq('id', id);
  if (error) throw new Error(`Failed to update pipeline run ${id}: ${error.message}`);
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getChannelVideos(channelId: string): Promise<VideoData[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('channel_id', channelId);
  if (error) throw new Error(`Failed to get videos for channel ${channelId}: ${error.message}`);
  return (data ?? []).map((v) => ({
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
    outlierScore: v.outlier_score as number | undefined,
    outlierCategory: v.outlier_category as VideoData['outlierCategory'],
    hasTranscript: v.has_transcript as boolean,
    hasAnalysis: v.has_analysis as boolean,
    createdAt: v.created_at as string | undefined,
  }));
}
