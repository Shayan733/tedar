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
  trendMode: boolean;       // true = recent 30 days, lower threshold. false = full baseline (100 videos, 365 days)
  maxDaysOld?: number;      // only include videos published within this many days (undefined = no filter)
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

export interface ChannelSnapshotData {
  channelId: string;
  scannedAt: string;
  subscriberCount?: number;
  avgViews?: number;
  totalVideoCount?: number;
  relevanceScore?: number;
}

export interface NicheSnapshotData {
  nicheId: string;
  scannedAt: string;
  channelCount: number;
  avgOutlierScore?: number;
  totalVideosScanned: number;
  totalOutliersFound: number;
}

export type VelocityInterval = '24h' | '48h' | '7d' | '30d' | 'latest';

export interface VideoVelocitySnapshotData {
  videoId: string;
  recordedAt: string;
  intervalLabel: VelocityInterval;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  outlierScore?: number;
}

export interface NichePipelineResult {
  runId: string;
  inputType: 'niche';
  inputValue: string;
  channelsScanned: number;
  videosScanned: number;
  outliersFound: number;
  outliers: OutlierResult[];
  topChannels: RankedChannel[];
}

export interface ChannelPipelineResult {
  runId: string;
  inputType: 'channel';
  inputValue: string;
  channelName: string;
  videosScanned: number;
  outliersFound: number;
  outliers: OutlierResult[];
}

export interface VideoPipelineResult {
  runId: string;
  inputType: 'video';
  inputValue: string;
  video: VideoData;
  decoderAvailable: false;
}
