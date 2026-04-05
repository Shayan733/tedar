// TEDAR — Fetch transcript for a YouTube video
// Routes through /api/transcript (edge runtime, Cloudflare IPs) to avoid
// Vercel Lambda IP blocking by YouTube's InnerTube API.
// On local dev, calls localhost:3000/api/transcript (same code, different IP — but works locally).

function extractVideoId(input: string): string {
  const m = input.match(/[?&]v=([^&]+)/); if (m) return m[1];
  const s = input.match(/youtu\.be\/([^?&#]+)/); if (s) return s[1];
  const e = input.match(/\/embed\/([^?&]+)/); if (e) return e[1];
  if (/^[\w-]{11}$/.test(input)) return input;
  return input;
}

function getEdgeBaseUrl(): string {
  // VERCEL_URL = current deployment host (e.g. tedar.vercel.app or branch preview URL)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export async function getTranscript(videoId: string): Promise<string> {
  const id = extractVideoId(videoId);
  const url = `${getEdgeBaseUrl()}/api/transcript`;

  console.log(`[transcript] calling edge endpoint for ${id}`);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: id }),
    });
  } catch (err) {
    console.log(`[transcript] edge endpoint unreachable: ${err instanceof Error ? err.message : err}`);
    throw new Error('Could not fetch the transcript. Please try again.');
  }

  const json = await res.json() as { transcript?: string; error?: string };

  if (!res.ok || !json.transcript) {
    const code = json.error ?? 'UNKNOWN';
    console.log(`[transcript] edge returned error: ${code} (http ${res.status})`);
    if (code === 'VIDEO_UNAVAILABLE') throw new Error('This video is private, deleted, or unavailable.');
    if (code === 'NO_CAPTIONS') throw new Error('This video does not have captions available.');
    if (code === 'CAPTIONS_UNAVAILABLE_IN_REGION') {
      throw new Error('Captions are not available for this video from our server region. Try a different video.');
    }
    throw new Error('Could not fetch the transcript. Please try again.');
  }

  return json.transcript;
}
