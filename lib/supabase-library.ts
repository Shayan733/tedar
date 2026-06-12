// TEDAR — Library queries
// Merged from DP-YT-PIPELINE's /library endpoint: one entry per video with
// the LATEST analysis per type (history stays in the DB, reads deduplicate),
// transcript status, and run counts.

import { supabaseAdmin } from './supabase';
import { AnalysisType, LibraryAnalysisInfo, LibraryEntry } from './types';

interface AnalysisRow {
  id: string;
  video_id: string;
  analysis_type: AnalysisType;
  overall_score: number | null;
  created_at: string;
}

interface PerTypeAccumulator {
  latest: AnalysisRow;
  runCount: number;
}

function toInfo(acc: PerTypeAccumulator): LibraryAnalysisInfo {
  return {
    analysisId: acc.latest.id,
    overallScore: acc.latest.overall_score,
    runCount: acc.runCount,
    lastRunAt: acc.latest.created_at,
  };
}

export async function getLibrary(): Promise<LibraryEntry[]> {
  const { data: videos, error: videosError } = await supabaseAdmin
    .from('videos')
    .select('id, youtube_video_id, title, thumbnail_url, view_count, like_count, comment_count, published_at, created_at, has_transcript, channels(channel_name)')
    .order('created_at', { ascending: false });
  if (videosError) throw new Error(`Failed to load library videos: ${videosError.message}`);

  const { data: analyses, error: analysesError } = await supabaseAdmin
    .from('analyses')
    .select('id, video_id, analysis_type, overall_score, created_at');
  if (analysesError) throw new Error(`Failed to load library analyses: ${analysesError.message}`);

  // Deduplicate to latest run per (video, type) while counting all runs
  const byVideo = new Map<string, Partial<Record<AnalysisType, PerTypeAccumulator>>>();
  for (const raw of (analyses ?? []) as unknown as AnalysisRow[]) {
    const perType = byVideo.get(raw.video_id) ?? {};
    const acc = perType[raw.analysis_type];
    if (!acc) {
      perType[raw.analysis_type] = { latest: raw, runCount: 1 };
    } else {
      acc.runCount += 1;
      if (raw.created_at > acc.latest.created_at) acc.latest = raw;
    }
    byVideo.set(raw.video_id, perType);
  }

  return (videos ?? []).map((v) => {
    const perType = byVideo.get(v.id as string) ?? {};
    // Many-to-one join — runtime shape is an object, but guard against array form
    const rawChannel = v.channels as { channel_name?: string } | { channel_name?: string }[] | null;
    const channel = Array.isArray(rawChannel) ? rawChannel[0] ?? null : rawChannel;
    return {
      videoId: v.id as string,
      youtubeVideoId: v.youtube_video_id as string,
      title: v.title as string,
      channelName: channel?.channel_name ?? null,
      thumbnailUrl: (v.thumbnail_url as string | null) ?? null,
      viewCount: (v.view_count as number) ?? 0,
      likeCount: (v.like_count as number | null) ?? null,
      commentCount: (v.comment_count as number | null) ?? null,
      publishedAt: (v.published_at as string | null) ?? null,
      addedAt: (v.created_at as string | null) ?? null,
      hasTranscript: Boolean(v.has_transcript),
      decode: perType.decode ? toInfo(perType.decode) : null,
      audience: perType.audience ? toInfo(perType.audience) : null,
      hasBrief: Boolean(perType.build),
    };
  });
}
