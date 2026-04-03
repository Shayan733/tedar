'use client';

import { useEffect, useState } from 'react';
import { AnalysisCard } from '@/components/AnalysisCard';
import { BriefBuilder } from './BriefBuilder';
import { DecoderResult, VideoData } from '@/lib/types';
import { readStream } from '@/lib/streaming';

interface DecodeLoaderProps {
  videoData: VideoData;
}

interface DecodeResultData {
  data: DecoderResult;
  meta: { cached: boolean; analysisId?: string };
}

export function DecodeLoader({ videoData }: DecodeLoaderProps) {
  const [result, setResult] = useState<DecoderResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('Checking cache...');

  useEffect(() => {
    let cancelled = false;

    fetch('/api/decode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl: videoData.url }),
    })
      .then(async (res) => {
        await readStream(res, (event) => {
          if (cancelled) return;
          if (event.type === 'progress') {
            setProgressMessage(event.message);
          } else if (event.type === 'result') {
            const d = event.data as DecodeResultData;
            if (!d.data) {
              setError('Analysis failed — no result returned.');
              return;
            }
            setResult(d.data);
            if (d.meta?.analysisId) setAnalysisId(d.meta.analysisId);
          } else if (event.type === 'error') {
            setError(event.message);
          }
        });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Analysis could not be completed.');
        }
      });

    return () => { cancelled = true; };
  }, [videoData.url]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center space-y-3">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={() => { setError(null); setResult(null); }}
          className="text-xs underline text-red-600 hover:text-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-10 text-center space-y-4">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-r-transparent" />
        <p className="text-sm text-gray-600 font-medium">{progressMessage}</p>
        <p className="text-xs text-gray-400">This takes 20–40 seconds</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnalysisCard result={result} videoData={videoData} />
      {analysisId && (
        <>
          <hr className="border-gray-200" />
          <BriefBuilder analysisId={analysisId} />
        </>
      )}
    </div>
  );
}
