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

// ─── Phase 3: Decoder Engine Types ───────────────────────────────────────────

export interface DimensionScores {
  system1Activation: number;
  informationGap: number;
  steppsSocialCurrency: number;
  steppsTriggers: number;
  steppsEmotion: number;
  steppsPublic: number;
  steppsPracticalValue: number;
  steppsStories: number;
  attentionArchitecture: number;
  lossAversion: number;
}

export interface KeyMoment {
  timestamp: string;
  transcriptQuote: string;
  mechanism: string;
  dimensionsActivated: string[];
}

export interface PsychologicalFormula {
  primaryMechanism: string;
  mechanismDescription: string;
  supportingMechanisms: string[];
  interactionEffects: string;
  keyMoments: KeyMoment[];
}

export interface EngagementScore {
  overall: number;
  confidence: 'low' | 'medium' | 'high';
  dimensions: DimensionScores;
  interactionNotes: string;
}

export interface ReplicationBrief {
  hookStrategy: string;
  contentStructure: string;
  priorityTriggers: string[];
  avoidanceNotes: string;
}

export interface ScriptOutline {
  hookBeat: string;
  evidenceBeats: string[];
  payoffBeat: string;
  closeBeat: string;
}

export interface DecoderResult {
  id?: string;                        // Supabase analysis UUID — set after saving to DB
  psychologicalFormula: PsychologicalFormula;
  engagementScore: EngagementScore;
  replicationBrief: ReplicationBrief;
  scriptOutline: ScriptOutline;
}

export interface TranscriptData {
  id?: string;
  videoId: string;
  fullText: string;
  wordCount: number;
  language: string;
  createdAt?: string;
}

export interface AnalysisRecord {
  id?: string;
  videoId: string;
  analysisType: 'decode' | 'build';
  llmProvider: string;
  llmModel: string;
  promptVersion: string;
  result: DecoderResult;
  overallScore: number;
  dimensionScores: DimensionScores;
  processingTimeMs?: number;
  tokensInput?: number;
  tokensOutput?: number;
  createdAt?: string;
}

// ─── Phase 4: Builder Engine Types ────────────────────────────────────────────

export interface CreatorContext {
  channelName: string;
  niche: string;
  typicalContentStyle?: string;
  targetAudience?: string;
}

export interface BuilderInstruction {
  instruction: string;
  reason: string;
  domain: 'cognitive_psychology' | 'emotion_science' | 'social_behavioural' |
          'visual_psychology' | 'audio_music' | 'performance_direction' | 'production_craft';
  confidence: 'low' | 'medium' | 'high';
}

export interface ProductionBrief {
  hookStrategy: BuilderInstruction;
  contentStructure: BuilderInstruction;
  priorityTriggers: BuilderInstruction[];
  avoidanceNotes: string;
}

export interface BuilderScriptOutline {
  hookBeat: BuilderInstruction;
  evidenceBeats: BuilderInstruction[];
  payoffBeat: BuilderInstruction;
  closeBeat: BuilderInstruction;
}

export interface BuilderResult {
  creatorContext: CreatorContext;
  productionBrief: ProductionBrief;
  scriptOutline: BuilderScriptOutline;
  sourceAnalysisId: string;
  promptVersion: string;
}

export interface BriefRecord {
  id?: string;
  videoId: string;
  analysisType: 'build';
  llmProvider: string;
  llmModel: string;
  promptVersion: string;
  result: BuilderResult;
  overallScore?: number;
  dimensionScores?: undefined;
  processingTimeMs?: number;
  createdAt?: string;
}
