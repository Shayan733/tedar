// TEDAR — Decode page (server component shell)
// Passes YouTube video ID and URL to DecodePageClient.
// All data loading and state is handled client-side via /api/decode/prepare.

import Link from 'next/link';
import { DecodePageClient } from './DecodePageClient';

export default async function DecodePage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-violet-600 transition-colors"
      >
        <span>&larr;</span> Back to Home
      </Link>

      <DecodePageClient youtubeVideoId={videoId} videoUrl={videoUrl} />
    </main>
  );
}
