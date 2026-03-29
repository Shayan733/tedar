// TEDAR — Configurable settings and thresholds
// All numbers live here. Never hard-code values in other files.

import { PipelineConfig } from './types';

// Default: full baseline mode — accurate outlier scores, broader historical window
export const DEFAULT_CONFIG: PipelineConfig = {
  flagThreshold: 3.0,          // Videos 3x above channel average are flagged
  flagMetric: 'views',         // Default metric for outlier detection
  maxChannelsToScan: 5,        // Max channels per niche scan (5 = ~60s browser-safe, 20 = ~5min)
  maxVideosPerChannel: 100,    // Pull 100 videos per channel for accurate baseline (2 paginated API calls)
  maxOutliersToAnalyse: 20,    // Max outliers to send to Decoder in Phase 3
  trendMode: false,            // false = baseline mode (100 videos, 365 days, 3x threshold)
};

// Trend mode: finds what is breaking through RIGHT NOW — last 30 days, lower threshold
export const TREND_MODE_CONFIG: PipelineConfig = {
  flagThreshold: 2.0,          // Lower bar — 2x average is notable in a short window
  flagMetric: 'views',
  maxChannelsToScan: 5,
  maxVideosPerChannel: 30,     // Only recent videos needed — no pagination required
  maxOutliersToAnalyse: 20,
  trendMode: true,
  maxDaysOld: 30,              // Only include videos published in the last 30 days
};

// Baseline mode: full historical outlier detection — what consistently outperforms
export const BASELINE_MODE_CONFIG: PipelineConfig = {
  flagThreshold: 3.0,
  flagMetric: 'views',
  maxChannelsToScan: 5,
  maxVideosPerChannel: 100,    // 100 videos = strong baseline, excludes flukes
  maxOutliersToAnalyse: 20,
  trendMode: false,
  maxDaysOld: 365,
};

export const OUTLIER_THRESHOLDS = {
  underperformer: 0.5,
  normal: 1.5,
  above_average: 3.0,
  notable: 5.0,
  strong: 10.0,
  // above 10.0 = viral
};

export const MAX_TRANSCRIPT_WORDS = 15000;
export const LLM_TEMPERATURE = 0.3;
export const LLM_MAX_TOKENS = 16384;
export const YOUTUBE_MAX_RESULTS = 50;
export const CHANNEL_BASELINE_TRIM_PERCENT = 0.05; // Exclude top 5% when calculating baseline

// LLM provider note:
// Active: Groq llama-3.3-70b-versatile — generous free tier, no daily quota issues
// Gemini 2.5 Flash free tier: 20 requests/day (NOT 250 — actual measured limit)
// Switch providers: change LLM_PROVIDER in .env.local (groq or gemini)
