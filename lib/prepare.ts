// TEDAR — prepareVideo: fetch metadata + transcript, save to DB, no LLM
// Edge-compatible: only imports fetch-based and supabase dependencies.
// Called by /api/decode/prepare/route.ts (Vercel Edge / Cloudflare IPs).

import { getVideoData } from './youtube/metadata';
import { getTranscript } from './youtube/transcript';
import { upsertVideo } from './supabase';
import {
  upsertTranscript,
  getAnalysisByVideoId,
  getVideoByYoutubeId,
  getTranscriptByVideoId,
} from './supabase-decoder';
import { getAudienceAnalysisByVideoId } from './supabase-audience';
import { VideoData } from './types';

export type DecodeProgressCallback = (message: string) => void;

export interface PrepareResult {
  videoId: string;                    // Supabase UUID
  youtubeVideoId: string;
  videoData: VideoData;
  transcript: string;
  wordCount: number;
  existingAnalysisId: string | null;
  existingAudienceId: string | null;
}

function extractYoutubeVideoId(input: string): string {
  const m = input.match(/[?&]v=([^&]+)/);      if (m) return m[1];
  const s = input.match(/youtu\.be\/([^?&]+)/); if (s) return s[1];
  const e = input.match(/\/embed\/([^?&]+)/);   if (e) return e[1];
  if (/^[\w-]{11}$/.test(input)) return input;
  return input;
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
  const [existingAnalysis, existingAudience] = await Promise.all([
    getAnalysisByVideoId(videoId, 'decode'),
    getAudienceAnalysisByVideoId(videoId),
  ]);

  return {
    videoId,
    youtubeVideoId,
    videoData,
    transcript,
    wordCount,
    existingAnalysisId: existingAnalysis?.id ?? null,
    existingAudienceId: existingAudience?.id ?? null,
  };
}
