// TEDAR — Fetch and clean the spoken transcript of a YouTube video
// Uses youtube-transcript package (already installed — do not reinstall)

import { YoutubeTranscript } from 'youtube-transcript';
import { MAX_TRANSCRIPT_WORDS } from '../config';

function extractVideoId(url: string): string {
  const standardMatch = url.match(/[?&]v=([^&]+)/);
  if (standardMatch) return standardMatch[1];

  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];

  const embedMatch = url.match(/\/embed\/([^?&]+)/);
  if (embedMatch) return embedMatch[1];

  // Raw ID (11 chars, alphanumeric + - _)
  if (/^[\w-]{11}$/.test(url)) return url;

  return url; // pass through — will fail at fetch with a clear error
}

export async function getTranscript(videoId: string): Promise<string> {
  // Accept either a raw ID or a full URL
  const id = extractVideoId(videoId);

  let segments;
  try {
    segments = await YoutubeTranscript.fetchTranscript(id);
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : '';

    if (
      msg.includes('disabled') ||
      msg.includes('no transcript') ||
      msg.includes('could not find') ||
      msg.includes('impossible to retrieve')
    ) {
      throw new Error(
        "This video doesn't have captions available. Approximately 5% of YouTube videos lack auto-captions. Try a different video."
      );
    }

    if (msg.includes('private') || msg.includes('not found') || msg.includes('unavailable')) {
      throw new Error('This video is private or has been deleted.');
    }

    throw new Error('Could not retrieve transcript for this video. Please try again.');
  }

  if (!segments || segments.length === 0) {
    throw new Error(
      "This video doesn't have captions available. Approximately 5% of YouTube videos lack auto-captions. Try a different video."
    );
  }

  // Join all segments into one clean string
  let fullText = segments
    .map((s) => s.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Truncate to MAX_TRANSCRIPT_WORDS if needed (~30 minutes of speech)
  const words = fullText.split(' ');
  if (words.length > MAX_TRANSCRIPT_WORDS) {
    fullText = words.slice(0, MAX_TRANSCRIPT_WORDS).join(' ');
  }

  return fullText;
}
