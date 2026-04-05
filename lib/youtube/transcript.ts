// TEDAR — Fetch and clean the spoken transcript of a YouTube video
// Uses YouTube InnerTube API (ANDROID client) — works on Vercel, no package dependency.
// All logs prefixed [transcript] for easy filtering in Vercel log viewer.

import { MAX_TRANSCRIPT_WORDS } from '../config';

const INNERTUBE_UA = 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)';
const CAPTION_FETCH_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';

interface CaptionTrack {
  languageCode: string;
  baseUrl: string;
  kind?: string; // 'asr' = auto-generated captions
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
}

function extractVideoId(input: string): string {
  const standardMatch = input.match(/[?&]v=([^&]+)/);
  if (standardMatch) return standardMatch[1];
  const shortMatch = input.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = input.match(/\/embed\/([^?&]+)/);
  if (embedMatch) return embedMatch[1];
  if (/^[\w-]{11}$/.test(input)) return input;
  return input;
}

// Prefer manual English → auto-generated English → any English variant → first available
function pickTrack(tracks: CaptionTrack[]): CaptionTrack | undefined {
  return (
    tracks.find((t) => t.languageCode === 'en' && t.kind !== 'asr') ??
    tracks.find((t) => t.languageCode === 'en') ??
    tracks.find((t) => t.languageCode?.startsWith('en')) ??
    tracks[0]
  );
}

const REGION_BLOCKED_STATUSES = new Set([
  'UNPLAYABLE',
  'LOGIN_REQUIRED',
  'CONTENT_CHECK_REQUIRED',
  'AGE_CHECK_REQUIRED',
]);

async function fetchTranscriptViaInnerTube(videoId: string): Promise<string> {
  console.log(`[transcript] fetching videoId: ${videoId}`);

  // Step 1 — InnerTube player API (ANDROID client bypasses cloud IP blocks)
  let playerData: PlayerResponse;
  try {
    const playerRes = await fetch(
      'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': INNERTUBE_UA },
        body: JSON.stringify({
          context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } },
          videoId,
        }),
      }
    );
    console.log(`[transcript] innertube http: ${playerRes.status}`);
    if (!playerRes.ok) {
      const body = await playerRes.text();
      console.log(`[transcript] innertube error body: ${body.slice(0, 500)}`);
      throw new Error('TRANSCRIPT_FETCH_FAILED');
    }
    playerData = (await playerRes.json()) as PlayerResponse;
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'TRANSCRIPT_FETCH_FAILED') throw err;
    // Network error, DNS failure, JSON parse error
    console.log(`[transcript] innertube request failed: ${msg}`);
    throw new Error('TRANSCRIPT_FETCH_FAILED');
  }

  // Step 2 — Check playability
  const status = playerData?.playabilityStatus?.status ?? 'MISSING';
  const reason = playerData?.playabilityStatus?.reason ?? '';
  console.log(`[transcript] playabilityStatus: ${status}${reason ? ` — ${reason}` : ''}`);

  if (status === 'ERROR' || status === 'MISSING') {
    throw new Error('VIDEO_UNAVAILABLE');
  }
  if (REGION_BLOCKED_STATUSES.has(status)) {
    // Video exists but YouTube won't serve it from this server IP
    throw new Error('CAPTIONS_UNAVAILABLE_IN_REGION');
  }
  // OK and LIVE_STREAM_OFFLINE fall through to caption extraction

  // Step 3 — Extract caption tracks
  const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (tracks === undefined) {
    console.log('[transcript] captionTracks: field missing from response');
    throw new Error('NO_CAPTIONS');
  }
  if (tracks.length === 0) {
    console.log('[transcript] captionTracks: present but empty');
    throw new Error('NO_CAPTIONS');
  }
  console.log(
    `[transcript] captionTracks: ${tracks.length} tracks — ` +
    tracks.map((t) => `${t.languageCode}${t.kind === 'asr' ? '(asr)' : ''}`).join(', ')
  );

  const track = pickTrack(tracks);
  if (!track?.baseUrl) {
    console.log('[transcript] no usable track found');
    throw new Error('NO_CAPTIONS');
  }
  console.log(`[transcript] selected: ${track.languageCode}${track.kind === 'asr' ? ' (asr)' : ''}`);

  // Step 4 — Fetch caption XML
  let xml: string;
  try {
    const captionRes = await fetch(track.baseUrl, { headers: { 'User-Agent': CAPTION_FETCH_UA } });
    console.log(`[transcript] caption fetch http: ${captionRes.status}`);
    if (!captionRes.ok) throw new Error('TRANSCRIPT_FETCH_FAILED');
    xml = await captionRes.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'TRANSCRIPT_FETCH_FAILED') throw err;
    console.log(`[transcript] caption fetch error: ${msg}`);
    throw new Error('TRANSCRIPT_FETCH_FAILED');
  }

  console.log(`[transcript] xml length: ${xml.length}`);
  if (xml.length < 50) {
    // Empty body with 200 = bot detection or expired URL, not a caption-less video
    console.log('[transcript] xml body empty — likely bot detection or expired URL');
    throw new Error('TRANSCRIPT_FETCH_FAILED');
  }

  // Step 5 — Strip XML tags, decode entities, collapse whitespace
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
    console.log('[transcript] text after stripping too short');
    throw new Error('NO_CAPTIONS');
  }

  console.log(`[transcript] success — ${text.split(' ').length} words`);
  return text;
}

export async function getTranscript(videoId: string): Promise<string> {
  const id = extractVideoId(videoId);

  let fullText: string;
  try {
    fullText = await fetchTranscriptViaInnerTube(id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'VIDEO_UNAVAILABLE') {
      throw new Error('This video is private, deleted, or unavailable.');
    }
    if (msg === 'CAPTIONS_UNAVAILABLE_IN_REGION') {
      throw new Error(
        'Captions are not available for this video from our server region. Try a different video.'
      );
    }
    if (msg === 'NO_CAPTIONS') {
      throw new Error('This video does not have captions available.');
    }
    // TRANSCRIPT_FETCH_FAILED or any unexpected error
    throw new Error('Could not fetch the transcript. Please try again.');
  }

  // Truncate to MAX_TRANSCRIPT_WORDS (2,500) to stay within Groq TPM limit
  const words = fullText.split(' ');
  if (words.length > MAX_TRANSCRIPT_WORDS) {
    fullText = words.slice(0, MAX_TRANSCRIPT_WORDS).join(' ');
  }
  return fullText;
}
