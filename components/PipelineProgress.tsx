'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface PipelineProgressProps {
  status: 'idle' | 'interpreting' | 'running' | 'complete' | 'error';
  inputType?: 'niche' | 'channel' | 'video';
}

const MESSAGES: Record<string, string[]> = {
  niche: [
    'Searching YouTube for channels in this niche...',
    'Asking the AI to rank channels by relevance...',
    'Pulling recent videos from top channels...',
    'Calculating each channel\'s performance baseline...',
    'Detecting outlier videos...',
    'Saving results to the database...',
  ],
  channel: [
    'Fetching recent videos from the channel...',
    'Calculating the channel\'s performance baseline...',
    'Detecting outlier videos...',
    'Saving results to the database...',
  ],
  video: [
    'Fetching video metadata...',
    'Saving to the database...',
  ],
};

export function PipelineProgress({ status, inputType }: PipelineProgressProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (status !== 'running') return;
    const messages = MESSAGES[inputType ?? 'niche'];
    setMessageIndex(0);
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [status, inputType]);

  if (status !== 'running') return null;

  const messages = MESSAGES[inputType ?? 'niche'];
  const message = messages[messageIndex];

  return (
    <div className="space-y-3 py-4">
      <Progress value={null} className="h-1 animate-pulse" />
      <p className="text-sm text-gray-600 text-center">{message}</p>
    </div>
  );
}
