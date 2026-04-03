// TEDAR — Phase 4 Builder database functions
// Kept in a separate file because lib/supabase.ts is already over 150 lines.
// Import supabaseAdmin from lib/supabase.ts — do not create a second client here.

import { supabaseAdmin } from './supabase';
import { BriefRecord, BuilderResult } from './types';

// ── Save Builder Result ──────────────────────────────────────────────────────

export async function upsertBrief(brief: BriefRecord): Promise<string> {
  const payload = {
    video_id: brief.videoId,
    analysis_type: brief.analysisType,
    llm_provider: brief.llmProvider,
    llm_model: brief.llmModel,
    prompt_version: brief.promptVersion,
    result: brief.result as unknown as Record<string, unknown>,
    overall_score: brief.overallScore ?? null,
    dimension_scores: brief.dimensionScores ?? null,
    processing_time_ms: brief.processingTimeMs,
  };

  // Check if a build record already exists for this source analysis
  const sourceAnalysisId = brief.result.sourceAnalysisId;
  const { data: existing } = await supabaseAdmin
    .from('analyses')
    .select('id')
    .eq('analysis_type', 'build')
    .eq('video_id', brief.videoId)
    .filter('result->>sourceAnalysisId', 'eq', sourceAnalysisId)
    .maybeSingle();

  let id: string;
  if (existing) {
    const { error } = await supabaseAdmin
      .from('analyses')
      .update(payload)
      .eq('id', existing.id as string);
    if (error) throw new Error(`Failed to update brief for video ${brief.videoId}: ${error.message}`);
    id = existing.id as string;
  } else {
    const { data, error } = await supabaseAdmin
      .from('analyses')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw new Error(`Failed to insert brief for video ${brief.videoId}: ${error.message}`);
    id = data.id as string;
  }

  // Confirm video has_analysis = true (already true from decode, but confirm)
  await supabaseAdmin
    .from('videos')
    .update({ has_analysis: true })
    .eq('id', brief.videoId);

  return id;
}

// ── Retrieve Builder Result ──────────────────────────────────────────────────

export async function getBriefByAnalysisId(
  analysisId: string
): Promise<BriefRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('analyses')
    .select('*')
    .eq('analysis_type', 'build')
    .filter('result->>sourceAnalysisId', 'eq', analysisId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to get brief for analysis ${analysisId}: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id as string,
    videoId: data.video_id as string,
    analysisType: 'build',
    llmProvider: data.llm_provider as string,
    llmModel: data.llm_model as string,
    promptVersion: data.prompt_version as string,
    result: data.result as unknown as BuilderResult,
    overallScore: data.overall_score as number | undefined,
    processingTimeMs: data.processing_time_ms as number | undefined,
    createdAt: data.created_at as string | undefined,
  };
}
