'use client';

import { useState } from 'react';
import { OutlierCard } from '@/components/OutlierCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NichePipelineResult, ChannelPipelineResult, VideoPipelineResult } from '@/lib/types';
import { readStream } from '@/lib/streaming';

type PageState = 'idle' | 'interpreting' | 'clarifying' | 'confirmed' | 'running' | 'complete' | 'error';

interface ScoutResultData {
  results: NichePipelineResult | ChannelPipelineResult | VideoPipelineResult;
  narratorMessage: string;
}

export default function Home() {
  const [pageState, setPageState] = useState<PageState>('idle');
  const [userInput, setUserInput] = useState('');
  const [conversationHistory, setConversationHistory] = useState('');
  const [clarifyingQuestion, setClarifyingQuestion] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [inputType, setInputType] = useState<'niche' | 'channel' | 'video' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [narratorMessage, setNarratorMessage] = useState('');
  const [results, setResults] = useState<NichePipelineResult | ChannelPipelineResult | VideoPipelineResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [progressMessage, setProgressMessage] = useState('');

  async function handleSubmit() {
    if (!userInput.trim()) return;
    setPageState('interpreting');

    try {
      const res = await fetch('/api/scout/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput, conversationHistory }),
      });
      const data = await res.json() as Record<string, unknown>;

      if (data.isReady) {
        setConfirmationMessage(data.confirmationMessage as string);
        setInputType(data.inputType as 'niche' | 'channel' | 'video');
        setInputValue(data.inputValue as string);
        setPageState('confirmed');
      } else {
        setClarifyingQuestion(data.clarifyingQuestion as string);
        setConversationHistory(prev => `${prev}\nUser: ${userInput}\nTEDAR: ${data.clarifyingQuestion as string}`);
        setPageState('clarifying');
      }
    } catch {
      setErrorMessage('Could not reach the interpreter. Please try again.');
      setPageState('error');
    }

    setUserInput('');
  }

  async function handleRun() {
    setPageState('running');
    setProgressMessage('');

    try {
      const res = await fetch('/api/scout/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputType, inputValue }),
      });

      await readStream(res, (event) => {
        if (event.type === 'progress') {
          setProgressMessage(event.message);
        } else if (event.type === 'result') {
          const data = event.data as ScoutResultData;
          setResults(data.results);
          setNarratorMessage(data.narratorMessage);
          setPageState('complete');
        } else if (event.type === 'error') {
          setErrorMessage(event.message);
          setPageState('error');
        }
      });
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Scout failed. Please try again.');
      setPageState('error');
    }
  }

  function handleReset() {
    setPageState('idle');
    setUserInput('');
    setConversationHistory('');
    setClarifyingQuestion('');
    setConfirmationMessage('');
    setInputType(null);
    setInputValue('');
    setNarratorMessage('');
    setResults(null);
    setErrorMessage('');
    setProgressMessage('');
  }

  const isBusy = pageState === 'interpreting' || pageState === 'running';
  const isRunning = pageState === 'running';
  const submitLabel = pageState === 'interpreting' ? 'Thinking...' : 'Search';

  const outliers = results && results.inputType !== 'video'
    ? (results as NichePipelineResult | ChannelPipelineResult).outliers
    : [];
  const videoResult = results?.inputType === 'video' ? results as VideoPipelineResult : null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">

        <div className="text-center space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">TEDAR</h1>
          <p className="text-sm text-gray-400 tracking-wide">See Deeper. See Further.</p>
        </div>

        <div className="flex gap-2">
          <Input
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !isBusy) void handleSubmit(); }}
            placeholder="Type a niche, channel URL, or video URL..."
            disabled={isBusy}
            className="flex-1"
          />
          <Button
            onClick={() => void handleSubmit()}
            disabled={isBusy || !userInput.trim()}
          >
            {submitLabel}
          </Button>
        </div>

        {pageState === 'clarifying' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">TEDAR</p>
            <p className="text-sm text-gray-800">{clarifyingQuestion}</p>
          </div>
        )}

        {pageState === 'confirmed' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">TEDAR</p>
            <p className="text-sm text-gray-800">{confirmationMessage}</p>
            <Button onClick={() => void handleRun()} size="sm">
              Run Scout
            </Button>
          </div>
        )}

        {/* STATE: running — live progress from stream */}
        {isRunning && (
          <div className="space-y-3 py-4">
            <div className="h-1 w-full rounded bg-gray-200 overflow-hidden">
              <div className="h-full bg-violet-500 animate-pulse" />
            </div>
            <p className="text-sm text-gray-600 text-center">
              {progressMessage || 'Starting Scout...'}
            </p>
          </div>
        )}

        {pageState === 'error' && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
            <Button variant="outline" size="sm" onClick={handleReset} className="mt-3">
              Try again
            </Button>
          </Alert>
        )}

        {pageState === 'complete' && (
          <div className="space-y-6">
            {narratorMessage && (
              <p className="text-base italic text-gray-700 leading-relaxed border-l-4 border-gray-200 pl-4">
                {narratorMessage}
              </p>
            )}
            {videoResult ? (
              <div className="max-w-sm">
                <OutlierCard
                  result={{
                    video: videoResult.video,
                    outlierScore: 0,
                    outlierCategory: 'normal',
                    channelAvgViews: 0,
                    channelName: videoResult.video.channelName ?? '',
                    rank: 1,
                  }}
                  rank={1}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {outliers.map(o => (
                  <OutlierCard key={o.video.youtubeVideoId} result={o} rank={o.rank} />
                ))}
              </div>
            )}
          </div>
        )}

        {pageState !== 'idle' && (
          <div className="text-center pt-4 border-t border-gray-100">
            <button
              onClick={handleReset}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Start a new search
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
