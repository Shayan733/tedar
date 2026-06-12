'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LibraryEntry } from '@/lib/types';

interface LibraryCardProps {
  entry: LibraryEntry;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K views`;
  return `${n} views`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function LibraryCard({ entry }: LibraryCardProps) {
  const [viewCount, setViewCount] = useState(entry.viewCount);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefreshStats() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/library/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: entry.videoId }),
      });
      const json = await res.json() as { data?: { viewCount: number }; error?: string };
      if (json.data) setViewCount(json.data.viewCount);
    } catch {
      // stats refresh is best-effort — keep the stale count on failure
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex gap-3">
          {entry.thumbnailUrl && (
            <Link href={`/decode/${entry.youtubeVideoId}`} className="flex-shrink-0">
              {/* img used directly — external YouTube thumbnails */}
              <img
                src={entry.thumbnailUrl}
                alt={entry.title}
                className="w-32 h-[72px] object-cover rounded"
              />
            </Link>
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <Link
              href={`/decode/${entry.youtubeVideoId}`}
              className="font-semibold text-sm leading-snug line-clamp-2 hover:text-violet-700 transition-colors"
            >
              {entry.title}
            </Link>
            <p className="text-xs text-muted-foreground">
              {entry.channelName ?? 'Unknown Channel'} · {formatViews(viewCount)}
              {entry.publishedAt ? ` · ${formatDate(entry.publishedAt)}` : ''}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {entry.hasTranscript && <Badge variant="secondary">Transcript</Badge>}
              {entry.decode && (
                <Badge className="bg-violet-100 text-violet-800">
                  K1 {entry.decode.overallScore !== null ? `· ${entry.decode.overallScore}` : ''}
                  {entry.decode.runCount > 1 ? ` · ${entry.decode.runCount} runs` : ''}
                </Badge>
              )}
              {entry.audience && (
                <Badge className="bg-blue-100 text-blue-800">
                  Audience{entry.audience.runCount > 1 ? ` · ${entry.audience.runCount} runs` : ''}
                </Badge>
              )}
              {entry.hasBrief && <Badge className="bg-green-100 text-green-800">Brief</Badge>}
              {!entry.decode && !entry.audience && (
                <Badge variant="outline" className="text-muted-foreground">Not analysed</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end justify-between flex-shrink-0">
            <button
              onClick={() => void handleRefreshStats()}
              disabled={refreshing}
              className="text-xs text-muted-foreground underline hover:text-foreground transition-colors disabled:opacity-50"
            >
              {refreshing ? 'Refreshing…' : 'Refresh stats'}
            </button>
            <Link
              href={`/decode/${entry.youtubeVideoId}`}
              className="text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors"
            >
              Open →
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
