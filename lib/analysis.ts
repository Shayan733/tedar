// TEDAR — Decoder orchestrator
// Single entry point for the full decode pipeline.
// Everything else (API route, decode page) calls this one function.

import { getVideoData } from './youtube/metadata';
import { getTranscript } from './youtube/transcript';
import { buildDecoderPrompt, DECODER_PROMPT_VERSION } from './prompts/k1-decoder';
import { generateLLMResponse, stripJsonFences } from './llm/provider';
import { upsertVideo } from './supabase';
import {
  upsertTranscript,
  upsertAnalysis,
  getAnalysisByVideoId,
  getVideoByYoutubeId,
} from './supabase-decoder';
import { LLM_TEMPERATURE, LLM_MAX_TOKENS } from './config';
import { DecoderResult, VideoData } from './types';

// Extracts YouTube video ID from any URL format or raw ID
function extractYoutubeVideoId(input: string): string {
  const standardMatch = input.match(/[?&]v=([^&]+)/);
  if (standardMatch) return standardMatch[1];
  const shortMatch = input.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = input.match(/\/embed\/([^?&]+)/);
  if (embedMatch) return embedMatch[1];
  if (/^[\w-]{11}$/.test(input)) return input;
  return input;
}

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

export interface DecodeOutcome {
  result: DecoderResult;
  cached: boolean;
  analysisId?: string;
}

export async function decodeVideo(
  videoUrl: string,
  options?: {
    knowledgeBrief?: string;
    forceRefresh?: boolean;
  }
): Promise<DecodeOutcome> {
  // Step 1: extract YouTube video ID
  const youtubeVideoId = extractYoutubeVideoId(videoUrl);

  // Step 2: look up or fetch video record
  let videoData: VideoData;
  let supabaseVideoId: string;

  const existing = await getVideoByYoutubeId(youtubeVideoId);
  if (existing && existing.id) {
    videoData = existing;
    supabaseVideoId = existing.id;
  } else {
    videoData = await getVideoData(videoUrl);
    // channelId from getVideoData is a YouTube channel ID string, not a Supabase UUID.
    // Clear it to avoid Phase 2 Bug #2 (UUID type error on the videos table).
    videoData = { ...videoData, channelId: undefined };
    supabaseVideoId = await upsertVideo(videoData);
    videoData = { ...videoData, id: supabaseVideoId };
  }

  // Step 3: cache check — return immediately if already analysed
  if (!options?.forceRefresh) {
    const cached = await getAnalysisByVideoId(supabaseVideoId, 'decode');
    if (cached) {
      return { result: cached.result, cached: true, analysisId: cached.id };
    }
  }

  // Step 4: fetch transcript
  const transcript = await getTranscript(youtubeVideoId);

  // Step 5: save transcript to database
  await upsertTranscript({
    videoId: supabaseVideoId,
    fullText: transcript,
    wordCount: transcript.split(' ').length,
    language: 'en',
  });

  // Step 6: build the K1 prompt
  const { systemPrompt, userMessage } = buildDecoderPrompt(
    videoData,
    transcript,
    options?.knowledgeBrief
  );

  // Step 7: record start time
  const startTime = Date.now();

  // Step 8: call LLM
  const response = await generateLLMResponse(systemPrompt, userMessage, {
    temperature: LLM_TEMPERATURE,
    maxTokens: LLM_MAX_TOKENS,
  });

  // Step 9: record processing time
  const processingTimeMs = Date.now() - startTime;

  // Step 10: parse and validate — retry once on failure
  let decoderResult: DecoderResult;
  try {
    const cleaned = stripJsonFences(response.text);
    const parsed: unknown = JSON.parse(cleaned);
    if (!validateDecoderResult(parsed)) throw new Error('Invalid shape');
    decoderResult = parsed;
  } catch {
    // Retry once with an explicit JSON instruction appended
    const retryResponse = await generateLLMResponse(
      systemPrompt,
      userMessage + '\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no backticks, no text outside the JSON object.',
      { temperature: LLM_TEMPERATURE, maxTokens: LLM_MAX_TOKENS }
    );
    try {
      const cleaned = stripJsonFences(retryResponse.text);
      const parsed: unknown = JSON.parse(cleaned);
      if (!validateDecoderResult(parsed)) throw new Error('Invalid shape on retry');
      decoderResult = parsed;
    } catch {
      throw new Error('Analysis could not be completed. Please try again.');
    }
  }

  // Step 11: save analysis to database
  const analysisId = await upsertAnalysis({
    videoId: supabaseVideoId,
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

  // Step 12: return result
  return { result: decoderResult, cached: false, analysisId };
}
