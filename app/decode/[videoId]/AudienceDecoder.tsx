'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AudienceCard } from '@/components/AudienceCard';
import { AudienceResult } from '@/lib/types';
import { readStream } from '@/lib/streaming';

type AudienceStage = 'idle' | 'analysing' | 'complete' | 'error';

interface AudienceDecoderProps {
  videoId: string;                    // Supabase UUID
  existingAudienceId: string | null;  // cached run detected during prepare
}

export function AudienceDecoder({ videoId, existingAudienceId }: AudienceDecoderProps) {
  const [stage, setStage] = useState<AudienceStage>('idle');
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [result, setResult] = useState<AudienceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDecode(forceRefresh: boolean) {
    setStage('analysing');
    setProgressMessages([]);
    setError(null);
    try {
      const res = await fetch('/api/decode/audience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, forceRefresh }),
      });
      await readStream(res, (event) => {
        if (event.type === 'progress') {
          setProgressMessages(prev => [...prev, event.message]);
        } else if (event.type === 'result') {
          setResult(event.data as AudienceResult);
          setStage('complete');
        } else if (event.type === 'error') {
          setError(event.message);
          setStage('error');
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Audience decode could not be completed.');
      setStage('error');
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-bold text-lg">Audience Decoder</h2>
        <p className="text-sm text-muted-foreground">
          The K1 analysis decodes the content. This decodes the crowd — what the
          top comments reveal about how viewers actually reacted.
        </p>
      </div>

      {stage === 'idle' && (
        <div className="flex flex-col items-start gap-2">
          {existingAudienceId ? (
            <>
              <p className="text-xs text-muted-foreground">This audience has been decoded before.</p>
              <Button size="lg" onClick={() => void handleDecode(false)}>
                View Audience Decode
              </Button>
              <button
                onClick={() => void handleDecode(true)}
                className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
              >
                Re-decode with fresh comments
              </button>
            </>
          ) : (
            <>
              <Button size="lg" onClick={() => void handleDecode(false)}>
                Decode the Audience
              </Button>
              <p className="text-xs text-muted-foreground">
                Reads the 50 most-liked comments and extracts sentiment, triggers and resonant themes.
              </p>
            </>
          )}
        </div>
      )}

      {stage === 'analysing' && (
        <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-4">
          {progressMessages.map((msg, i) => (
            <p key={i} className="text-xs text-gray-500 font-mono">
              <span className="text-violet-500 mr-2">✓</span>{msg}
            </p>
          ))}
          {progressMessages.length === 0 && (
            <p className="text-xs text-gray-400">Starting audience decode…</p>
          )}
        </div>
      )}

      {stage === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setStage('idle')}
            className="text-xs underline text-red-600 hover:text-red-800"
          >
            Back
          </button>
        </div>
      )}

      {stage === 'complete' && result && (
        <div className="space-y-2">
          <AudienceCard result={result} />
          <button
            onClick={() => void handleDecode(true)}
            className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
          >
            Re-decode with fresh comments
          </button>
        </div>
      )}
    </section>
  );
}
