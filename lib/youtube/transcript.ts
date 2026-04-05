// TEDAR — Fetch and clean the spoken transcript of a YouTube video
// Uses YouTube InnerTube API (ANDROID client) — works on Vercel, no package dependency
// The youtube-transcript package was blocked by YouTube on cloud server IPs.
// This approach calls YouTube's internal player API directly, which returns captionTracks
// from YouTube's own infrastructure without browser-scraping restrictions.

import { MAX_TRANSCRIPT_WORDS } from '../config';

// User-agent recognised by YouTube's timedtext API for caption file downloads
const CAPTION_FETCH_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';

interface CaptionTrack {
  languageCode: string;
  baseUrl: string;
}

interface PlayerResponse {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
  playabilityStatus?: {
    status?: string;
    reason?: string;
  };
  videoDetails?: {
    title?: string;
  };
}

function extractVideoId(input: string): string {
  const standardMatch = input.match(/[?&]v=([^&]+)/);
  if (standardMatch) return standardMatch[1];

  const shortMatch = input.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];

  const embedMatch = input.match(/\/embed\/([^?&]+)/);
  if (embedMatch) return embedMatch[1];

  // Raw ID (11 chars, alphanumeric + - _)
  if (/^[\w-]{11}$/.test(input)) return input;

  return input; // pass through — will fail at fetch with a clear error
}

async function fetchTranscriptViaInnerTube(videoId: string): Promise<string> {
  console.log('[transcript] method: innertube-android');

  // Step 1 — Call InnerTube player API with ANDROID client
  // This returns the same player data YouTube's own Android app uses, including captionTracks.
  // The ANDROID client (v20.10.38) is not subject to IP-based scraping blocks.
  const playerRes = await fetch(
    'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '20.10.38',
          },
        },
        videoId,
      }),
    }
  );

  if (!playerRes.ok) {
    throw new Error('TRANSCRIPT_FETCH_FAILED');
  }

  const playerData = (await playerRes.json()) as PlayerResponse;

  const status = playerData?.playabilityStatus?.status;
  if (status === 'ERROR' || status === 'LOGIN_REQUIRED') {
    throw new Error('VIDEO_NOT_FOUND');
  }

  const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks || tracks.length === 0) {
    throw new Error('NO_CAPTIONS');
  }

  // Step 2 — Prefer English track; fall back to any English variant; then first available
  const track =
    tracks.find((t) => t.languageCode === 'en') ??
    tracks.find((t) => t.languageCode?.startsWith('en')) ??
    tracks[0];

  if (!track?.baseUrl) {
    throw new Error('NO_CAPTIONS');
  }

  // Step 3 — Fetch the caption XML
  const captionRes = await fetch(track.baseUrl, {
    headers: { 'User-Agent': CAPTION_FETCH_UA },
  });

  if (!captionRes.ok) {
    throw new Error('TRANSCRIPT_FETCH_FAILED');
  }

  const xml = await captionRes.text();

  if (!xml || xml.length < 50) {
    throw new Error('NO_CAPTIONS');
  }

  // Step 4 — Strip XML tags, decode entities, collapse whitespace
  const text = xml
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length < 50) {
    throw new Error('NO_CAPTIONS');
  }

  return text;
}

export async function getTranscript(videoId: string): Promise<string> {
  // Accept either a raw video ID or a full YouTube URL
  const id = extractVideoId(videoId);

  let fullText: string;
  try {
    fullText = await fetchTranscriptViaInnerTube(id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';

    if (msg === 'NO_CAPTIONS') {
      throw new Error(
        "This video doesn't have captions available. Approximately 5% of YouTube videos lack auto-captions. Try a different video."
      );
    }

    if (msg === 'VIDEO_NOT_FOUND') {
      throw new Error('This video is private or has been deleted.');
    }

    if (msg === 'TRANSCRIPT_FETCH_FAILED') {
      throw new Error('Could not retrieve transcript for this video. Please try again.');
    }

    throw new Error('Could not retrieve transcript for this video. Please try again.');
  }

  // Truncate to MAX_TRANSCRIPT_WORDS (2,500) to stay within Groq TPM limit
  const words = fullText.split(' ');
  if (words.length > MAX_TRANSCRIPT_WORDS) {
    fullText = words.slice(0, MAX_TRANSCRIPT_WORDS).join(' ');
  }

  return fullText;
}
