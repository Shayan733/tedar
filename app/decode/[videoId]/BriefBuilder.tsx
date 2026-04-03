'use client';

import { useState } from 'react';
import { BuilderCard } from '@/components/BuilderCard';
import { BuilderResult } from '@/lib/types';
import { readStream } from '@/lib/streaming';

interface BriefBuilderProps {
  analysisId: string;
}

interface BuildResultData {
  data: BuilderResult;
  meta: { cached: boolean; processingTimeMs: number };
}

export function BriefBuilder({ analysisId }: BriefBuilderProps) {
  const [channelName, setChannelName] = useState('');
  const [niche, setNiche] = useState('');
  const [briefState, setBriefState] = useState<'idle' | 'building' | 'complete' | 'error'>('idle');
  const [briefResult, setBriefResult] = useState<BuilderResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [progressMessage, setProgressMessage] = useState('');

  const handleBuild = async () => {
    if (!channelName.trim() || !niche.trim()) return;

    setBriefState('building');
    setErrorMessage('');
    setProgressMessage('');

    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          channelName: channelName.trim(),
          niche: niche.trim(),
        }),
      });

      await readStream(res, (event) => {
        if (event.type === 'progress') {
          setProgressMessage(event.message);
        } else if (event.type === 'result') {
          const d = event.data as BuildResultData;
          if (!d.data) {
            setErrorMessage('Build failed — no result returned.');
            setBriefState('error');
            return;
          }
          setBriefResult(d.data);
          setBriefState('complete');
        } else if (event.type === 'error') {
          setErrorMessage(event.message);
          setBriefState('error');
        }
      });
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Build could not be completed.');
      setBriefState('error');
    }
  };

  if (briefState === 'complete' && briefResult) {
    return (
      <div className="space-y-4">
        <BuilderCard result={briefResult} />
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => { setBriefState('idle'); setBriefResult(null); }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Build another brief
          </button>
          <a
            href="/"
            className="text-sm text-violet-600 hover:text-violet-800 font-medium"
          >
            Decode another video →
          </a>
        </div>
      </div>
    );
  }

  if (briefState === 'building') {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-10 text-center space-y-4">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-r-transparent" />
        <p className="text-sm text-gray-600 font-medium">
          {progressMessage || 'Building your production brief...'}
        </p>
        <p className="text-xs text-gray-400">This takes 10–20 seconds</p>
      </div>
    );
  }

  if (briefState === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center space-y-3">
        <p className="text-sm text-red-700">{errorMessage}</p>
        <button
          onClick={() => setBriefState('idle')}
          className="text-xs underline text-red-600 hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Build Production Brief</h3>
      <p className="text-sm text-gray-500">
        Enter your channel details to get a personalised production direction brief based on this analysis.
      </p>

      <div className="space-y-3">
        <div>
          <label htmlFor="channelName" className="block text-sm font-medium text-gray-700 mb-1">
            Channel Name
          </label>
          <input
            id="channelName"
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder="e.g. FinanceWithShayan"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <div>
          <label htmlFor="niche" className="block text-sm font-medium text-gray-700 mb-1">
            Niche
          </label>
          <input
            id="niche"
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g. personal finance"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <button
          onClick={() => void handleBuild()}
          disabled={!channelName.trim() || !niche.trim()}
          className="w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Build Production Brief
        </button>
      </div>
    </div>
  );
}
