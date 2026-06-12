// TEDAR — Library page (server component shell)
// Every video TEDAR has touched: transcript status, latest analysis per type,
// run counts, live stats refresh, and CSV/JSON export.
// Merged from DP-YT-PIPELINE's Films panel.

import type { Metadata } from 'next';
import { LibraryClient } from './LibraryClient';

export const metadata: Metadata = {
  title: 'Library — TEDAR',
  description: 'Every video TEDAR has analysed, with full run history.',
};

export default function LibraryPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Library</h1>
        <p className="text-sm text-muted-foreground">
          Every video TEDAR has touched. Analyses are never overwritten — re-runs
          add to the history.
        </p>
      </div>
      <LibraryClient />
    </main>
  );
}
