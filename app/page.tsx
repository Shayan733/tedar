'use client';

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 OF 2 — STATE MACHINE + DUMMY RENDERING
// All five states (idle, clarifying, running, complete, error) render correctly
// with hardcoded dummy data before any real API calls are wired in.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { OutlierCard } from '@/components/OutlierCard';
import { PipelineProgress } from '@/components/PipelineProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NichePipelineResult, ChannelPipelineResult, VideoPipelineResult } from '@/lib/types';

// ── State types ──────────────────────────────────────────────────────────────

type PageState = 'idle' | 'interpreting' | 'clarifying' | 'confirmed' | 'running' | 'complete' | 'error';
//  idle        → user has typed nothing yet
//  interpreting → waiting for /api/scout/interpret to return
//  clarifying  → TEDAR asked a question, waiting for user's answer
//  confirmed   → TEDAR understood the intent, showing confirmation + Run button
//  running     → /api/scout/run is in progress, progress messages cycling
//  complete    → results received, cards displayed
//  error       → something failed, error message shown with Try Again


// ── Component ─────────────────────────────────────────────────────────────────

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

  // ── Handlers (Step 1: hardcoded flows) ─────────────────────────────────────

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

    try {
      const res = await fetch('/api/scout/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputType, inputValue }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (data.error) throw new Error(data.error as string);
      setResults(data.results as NichePipelineResult | ChannelPipelineResult | VideoPipelineResult);
      setNarratorMessage(data.narratorMessage as string);
      setPageState('complete');
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
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const isBusy = pageState === 'interpreting' || pageState === 'running';
  const isRunning = pageState === 'running';
  const submitLabel = pageState === 'interpreting' ? 'Thinking...' : 'Search';

  const outliers = results && results.inputType !== 'video'
    ? (results as NichePipelineResult | ChannelPipelineResult).outliers
    : [];
  const videoResult = results?.inputType === 'video' ? results as VideoPipelineResult : null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">

        {/* Header — always visible */}
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">TEDAR</h1>
          <p className="text-sm text-gray-400 tracking-wide">See Deeper. See Further.</p>
        </div>

        {/* Input — disabled while busy */}
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

        {/* STATE: clarifying — TEDAR asks a question */}
        {pageState === 'clarifying' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">TEDAR</p>
            <p className="text-sm text-gray-800">{clarifyingQuestion}</p>
          </div>
        )}

        {/* STATE: confirmed — TEDAR understood, shows what it will do */}
        {pageState === 'confirmed' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">TEDAR</p>
            <p className="text-sm text-gray-800">{confirmationMessage}</p>
            <Button onClick={() => void handleRun()} size="sm">
              Run Scout
            </Button>
          </div>
        )}

        {/* STATE: running — animated progress */}
        <PipelineProgress
          status={isRunning ? 'running' : 'idle'}
          inputType={inputType ?? undefined}
        />

        {/* STATE: error */}
        {pageState === 'error' && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
            <Button variant="outline" size="sm" onClick={handleReset} className="mt-3">
              Try again
            </Button>
          </Alert>
        )}

        {/* STATE: complete — narrator summary + result cards */}
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

        {/* Footer reset — visible whenever the user has done anything */}
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
