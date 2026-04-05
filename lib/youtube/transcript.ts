// TEDAR — Fetch and clean the spoken transcript of a YouTube video
// Uses YouTube InnerTube API with multi-client fallback (ANDROID → WEB → MWEB).
// Cloud server IPs are often blocked by ANDROID client; WEB/MWEB succeed more often.
// All logs prefixed [transcript] for easy filtering in Vercel log viewer.

import { MAX_TRANSCRIPT_WORDS } from '../config';

const CAPTION_FETCH_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';

// Clients tried in order. WEB and MWEB are less aggressively blocked from cloud IPs.
const CLIENTS = [
  {
    name: 'ANDROID',
    version: '20.10.38',
    ua: 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)',
  },
  {
    name: 'WEB',
    version: '2.20210721.00.00',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  },
  {
    name: 'MWEB',
    version: '2.20210726.08.00',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  },
] as const;

interface CaptionTrack {
  languageCode: string;
  baseUrl: string;
  kind?: string; // 'asr' = auto-generated captions
}

interface PlayerResponse {
  captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] } };
  playabilityStatus?: { status?: string; reason?: string };
}

function extractVideoId(input: string): string {
  const m = input.match(/[?&]v=([^&]+)/); if (m) return m[1];
  const s = input.match(/youtu\.be\/([^?&#]+)/); if (s) return s[1];
  const e = input.match(/\/embed\/([^?&]+)/); if (e) return e[1];
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

// Returns caption tracks for one client, or null if this client is blocked/unavailable.
// Throws only for hard errors (VIDEO_UNAVAILABLE) that mean no other client will help.
// 8-second timeout per client — YouTube sometimes holds connections open from cloud IPs.
async function tryClient(
  videoId: string,
  client: typeof CLIENTS[number]
): Promise<CaptionTrack[] | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let res: Response;
  try {
    res = await fetch(
      'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': client.ua },
        body: JSON.stringify({
          context: { client: { clientName: client.name, clientVersion: client.version, hl: 'en', gl: 'US' } },
          videoId,
          racyCheckOk: true,
          contentCheckOk: true,
        }),
        signal: controller.signal,
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    console.log(`[transcript] ${client.name} fetch error: ${msg.includes('abort') ? 'timeout (8s)' : msg}`);
    return null; // treat timeout/network error as soft failure, try next client
  } finally {
    clearTimeout(timeout);
  }
  console.log(`[transcript] ${client.name} http: ${res.status}`);
  if (!res.ok) return null;

  const data = (await res.json()) as PlayerResponse;
  const status = data?.playabilityStatus?.status ?? 'MISSING';
  const reason = data?.playabilityStatus?.reason ?? '';
  console.log(`[transcript] ${client.name} playability: ${status}${reason ? ` — ${reason}` : ''}`);

  if (status === 'ERROR' || status === 'MISSING') throw new Error('VIDEO_UNAVAILABLE');
  // UNPLAYABLE/LOGIN_REQUIRED = blocked from this IP — try next client
  if (status !== 'OK' && status !== 'LIVE_STREAM_OFFLINE') return null;

  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks || tracks.length === 0) {
    console.log(`[transcript] ${client.name}: no caption tracks`);
    return [];
  }
  console.log(`[transcript] ${client.name}: ${tracks.length} tracks — ` + tracks.map((t) => `${t.languageCode}${t.kind === 'asr' ? '(asr)' : ''}`).join(', '));
  return tracks;
}

async function fetchTranscriptViaInnerTube(videoId: string): Promise<string> {
  console.log(`[transcript] fetching videoId: ${videoId}`);

  let tracks: CaptionTrack[] | null = null;
  for (const client of CLIENTS) {
    try {
      tracks = await tryClient(videoId, client);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'VIDEO_UNAVAILABLE') throw err;
      console.log(`[transcript] ${client.name} request error: ${msg}`);
      continue;
    }
    if (tracks !== null) break; // Got a usable response from this client
  }

  if (tracks === null) throw new Error('CAPTIONS_UNAVAILABLE_IN_REGION');
  if (tracks.length === 0) throw new Error('NO_CAPTIONS');

  const track = pickTrack(tracks);
  if (!track?.baseUrl) throw new Error('NO_CAPTIONS');
  console.log(`[transcript] selected: ${track.languageCode}${track.kind === 'asr' ? ' (asr)' : ''}`);

  // Fetch caption XML
  const captionRes = await fetch(track.baseUrl, { headers: { 'User-Agent': CAPTION_FETCH_UA } });
  console.log(`[transcript] caption fetch http: ${captionRes.status}`);
  if (!captionRes.ok) throw new Error('TRANSCRIPT_FETCH_FAILED');
  const xml = await captionRes.text();
  console.log(`[transcript] xml length: ${xml.length}`);

  if (xml.length < 50) {
    console.log('[transcript] xml body empty — likely bot detection or expired URL');
    throw new Error('TRANSCRIPT_FETCH_FAILED');
  }

  const text = xml
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

  if (text.length < 50) throw new Error('NO_CAPTIONS');
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
    if (msg === 'VIDEO_UNAVAILABLE') throw new Error('This video is private, deleted, or unavailable.');
    if (msg === 'CAPTIONS_UNAVAILABLE_IN_REGION') throw new Error('Captions are not available for this video from our server region. Try a different video.');
    if (msg === 'NO_CAPTIONS') throw new Error('This video does not have captions available.');
    throw new Error('Could not fetch the transcript. Please try again.');
  }

  const words = fullText.split(' ');
  if (words.length > MAX_TRANSCRIPT_WORDS) fullText = words.slice(0, MAX_TRANSCRIPT_WORDS).join(' ');
  return fullText;
}
