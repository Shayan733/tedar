'use client';

import { useEffect, useState, useCallback } from 'react';
import { TranscriptPreview } from '@/components/TranscriptPreview';
import { AnalysisCard } from '@/components/AnalysisCard';
import { DecoderResult, VideoData } from '@/lib/types';
import { readStream } from '@/lib/streaming';

type DecodeStage = 'preparing' | 'previewing' | 'analysing' | 'complete' | 'error';

interface PreparedData {
  videoId: string;
  videoData: VideoData;
  transcript: string;
  wordCount: number;
  existingAnalysisId: string | null;
  existingAudienceId: string | null;
}

interface DecodeLoaderProps {
  youtubeVideoId: string;
  videoUrl: string;
  onAnalysisComplete?: (analysisId: string) => void;
  onPrepared?: (videoId: string, existingAudienceId: string | null) => void;
}

export function DecodeLoader({ videoUrl, onAnalysisComplete, onPrepared }: DecodeLoaderProps) {
  const [stage, setStage] = useState<DecodeStage>('preparing');
  const [prepared, setPrepared] = useState<PreparedData | null>(null);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<DecoderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runPrepare = useCallback(async () => {
    setStage('preparing');
    setError(null);
    setPrepared(null);
    try {
      const res = await fetch('/api/decode/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });
      const json = await res.json() as { data?: PreparedData; error?: string };
      if (json.error || !json.data) throw new Error(json.error ?? 'Prepare failed');
      setPrepared(json.data);
      setStage('previewing');
      onPrepared?.(json.data.videoId, json.data.existingAudienceId ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load video.');
      setStage('error');
    }
  }, [videoUrl, onPrepared]); // parent must pass a stable onPrepared (useCallback)

  useEffect(() => { void runPrepare(); }, [runPrepare]);

  async function handleAnalyse(forceRefresh = false) {
    if (!prepared) return;
    setStage('analysing');
    setProgressMessages([]);
    try {
      const res = await fetch('/api/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: prepared.videoId, forceRefresh }),
      });
      await readStream(res, (event) => {
        if (event.type === 'progress') {
          setProgressMessages(prev => [...prev, event.message]);
        } else if (event.type === 'result') {
          const result = event.data as DecoderResult;
          setAnalysisResult(result);
          setStage('complete');
          if (result.id) onAnalysisComplete?.(result.id);
        } else if (event.type === 'error') {
          setError(event.message);
          setStage('error');
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis could not be completed.');
      setStage('error');
    }
  }

  if (stage === 'preparing') {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-10 text-center space-y-4">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-r-transparent" />
        <p className="text-sm text-gray-600 font-medium">Loading video and transcript…</p>
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center space-y-3">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={() => void runPrepare()} className="text-xs underline text-red-600 hover:text-red-800">
          Try again
        </button>
      </div>
    );
  }

  if (!prepared) return null;

  return (
    <div className="space-y-6">
      <TranscriptPreview
        videoData={prepared.videoData}
        transcript={prepared.transcript}
        wordCount={prepared.wordCount}
        existingAnalysisId={prepared.existingAnalysisId}
        onAnalyseClick={() => void handleAnalyse(true)}
        onViewExistingClick={() => void handleAnalyse(false)}
        isCollapsed={stage === 'analysing' || stage === 'complete'}
      />

      {stage === 'analysing' && (
        <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-4">
          {progressMessages.map((msg, i) => (
            <p key={i} className="text-xs text-gray-500 font-mono">
              <span className="text-violet-500 mr-2">✓</span>{msg}
            </p>
          ))}
          {progressMessages.length === 0 && (
            <p className="text-xs text-gray-400">Starting analysis…</p>
          )}
        </div>
      )}

      {stage === 'complete' && analysisResult && (
        <AnalysisCard result={analysisResult} videoData={prepared.videoData} />
      )}
    </div>
  );
}
