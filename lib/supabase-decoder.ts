// TEDAR — Phase 3 Decoder database functions
// Kept in a separate file because lib/supabase.ts is already over 150 lines.
// Import supabaseAdmin from lib/supabase.ts — do not create a second client here.

import { supabaseAdmin } from './supabase';
import { TranscriptData, AnalysisRecord, VideoData, DecoderResult, DimensionScores } from './types';

// ── Transcripts ───────────────────────────────────────────────────────────────

export async function upsertTranscript(transcript: TranscriptData): Promise<string> {
  const payload = {
    video_id: transcript.videoId,
    full_text: transcript.fullText,
    word_count: transcript.wordCount,
    language: transcript.language,
  };

  // Check if transcript already exists for this video
  const { data: existing } = await supabaseAdmin
    .from('transcripts')
    .select('id')
    .eq('video_id', transcript.videoId)
    .maybeSingle();

  let id: string;
  if (existing) {
    const { error } = await supabaseAdmin
      .from('transcripts')
      .update(payload)
      .eq('id', existing.id as string);
    if (error) throw new Error(`Failed to update transcript for video ${transcript.videoId}: ${error.message}`);
    id = existing.id as string;
  } else {
    const { data, error } = await supabaseAdmin
      .from('transcripts')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw new Error(`Failed to insert transcript for video ${transcript.videoId}: ${error.message}`);
    id = data.id as string;
  }

  // Mark video as having a transcript
  await supabaseAdmin
    .from('videos')
    .update({ has_transcript: true })
    .eq('id', transcript.videoId);

  return id;
}

// ── Analyses ──────────────────────────────────────────────────────────────────

export async function upsertAnalysis(analysis: AnalysisRecord): Promise<string> {
  const payload = {
    video_id: analysis.videoId,
    analysis_type: analysis.analysisType,
    llm_provider: analysis.llmProvider,
    llm_model: analysis.llmModel,
    prompt_version: analysis.promptVersion,
    result: analysis.result as unknown as Record<string, unknown>,
    overall_score: analysis.overallScore,
    dimension_scores: analysis.dimensionScores as unknown as Record<string, unknown>,
    processing_time_ms: analysis.processingTimeMs,
    tokens_input: analysis.tokensInput,
    tokens_output: analysis.tokensOutput,
  };

  // Check if a record already exists for this video + analysis type
  const { data: existing } = await supabaseAdmin
    .from('analyses')
    .select('id')
    .eq('video_id', analysis.videoId)
    .eq('analysis_type', analysis.analysisType)
    .maybeSingle();

  let id: string;
  if (existing) {
    // Update the existing record
    const { error } = await supabaseAdmin
      .from('analyses')
      .update(payload)
      .eq('id', existing.id as string);
    if (error) throw new Error(`Failed to update analysis for video ${analysis.videoId}: ${error.message}`);
    id = existing.id as string;
  } else {
    // Insert a new record
    const { data, error } = await supabaseAdmin
      .from('analyses')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw new Error(`Failed to insert analysis for video ${analysis.videoId}: ${error.message}`);
    id = data.id as string;
  }

  // Mark video as having an analysis
  await supabaseAdmin
    .from('videos')
    .update({ has_analysis: true })
    .eq('id', analysis.videoId);

  return id;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getAnalysisByVideoId(
  videoId: string,
  analysisType: 'decode' | 'build'
): Promise<AnalysisRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('analyses')
    .select('*')
    .eq('video_id', videoId)
    .eq('analysis_type', analysisType)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to get analysis for video ${videoId}: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id as string,
    videoId: data.video_id as string,
    analysisType: data.analysis_type as 'decode' | 'build',
    llmProvider: data.llm_provider as string,
    llmModel: data.llm_model as string,
    promptVersion: data.prompt_version as string,
    result: data.result as unknown as DecoderResult,
    overallScore: data.overall_score as number,
    dimensionScores: data.dimension_scores as unknown as DimensionScores,
    processingTimeMs: data.processing_time_ms as number | undefined,
    tokensInput: data.tokens_input as number | undefined,
    tokensOutput: data.tokens_output as number | undefined,
    createdAt: data.created_at as string | undefined,
  };
}

export async function getVideoByYoutubeId(youtubeVideoId: string): Promise<VideoData | null> {
  const { data, error } = await supabaseAdmin
    .from('videos')
    .select('*')
    .eq('youtube_video_id', youtubeVideoId)
    .maybeSingle();
  if (error) throw new Error(`Failed to get video by YouTube ID ${youtubeVideoId}: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id as string,
    youtubeVideoId: data.youtube_video_id as string,
    channelId: data.channel_id as string | undefined,
    title: data.title as string,
    description: data.description as string | undefined,
    url: data.url as string,
    viewCount: data.view_count as number,
    likeCount: data.like_count as number | undefined,
    commentCount: data.comment_count as number | undefined,
    durationSeconds: data.duration_seconds as number | undefined,
    publishedAt: data.published_at as string | undefined,
    thumbnailUrl: data.thumbnail_url as string | undefined,
    tags: data.tags as string[] | undefined,
    outlierScore: data.outlier_score as number | undefined,
    outlierCategory: data.outlier_category as VideoData['outlierCategory'],
    hasTranscript: data.has_transcript as boolean,
    hasAnalysis: data.has_analysis as boolean,
    createdAt: data.created_at as string | undefined,
  };
}
