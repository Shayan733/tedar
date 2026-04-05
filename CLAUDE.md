# TEDAR — CLAUDE.md
# Phase 5: Deployment Fixes & Transcript Preview Flow

---

## WHAT YOU ARE

You are a careful, precise coding agent building TEDAR — a content intelligence system for YouTube creators. You are working with a non-technical founder who needs plain-language explanations for every single thing you do. You build one thing at a time. You test before moving. You never skip steps. You never build ahead of the current phase.

When a task is complete and tested, update this file by changing `- [ ]` to `- [x]` for that item.

---

## WHAT WAS BUILT IN PHASES 0–4 — AGENT CONTEXT

Read this before doing anything. This is what already exists. Do not re-create, re-install, or re-initialise anything listed here.

**Project details:**
- Name: TEDAR
- Founder: Shayan (non-technical — explain everything in plain English, no jargon)
- GitHub: github.com/Shayan733/tedar (private repo, connected and pushing)
- Local path: ~/Desktop/TEDAR/tedar
- **Live URL: https://tedar.vercel.app** (deployed, auto-deploys on push to main)

**Already built and confirmed working:**
- ✅ Full Next.js 14 project with TypeScript and Tailwind
- ✅ All 11 Supabase tables live and populated with real data
- ✅ Full Scout Engine — niche, channel, and video input modes
- ✅ Full Decoder Engine — K1 psychological analysis with four tabs
- ✅ Full Builder Engine — production briefs via Gemini 2.5 Flash
- ✅ Streaming responses via Server-Sent Events — `lib/streaming.ts`
- ✅ Deployed to Vercel at tedar.vercel.app

**LLM configuration — CURRENT ACTIVE STATE:**
- **Decoder:** Groq `llama-3.3-70b-versatile` via `LLM_PROVIDER=groq`
- **Builder:** Gemini 2.5 Flash via `BUILDER_LLM_PROVIDER=gemini`
- Never call any LLM API directly — always through `lib/llm/provider.ts`

**Config values — DO NOT change these:**
- `MAX_TRANSCRIPT_WORDS: 2500` — Groq TPM limit constraint
- `maxChannelsToScan: 5`
- `maxVideosPerChannel: 100`
- `LLM_TEMPERATURE: 0.3`
- `LLM_MAX_TOKENS: 2048` (Decoder)
- Builder max tokens: 8,192 (set in `lib/builder.ts` directly)

---

## BUGS FIXED IN PHASES 1–4 — DO NOT REINTRODUCE

1. **next/image crash** — Use `<img>` tag for YouTube thumbnails. Domain whitelisted in next.config.ts.
2. **Video pipeline UUID error** — Never pass YouTube channel ID string into channel_id DB column. Always use Supabase UUID.
3. **"Unknown Channel" bug** — Always call fetchChannelName() helper.
4. **TypeScript error on Next.js params** — Always `await params` before accessing route parameters.
5. **Browser timeout** — maxChannelsToScan is 5, maxVideosPerChannel is 100. Never revert.
6. **Supabase upsert without unique constraint** — Use select-then-update/insert pattern.
7. **Groq token limit** — MAX_TRANSCRIPT_WORDS must stay at 2,500.
8. **Builder JSON truncation** — Builder max tokens must be 8,192.

---

## WHAT THIS PHASE FIXES AND BUILDS

Phase 5 solves two problems identified during the first Vercel deployment test at tedar.vercel.app, and introduces one major product improvement.

### Problem 1 — Transcripts fail on Vercel for EVERY video (CRITICAL)

The `youtube-transcript` package works on the founder's local machine but fails on Vercel for every video — even TED Talks with confirmed captions. YouTube blocks scraping requests from cloud server IPs. This blocks the entire core product loop on the live site.

### Problem 2 — Niche mode shows "load failed" on Vercel

Niche mode tries to do everything in one 90-second request. The browser gives up waiting. Fix: split niche mode into two progressive frontend steps (discover → scan all) with no backend changes. Each individual request stays under Vercel's timeout window.

### Product Improvement — Transcript Preview + Manual Decode Flow

Currently, landing on the decode page runs the analysis automatically. The user sees nothing but a spinner for 15–30 seconds, has no visibility into what is being analysed, and cannot intervene if the transcript is poor.

**The new flow:**
1. User lands on decode page (from pasted URL, channel outlier click, or niche outlier click)
2. Frontend automatically fetches video metadata AND transcript — takes ~5 seconds
3. Page displays: video thumbnail, title, channel, view count, and **the full transcript in a scrollable box**
4. User reviews the transcript and clicks **"Analyse with K1 Framework"** button
5. Chain-of-thought progress streams as the analysis runs — user watches TEDAR think
6. Results appear below the transcript. Transcript stays visible as a collapsible section.

**Why this matters — the four psychological wins:**
- **Agency:** the user commits deliberately, which makes the result feel earned and valuable
- **Transparency:** they see the raw material TEDAR is working with — no black box
- **Quality gate:** if the transcript is garbage, too short, or wrong language, they stop before wasting an analysis
- **Premium feel:** automated pipelines feel cheap. Deliberate checkpoints feel crafted. Claude, Perplexity, Midjourney all give commitment moments before running. This places TEDAR in that category.

**Consistency rule:** This flow applies to ALL decode entry points — video URL mode, clicking outliers from channel scan, clicking outliers from niche results. Every path lands on the transcript preview. No exceptions.

**Cached analysis handling:** If a video already has a saved analysis in the database, the preview page still shows (transcript preview is valuable every time), but a prominent "View Previous Analysis" button loads the cached result instantly. A secondary "Re-analyse" option is also available.

---

**At the end of this phase, the founder can:**
1. Paste a video URL on tedar.vercel.app and see the video info + full transcript within ~5 seconds
2. Decide whether to analyse it and click a button to commit
3. Watch step-by-step progress messages as the analysis runs
4. View the full K1 analysis with transcript still visible above
5. Use niche mode without timeout errors via the new progressive scan flow
6. Share the live URL with test creators confidently

**Files changed in this phase (in order):**
1. `lib/youtube/transcript.ts` — transcript fetching rewritten for Vercel compatibility
2. `lib/analysis.ts` — split `decodeVideo` into `prepareVideo` + `analyseVideo`, add progress callback
3. `app/api/decode/prepare/route.ts` — NEW endpoint: fetch metadata + transcript for preview
4. `app/api/decode/route.ts` — modified: now takes a videoId, loads transcript from DB, runs analysis only
5. `components/TranscriptPreview.tsx` — NEW component: displays video info + transcript + analyse button
6. `app/decode/[videoId]/DecodeLoader.tsx` — restructured for two-stage flow
7. `app/decode/[videoId]/page.tsx` — updated to pass props correctly for new flow
8. `app/page.tsx` — niche mode split into discover-then-scan progressive steps
9. Verify deployment and run full live test suite on tedar.vercel.app
10. Commit and push to GitHub

**Estimated time:** 2–3 days.

---

## WHAT COMES AFTER THIS PHASE

Phase 6 is UX polish — shared library page, dark/light mode toggle, typography and layout improvements. Phase 7+ is System 2 knowledge layer. Do not touch any of that in Phase 5.

**Do not build any of the following in Phase 5:**
- Auth or user accounts
- Payments
- Library/history page (Phase 6)
- Dark/light mode toggle (Phase 6)
- UI redesign (Phase 6)
- System 2 / Knowledge System
- Background job infrastructure
- Any new features not listed in the task list below

---

## GOLDEN RULES — READ BEFORE EVERY ACTION

1. **ONE TASK AT A TIME.** Complete one task fully, explain what was done, test it, confirm it works, then move to the next.
2. **EXPLAIN EVERYTHING IN PLAIN LANGUAGE.** After every change, write 2–3 sentences explaining what was just done and why. No jargon.
3. **TEST BEFORE MOVING.** Every task has a specific test. Do not proceed until the test passes both locally AND on the deployed Vercel URL where relevant.
4. **THE TRANSCRIPT FIX MUST WORK ON VERCEL.** Working locally is not enough. It must be verified on tedar.vercel.app before moving to Task 2.
5. **THE PREVIEW FLOW APPLIES EVERYWHERE.** Video mode, channel outliers, niche outliers — all paths land on the transcript preview page. No path auto-runs the analysis.
6. **NEVER BUILD AHEAD.** Only the tasks in this file. No library page, no theme toggle, no redesign.
7. **NEVER USE 'any' IN TYPESCRIPT.** All types must be explicitly defined.
8. **MAX 150 LINES PER FILE.** If a file would exceed this, split it logically and flag it.
9. **NEVER CALL LLM APIs DIRECTLY.** Always go through `lib/llm/provider.ts`.
10. **NEVER COMMIT .env.local.** Verify it is in .gitignore before every commit.
11. **PRESERVE STREAMING INFRASTRUCTURE.** `lib/streaming.ts` and the existing SSE pattern must not be rewritten. Extend it, do not replace it.
12. **PRESERVE PHASE 3–4 FILES.** The K1 decoder prompt, the Builder prompt, the AnalysisCard and BuilderCard components — all untouched. Only modify files listed in the task list.

---

## APPROVED TECH STACK

| What | Technology | Notes |
|---|---|---|
| Framework | Next.js 14, App Router, TypeScript | Already installed |
| Deployment | Vercel (free tier) | tedar.vercel.app, auto-deploys from main |
| Database | Supabase (PostgreSQL) | 11 tables live |
| Decoder LLM | Groq llama-3.3-70b-versatile | Active |
| Builder LLM | Gemini 2.5 Flash | Active |
| Streaming | Server-Sent Events via `lib/streaming.ts` | Already built |
| Package manager | npm | Do not use yarn, pnpm, or bun |

---

## CRITICAL: HOW THE TRANSCRIPT FIX WORKS — READ BEFORE TASK 1

**The core problem in plain English:**

YouTube has two different data systems:

1. **The official YouTube Data API v3** — used for channels, videos, metadata. Requires an API key. Google knows who is calling. Works from any server including Vercel. TEDAR already uses this successfully for Scout.

2. **Transcripts/captions** — there is NO official YouTube API for transcripts. The `youtube-transcript` package works by pretending to be a browser visiting YouTube.com, scraping the HTML page, and extracting caption data. This unofficial scraping approach is what YouTube blocks from cloud server IPs.

**The three possible fixes, in order of preference:**

**Fix A — Add browser-like headers to the existing package request.** Cheapest fix. Override the fetch headers to look like real Chrome. Sometimes enough to bypass YouTube's bot detection. Start here.

**Fix B — Call YouTube's internal timedtext API directly.** Bypass the package entirely. Fetch the YouTube watch page HTML, extract the `captionTracks` JSON from `ytInitialPlayerResponse`, fetch the caption file URL directly, parse the XML into plain text. More reliable than scraping.

**Fix C — Switch to an alternative package.** Last resort. Packages like `@distube/ytdl-core`, `youtube-captions-scraper` use different techniques.

**Testing requirement:** Any fix must be tested with this specific video ID that is guaranteed to have captions: `ewkQ1FLbYSg` (a TED Talk). The fix must succeed on Vercel, not just locally. Deploying and testing on tedar.vercel.app is mandatory before marking Task 1 complete.

---

## CRITICAL: HOW THE TRANSCRIPT PREVIEW FLOW WORKS — READ BEFORE TASK 2

**The architecture change in plain English:**

Right now, `lib/analysis.ts` has one function `decodeVideo(videoUrl)` that does everything in sequence: fetch metadata → fetch transcript → run LLM analysis → save to DB → return result. The frontend calls this as one big operation.

The new architecture splits this into two functions that run at two different times:

**Function 1 — `prepareVideo(videoUrl)`:**
- Fetches video metadata (title, channel, thumbnail, views, etc.)
- Fetches the full transcript
- Saves metadata and transcript to the database
- Returns: `{ videoId, videoData, transcript, wordCount, existingAnalysisId }`
- Does NOT call any LLM. Fast — ~5 seconds.
- Checks if an analysis already exists for this video and returns the ID if so.

**Function 2 — `analyseVideo(videoId)`:**
- Takes a Supabase video UUID (not a YouTube video ID)
- Loads the pre-saved transcript from the database
- Loads the video metadata from the database
- Builds the K1 prompt and calls Groq
- Parses and validates the result
- Saves the analysis to the database
- Returns the `DecoderResult`
- This is where chain-of-thought progress callbacks fire
- Slower — ~15–30 seconds

**Two API endpoints:**
- `POST /api/decode/prepare` — calls `prepareVideo`, returns video info + transcript + cached analysis flag. Normal JSON response, no streaming (fast enough to not need it).
- `POST /api/decode` — **modified** to call `analyseVideo` only (not `prepareVideo`). Streams progress via SSE during the analysis. Takes `videoId` (Supabase UUID) instead of `videoUrl`.

**The frontend flow:**
1. User arrives at `/decode/[youtubeVideoId]` from any entry point
2. Client component calls `/api/decode/prepare` with the YouTube URL
3. Preview renders: video card at top, full transcript in scrollable box below, action button at bottom
4. If `existingAnalysisId` is returned, the button reads **"View Previous Analysis"** (loads instantly from cache) with a secondary **"Re-analyse"** link
5. If no previous analysis, the button reads **"Analyse with K1 Framework"**
6. On click, the client calls `/api/decode` with the videoId and switches to progress display
7. Chain-of-thought messages stream in during analysis
8. When the `result` event arrives, the `AnalysisCard` renders below the (now collapsible) transcript preview
9. The existing `BriefBuilder` component appears below `AnalysisCard` as before

**Chain-of-thought messages stream during analysis (not prepare).** The prepare step is fast enough to not need progress narration — a simple "Loading transcript..." spinner is sufficient. The progress narrative is reserved for the analysis phase where it actually helps the perceived wait time.

**Analysis phase progress messages (11 total):**
1. `'Loading transcript from database...'`
2. `'Transcript loaded — {wordCount} words'`
3. `'Building K1 analysis prompt...'`
4. `'Analysing with Groq llama-3.3-70B — identifying psychological triggers...'`
5. `'Scoring System 1 vs System 2 activation...'`
6. `'Evaluating information gap architecture...'`
7. `'Measuring STEPPS dimensions...'`
8. `'Parsing psychological formula...'`
9. `'Validating analysis structure...'`
10. `'Saving to database...'`
11. `'Analysis complete — confidence: {confidence}'`

Messages 5, 6, 7 happen AFTER the LLM call starts but before it returns — they are a proxy for what the LLM is actually scoring internally per the K1 prompt. Emit them in rapid succession just after the `generateLLMResponse` call begins. This is acceptable because it matches what the K1 prompt actually instructs the model to do.

---

## PHASE 5 TASK LIST

Work through these in exact order. One task at a time. Tick each box when complete and tested.

---

### TASK 1 — Fix transcript fetching for Vercel

**What it is:** Rewrite `lib/youtube/transcript.ts` to work on Vercel's cloud servers. The fix must be verified on the live URL, not just locally.

**Build instructions:**

Start with **Fix A** (browser-like headers). If testing on Vercel fails, move to **Fix B** (direct timedtext API). If that also fails, move to **Fix C** (alternative package).

**Fix A — Browser-like headers:**

Check if the `youtube-transcript` package supports custom fetch options. If yes, configure with these headers:

```typescript
const browserHeaders = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};
```

If the package does not support custom headers, proceed to Fix B.

**Fix B — Direct timedtext API (recommended if Fix A fails):**

Bypass the package entirely. Implement transcript fetch manually:

```typescript
async function fetchTranscriptDirect(videoId: string): Promise<string> {
  // 1. Fetch watch page HTML
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const pageResponse = await fetch(watchUrl, { headers: browserHeaders });
  if (!pageResponse.ok) throw new Error('TRANSCRIPT_FETCH_FAILED');
  const html = await pageResponse.text();

  // 2. Extract captionTracks from ytInitialPlayerResponse
  const match = html.match(/"captionTracks":(\[.*?\])/);
  if (!match) throw new Error('NO_CAPTIONS');

  const captionTracks = JSON.parse(match[1]);
  const track = captionTracks.find((t: { languageCode: string }) => t.languageCode === 'en')
    ?? captionTracks[0];
  if (!track?.baseUrl) throw new Error('NO_CAPTIONS');

  // 3. Fetch the caption XML
  const captionResponse = await fetch(track.baseUrl, { headers: browserHeaders });
  if (!captionResponse.ok) throw new Error('TRANSCRIPT_FETCH_FAILED');
  const captionXml = await captionResponse.text();

  // 4. Strip XML tags, decode entities, collapse whitespace
  const text = captionXml
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length < 50) throw new Error('NO_CAPTIONS');
  return text;
}
```

**Requirements for the final `lib/youtube/transcript.ts`:**

- Export `getTranscript(videoId: string): Promise<string>` — same signature as current
- Apply `MAX_TRANSCRIPT_WORDS` truncation (2,500) from `lib/config.ts`
- Throw clear errors: `'NO_CAPTIONS'` for genuinely uncaptioned videos, `'TRANSCRIPT_FETCH_FAILED'` for network/blocking issues
- Log which method is active via `console.log('[transcript] method: direct-timedtext')` so Vercel logs show which fix works

**Plain English explanation:** This file is the one piece that pulls the spoken words out of a YouTube video. The package we were using gets blocked by YouTube when running from cloud servers. The fix either adds browser disguise headers or bypasses the package entirely and calls YouTube's caption endpoints directly.

**Test locally first:**

Create `scripts/test-transcript.ts`:
```typescript
import { getTranscript } from '../lib/youtube/transcript';

async function main() {
  const videoId = 'ewkQ1FLbYSg'; // TED Talk with confirmed captions
  try {
    console.log(`Fetching transcript for ${videoId}...`);
    const transcript = await getTranscript(videoId);
    console.log(`✅ Success — ${transcript.split(/\s+/).length} words`);
    console.log(`First 200 chars: ${transcript.slice(0, 200)}`);
  } catch (e) {
    console.log(`❌ Failed: ${e instanceof Error ? e.message : e}`);
  }
}
main().catch(console.error);
```

Run: `npx ts-node scripts/test-transcript.ts`

**Test on Vercel (MANDATORY):**

1. Commit and push to GitHub
2. Wait for Vercel to auto-deploy (~2 minutes)
3. Go to https://tedar.vercel.app
4. Paste a YouTube video URL that has captions
5. Confirm the transcript fetch succeeds

**The fix is only confirmed working when transcript fetch succeeds on https://tedar.vercel.app — NOT just locally.**

- [ ] `lib/youtube/transcript.ts` rewritten
- [ ] `scripts/test-transcript.ts` created
- [ ] Local test passes with video ID `ewkQ1FLbYSg`
- [ ] Pushed to GitHub and Vercel redeployed
- [ ] **Live test on tedar.vercel.app confirmed working**
- [ ] TypeScript check passes: `npx tsc --noEmit`

---

### TASK 2 — Transcript Preview & Manual Decode Flow

This task is the largest in Phase 5. It restructures the decode flow to show the transcript first, then run analysis on explicit user action. It has six sub-steps. Complete them in order — do not jump ahead.

---

#### TASK 2A — Split `decodeVideo` into `prepareVideo` and `analyseVideo`

**What it is:** Refactor `lib/analysis.ts` so the pipeline becomes two separable operations.

**New structure:**

```typescript
export type DecodeProgressCallback = (message: string) => void;

export interface PrepareResult {
  videoId: string;                    // Supabase UUID
  youtubeVideoId: string;
  videoData: VideoData;
  transcript: string;
  wordCount: number;
  existingAnalysisId: string | null;  // If already decoded before, return the analysis ID
}

export async function prepareVideo(videoUrl: string): Promise<PrepareResult>

export async function analyseVideo(
  videoId: string,                    // Supabase UUID
  options?: {
    forceRefresh?: boolean;
    onProgress?: DecodeProgressCallback;
  }
): Promise<DecoderResult>
```

**`prepareVideo` pipeline steps:**
1. Extract YouTube video ID from URL
2. Check if video exists in Supabase `videos` table by `youtube_video_id`
3. If exists: load existing `VideoData`, skip metadata fetch
4. If not: call YouTube Data API v3 to fetch metadata, upsert to `videos` table, get Supabase UUID
5. Check if transcript exists in `transcripts` table for this video
6. If exists: load existing transcript, skip fetch
7. If not: call `getTranscript(youtubeVideoId)`, upsert to `transcripts` table
8. Check if any decode analysis exists for this video (`analyses` table, `analysis_type = 'decode'`)
9. Return `PrepareResult` with all data and the cached analysis ID if found (null otherwise)

**`analyseVideo` pipeline steps:**
1. Load video record from Supabase by UUID
2. Load transcript from Supabase for this video
3. If `forceRefresh !== true`: check for existing analysis, return it if found
4. Emit progress: `'Loading transcript from database...'`
5. Emit progress: `'Transcript loaded — {wordCount} words'`
6. Emit progress: `'Building K1 analysis prompt...'`
7. Build the decoder prompt using `buildDecoderPrompt(videoData, transcript)`
8. Emit progress: `'Analysing with Groq llama-3.3-70B — identifying psychological triggers...'`
9. Emit progress: `'Scoring System 1 vs System 2 activation...'` (just before LLM call)
10. Emit progress: `'Evaluating information gap architecture...'` (just before LLM call)
11. Emit progress: `'Measuring STEPPS dimensions...'` (just before LLM call)
12. Call `generateLLMResponse` (the actual LLM work happens here)
13. Emit progress: `'Parsing psychological formula...'`
14. Strip JSON fences, parse, retry once on failure
15. Emit progress: `'Validating analysis structure...'`
16. Validate against `DecoderResult` type
17. Emit progress: `'Saving to database...'`
18. `upsertAnalysis` to save the result
19. Emit progress: `'Analysis complete — confidence: {confidence}'`
20. Return `DecoderResult`

**Important:** The existing `decodeVideo` function can be kept as a convenience wrapper that calls `prepareVideo` then `analyseVideo` in sequence. This preserves backwards compatibility if anything else in the codebase calls it. Or delete it if nothing else uses it — check imports first with grep.

**Plain English explanation:** Before, the decode function was one big block that fetched the video, pulled the transcript, and ran the analysis all at once. Now it is two separate functions: `prepareVideo` gets the transcript ready for the user to review (fast), and `analyseVideo` runs the actual AI analysis when the user decides to commit (slower). This split is what makes the new preview flow possible.

**Test:**
```bash
npx tsc --noEmit
```

Create a quick integration test `scripts/test-prepare.ts`:
```typescript
import { prepareVideo, analyseVideo } from '../lib/analysis';

async function main() {
  const videoUrl = 'https://www.youtube.com/watch?v=ewkQ1FLbYSg';

  console.log('--- Preparing video ---');
  const prepared = await prepareVideo(videoUrl);
  console.log(`✅ Video: ${prepared.videoData.title}`);
  console.log(`✅ Word count: ${prepared.wordCount}`);
  console.log(`✅ Existing analysis: ${prepared.existingAnalysisId ?? 'none'}`);

  console.log('\n--- Analysing video ---');
  const result = await analyseVideo(prepared.videoId, {
    onProgress: (msg) => console.log(`  → ${msg}`),
  });
  console.log(`✅ Analysis complete — overall score: ${result.engagementScore.overall}`);
}

main().catch(console.error);
```

- [ ] `lib/analysis.ts` split into `prepareVideo` + `analyseVideo`
- [ ] `DecodeProgressCallback` and `PrepareResult` types exported
- [ ] All 11 progress messages emit in correct order in `analyseVideo`
- [ ] `scripts/test-prepare.ts` runs end-to-end locally
- [ ] TypeScript check passes

---

#### TASK 2B — Create `/api/decode/prepare` endpoint

**What it is:** A new API route that the client calls when landing on the decode page. Returns video metadata, transcript, and the existing analysis ID if any.

**File:** `app/api/decode/prepare/route.ts`

**Request body:**
```typescript
{
  videoUrl: string;
}
```

**Response — success:**
```typescript
{
  data: {
    videoId: string;              // Supabase UUID
    youtubeVideoId: string;
    videoData: VideoData;
    transcript: string;
    wordCount: number;
    existingAnalysisId: string | null;
  },
  meta: {
    processingTimeMs: number;
  }
}
```

**Response — error:**
```typescript
{
  error: string;
  code: 'INVALID_URL' | 'VIDEO_NOT_FOUND' | 'NO_TRANSCRIPT' | 'TRANSCRIPT_FETCH_FAILED' | 'INTERNAL_ERROR';
}
```

**Implementation:**
- POST handler only
- Validate `videoUrl` is present — return 400 with `INVALID_URL` if missing
- Call `prepareVideo(videoUrl)`
- Catch errors and map to the error codes above
- Set `export const maxDuration = 30;` at top of file for Vercel
- No streaming needed — regular JSON response is fine (fast operation)

**Plain English explanation:** This endpoint is the door between the browser and the new prepare step. The browser sends the video URL, the server fetches everything needed for the preview, and returns it. It is a normal request/response — no streaming — because 5 seconds is fast enough to not need a progress narrator.

**Test:**
```bash
# With npm run dev running:
curl -X POST http://localhost:3000/api/decode/prepare \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://www.youtube.com/watch?v=ewkQ1FLbYSg"}' \
  --max-time 30
```

Expected: JSON response with `videoData`, `transcript`, `wordCount`, `existingAnalysisId`.

- [ ] `app/api/decode/prepare/route.ts` created
- [ ] Returns full prepare result JSON locally
- [ ] Error cases return correct status codes
- [ ] TypeScript check passes

---

#### TASK 2C — Modify `/api/decode` to run analysis only

**What it is:** The existing `app/api/decode/route.ts` currently does the full decodeVideo flow. Update it to accept a `videoId` (Supabase UUID) and run only `analyseVideo`. Stream progress via the existing SSE infrastructure.

**New request body:**
```typescript
{
  videoId: string;           // Supabase UUID — NOT the YouTube video ID
  forceRefresh?: boolean;
}
```

**SSE events streamed:**
```
data: {"type":"progress","message":"Loading transcript from database..."}\n\n
data: {"type":"progress","message":"Transcript loaded — 2347 words"}\n\n
... (all 11 progress messages)
data: {"type":"result","data":{...DecoderResult...}}\n\n
```

**Error event:**
```
data: {"type":"error","message":"...","code":"..."}\n\n
```

**Implementation notes:**
- Keep the existing SSE setup from `lib/streaming.ts` — do not rewrite it
- The route reads the videoId from the request body, calls `analyseVideo(videoId, { onProgress, forceRefresh })` where `onProgress` writes each message as a `progress` event
- On success, emit `result` event with the full `DecoderResult`
- On error, emit `error` event with message and code
- Set `export const maxDuration = 60;` at top of file

**Important:** This is a breaking change to the existing `/api/decode` API. The old signature accepted `videoUrl`. The new signature accepts `videoId`. Grep the codebase for `/api/decode` calls and verify all call sites are updated in Task 2F.

**Plain English explanation:** This endpoint used to do the whole job in one call. Now it does only the AI analysis part — the preview step is handled by a different endpoint. This change is what makes streaming the chain-of-thought progress clean: only the slow part streams, and the fast prep work runs as a normal request beforehand.

**Test via curl:**
```bash
# Get a videoId from Supabase first, then:
curl -X POST http://localhost:3000/api/decode \
  -H "Content-Type: application/json" \
  -d '{"videoId": "PASTE_SUPABASE_UUID_HERE"}' \
  --no-buffer
```

Expected: SSE events stream in, ending with a `result` event containing the full analysis.

- [ ] `app/api/decode/route.ts` modified to accept `videoId` and run `analyseVideo`
- [ ] Progress events stream correctly via SSE
- [ ] Final `result` event contains full `DecoderResult`
- [ ] `maxDuration = 60` set
- [ ] TypeScript check passes

---

#### TASK 2D — Create `components/TranscriptPreview.tsx`

**What it is:** A new client component that displays the video information and full transcript in a readable layout, with the action button(s) to run analysis.

**Props:**
```typescript
interface TranscriptPreviewProps {
  videoData: VideoData;
  transcript: string;
  wordCount: number;
  existingAnalysisId: string | null;
  onAnalyseClick: () => void;         // Fires when user clicks Analyse
  onViewExistingClick?: () => void;   // Fires when user clicks View Previous Analysis
  isCollapsed?: boolean;               // When analysis is running/shown, transcript collapses
}
```

**Layout (top to bottom):**

1. **Video card** — horizontal layout:
   - Thumbnail on the left (use `<img>`, not `next/image`)
   - Right side: title (large, bold), channel name, view count formatted (e.g., "11.7M views"), publish date
   - Subtle border, rounded corners

2. **Transcript section:**
   - Header: "Transcript" + small subtitle showing word count (e.g., "2,347 words")
   - Toggle button to collapse/expand the transcript box (arrow icon)
   - Scrollable box showing the full transcript
   - Max height ~400px with vertical scroll
   - Light background, readable line-height (1.7), comfortable padding
   - If `isCollapsed === true`, show only the header and a "Show transcript" button

3. **Action area** — below the transcript:
   - If `existingAnalysisId` is present:
     - Primary button: **"View Previous Analysis"** — prominent, filled style
     - Secondary link/button: **"Re-analyse with K1 Framework"** — underlined text style
     - Small note: "This video has been analysed before"
   - If `existingAnalysisId` is null:
     - Primary button: **"Analyse with K1 Framework"** — prominent, filled style
     - Small note below: "Analysis takes 15–30 seconds using Kahneman, Berger, Loewenstein and Salt frameworks"

**Styling notes:**
- Use shadcn/ui components where possible: `Card`, `Button`, `Separator`, `Badge`
- The transcript box should feel readable, not cramped — this is content the user will actually want to read
- The Analyse button should feel important — slightly larger than normal buttons, with clear visual weight
- Keep the component under 150 lines — if it grows, split the video card into its own `VideoInfoCard.tsx`

**Plain English explanation:** This is the new heart of the decode experience. Before anything runs, the user sees exactly what TEDAR is looking at — the video they picked and every word it contains. Then they decide whether to analyse. If it's already been analysed, they can see the previous analysis instantly instead of waiting for a re-run.

**Test:** Cannot fully test until Task 2E wires it up. For now, `npx tsc --noEmit` must pass with no errors on this file.

- [ ] `components/TranscriptPreview.tsx` created
- [ ] All props typed correctly
- [ ] Video card, transcript box, and action area all render
- [ ] Collapse/expand toggle works
- [ ] Both button states (with/without existing analysis) render correctly
- [ ] Under 150 lines
- [ ] TypeScript check passes

---

#### TASK 2E — Restructure `DecodeLoader.tsx` for the two-stage flow

**What it is:** The existing `app/decode/[videoId]/DecodeLoader.tsx` handles the live decode flow. Restructure it into a state machine that handles four stages: preparing, previewing, analysing, complete.

**New state machine:**
```typescript
type DecodeStage = 
  | 'preparing'        // Initial load — calling /api/decode/prepare
  | 'previewing'       // Preview shown, waiting for user action
  | 'analysing'        // /api/decode streaming, chain-of-thought progress visible
  | 'complete'         // Analysis done, AnalysisCard visible
  | 'error';           // Something failed at some stage
```

**Props:**
```typescript
interface DecodeLoaderProps {
  youtubeVideoId: string;           // The YouTube video ID from the URL
  videoUrl: string;                 // Full URL for prepare call
  onAnalysisComplete?: (analysisId: string) => void;  // Fires when analysis done
}
```

**State:**
```typescript
const [stage, setStage] = useState<DecodeStage>('preparing');
const [prepared, setPrepared] = useState<PrepareResult | null>(null);
const [progressMessages, setProgressMessages] = useState<string[]>([]);
const [analysisResult, setAnalysisResult] = useState<DecoderResult | null>(null);
const [error, setError] = useState<string | null>(null);
```

**Flow:**

```typescript
// On mount: call prepare endpoint
useEffect(() => {
  async function prepare() {
    try {
      const response = await fetch('/api/decode/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });
      const { data, error } = await response.json();
      if (error) throw new Error(error);
      setPrepared(data);
      setStage('previewing');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setStage('error');
    }
  }
  prepare();
}, [videoUrl]);

// When user clicks Analyse (or View Previous)
async function handleAnalyse(forceRefresh = false) {
  if (!prepared) return;
  setStage('analysing');
  setProgressMessages([]);

  const response = await fetch('/api/decode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId: prepared.videoId, forceRefresh }),
  });

  // Read SSE stream
  const reader = response.body?.getReader();
  if (!reader) { setStage('error'); return; }

  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const event = JSON.parse(line.slice(6));
      
      if (event.type === 'progress') {
        setProgressMessages(prev => [...prev, event.message]);
      } else if (event.type === 'result') {
        setAnalysisResult(event.data);
        setStage('complete');
        // Notify parent component so BriefBuilder can render
        if (event.data.id) onAnalysisComplete?.(event.data.id);
      } else if (event.type === 'error') {
        setError(event.message);
        setStage('error');
      }
    }
  }
}
```

**Rendering logic:**

- `stage === 'preparing'`: simple spinner + "Loading video and transcript..." text
- `stage === 'previewing'`: render `<TranscriptPreview>` with `onAnalyseClick={() => handleAnalyse(false)}`, `onViewExistingClick={() => handleAnalyse(false)}` (loads cache instantly)
- `stage === 'analysing'`: render `<TranscriptPreview isCollapsed={true}>` at top + chain-of-thought progress list below
- `stage === 'complete'`: render `<TranscriptPreview isCollapsed={true}>` at top + `<AnalysisCard result={analysisResult}>` below
- `stage === 'error'`: render error message + retry button that resets state and calls prepare again

**Chain-of-thought progress display:**
Each message in `progressMessages` renders as a line with a small checkmark and subtle fade-in animation. Light grey text. Monospace or slightly reduced font. Feels like a live log.

**Plain English explanation:** This component is the full decode experience in one client-side state machine. It calls the prepare endpoint on mount to get the transcript ready, shows the preview, waits for the user to commit, then streams the analysis with live progress. Everything a user sees between clicking an outlier and viewing the full analysis lives inside this one component.

**Also update `app/decode/[videoId]/page.tsx`:**

The page needs to hold the analysis ID in state so `BriefBuilder` only renders once the analysis is complete. Create a small wrapper client component:

```typescript
// app/decode/[videoId]/page.tsx (server component)
export default async function DecodePage({ params }) {
  const { videoId } = await params;
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  return <DecodePageClient youtubeVideoId={videoId} videoUrl={videoUrl} />;
}

// app/decode/[videoId]/DecodePageClient.tsx (NEW client component)
'use client';
export function DecodePageClient({ youtubeVideoId, videoUrl }) {
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  return (
    <>
      <DecodeLoader
        youtubeVideoId={youtubeVideoId}
        videoUrl={videoUrl}
        onAnalysisComplete={(id) => setAnalysisId(id)}
      />
      {analysisId && <BriefBuilder analysisId={analysisId} />}
    </>
  );
}
```

**Test:**
1. `npm run dev`
2. Paste a video URL — new decode page opens
3. Verify spinner → transcript preview appears (~5 seconds)
4. Verify video info + transcript render correctly
5. Click "Analyse with K1 Framework"
6. Verify chain-of-thought progress messages stream in
7. Verify full AnalysisCard appears below collapsed transcript preview
8. Verify BriefBuilder appears below AnalysisCard
9. Go back, re-open the same video
10. Verify preview now shows "View Previous Analysis" button
11. Click it → verify analysis loads instantly (cache hit)

- [ ] `app/decode/[videoId]/DecodeLoader.tsx` restructured with state machine
- [ ] `app/decode/[videoId]/DecodePageClient.tsx` created
- [ ] `app/decode/[videoId]/page.tsx` updated
- [ ] Preview → analyse → complete flow works locally
- [ ] Existing analysis detection works — "View Previous Analysis" appears for cached videos
- [ ] Chain-of-thought progress displays during analysis
- [ ] BriefBuilder appears correctly after analysis completes
- [ ] TypeScript check passes

---

#### TASK 2F — Verify all decode entry points use the new flow

**What it is:** The preview flow must apply consistently everywhere. Audit the codebase for every place that navigates to a decode page or calls `/api/decode` directly.

**Entry points to check:**

1. **Video mode input on homepage** — pasting a video URL should route to `/decode/[videoId]`. Verify this already works via navigation.

2. **OutlierCard click in channel mode** — clicking an outlier should navigate to `/decode/[videoId]`. Verify the OutlierCard's onClick uses `router.push` or a `<Link>` pointing to the decode route. Should NOT directly call `/api/decode`.

3. **OutlierCard click in niche mode** — same as channel mode. Clicking any outlier navigates to `/decode/[videoId]`.

4. **Grep for stale call sites:**
```bash
grep -rn "fetch('/api/decode'" app/ components/ lib/
grep -rn "decodeVideo(" app/ components/ lib/
```

Update any stale call sites. If any component currently calls `/api/decode` directly with a `videoUrl`, update it to navigate to the decode page instead.

**Test:**
1. Test each entry point manually in the browser:
   - Paste video URL → lands on preview
   - Channel mode → click outlier → lands on preview
   - Niche mode → scan channels → click outlier → lands on preview
2. Confirm all three paths show the transcript preview before analysis

- [ ] Grep completed for `/api/decode` and `decodeVideo` call sites
- [ ] All OutlierCard components navigate via link/router
- [ ] Video mode entry confirmed working
- [ ] Channel mode outlier click confirmed working
- [ ] Niche mode outlier click confirmed working
- [ ] No stale call sites remain

---

### TASK 3 — Split niche mode into progressive steps

**What it is:** Niche mode on the homepage currently calls a single endpoint that does everything. Split into two sequential frontend steps.

**Do NOT change the backend API endpoints.** `/api/scout/discover` and `/api/scout/scan` already exist. This is a frontend-only change.

**New flow:**
```
Step 1: User types niche → call /api/scout/discover
   → show 5 channels with names, subscriber counts, relevance scores
   → ~10–15 seconds

Step 2: After channels appear, "Scan All Channels" button shows
   → on click, loop through channels sequentially
   → call /api/scout/scan for each
   → append outliers to grid as each returns
```

**Update `app/page.tsx`:**

Add these states:
```typescript
const [nicheStage, setNicheStage] = useState<'idle' | 'discovering' | 'channelsReady' | 'scanning' | 'complete'>('idle');
const [discoveredChannels, setDiscoveredChannels] = useState<ChannelData[]>([]);
const [scanProgress, setScanProgress] = useState<string>('');
const [outliers, setOutliers] = useState<OutlierResult[]>([]);
```

**Flow functions:**

```typescript
async function handleNicheSubmit(keyword: string) {
  setNicheStage('discovering');
  setDiscoveredChannels([]);
  setOutliers([]);

  const response = await fetch('/api/scout/discover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword }),
  });
  const { data } = await response.json();

  setDiscoveredChannels(data.channels);
  setNicheStage('channelsReady');
}

async function handleScanAllChannels() {
  setNicheStage('scanning');
  setOutliers([]);

  for (let i = 0; i < discoveredChannels.length; i++) {
    const channel = discoveredChannels[i];
    setScanProgress(`Scanning ${i + 1} of ${discoveredChannels.length}: ${channel.channelName}...`);

    try {
      const response = await fetch('/api/scout/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: channel.youtubeChannelId }),
      });
      const { data } = await response.json();
      setOutliers(prev => [...prev, ...data]);
    } catch (error) {
      console.error(`Failed to scan ${channel.channelName}:`, error);
    }
  }

  setNicheStage('complete');
  setScanProgress('');
}
```

**UI rendering:**
- `'idle'` — show input panel normally
- `'discovering'` — show "Discovering top channels for [niche]..." with spinner
- `'channelsReady'` — show 5 channel cards (name, subs, relevance) + prominent "Scan All Channels" button
- `'scanning'` — show channel cards with current channel highlighted + `OutlierGrid` below that fills progressively
- `'complete'` — show full `OutlierGrid` sorted by outlier score

**Critical React state note:** When appending to outliers inside the async loop, use the functional form: `setOutliers(prev => [...prev, ...data])`. Do NOT use `setOutliers([...outliers, ...data])` — the latter captures stale state in the async closure and only the last channel's outliers will show.

**Do not touch channel mode or video mode.** They already work.

**Plain English explanation:** The old niche mode did everything in one long request that took 90 seconds — too long for the browser to wait. The new flow shows results in two stages. First the user sees which channels TEDAR picked (fast). Then they click a button to scan each channel one by one, watching outliers pop up as each scan completes. The user is never waiting more than ~20 seconds for anything visible.

**Test locally:**
1. `npm run dev`
2. Type "personal finance" in niche input
3. Within 15 seconds, 5 channels appear
4. Click "Scan All Channels"
5. Progress updates as each channel scans
6. Outliers appear progressively
7. Click any outlier → lands on new transcript preview page (from Task 2)

**Test on Vercel:**
After commit + push + redeploy, test same flow on tedar.vercel.app. Confirm no "load failed".

- [ ] `app/page.tsx` updated with niche stage state machine
- [ ] `handleNicheSubmit` calls `/api/scout/discover` only
- [ ] `handleScanAllChannels` loops channels sequentially with functional state updates
- [ ] UI renders correctly for all 5 states
- [ ] Outliers append progressively
- [ ] Channel mode and video mode still work unchanged
- [ ] Outlier click navigates to new preview flow
- [ ] Local test passes
- [ ] Vercel test passes
- [ ] TypeScript check passes

---

### TASK 4 — Final commit and live verification

**What it is:** Final commit of all Phase 5 changes, Vercel redeploy, and full live test suite.

**Build instructions:**

```bash
git status
cat .gitignore | grep .env.local
npm run build

git add .
git commit -m "Phase 5: Fix transcript for Vercel, add transcript preview flow, split niche mode progressively"
git push

git show --stat HEAD  # verify .env.local NOT in commit
```

Wait ~2 minutes for Vercel auto-deploy.

**Live verification suite on tedar.vercel.app — run all six tests in order:**

**Test 1 — Video mode preview flow:**
1. Go to https://tedar.vercel.app
2. Video mode → paste `https://www.youtube.com/watch?v=ewkQ1FLbYSg`
3. Verify transcript preview loads within ~10 seconds
4. Verify video info + full transcript visible
5. Click "Analyse with K1 Framework"
6. Verify chain-of-thought progress streams
7. Verify AnalysisCard and BriefBuilder appear

**Test 2 — Cached analysis detection:**
1. Refresh the page from Test 1
2. Verify preview shows "View Previous Analysis" button
3. Click it → verify analysis loads in under 2 seconds

**Test 3 — Channel mode → outlier → preview:**
1. Channel mode → paste `https://www.youtube.com/@TED`
2. Wait for outliers to appear
3. Click any outlier
4. Verify preview page loads with that video's transcript
5. Verify analyse flow works

**Test 4 — Niche mode progressive flow:**
1. Niche mode → type "personal finance"
2. Verify 5 channels appear within ~15 seconds
3. Click "Scan All Channels"
4. Verify progress updates per channel
5. Verify outliers appear progressively
6. Click any outlier → verify preview flow works

**Test 5 — Error handling:**
1. Paste a video URL known to have no captions (or invalid URL)
2. Verify clear error message appears
3. Verify no crash, option to retry

**Test 6 — Brief builder still works:**
1. From any completed analysis, fill channel name + niche in BriefBuilder
2. Click Build → verify brief generates correctly
3. Verify both Brief and Script tabs render

**If any test fails:**
- Check Vercel logs at vercel.com/shayan733s-projects/tedar/logs
- Read exact error
- Report to founder with error and proposed fix
- Do not mark Phase 5 complete until all six tests pass

- [ ] `npm run build` passes with zero errors
- [ ] All changes committed and pushed
- [ ] `.env.local` NOT in commit
- [ ] Vercel auto-deploy completed
- [ ] Test 1: Video mode preview flow works
- [ ] Test 2: Cached analysis detection works
- [ ] Test 3: Channel → outlier → preview works
- [ ] Test 4: Niche mode progressive flow works
- [ ] Test 5: Error handling works
- [ ] Test 6: Brief builder works

---

## PHASE 5 GATE CHECK

All of the following must be true before Phase 5 is marked complete:

- [ ] `npx tsc --noEmit` passes with zero TypeScript errors
- [ ] Transcript fetching works on Vercel (not just locally)
- [ ] Transcript preview flow works on all three entry points (video, channel outlier, niche outlier)
- [ ] Chain-of-thought progress displays during analysis
- [ ] Existing analyses detected — "View Previous Analysis" button appears for cached videos
- [ ] Niche mode progressive flow completes without timeouts
- [ ] Channel mode and video mode still work end-to-end
- [ ] BriefBuilder still generates production briefs correctly
- [ ] All code committed and pushed to GitHub
- [ ] Vercel deployment is live and stable
- [ ] All six live verification tests pass on tedar.vercel.app
- [ ] No console errors in browser when using the live site

**When all boxes are ticked:** Tell the founder "Phase 5 is complete. TEDAR now has a transcript preview flow, chain-of-thought progress narration, and progressive niche scanning. The live URL at tedar.vercel.app is ready to share with test creators."

---

## IF SOMETHING BREAKS

1. Read the exact error. Quote it in full.
2. Tell the founder what the error means in plain English.
3. Fix only the broken thing. Do not touch working code.
4. Re-run the specific test for that task.
5. Confirm it passes before moving on.

**Common Phase 5 issues:**

- **Fix A headers don't work on Vercel:** Expected — move to Fix B (direct timedtext API).

- **Fix B returns empty captionTracks:** YouTube occasionally changes page structure. Log the raw HTML response to Vercel logs and inspect. Adjust the regex accordingly.

- **Transcript garbled with double-decoded entities:** Only decode each entity once, in the correct order.

- **Prepare endpoint returns but frontend shows spinner forever:** Client component never called `setStage('previewing')` after setting prepared state.

- **Chain-of-thought messages arrive all at once:** The LLM call is synchronous. Messages before the call stream fine, but anything after waits for the LLM. This is expected. The perceived wait is short because the first 8 messages stream in the first ~200ms.

- **"View Previous Analysis" shows but loads for 30s:** The cache hit logic in `analyseVideo` is not returning early. Check that when `forceRefresh !== true` and an existing analysis is found, the function returns immediately without calling the LLM.

- **TranscriptPreview shows but buttons don't work:** Client component boundary issue. Verify `'use client'` at the top of the file and that parent components pass callback props correctly.

- **Niche mode outliers only show the last channel's results:** Stale state in async loop. Use `setOutliers(prev => [...prev, ...data])` not `setOutliers([...outliers, ...data])`.

- **Vercel SSE stream closes early:** Add `export const maxDuration = 60;` at the top of `app/api/decode/route.ts`.

- **OutlierCard clicks lead to broken decode page:** Check that Link/href uses the YouTube video ID, not the Supabase UUID. The decode page URL format is `/decode/[youtubeVideoId]`.

- **`decodeVideo` function still called somewhere:** Grep: `grep -rn "decodeVideo" --include="*.ts" --include="*.tsx"`. Update or remove every call site.

- **Vercel logs show no errors but decode page is blank:** Client-side JavaScript error. Open browser DevTools → Console on the live site. Client errors do not appear in Vercel logs.

- **npm run build fails with "Type error in DecodeLoader":** Prop type mismatch between `page.tsx`, `DecodePageClient.tsx`, and `DecodeLoader.tsx`. Check all three agree on the props passed.

- **BriefBuilder does not appear after analysis:** The `onAnalysisComplete` callback is not being called with a valid analysis ID. Check that the `result` event data contains the saved analysis ID from Supabase — `analyseVideo` must include the DB record ID in the returned result.

---

*TEDAR Project Bible v5.0 — Phase 5 of the live deployment track*
*Fix what is broken. Give the user a checkpoint moment. Verify on the live URL before declaring victory.*
*The transcript preview is not a feature. It is a psychological contract between the user and the product.*