// TEDAR — Audience Decoder database functions
// Audience analyses live in the same `analyses` table with
// analysis_type = 'audience'. Every run is a permanent row (history preserved);
// reads take the latest row per video.

import { supabaseAdmin } from './supabase';
import { AudienceResult } from './types';

export interface AudienceInsert {
  videoId: string;
  llmProvider: string;
  llmModel: string;
  promptVersion: string;
  result: AudienceResult;
  processingTimeMs?: number;
  tokensInput?: number;
}

export async function insertAudienceAnalysis(record: AudienceInsert): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('analyses')
    .insert({
      video_id: record.videoId,
      analysis_type: 'audience',
      llm_provider: record.llmProvider,
      llm_model: record.llmModel,
      prompt_version: record.promptVersion,
      result: record.result as unknown as Record<string, unknown>,
      processing_time_ms: record.processingTimeMs,
      tokens_input: record.tokensInput,
    })
    .select('id')
    .single();
  if (error) {
    throw new Error(
      `Failed to save audience analysis for video ${record.videoId}: ${error.message}. ` +
      `If this mentions a check constraint, run the migration in supabase/migrations to allow the 'audience' analysis type.`
    );
  }
  return data.id as string;
}

export async function getAudienceAnalysisByVideoId(
  videoId: string
): Promise<{ id: string; result: AudienceResult; createdAt: string } | null> {
  const { data, error } = await supabaseAdmin
    .from('analyses')
    .select('id, result, created_at')
    .eq('video_id', videoId)
    .eq('analysis_type', 'audience')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to get audience analysis for video ${videoId}: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id as string,
    result: data.result as unknown as AudienceResult,
    createdAt: data.created_at as string,
  };
}
