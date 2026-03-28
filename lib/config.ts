// TEDAR — Configurable settings and thresholds
// All numbers live here. Never hard-code values in other files.

import { PipelineConfig } from './types';

export const DEFAULT_CONFIG: PipelineConfig = {
  flagThreshold: 3.0,          // Videos 3x above channel average are flagged
  flagMetric: 'views',         // Default metric for outlier detection
  maxChannelsToScan: 20,       // Max channels to scan per niche
  maxVideosPerChannel: 50,     // Videos pulled per channel
  maxOutliersToAnalyse: 20,    // Max outliers to send to Decoder
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
