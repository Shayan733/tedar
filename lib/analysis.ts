// TEDAR — Decoder orchestrator
// prepareVideo: fetch metadata + transcript, save to DB, no LLM (~5 seconds)
// analyseVideo: load from DB, run K1 analysis, stream progress (~15–30 seconds)

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
  getVideoById,
  getTranscriptByVideoId,
} from './supabase-decoder';
import { LLM_TEMPERATURE, LLM_MAX_TOKENS } from './config';
import { DecoderResult, VideoData } from './types';

export type DecodeProgressCallback = (message: string) => void;

export interface PrepareResult {
  videoId: string;                    // Supabase UUID
  youtubeVideoId: string;
  videoData: VideoData;
  transcript: string;
  wordCount: number;
  existingAnalysisId: string | null;
}

function extractYoutubeVideoId(input: string): string {
  const m = input.match(/[?&]v=([^&]+)/);     if (m) return m[1];
  const s = input.match(/youtu\.be\/([^?&]+)/); if (s) return s[1];
  const e = input.match(/\/embed\/([^?&]+)/);  if (e) return e[1];
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

export async function prepareVideo(videoUrl: string): Promise<PrepareResult> {
  const youtubeVideoId = extractYoutubeVideoId(videoUrl);

  // Get or fetch video record
  let videoData: VideoData;
  let videoId: string;
  const existing = await getVideoByYoutubeId(youtubeVideoId);
  if (existing?.id) {
    videoData = existing;
    videoId = existing.id;
  } else {
    videoData = await getVideoData(videoUrl);
    videoData = { ...videoData, channelId: undefined }; // prevent UUID type error (Phase 2 Bug #2)
    videoId = await upsertVideo(videoData);
    videoData = { ...videoData, id: videoId };
  }

  // Get or fetch transcript
  let transcript: string;
  const existingTranscript = await getTranscriptByVideoId(videoId);
  if (existingTranscript) {
    transcript = existingTranscript.fullText;
  } else {
    transcript = await getTranscript(youtubeVideoId);
    await upsertTranscript({
      videoId,
      fullText: transcript,
      wordCount: transcript.split(' ').length,
      language: 'en',
    });
  }

  const wordCount = transcript.split(' ').length;
  const existingAnalysis = await getAnalysisByVideoId(videoId, 'decode');

  return {
    videoId,
    youtubeVideoId,
    videoData,
    transcript,
    wordCount,
    existingAnalysisId: existingAnalysis?.id ?? null,
  };
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
  emit('Saving to database...');

  const analysisId = await upsertAnalysis({
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

// Compatibility wrapper — used by existing /api/decode/route.ts until Task 2C replaces it
export async function decodeVideo(
  videoUrl: string,
  options?: { forceRefresh?: boolean }
): Promise<{ result: DecoderResult; cached: boolean; analysisId?: string }> {
  const prepared = await prepareVideo(videoUrl);
  const isCached = !options?.forceRefresh && prepared.existingAnalysisId !== null;
  const result = await analyseVideo(prepared.videoId, { forceRefresh: options?.forceRefresh });
  return { result, cached: isCached, analysisId: result.id };
}
