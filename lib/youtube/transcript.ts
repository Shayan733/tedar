// TEDAR — Fetch transcript for a YouTube video
// Uses InnerTube ANDROID client directly (works from Cloudflare edge IPs).
// Called only from prepareVideo, which runs in the /api/decode/prepare edge route.

import { MAX_TRANSCRIPT_WORDS } from '../config';

const ANDROID_UA = 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

interface CaptionTrack { languageCode: string; baseUrl: string; kind?: string; }
interface PlayerResponse {
  captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] } };
  playabilityStatus?: { status?: string };
}

function extractVideoId(input: string): string {
  const m = input.match(/[?&]v=([^&]+)/); if (m) return m[1];
  const s = input.match(/youtu\.be\/([^?&#]+)/); if (s) return s[1];
  const e = input.match(/\/embed\/([^?&]+)/); if (e) return e[1];
  if (/^[\w-]{11}$/.test(input)) return input;
  return input;
}

function pickTrack(tracks: CaptionTrack[]): CaptionTrack | undefined {
  return (
    tracks.find((t) => t.languageCode === 'en' && t.kind !== 'asr') ??
    tracks.find((t) => t.languageCode === 'en') ??
    tracks.find((t) => t.languageCode?.startsWith('en')) ??
    tracks[0]
  );
}

export async function getTranscript(videoId: string): Promise<string> {
  const id = extractVideoId(videoId);
  console.log(`[transcript] fetching: ${id}`);

  const playerRes = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': ANDROID_UA },
    body: JSON.stringify({
      context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38', hl: 'en', gl: 'US' } },
      videoId: id,
      racyCheckOk: true,
      contentCheckOk: true,
    }),
  });

  if (!playerRes.ok) throw new Error('Could not fetch the transcript. Please try again.');
  const data = (await playerRes.json()) as PlayerResponse;
  const status = data?.playabilityStatus?.status ?? 'MISSING';
  console.log(`[transcript] playability: ${status}`);

  if (status === 'ERROR' || status === 'MISSING') {
    throw new Error('This video is private, deleted, or unavailable.');
  }
  if (status !== 'OK' && status !== 'LIVE_STREAM_OFFLINE') {
    throw new Error('Captions are not available for this video from our server region. Try a different video.');
  }

  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  if (tracks.length === 0) throw new Error('This video does not have captions available.');

  const track = pickTrack(tracks);
  if (!track?.baseUrl) throw new Error('This video does not have captions available.');

  const captionRes = await fetch(track.baseUrl, { headers: { 'User-Agent': BROWSER_UA } });
  if (!captionRes.ok) throw new Error('Could not fetch the transcript. Please try again.');
  const xml = await captionRes.text();

  const text = xml
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ').trim();

  if (text.length < 50) throw new Error('This video does not have captions available.');

  const words = text.split(' ');
  console.log(`[transcript] success — ${words.length} words`);
  return words.length > MAX_TRANSCRIPT_WORDS
    ? words.slice(0, MAX_TRANSCRIPT_WORDS).join(' ')
    : text;
}
