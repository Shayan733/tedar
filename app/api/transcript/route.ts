// TEDAR — Edge transcript endpoint
// Runs on Vercel's Edge Network (Cloudflare IPs), not Lambda (AWS IPs).
// YouTube blocks Lambda IPs from InnerTube API but allows Cloudflare edge IPs.
// Called by lib/youtube/transcript.ts when running in the Lambda serverless context.

export const runtime = 'edge';

const ANDROID_UA = 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const MAX_TRANSCRIPT_WORDS = 2500;

interface CaptionTrack { languageCode: string; baseUrl: string; kind?: string; }
interface PlayerResponse {
  captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] } };
  playabilityStatus?: { status?: string; reason?: string };
}

function pickTrack(tracks: CaptionTrack[]): CaptionTrack | undefined {
  return (
    tracks.find((t) => t.languageCode === 'en' && t.kind !== 'asr') ??
    tracks.find((t) => t.languageCode === 'en') ??
    tracks.find((t) => t.languageCode?.startsWith('en')) ??
    tracks[0]
  );
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request): Promise<Response> {
  let videoId: string;
  try {
    const body = await req.json() as { videoId?: string };
    videoId = body.videoId ?? '';
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }
  if (!videoId) return Response.json({ error: 'videoId required' }, { status: 400 });

  console.log(`[transcript:edge] fetching ${videoId}`);

  // Step 1 — InnerTube ANDROID (works from Cloudflare edge IPs)
  const playerRes = await fetchWithTimeout(
    'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': ANDROID_UA },
      body: JSON.stringify({
        context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38', hl: 'en', gl: 'US' } },
        videoId,
        racyCheckOk: true,
        contentCheckOk: true,
      }),
    },
    10000
  );
  if (!playerRes) return Response.json({ error: 'TRANSCRIPT_FETCH_FAILED' }, { status: 503 });
  console.log(`[transcript:edge] innertube http: ${playerRes.status}`);

  const data = (await playerRes.json()) as PlayerResponse;
  const status = data?.playabilityStatus?.status ?? 'MISSING';
  console.log(`[transcript:edge] playability: ${status}`);

  if (status === 'ERROR' || status === 'MISSING') {
    return Response.json({ error: 'VIDEO_UNAVAILABLE' }, { status: 404 });
  }
  if (status !== 'OK' && status !== 'LIVE_STREAM_OFFLINE') {
    return Response.json({ error: 'CAPTIONS_UNAVAILABLE_IN_REGION' }, { status: 503 });
  }

  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  console.log(`[transcript:edge] ${tracks.length} caption tracks`);
  if (tracks.length === 0) return Response.json({ error: 'NO_CAPTIONS' }, { status: 404 });

  const track = pickTrack(tracks);
  if (!track?.baseUrl) return Response.json({ error: 'NO_CAPTIONS' }, { status: 404 });

  // Step 2 — Fetch caption XML
  const captionRes = await fetchWithTimeout(track.baseUrl, { headers: { 'User-Agent': BROWSER_UA } }, 8000);
  if (!captionRes?.ok) return Response.json({ error: 'TRANSCRIPT_FETCH_FAILED' }, { status: 503 });
  const xml = await captionRes.text();
  if (xml.length < 50) return Response.json({ error: 'TRANSCRIPT_FETCH_FAILED' }, { status: 503 });

  const text = xml
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
  if (text.length < 50) return Response.json({ error: 'NO_CAPTIONS' }, { status: 404 });

  const words = text.split(' ');
  const transcript = words.length > MAX_TRANSCRIPT_WORDS
    ? words.slice(0, MAX_TRANSCRIPT_WORDS).join(' ')
    : text;

  console.log(`[transcript:edge] success — ${transcript.split(' ').length} words`);
  return Response.json({ transcript });
}
