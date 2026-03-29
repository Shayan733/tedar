'use client';

// eslint-disable-next-line @next/next/no-img-element
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OutlierResult, OutlierCategory } from '@/lib/types';

interface OutlierCardProps {
  result: OutlierResult;
  rank: number;
}

function getBadgeClass(category: OutlierCategory): string {
  switch (category) {
    case 'viral':        return 'bg-red-100 text-red-800';
    case 'strong':       return 'bg-orange-100 text-orange-800';
    case 'notable':      return 'bg-yellow-100 text-yellow-800';
    case 'above_average':return 'bg-blue-100 text-blue-800';
    default:             return 'bg-gray-100 text-gray-800';
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function OutlierCard({ result, rank }: OutlierCardProps) {
  const { video, outlierScore, outlierCategory } = result;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        {video.thumbnailUrl && (
          <div className="relative w-full aspect-video">
            {/* img used directly — thumbnails are external URLs, next/image requires domain config */}
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-black text-white text-xs font-bold px-2 py-1 rounded">
              #{rank}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">{video.title}</h3>
        <p className="text-xs text-gray-500">{result.channelName}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold">{outlierScore.toFixed(1)}x</span>
          <Badge className={`text-xs ${getBadgeClass(outlierCategory)}`}>
            {outlierCategory.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{video.viewCount.toLocaleString()} views</span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>
        <Button
          disabled
          variant="outline"
          size="sm"
          className="w-full mt-2 opacity-40 cursor-not-allowed"
          title="Psychological analysis — available in Phase 3"
        >
          Decode this video
        </Button>
        <p className="text-xs text-center text-gray-400">Psychological analysis — available in Phase 3</p>
      </CardContent>
    </Card>
  );
}
