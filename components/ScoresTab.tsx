'use client';

import { Badge } from '@/components/ui/badge';
import { EngagementScore, DimensionScores } from '@/lib/types';

const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  system1Activation:    'System 1 Activation',
  informationGap:       'Information Gap',
  steppsSocialCurrency: 'Social Currency',
  steppsTriggers:       'Triggers',
  steppsEmotion:        'Emotion (High-Arousal)',
  steppsPublic:         'Public / Social Proof',
  steppsPracticalValue: 'Practical Value',
  steppsStories:        'Stories / Narrative',
  attentionArchitecture:'Attention Architecture',
  lossAversion:         'Loss Aversion',
};

function barColor(score: number): string {
  if (score > 70) return 'bg-green-500';
  if (score >= 40) return 'bg-amber-400';
  return 'bg-red-400';
}

function overallBg(score: number): string {
  if (score > 70) return 'bg-green-100 text-green-800';
  if (score >= 40) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

function confidenceBadge(confidence: 'low' | 'medium' | 'high'): string {
  if (confidence === 'high') return 'bg-green-100 text-green-800';
  if (confidence === 'medium') return 'bg-amber-100 text-amber-800';
  return 'bg-gray-100 text-gray-600';
}

export function ScoresTab({ score }: { score: EngagementScore }) {
  const dims = score.dimensions;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className={`rounded-xl px-5 py-3 ${overallBg(score.overall)}`}>
          <span className="text-4xl font-black">{score.overall}</span>
          <span className="text-lg font-semibold">/100</span>
        </div>
        <div className="space-y-1">
          <Badge className={`text-xs ${confidenceBadge(score.confidence)}`}>
            {score.confidence} confidence
          </Badge>
          <p className="text-xs text-gray-500">Engagement Score</p>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Interaction Notes</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{score.interactionNotes}</p>
      </div>

      <div className="space-y-3">
        {(Object.keys(DIMENSION_LABELS) as (keyof DimensionScores)[]).map((key) => {
          const val = dims[key];
          return (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{DIMENSION_LABELS[key]}</span>
                <span className="font-semibold text-gray-800">{val}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${barColor(val)}`}
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
