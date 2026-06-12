// TEDAR — Audience Decoder orchestrator
// Merged from DP-YT-PIPELINE: analyses the top comments on a video to decode
// how the audience actually reacted. The K1 Decoder reads the transcript;
// this reads the crowd. Same orchestration pattern as lib/analysis.ts.

import { getTopComments, CommentsDisabledError } from './youtube/comments';
import { buildAudiencePrompt, AUDIENCE_PROMPT_VERSION } from './prompts/audience-decoder';
import { generateLLMResponse, stripJsonFences } from './llm/provider';
import { getVideoById } from './supabase-decoder';
import { insertAudienceAnalysis, getAudienceAnalysisByVideoId } from './supabase-audience';
import { countAnalysisRuns } from './supabase-history';
import { LLM_TEMPERATURE, LLM_MAX_TOKENS } from './config';
import { AudienceResult } from './types';
import { DecodeProgressCallback } from './prepare';

const MIN_COMMENTS_FOR_ANALYSIS = 5;

function validateAudienceResult(parsed: unknown): parsed is AudienceResult {
  if (typeof parsed !== 'object' || parsed === null) return false;
  const r = parsed as Record<string, unknown>;
  return (
    typeof r.dominantSentiment === 'string' &&
    Array.isArray(r.emotionalTriggers) &&
    Array.isArray(r.resonantThemes) &&
    typeof r.audienceReactionPattern === 'string' &&
    typeof r.whatWorked === 'string' &&
    Array.isArray(r.standoutComments)
  );
}

export async function decodeAudience(
  videoId: string,
  options?: { forceRefresh?: boolean; onProgress?: DecodeProgressCallback }
): Promise<AudienceResult> {
  const emit = (msg: string) => options?.onProgress?.(msg);

  const videoData = await getVideoById(videoId);
  if (!videoData) throw new Error('Video not found. Run prepareVideo first.');

  if (!options?.forceRefresh) {
    const cached = await getAudienceAnalysisByVideoId(videoId);
    if (cached) return { ...cached.result, id: cached.id };
  }

  emit('Fetching top comments from YouTube...');
  let comments;
  try {
    comments = await getTopComments(videoData.youtubeVideoId);
  } catch (err) {
    if (err instanceof CommentsDisabledError) {
      throw new Error('Comments are disabled on this video — the audience cannot be decoded.');
    }
    throw err;
  }
  if (comments.length < MIN_COMMENTS_FOR_ANALYSIS) {
    throw new Error(`Only ${comments.length} comments found — not enough audience signal to decode.`);
  }

  emit(`${comments.length} comments loaded — ranked by audience likes`);
  emit('Building audience analysis prompt...');
  const { systemPrompt, userMessage } = buildAudiencePrompt(videoData, comments);

  emit('Reading audience sentiment...');
  emit('Mapping emotional triggers across comment threads...');
  emit('Identifying themes the audience amplified...');

  const startTime = Date.now();
  const response = await generateLLMResponse(systemPrompt, userMessage, {
    temperature: LLM_TEMPERATURE,
    maxTokens: LLM_MAX_TOKENS,
  });
  const processingTimeMs = Date.now() - startTime;

  emit('Parsing audience insights...');
  let audienceResult: AudienceResult;
  try {
    const parsed: unknown = JSON.parse(stripJsonFences(response.text));
    if (!validateAudienceResult(parsed)) throw new Error('Invalid shape');
    audienceResult = parsed;
  } catch {
    const retry = await generateLLMResponse(
      systemPrompt,
      userMessage + '\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no backticks.',
      { temperature: LLM_TEMPERATURE, maxTokens: LLM_MAX_TOKENS }
    );
    const parsed: unknown = JSON.parse(stripJsonFences(retry.text));
    if (!validateAudienceResult(parsed)) {
      throw new Error('Audience analysis could not be completed. Please try again.');
    }
    audienceResult = parsed;
  }
  audienceResult.commentsAnalysed = comments.length;

  const previousRuns = await countAnalysisRuns(videoId, 'audience');
  emit(previousRuns > 0
    ? `Saving to database — run #${previousRuns + 1} for this video, history preserved...`
    : 'Saving to database...');

  const analysisId = await insertAudienceAnalysis({
    videoId,
    llmProvider: process.env.LLM_PROVIDER ?? 'groq',
    llmModel: 'llama-3.3-70b-versatile',
    promptVersion: AUDIENCE_PROMPT_VERSION,
    result: audienceResult,
    processingTimeMs,
    tokensInput: response.tokensUsed,
  });

  emit(`Audience decode complete — dominant sentiment: ${audienceResult.dominantSentiment}`);
  return { ...audienceResult, id: analysisId };
}
