// TEDAR — Decoder orchestrator
// prepareVideo: fetch metadata + transcript, no LLM — lives in lib/prepare.ts (edge-compatible)
// analyseVideo: load from DB, run K1 analysis, stream progress (~15–30 seconds)

import { prepareVideo, PrepareResult, DecodeProgressCallback } from './prepare';
import { buildDecoderPrompt, DECODER_PROMPT_VERSION } from './prompts/k1-decoder';
import { generateLLMResponse, stripJsonFences } from './llm/provider';
import {
  insertAnalysis,
  getAnalysisByVideoId,
  getVideoById,
  getTranscriptByVideoId,
} from './supabase-decoder';
import { countAnalysisRuns } from './supabase-history';
import { LLM_TEMPERATURE, LLM_MAX_TOKENS } from './config';
import { DecoderResult } from './types';

// Re-export for backwards compatibility — other files import these from lib/analysis
export type { PrepareResult, DecodeProgressCallback };
export { prepareVideo };

function validateDecoderResult(parsed: unknown): parsed is DecoderResult {
  if (typeof parsed !== 'object' || parsed === null) return false;
  const r = parsed as Record<string, unknown>;
  return (
    typeof r.psychologicalFormula === 'object' &&
    typeof r.engagementScore === 'object' &&
    typeof r.replicationBrief === 'object' &&
    typeof r.scriptOutline === 'object'
  );
}

export async function analyseVideo(
  videoId: string,
  options?: { forceRefresh?: boolean; onProgress?: DecodeProgressCallback }
): Promise<DecoderResult> {
  const emit = (msg: string) => options?.onProgress?.(msg);

  const videoData = await getVideoById(videoId);
  if (!videoData) throw new Error('Video not found. Run prepareVideo first.');

  const transcriptRecord = await getTranscriptByVideoId(videoId);
  if (!transcriptRecord) throw new Error('Transcript not found. Run prepareVideo first.');

  // Return cached result if available and not forcing refresh
  if (!options?.forceRefresh) {
    const cached = await getAnalysisByVideoId(videoId, 'decode');
    if (cached) return { ...cached.result, id: cached.id };
  }

  emit('Loading transcript from database...');
  const { fullText: transcript, wordCount } = transcriptRecord;
  emit(`Transcript loaded — ${wordCount} words`);
  emit('Building K1 analysis prompt...');
  const { systemPrompt, userMessage } = buildDecoderPrompt(videoData, transcript);

  emit('Analysing with Groq llama-3.3-70B — identifying psychological triggers...');
  emit('Scoring System 1 vs System 2 activation...');
  emit('Evaluating information gap architecture...');
  emit('Measuring STEPPS dimensions...');

  const startTime = Date.now();
  const response = await generateLLMResponse(systemPrompt, userMessage, {
    temperature: LLM_TEMPERATURE,
    maxTokens: LLM_MAX_TOKENS,
  });
  const processingTimeMs = Date.now() - startTime;

  emit('Parsing psychological formula...');

  let decoderResult: DecoderResult;
  try {
    const parsed: unknown = JSON.parse(stripJsonFences(response.text));
    if (!validateDecoderResult(parsed)) throw new Error('Invalid shape');
    decoderResult = parsed;
  } catch {
    const retry = await generateLLMResponse(
      systemPrompt,
      userMessage + '\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no backticks.',
      { temperature: LLM_TEMPERATURE, maxTokens: LLM_MAX_TOKENS }
    );
    const parsed: unknown = JSON.parse(stripJsonFences(retry.text));
    if (!validateDecoderResult(parsed)) throw new Error('Analysis could not be completed. Please try again.');
    decoderResult = parsed as DecoderResult;
  }

  emit('Validating analysis structure...');

  // Every run is preserved — log which run number this is (DP-YT-PIPELINE V5)
  const previousRuns = await countAnalysisRuns(videoId, 'decode');
  emit(previousRuns > 0
    ? `Saving to database — run #${previousRuns + 1} for this video, history preserved...`
    : 'Saving to database...');

  const analysisId = await insertAnalysis({
    videoId,
    analysisType: 'decode',
    llmProvider: process.env.LLM_PROVIDER ?? 'groq',
    llmModel: 'llama-3.3-70b-versatile',
    promptVersion: DECODER_PROMPT_VERSION,
    result: decoderResult,
    overallScore: decoderResult.engagementScore.overall,
    dimensionScores: decoderResult.engagementScore.dimensions,
    processingTimeMs,
    tokensInput: response.tokensUsed,
  });

  emit(`Analysis complete — confidence: ${decoderResult.engagementScore.overall}`);
  return { ...decoderResult, id: analysisId };
}

// Compatibility wrapper — preserves backwards compatibility for scripts
export async function decodeVideo(
  videoUrl: string,
  options?: { forceRefresh?: boolean }
): Promise<{ result: DecoderResult; cached: boolean; analysisId?: string }> {
  const prepared = await prepareVideo(videoUrl);
  const isCached = !options?.forceRefresh && prepared.existingAnalysisId !== null;
  const result = await analyseVideo(prepared.videoId, { forceRefresh: options?.forceRefresh });
  return { result, cached: isCached, analysisId: result.id };
}
