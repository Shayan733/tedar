// TEDAR — Analysis export
// Merged from DP-YT-PIPELINE's CSV/JSON export: one row per video, always the
// LATEST decode analysis (full run history stays in the database).

import { supabaseAdmin } from './supabase';
import { DecoderResult } from './types';

export interface ExportRow {
  youtubeVideoId: string;
  title: string;
  channelName: string;
  url: string;
  viewCount: number;
  overallScore: number | null;
  confidence: string;
  primaryMechanism: string;
  supportingMechanisms: string;
  hookStrategy: string;
  priorityTriggers: string;
  llmModel: string;
  analysedAt: string;
}

interface ExportAnalysisRow {
  id: string;
  video_id: string;
  overall_score: number | null;
  llm_model: string;
  created_at: string;
  result: DecoderResult;
  videos: {
    youtube_video_id?: string;
    title?: string;
    url?: string;
    view_count?: number;
    channels?: { channel_name?: string } | { channel_name?: string }[] | null;
  } | null;
}

export async function getExportRows(): Promise<ExportRow[]> {
  const { data, error } = await supabaseAdmin
    .from('analyses')
    .select('id, video_id, overall_score, llm_model, created_at, result, videos(youtube_video_id, title, url, view_count, channels(channel_name))')
    .eq('analysis_type', 'decode')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to load analyses for export: ${error.message}`);

  // Rows arrive newest-first — first row seen per video is its latest run
  const latest = new Map<string, ExportAnalysisRow>();
  for (const row of (data ?? []) as unknown as ExportAnalysisRow[]) {
    if (!latest.has(row.video_id)) latest.set(row.video_id, row);
  }

  return [...latest.values()].map((row) => {
    const v = row.videos;
    const rawChannel = v?.channels;
    const channel = Array.isArray(rawChannel) ? rawChannel[0] ?? null : rawChannel ?? null;
    const formula = row.result?.psychologicalFormula;
    const brief = row.result?.replicationBrief;
    return {
      youtubeVideoId: v?.youtube_video_id ?? '',
      title: v?.title ?? '',
      channelName: channel?.channel_name ?? '',
      url: v?.url ?? '',
      viewCount: v?.view_count ?? 0,
      overallScore: row.overall_score,
      confidence: row.result?.engagementScore?.confidence ?? '',
      primaryMechanism: formula?.primaryMechanism ?? '',
      supportingMechanisms: (formula?.supportingMechanisms ?? []).join(' | '),
      hookStrategy: brief?.hookStrategy ?? '',
      priorityTriggers: (brief?.priorityTriggers ?? []).join(' | '),
      llmModel: row.llm_model,
      analysedAt: row.created_at,
    };
  });
}

function escapeCsvField(value: string | number | null): string {
  const str = value === null ? '' : String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

const EXPORT_HEADERS: (keyof ExportRow)[] = [
  'youtubeVideoId', 'title', 'channelName', 'url', 'viewCount',
  'overallScore', 'confidence', 'primaryMechanism', 'supportingMechanisms',
  'hookStrategy', 'priorityTriggers', 'llmModel', 'analysedAt',
];

export function toCsv(rows: ExportRow[]): string {
  const headers = EXPORT_HEADERS;
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvField(row[h])).join(','));
  }
  return lines.join('\r\n');
}
