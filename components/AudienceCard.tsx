'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AudienceResult } from '@/lib/types';

interface AudienceCardProps {
  result: AudienceResult;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function AudienceCard({ result }: AudienceCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-bold text-base">Audience Decode</h2>
          <div className="flex items-center gap-2">
            <Badge className="bg-violet-100 text-violet-800 capitalize">
              {result.dominantSentiment}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {result.commentsAnalysed} top comments analysed
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Section title="Emotional Triggers">
            <div className="flex flex-wrap gap-1.5">
              {result.emotionalTriggers.map((trigger) => (
                <Badge key={trigger} variant="secondary" className="capitalize">{trigger}</Badge>
              ))}
            </div>
          </Section>
          <Section title="Resonant Themes">
            <div className="flex flex-wrap gap-1.5">
              {result.resonantThemes.map((theme) => (
                <Badge key={theme} variant="outline" className="capitalize">{theme}</Badge>
              ))}
            </div>
          </Section>
        </div>

        <Section title="How the Audience Responded">
          <p className="text-sm leading-relaxed">{result.audienceReactionPattern}</p>
        </Section>

        {result.expectationGap && (
          <Section title="Expectation Gap">
            <p className="text-sm leading-relaxed">{result.expectationGap}</p>
          </Section>
        )}

        <Section title="What Worked">
          <p className="text-sm leading-relaxed">{result.whatWorked}</p>
        </Section>

        {result.standoutComments.length > 0 && (
          <Section title="Standout Comments">
            <ul className="space-y-3">
              {result.standoutComments.map((comment, i) => (
                <li key={i} className="rounded border border-gray-200 bg-muted/40 p-3">
                  <p className="text-sm italic leading-relaxed">&ldquo;{comment.text}&rdquo;</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    <span className="font-medium text-violet-600">{comment.likeCount.toLocaleString()} likes</span>
                    {' — '}{comment.insight}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </CardContent>
    </Card>
  );
}
