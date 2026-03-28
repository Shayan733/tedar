// TEDAR — Outlier detection: the mathematical heart of the Scout Engine
// Calculates which videos are significantly outperforming a channel's average.

import { VideoData, OutlierCategory, OutlierResult, PipelineConfig } from '../types';
import { OUTLIER_THRESHOLDS, CHANNEL_BASELINE_TRIM_PERCENT } from '../config';

export function calculateChannelBaseline(videos: VideoData[]): number {
  if (videos.length === 0) return 0;

  // Sort by view count descending
  const sorted = [...videos].sort((a, b) => b.viewCount - a.viewCount);

  // Exclude top 5% to prevent viral outliers from distorting the baseline.
  // Reason: one video with 10M views on a 100K-average channel would inflate the
  // average to ~300K, masking real outliers. Trimmed mean gives the true typical
  // performance. Standard technique in viral content diffusion research.
  const trimCount = Math.ceil(sorted.length * CHANNEL_BASELINE_TRIM_PERCENT);
  const trimmed = sorted.slice(trimCount);

  const total = trimmed.reduce((sum, v) => sum + v.viewCount, 0);
  return total / trimmed.length;
}

export function categoriseOutlier(score: number): OutlierCategory {
  // Thresholds from config — never hard-coded here.
  // 3x default: normal variance is 0.5x–2x; above 3x is statistically unusual.
  if (score < OUTLIER_THRESHOLDS.underperformer) return 'underperformer';
  if (score < OUTLIER_THRESHOLDS.normal) return 'normal';
  if (score < OUTLIER_THRESHOLDS.above_average) return 'above_average';
  if (score < OUTLIER_THRESHOLDS.notable) return 'notable';
  if (score < OUTLIER_THRESHOLDS.strong) return 'strong';
  return 'viral';
}

export function detectOutliers(
  videos: VideoData[],
  channelName: string,
  config: PipelineConfig
): OutlierResult[] {
  if (videos.length === 0) return [];

  const baseline = calculateChannelBaseline(videos);
  if (baseline === 0) return [];

  const results: OutlierResult[] = [];

  for (const video of videos) {
    const score = video.viewCount / baseline;

    // Only flag videos above the configured threshold (default: 3x).
    // Reason for 50-video minimum: fewer than 30 gives an unreliable baseline —
    // one bad month skews everything. 50 balances accuracy vs. API cost.
    if (score >= config.flagThreshold) {
      results.push({
        video,
        outlierScore: score,
        outlierCategory: categoriseOutlier(score),
        channelAvgViews: baseline,
        channelName,
        rank: 0, // assigned after sorting
      });
    }
  }

  // Sort by score descending and assign ranks
  results.sort((a, b) => b.outlierScore - a.outlierScore);
  results.forEach((r, i) => { r.rank = i + 1; });

  return results;
}
