// TEDAR — Master type definitions
// Every other file imports types from here. Never define types elsewhere.

export interface NicheData {
  id?: string;
  name: string;
  keywords: string[];
  channelCount: number;
  lastScannedAt?: string;
  createdAt?: string;
}

export interface ChannelData {
  id?: string;
  youtubeChannelId: string;
  channelName: string;
  channelUrl?: string;
  subscriberCount?: number;
  totalVideoCount?: number;
  nicheId?: string;
  avgViews?: number;
  relevanceScore?: number;
  lastScannedAt?: string;
  createdAt?: string;
}

export interface VideoData {
  id?: string;
  youtubeVideoId: string;
  channelId?: string;
  title: string;
  description?: string;
  url: string;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  durationSeconds?: number;
  publishedAt?: string;
  thumbnailUrl?: string;
  tags?: string[];
  outlierScore?: number;
  outlierCategory?: OutlierCategory;
  hasTranscript?: boolean;
  hasAnalysis?: boolean;
  createdAt?: string;
  // Channel info (joined from channels table)
  channelName?: string;
  channelUrl?: string;
}

export type OutlierCategory =
  | 'underperformer'
  | 'normal'
  | 'above_average'
  | 'notable'
  | 'strong'
  | 'viral';

export interface OutlierResult {
  video: VideoData;
  outlierScore: number;
  outlierCategory: OutlierCategory;
  channelAvgViews: number;
  channelName: string;
  rank: number;
}

export interface ChannelSearchResult {
  youtubeChannelId: string;
  channelName: string;
  channelUrl: string;
  description?: string;
  subscriberCount?: number;
  thumbnailUrl?: string;
}

export interface RankedChannel extends ChannelSearchResult {
  relevanceScore: number;
  relevanceReason: string;
}

export interface PipelineConfig {
  flagThreshold: number;
  flagMetric: 'views' | 'engagement_rate' | 'view_velocity' | 'comment_ratio';
  maxChannelsToScan: number;
  maxVideosPerChannel: number;
  maxOutliersToAnalyse: number;
}

export interface PipelineRun {
  id?: string;
  inputType: 'niche' | 'channel' | 'video';
  inputValue: string;
  channelsFound: number;
  videosScanned: number;
  outliersFound: number;
  analysesCompleted: number;
  briefsGenerated: number;
  status: 'running' | 'completed' | 'failed';
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface LLMResponse {
  text: string;
  tokensUsed?: number;
}

export interface VideoSnapshotData {
  videoId: string;
  scannedAt: string;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  outlierScore?: number;
  outlierCategory?: OutlierCategory;
  channelAvgViewsAtScan?: number;
}
