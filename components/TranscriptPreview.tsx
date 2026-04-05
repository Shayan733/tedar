'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoData } from '@/lib/types';

interface TranscriptPreviewProps {
  videoData: VideoData;
  transcript: string;
  wordCount: number;
  existingAnalysisId: string | null;
  onAnalyseClick: () => void;
  onViewExistingClick?: () => void;
  isCollapsed?: boolean;
}

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K views`;
  return `${n} views`;
}

function formatWordCount(n: number): string {
  return n.toLocaleString();
}

export function TranscriptPreview({
  videoData,
  transcript,
  wordCount,
  existingAnalysisId,
  onAnalyseClick,
  onViewExistingClick,
  isCollapsed = false,
}: TranscriptPreviewProps) {
  const [transcriptExpanded, setTranscriptExpanded] = useState(!isCollapsed);

  // Sync with isCollapsed prop changes (when analysis starts)
  const showTranscript = !isCollapsed && transcriptExpanded;

  return (
    <div className="space-y-4">
      {/* Video info card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {videoData.thumbnailUrl && (
              <img
                src={videoData.thumbnailUrl}
                alt={videoData.title}
                className="w-40 h-[90px] object-cover rounded flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base leading-snug line-clamp-2 mb-1">
                {videoData.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {videoData.channelName ?? 'Unknown Channel'}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary">{formatViewCount(videoData.viewCount)}</Badge>
                {videoData.publishedAt && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(videoData.publishedAt).getFullYear()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcript section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-semibold text-sm">Transcript</span>
              <span className="text-xs text-muted-foreground ml-2">{formatWordCount(wordCount)} words</span>
            </div>
            {!isCollapsed && (
              <button
                onClick={() => setTranscriptExpanded(v => !v)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {transcriptExpanded ? '▲ Hide' : '▼ Show'}
              </button>
            )}
            {isCollapsed && (
              <span className="text-xs text-muted-foreground">Collapsed during analysis</span>
            )}
          </div>

          {showTranscript && (
            <div className="max-h-[400px] overflow-y-auto rounded bg-muted/40 p-3">
              <p className="text-sm leading-[1.7] whitespace-pre-wrap">{transcript}</p>
            </div>
          )}

          {!showTranscript && !isCollapsed && (
            <p className="text-xs text-muted-foreground italic">Transcript hidden — click Show to expand.</p>
          )}
        </CardContent>
      </Card>

      {/* Action area */}
      {!isCollapsed && (
        <div className="flex flex-col items-start gap-2">
          {existingAnalysisId ? (
            <>
              <p className="text-xs text-muted-foreground">This video has been analysed before.</p>
              <Button size="lg" onClick={onViewExistingClick ?? onAnalyseClick}>
                View Previous Analysis
              </Button>
              <button
                onClick={onAnalyseClick}
                className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
              >
                Re-analyse with K1 Framework
              </button>
            </>
          ) : (
            <>
              <Button size="lg" onClick={onAnalyseClick}>
                Analyse with K1 Framework
              </Button>
              <p className="text-xs text-muted-foreground">
                Analysis takes 15–30 seconds using Kahneman, Berger, Loewenstein and Salt frameworks.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
