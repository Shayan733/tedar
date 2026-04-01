// TEDAR — Decode results page
// Server component: loads video + analysis from DB, renders immediately if cached.
// Falls back to DecodeLoader (client) when analysis does not exist yet.

import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { AnalysisCard } from '@/components/AnalysisCard';
import { DecodeLoader } from './DecodeLoader';
import { getVideoByYoutubeId, getAnalysisByVideoId } from '@/lib/supabase-decoder';
import { OutlierCategory } from '@/lib/types';

function badgeClass(category: OutlierCategory): string {
  switch (category) {
    case 'viral':         return 'bg-red-100 text-red-800';
    case 'strong':        return 'bg-orange-100 text-orange-800';
    case 'notable':       return 'bg-yellow-100 text-yellow-800';
    case 'above_average': return 'bg-blue-100 text-blue-800';
    default:              return 'bg-gray-100 text-gray-800';
  }
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K views`;
  return `${n} views`;
}

export default async function DecodePage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  // ── await params — required in Next.js App Router (Phase 2 bug pattern) ──
  const { videoId } = await params;

  const video = await getVideoByYoutubeId(videoId);
  if (!video || !video.id) redirect('/');

  const analysis = await getAnalysisByVideoId(video.id, 'decode');

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Video header */}
      <div className="space-y-3">
        {video.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full rounded-lg object-cover aspect-video"
          />
        )}

        <h1 className="text-xl font-bold text-gray-900 leading-snug">{video.title}</h1>

        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          {video.channelName && <span>{video.channelName}</span>}
          {video.channelName && <span>·</span>}
          <span>{formatViews(video.viewCount)}</span>
          {video.outlierScore && video.outlierCategory && (
            <>
              <span>·</span>
              <Badge className={`text-xs ${badgeClass(video.outlierCategory)}`}>
                {video.outlierScore.toFixed(1)}x — {video.outlierCategory.replace('_', ' ')}
              </Badge>
            </>
          )}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* State 1: cached analysis — render immediately */}
      {analysis ? (
        <AnalysisCard result={analysis.result} videoData={video} />
      ) : (
        /* State 2: no analysis yet — client component triggers decode API */
        <DecodeLoader videoData={video} />
      )}

    </main>
  );
}
