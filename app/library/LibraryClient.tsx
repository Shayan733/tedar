'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LibraryCard } from '@/components/LibraryCard';
import { LibraryEntry } from '@/lib/types';

type LoadState = 'loading' | 'ready' | 'error';

export function LibraryClient() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'analysed' | 'unanalysed'>('all');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/library');
        const json = await res.json() as { data?: { entries: LibraryEntry[] }; error?: string };
        if (json.error || !json.data) throw new Error(json.error ?? 'Could not load library');
        setEntries(json.data.entries);
        setLoadState('ready');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load library.');
        setLoadState('error');
      }
    }
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (filter === 'analysed' && !entry.decode && !entry.audience) return false;
      if (filter === 'unanalysed' && (entry.decode || entry.audience)) return false;
      if (!q) return true;
      return (
        entry.title.toLowerCase().includes(q) ||
        (entry.channelName ?? '').toLowerCase().includes(q)
      );
    });
  }, [entries, query, filter]);

  if (loadState === 'loading') {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-10 text-center space-y-4">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-r-transparent" />
        <p className="text-sm text-gray-600 font-medium">Loading your library…</p>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or channel…"
          className="flex-1 min-w-[200px]"
        />
        {(['all', 'analysed', 'unanalysed'] as const).map((option) => (
          <Button
            key={option}
            variant={filter === option ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(option)}
            className="capitalize"
          >
            {option}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{filtered.length} of {entries.length} videos</span>
        <span className="space-x-3">
          <a href="/api/export?format=csv" className="underline hover:text-foreground">Export CSV</a>
          <a href="/api/export?format=json" className="underline hover:text-foreground">Export JSON</a>
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-10 text-center">
          <p className="text-sm text-gray-500">
            {entries.length === 0
              ? 'No videos yet — decode your first video from the Scout page.'
              : 'No videos match your search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <LibraryCard key={entry.videoId} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
