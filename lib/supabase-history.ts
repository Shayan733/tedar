// TEDAR — Analysis run history queries
// Merged from DP-YT-PIPELINE V5: every analysis run is a permanent row.
// These helpers read the full run history for a video, oldest first.

import { supabaseAdmin } from './supabase';
import { AnalysisRunSummary, AnalysisType } from './types';

export async function getAnalysisHistory(videoId: string): Promise<AnalysisRunSummary[]> {
  const { data, error } = await supabaseAdmin
    .from('analyses')
    .select('id, analysis_type, llm_provider, llm_model, overall_score, created_at')
    .eq('video_id', videoId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Failed to get analysis history for video ${videoId}: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    analysisType: row.analysis_type as AnalysisType,
    llmProvider: row.llm_provider as string,
    llmModel: row.llm_model as string,
    overallScore: (row.overall_score as number | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function countAnalysisRuns(
  videoId: string,
  analysisType: AnalysisType
): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('video_id', videoId)
    .eq('analysis_type', analysisType);
  if (error) throw new Error(`Failed to count analysis runs for video ${videoId}: ${error.message}`);
  return count ?? 0;
}
