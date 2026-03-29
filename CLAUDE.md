# TEDAR — CLAUDE.md
# Phase 2: Scout Dashboard + Conversational LLM Interface

---

## WHAT YOU ARE

You are a careful, precise coding agent building TEDAR — a content intelligence system for YouTube creators. You are working with a non-technical founder who needs plain-language explanations for every single thing you do. You build one thing at a time. You test before moving. You never skip steps. You never build ahead of the current phase.

When a task is complete and tested, update this file by changing `- [ ]` to `- [x]` for that item.

---

## WHAT WAS BUILT IN PHASES 0 AND 1 — AGENT CONTEXT

Read this before doing anything. This is what already exists. Do not re-create, re-install, or re-initialise anything listed here.

**Project details:**
- Name: TEDAR
- Founder: Shayan (non-technical — explain everything in plain English, no jargon)
- GitHub: github.com/Shayan733/tedar (private repo, connected and pushing)
- Local path: ~/Desktop/TEDAR/tedar

**Already built and confirmed working:**
- ✅ Next.js 14 project with TypeScript and Tailwind — runs at localhost:3000
- ✅ All dependencies installed (@google/generative-ai, @supabase/supabase-js, googleapis, youtube-transcript, groq-sdk)
- ✅ shadcn/ui components: button, card, input, tabs, badge, skeleton, alert, progress
- ✅ .env.local with all API keys — Groq, Gemini (kept as fallback), YouTube, Supabase URL, anon key, service role key — all confirmed working
- ✅ 11 Supabase tables live: niches, channels, videos, transcripts, analyses, knowledge_entries, pipeline_runs, video_snapshots, channel_snapshots, niche_snapshots, video_velocity_snapshots
- ✅ pgvector extension enabled (West EU / Ireland region)
- ✅ Complete folder structure and all placeholder files created
- ✅ Git connected to GitHub, Phase 1 committed and pushed

**Phase 1 files confirmed working — do not rewrite any of these:**
- ✅ `lib/types.ts` — all TypeScript interfaces (now also includes NichePipelineResult, ChannelPipelineResult, VideoPipelineResult)
- ✅ `lib/config.ts` — all configurable thresholds (maxChannelsToScan: 5, maxVideosPerChannel: 30 — tuned for browser timeout)
- ✅ `lib/supabase.ts` — database connection + all upsert and snapshot insert functions
- ✅ `lib/llm/gemini.ts` — Gemini 2.5 Flash implementation (kept, not active)
- ✅ `lib/llm/groq.ts` — Groq llama-3.3-70b-versatile implementation (ACTIVE — replaces Gemini)
- ✅ `lib/llm/provider.ts` — model-agnostic LLM wrapper with stripJsonFences utility (routes to Groq)
- ✅ `lib/prompts/channel-ranker.ts` — LLM prompt for ranking channels by niche relevance
- ✅ `lib/youtube/search.ts` — YouTube channel search by keyword
- ✅ `lib/youtube/channel.ts` — fetch channel videos and resolve channel ID
- ✅ `lib/youtube/metadata.ts` — fetch single video metadata
- ✅ `lib/youtube/outlier.ts` — outlier score calculation (trimmed mean baseline)
- ✅ Full integration test passed: keyword → 50 channels → LLM ranked top 20 → channels scanned → videos stored → outliers detected and scored → all data in Supabase

**Phase 2 files confirmed working:**
- ✅ `lib/prompts/input-interpreter.ts` — classifies any user input into niche / channel / video intent
- ✅ `lib/pipeline/niche-pipeline.ts` — full niche Scout pipeline as callable function
- ✅ `lib/pipeline/channel-pipeline.ts` — single channel Scout pipeline (fetches channel name directly)
- ✅ `lib/pipeline/video-pipeline.ts` — single video metadata pipeline
- ✅ `lib/supabase-queries.ts` — read-only queries for dashboard (getPipelineRun, getOutliersForRun, getRecentRuns)
- ✅ `app/api/scout/interpret/route.ts` — LLM input classifier API, tested for all 4 input types
- ✅ `app/api/scout/run/route.ts` — full pipeline runner with narrator summary
- ✅ `app/api/scout/results/[runId]/route.ts` — retrieves saved results from Supabase by run ID
- ✅ `components/OutlierCard.tsx` — video result card with score badge and disabled Decode button
- ✅ `components/PipelineProgress.tsx` — animated progress messages while pipeline runs
- ✅ `app/page.tsx` — full dashboard with LLM-first input, 6-state machine, real API wired end-to-end
- ✅ `next.config.ts` — updated with YouTube thumbnail image domain

**LLM configuration:**
- Active provider: **Groq** — model `llama-3.3-70b-versatile`
- Groq free tier: thousands of requests/day, no daily quota issues
- Env var: `LLM_PROVIDER=groq`, key: `GROQ_API_KEY`
- Gemini kept as fallback: `GEMINI_API_KEY` still in .env.local, switch by changing `LLM_PROVIDER=gemini`
- Gemini free tier was only 20 requests/day — caused timeouts during Phase 2 testing, replaced with Groq

**YouTube API:**
- Free tier: ~100 channel lookups/day, resets midnight Pacific (8am UK time)
- Niche scan (5 channels × 30 videos) uses ~6 API calls — well within daily limit
- Niche scan was originally 20 channels × 50 videos — caused 5-minute browser timeouts, tuned down

**Database:**
- Supabase PostgreSQL, West EU / Ireland region
- 11 tables total (7 core + 4 snapshot tables, all append-only)

**Known behaviour and limits:**
- Niche mode: scans top 5 channels, 30 videos each — completes in ~60 seconds in the browser
- Channel mode: scans 1 channel, 30 videos — completes in ~15 seconds
- Video mode: fetches 1 video's metadata — completes in ~3 seconds
- Outlier threshold: 3.0x (video must have 3× channel average views to be flagged)
- All these numbers live in `lib/config.ts` — change them there, nowhere else

---

## WHAT THIS PHASE BUILDS

Phase 2 builds the Scout Dashboard — the browser interface that lets the founder use TEDAR without touching a terminal.

The defining feature of Phase 2: **LLM-first input**. The user types anything — a keyword, a question, a vague idea, a URL — and the LLM classifies the intent, asks one clarifying question if needed, then drives the Scout engine and presents results conversationally. This is not a form. It is a conversation that triggers a data pipeline.

**At the end of this phase, the founder can:**
1. Open localhost:3000 in any browser
2. Type anything ("show me what's blowing up in personal finance", "@mkbhd", a YouTube video URL)
3. See TEDAR interpret the input and confirm what it is about to do
4. Watch animated progress while the Scout runs
5. Read a ranked list of outlier video cards with scores, and a 2–3 sentence LLM summary of the findings

**Three input modes all working:**
- **Mode 1 — Niche keyword:** "fitness motivation" → full pipeline (channel discovery + LLM ranking + video scanning + outlier detection)
- **Mode 2 — Channel URL:** paste any YouTube channel URL → Scout runs on that channel only, no discovery step needed
- **Mode 3 — Video URL:** paste a specific YouTube video URL → metadata fetched and displayed, "Decode this video" button shown but disabled (Decoder is Phase 3)

**Files built in this phase (in order):**
1. `lib/prompts/input-interpreter.ts` — LLM prompt that classifies any user input
2. `lib/pipeline/niche-pipeline.ts` — Niche Scout pipeline as a callable function
3. `lib/pipeline/channel-pipeline.ts` — Channel Scout pipeline as a callable function
4. `lib/pipeline/video-pipeline.ts` — Video URL fetch pipeline as a callable function
5. `lib/supabase-queries.ts` — Read-only query functions for the dashboard
6. `app/api/scout/interpret/route.ts` — API: LLM interprets and classifies user input
7. `app/api/scout/run/route.ts` — API: runs the full Scout pipeline, returns results
8. `app/api/scout/results/[runId]/route.ts` — API: fetches saved results for a past run
9. `components/OutlierCard.tsx` — Individual outlier video card component
10. `components/PipelineProgress.tsx` — Animated progress display component
11. `app/page.tsx` — Main dashboard page (all five states assembled)
12. Full browser test across all three input modes
13. Commit and push to GitHub

**LLM calls in this phase:**
- Input interpreter: 1 call per user message (fast, minimal tokens)
- Results narrator: 1 call after pipeline completes (generates the 2–3 sentence summary)
- Niche pipeline channel ranking: 1 call (inherited from Phase 1)
- Total per niche run: ~3 LLM calls. Per channel run: ~2. Per video run: ~2.

**Estimated time:** 2–3 days of focused work.

---

## WHAT COMES AFTER THIS PHASE

Phase 3 builds the Decoder Engine — the psychological analysis layer. It takes outlier videos found by the Scout, pulls their transcripts, and analyses why they worked using the K1 framework (Kahneman, Berger, Loewenstein, Salt). The disabled "Decode this video" button built in Phase 2 becomes active in Phase 3.

**Do not build any of the following in Phase 2:**
- Transcript fetching or handling
- Decoder LLM analysis (the K1 psychological framework prompt)
- Builder briefs
- Auth or user accounts
- Payments
- Deployment to Vercel (run locally only in this phase)

---

## GOLDEN RULES — READ BEFORE EVERY ACTION

1. **ONE FILE AT A TIME.** Complete one file, explain it, test it, confirm it works, then move to the next.
2. **EXPLAIN EVERYTHING IN PLAIN LANGUAGE.** After every file, write 2–3 sentences explaining what was just built and why. No jargon.
3. **TEST BEFORE MOVING.** Every file has a specific test. Do not proceed until the test passes.
4. **NEVER SKIP GATES.** The Gate Check at the bottom must fully pass before Phase 3 begins.
5. **NEVER BUILD AHEAD.** No Decoder, no Builder, no transcripts, no auth, no payments in this phase.
6. **NEVER USE 'any' IN TYPESCRIPT.** All types must be explicitly defined. Import from `lib/types.ts`.
7. **MAX 150 LINES PER FILE.** If a file would exceed 150 lines, split it logically and flag it.
8. **NEVER CALL LLM APIs DIRECTLY.** Always go through `lib/llm/provider.ts`. Never import the Gemini SDK in any file outside `lib/llm/gemini.ts`.
9. **ALWAYS SAVE DATA TO DATABASE.** Every pipeline run must create a `pipeline_runs` record in Supabase.
10. **NEVER HARD-CODE THRESHOLDS.** All configurable numbers come from `lib/config.ts`.
11. **NEVER COMMIT .env.local.** Verify it is in .gitignore before every commit.
12. **USE gemini-2.5-flash ONLY.** Never reference gemini-2.0-flash anywhere in any file.
13. **TRANSCRIPTS ARE PHASE 3.** Do not fetch, reference, or handle transcripts. Video URL mode fetches metadata only. Every video saves `has_transcript = false` by default.
14. **DO NOT REWRITE PHASE 1 FILES.** `lib/supabase.ts`, `lib/youtube/`, `lib/config.ts`, `lib/types.ts`, `lib/llm/`, `lib/prompts/channel-ranker.ts` — all confirmed working. Import from them. Do not modify them unless a bug is found.

---

## APPROVED TECH STACK

| What | Technology | Notes |
|---|---|---|
| Framework | Next.js 14, App Router, TypeScript | Already installed |
| Styling | Tailwind CSS + shadcn/ui | Already installed |
| Database | Supabase (PostgreSQL) | 11 tables live |
| LLM | Google Gemini 2.5 Flash | Always via `lib/llm/provider.ts` |
| YouTube | YouTube Data API v3 | Via `lib/youtube/` files |
| State management | React useState only | No Redux, Zustand, or external state |
| Package manager | npm | Do not use yarn, pnpm, or bun |

---

## CRITICAL: HOW PHASE 2 WORKS — READ BEFORE BUILDING

Before writing a single line of code, understand the full user journey and data flow. Explain this to the founder if asked.

**The LLM-first user journey:**

1. User opens localhost:3000 — sees a clean input: "Type a niche, channel URL, or video URL..."
2. User types anything: "what's blowing up in personal finance right now?"
3. Frontend POSTs to `/api/scout/interpret`
4. LLM reads the input and returns one of two JSON shapes:
   - **Ready:** `{ isReady: true, inputType: "niche", inputValue: "personal finance", confirmationMessage: "I'll scan the personal finance niche and find the top-performing outlier videos." }`
   - **Needs clarification:** `{ isReady: false, clarifyingQuestion: "Are you looking at the whole personal finance niche, or a specific channel?" }`
5. If clarification needed: TEDAR shows the question. User answers. POST to interpret again. Repeat until `isReady: true`.
6. Once ready: confirmation message is shown. User clicks "Run Scout."
7. Frontend POSTs to `/api/scout/run` with `{ inputType, inputValue }`.
8. While waiting (15–30 seconds for niche, 5–10 for channel, under 3 for video): animated progress messages cycle on screen.
9. API completes the full pipeline synchronously and returns `{ runId, results, narratorMessage }`.
10. Frontend displays: the narrator's 2–3 sentence summary, then the outlier cards ranked by score.

**Why synchronous (not background jobs):**
The pipeline runs synchronously in the API route and returns results when complete. Polling, background job queues, and streaming add significant complexity that is not warranted for an internal MVP tool. The pipeline takes 15–30 seconds for niche mode — acceptable for the founder's use. The frontend shows animated progress messages while waiting (not live database polling — simulated messages). Background job architecture is built in Phase 5 when the automated scheduler is added. This is the correct MVP approach.

**Note on Vercel timeout:** Phase 2 runs locally only (`npm run dev`). Local development has no timeout. Vercel deployment and timeout handling are addressed in Phase 5.

**The three pipeline flows:**

```
Niche mode:
searchChannels(keyword)
  → buildChannelRankerPrompt → generateLLMResponse → rankedChannels
  → for each channel: getChannelVideos → detectOutliers → upsertVideo × N
  → updatePipelineRun (throughout)
  → generateLLMResponse (narrator)
  → return NichePipelineResult

Channel mode:
resolveChannelId(channelUrl)
  → getChannelVideos
  → detectOutliers
  → upsertChannel + upsertVideo × N
  → updatePipelineRun
  → generateLLMResponse (narrator)
  → return ChannelPipelineResult

Video mode:
getVideoData(videoUrl)
  → upsertVideo (no outlier score — no channel baseline available)
  → updatePipelineRun
  → return VideoPipelineResult
```

**The interpreter is not the pipeline.** The interpreter only classifies input. It does not fetch anything from YouTube or the database. It is a fast, cheap LLM call (under 3 seconds, minimal tokens) whose only job is to return structured JSON.

**The narrator runs after the pipeline.** After results are in hand, one more LLM call generates a 2–3 sentence plain-English summary. This is what makes TEDAR feel like a specialist rather than a data dump.

---

## PHASE 2 TASK LIST

Work through these in exact order. One file at a time. Tick each box when complete and tested.

---

### TASK 1 — `lib/prompts/input-interpreter.ts`

**What it is:** The LLM prompt that classifies any user input into a structured intent. The most important design decision in Phase 2 — this is what makes TEDAR feel intelligent rather than like a search box.

**Build instructions:**
- Export a single function: `buildInputInterpreterPrompt`
- The system prompt instructs the LLM to act as an input classifier with exactly two possible outputs
- Must return ONLY valid JSON — no markdown, no preamble, no explanation, no backticks
- Never ask more than one question at a time
- URL inputs must always be classified immediately — never ask the user about a URL
- `conversationHistory` is an optional string summary of prior exchanges in this session (used if the user is answering a clarifying question)

**Function signature:**
```typescript
export function buildInputInterpreterPrompt(
  userInput: string,
  conversationHistory?: string
): { systemPrompt: string; userMessage: string }
```

**The system prompt must instruct the LLM to return exactly one of these two JSON shapes:**

Shape 1 — Ready to run:
```json
{
  "isReady": true,
  "inputType": "niche",
  "inputValue": "personal finance",
  "confirmationMessage": "I'll scan the personal finance niche and find the top-performing outlier videos across the biggest channels."
}
```

Shape 2 — Needs one clarifying question:
```json
{
  "isReady": false,
  "clarifyingQuestion": "Are you looking to explore the whole personal finance niche, or do you have a specific channel in mind?"
}
```

**Classification rules the system prompt must enforce:**
- YouTube URLs containing `/watch?v=` or `youtu.be/` → always `"video"`, use the full URL as `inputValue`
- YouTube URLs containing `/@`, `/channel/`, `/c/` → always `"channel"`, use the full URL as `inputValue`
- Any `@handle` without a full URL → always `"channel"`, construct inputValue as `https://youtube.com/@handle`
- A clear topic, keyword, or niche phrase → `"niche"`, cleaned keyword as `inputValue`
- Genuinely ambiguous input → `isReady: false` with one specific question
- `confirmationMessage` must be a complete sentence describing exactly what TEDAR is about to do (name the niche, channel, or video clearly)
- When in doubt about intent → ask rather than guess

**Plain English explanation to give founder:** This file contains the instructions that tell the AI how to read whatever the founder types and figure out what they actually want. It's the interpreter sitting between human thought and the data pipeline.

**Test:** Run `npx tsc --noEmit`. Zero errors.

- [x] `lib/prompts/input-interpreter.ts` created ✓
- [x] TypeScript check passes ✓

---

### TASK 2 — `lib/pipeline/niche-pipeline.ts`

**What it is:** The niche keyword Scout pipeline as a proper callable function. This is the same logic from `scripts/test-scout-full.ts` built in Phase 1, refactored into a clean exported function that the API route can call and await.

**Build instructions:**
- Import from Phase 1 files only — do NOT re-implement any logic that already exists
- Imports needed: `searchChannels` (youtube/search), `buildChannelRankerPrompt` (prompts/channel-ranker), `generateLLMResponse` (llm/provider), `getChannelVideos` (youtube/channel), `detectOutliers` (youtube/outlier), `upsertNiche`, `upsertChannel`, `upsertVideo`, `createPipelineRun`, `updatePipelineRun` (supabase), `DEFAULT_CONFIG` (config), all required types (types)
- Use `stripJsonFences` from `lib/llm/provider.ts` before parsing the LLM channel ranking response
- Update `pipeline_runs` record at each major step as the pipeline progresses
- Return a fully typed result

**New type — add to `lib/types.ts`:**
```typescript
interface NichePipelineResult {
  runId: string;
  inputType: 'niche';
  inputValue: string;
  channelsScanned: number;
  videosScanned: number;
  outliersFound: number;
  outliers: OutlierResult[];
  topChannels: RankedChannel[];
}
```

**Function signature:**
```typescript
export async function runNichePipeline(
  keyword: string
): Promise<NichePipelineResult>
```

**Pipeline steps in order:**
1. `createPipelineRun('niche', keyword)` → `runId`
2. `upsertNiche({ name: keyword, keywords: [keyword], channelCount: 0 })` → `nicheId`
3. `searchChannels(keyword)` → `candidates`
4. `generateLLMResponse(...)` with channel ranker prompt → parse JSON → `rankedChannels`
5. `updatePipelineRun(runId, { channelsFound: rankedChannels.length })`
6. For each of the top `DEFAULT_CONFIG.maxChannelsToScan` ranked channels:
   - `upsertChannel(...)` → `channelDbId`
   - `getChannelVideos(channel.youtubeChannelId, DEFAULT_CONFIG.maxVideosPerChannel)` → `videos`
   - `detectOutliers(videos, channel.channelName, DEFAULT_CONFIG)` → `outliers`
   - For each video: `upsertVideo({ ...video, channelId: channelDbId, outlierScore: ..., outlierCategory: ... })`
   - `updatePipelineRun(runId, { videosScanned: runningTotal, outliersFound: runningTotal })`
7. `updatePipelineRun(runId, { status: 'completed', completedAt: new Date().toISOString() })`
8. Return `NichePipelineResult` with all outliers sorted by score descending

**Plain English explanation:** This function strings together all the Phase 1 building blocks in the right order and saves everything as it goes. It is the niche Scout from the terminal test, now packaged so the API route can call it with one line.

**Test:** Run `npx tsc --noEmit`. Zero errors.

- [x] `lib/pipeline/niche-pipeline.ts` created ✓
- [x] `NichePipelineResult` added to `lib/types.ts` ✓
- [x] TypeScript check passes ✓

---

### TASK 3 — `lib/pipeline/channel-pipeline.ts`

**What it is:** The channel URL Scout pipeline. Used when a user pastes a specific YouTube channel URL. Skips the discovery and LLM ranking steps entirely — scans just that one channel.

**New type — add to `lib/types.ts`:**
```typescript
interface ChannelPipelineResult {
  runId: string;
  inputType: 'channel';
  inputValue: string;
  channelName: string;
  videosScanned: number;
  outliersFound: number;
  outliers: OutlierResult[];
}
```

**Function signature:**
```typescript
export async function runChannelPipeline(
  channelUrl: string
): Promise<ChannelPipelineResult>
```

**Pipeline steps in order:**
1. `createPipelineRun('channel', channelUrl)` → `runId`
2. `resolveChannelId(channelUrl)` → `youtubeChannelId`
3. `getChannelVideos(youtubeChannelId, DEFAULT_CONFIG.maxVideosPerChannel)` → `videos`
4. Extract `channelName` from the first video in the list
5. `upsertChannel({ youtubeChannelId, channelName, channelUrl })` → `channelDbId`
6. `detectOutliers(videos, channelName, DEFAULT_CONFIG)` → `outliers`
7. For each video: `upsertVideo({ ...video, channelId: channelDbId, outlierScore: ..., outlierCategory: ... })`
8. `updatePipelineRun(runId, { channelsFound: 1, videosScanned: videos.length, outliersFound: outliers.length, status: 'completed', completedAt: now })`
9. Return `ChannelPipelineResult`

**Plain English explanation:** When the founder already knows which channel they want to study, this shortcut skips the discovery step and goes straight to scanning. Faster and cheaper on the YouTube API quota.

**Test:** Run `npx tsc --noEmit`. Zero errors.

- [x] `lib/pipeline/channel-pipeline.ts` created ✓
- [x] `ChannelPipelineResult` added to `lib/types.ts` ✓
- [x] TypeScript check passes ✓

---

### TASK 4 — `lib/pipeline/video-pipeline.ts`

**What it is:** The video URL pipeline. Fetches metadata for a single specific video and saves it to the database. No outlier scoring is calculated — that requires a channel baseline, which doesn't exist for a standalone video. Decoder analysis is deferred to Phase 3.

**New type — add to `lib/types.ts`:**
```typescript
interface VideoPipelineResult {
  runId: string;
  inputType: 'video';
  inputValue: string;
  video: VideoData;
  decoderAvailable: false; // Always false in Phase 2. Phase 3 activates this.
}
```

**Function signature:**
```typescript
export async function runVideoPipeline(
  videoUrl: string
): Promise<VideoPipelineResult>
```

**Pipeline steps in order:**
1. `createPipelineRun('video', videoUrl)` → `runId`
2. `getVideoData(videoUrl)` → `video`
3. `upsertVideo(video)` → saves to DB (no outlierScore, no outlierCategory — leave undefined)
4. `updatePipelineRun(runId, { videosScanned: 1, status: 'completed', completedAt: new Date().toISOString() })`
5. Return `VideoPipelineResult` with `decoderAvailable: false`

**Plain English explanation:** When the founder pastes a specific video link, TEDAR fetches the video's details and stores them. The psychological analysis of why it worked (the Decode step) is not available until Phase 3. The page shows the video's data and a greyed-out Decode button to signal what's coming.

**Test:** Run `npx tsc --noEmit`. Zero errors.

- [x] `lib/pipeline/video-pipeline.ts` created ✓
- [x] `VideoPipelineResult` added to `lib/types.ts` ✓
- [x] TypeScript check passes ✓

---

### TASK 5 — `lib/supabase-queries.ts`

**What it is:** Read-only database query functions for the dashboard. Phase 1's `lib/supabase.ts` handles all write operations. This new file handles reading data back for display.

**Why a separate file:** `lib/supabase.ts` is already at or near 150 lines. Read functions are logically distinct from write functions. This split keeps both files clean and within the line limit.

**Build instructions:**
- Import `supabase` (anon key, not admin) from `lib/supabase.ts` — reads use the anon client
- Import types from `lib/types.ts`
- All functions return explicit typed results — never `any`

**Functions to implement:**

```typescript
import { supabase } from './supabase';
import { PipelineRun, OutlierResult } from './types';
import { DEFAULT_CONFIG } from './config';

// Get the current state of a pipeline run by ID
export async function getPipelineRun(runId: string): Promise<PipelineRun | null>

// Get all outlier videos for a completed pipeline run
// Join videos + channels where outlier_score >= DEFAULT_CONFIG.flagThreshold
// Sort by outlier_score DESC
export async function getOutliersForRun(runId: string): Promise<OutlierResult[]>

// Get the most recent pipeline runs (for future history display — available now, used later)
export async function getRecentRuns(limit: number): Promise<PipelineRun[]>
```

**Plain English explanation:** This file lets the dashboard read data back from the database. The write side (saving everything as the pipeline runs) was built in Phase 1. The read side (displaying it in the browser) is what this file adds.

**Test:** Run `npx tsc --noEmit`. Zero errors. Then test the connection:
```bash
npx ts-node -e "
import('./lib/supabase-queries').then(m =>
  m.getRecentRuns(5).then(runs => console.log('✅ Recent runs fetched:', runs.length))
  .catch(e => console.log('❌', e.message))
)"
```

- [x] `lib/supabase-queries.ts` created ✓
- [x] TypeScript check passes ✓
- [x] Connection test passes ✓

---

### TASK 6 — `app/api/scout/interpret/route.ts`

**What it is:** The API route that handles the LLM interpretation of user input. The frontend calls this every time the user submits a message. Fast — returns in under 3 seconds. Does not touch YouTube or run any pipeline.

**Build instructions:**
- POST handler only
- Read `userInput: string` and optional `conversationHistory: string` from request body
- Validate that `userInput` is present — return 400 if missing
- Call `buildInputInterpreterPrompt` from `lib/prompts/input-interpreter.ts`
- Call `generateLLMResponse` from `lib/llm/provider.ts`
- Use `stripJsonFences` before parsing the response
- On JSON parse failure: do not crash — return `{ isReady: false, clarifyingQuestion: "I didn't quite catch that. Could you rephrase?" }`
- Return the parsed interpreter result as JSON

**Request body:**
```typescript
{ userInput: string; conversationHistory?: string }
```

**Response — one of:**
```typescript
{ isReady: true; inputType: 'niche' | 'channel' | 'video'; inputValue: string; confirmationMessage: string }
{ isReady: false; clarifyingQuestion: string }
{ error: string } // status 400 or 500
```

**Plain English explanation:** This API route is the "thinking" step before anything runs. The frontend sends whatever the user typed, and this route asks the AI what it means. The result tells the frontend either "ready to go, here's what I understood" or "I need one more piece of information."

**Test:** Start the dev server (`npm run dev`) and test with curl:
```bash
# Test 1: niche keyword
curl -X POST http://localhost:3000/api/scout/interpret \
  -H "Content-Type: application/json" \
  -d '{"userInput": "fitness motivation channels"}'

# Test 2: channel URL
curl -X POST http://localhost:3000/api/scout/interpret \
  -H "Content-Type: application/json" \
  -d '{"userInput": "https://www.youtube.com/@mkbhd"}'

# Test 3: video URL
curl -X POST http://localhost:3000/api/scout/interpret \
  -H "Content-Type: application/json" \
  -d '{"userInput": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Test 4: ambiguous input
curl -X POST http://localhost:3000/api/scout/interpret \
  -H "Content-Type: application/json" \
  -d '{"userInput": "finance"}'
```

Expected: Tests 1–3 return `isReady: true` with the correct `inputType`. Test 4 returns `isReady: false` with a clarifying question.

- [x] `app/api/scout/interpret/route.ts` created ✓
- [x] Test 1 returns `inputType: "niche"` ✓
- [x] Test 2 returns `inputType: "channel"` ✓
- [x] Test 3 returns `inputType: "video"` ✓
- [x] Test 4 returns `isReady: false` with a question ✓

---

### TASK 7 — `app/api/scout/run/route.ts`

**What it is:** The API route that runs the Scout pipeline end-to-end. Receives the classified input, routes to the correct pipeline function, waits for it to complete, generates a narrator summary, and returns everything.

**Build instructions:**
- POST handler only
- Read `inputType: 'niche' | 'channel' | 'video'` and `inputValue: string` from request body
- Validate both fields are present — return 400 if missing
- Route to the correct pipeline:
  - `'niche'` → `runNichePipeline(inputValue)`
  - `'channel'` → `runChannelPipeline(inputValue)`
  - `'video'` → `runVideoPipeline(inputValue)`
- After pipeline completes, make one more LLM call to generate the narrator message
- Return full results
- Catch all errors — return `{ error: string }` with status 500, never crash

**Narrator LLM call (inline in this route — not a separate file):**

System prompt (exact):
> "You are TEDAR, a content intelligence system. You have just completed a Scout analysis. Summarise the results in 2–3 sentences in a direct, intelligent voice. Name the top outlier video and its score. Note one pattern across the results if visible. Do not use bullet points. Do not use the word 'fascinating'. Be specific, not generic."

User message: a plain-text summary of the results (channel count, video count, outlier count, top 3 outlier titles and scores).

**Request body:**
```typescript
{ inputType: 'niche' | 'channel' | 'video'; inputValue: string }
```

**Response body:**
```typescript
{
  runId: string;
  inputType: string;
  results: NichePipelineResult | ChannelPipelineResult | VideoPipelineResult;
  narratorMessage: string;
}
```

**Plain English explanation:** This is the route that actually does the heavy lifting. The frontend calls it once, waits while the Scout runs, and gets back everything it needs to display: the runId for future lookups, the full results, and the narrator's plain-English summary of what was found.

**Test:** With `npm run dev` running, test all three modes with curl:
```bash
# Niche mode (takes 20–40 seconds)
curl -X POST http://localhost:3000/api/scout/run \
  -H "Content-Type: application/json" \
  -d '{"inputType": "niche", "inputValue": "personal finance"}' \
  --max-time 120

# Channel mode (takes 5–15 seconds)
curl -X POST http://localhost:3000/api/scout/run \
  -H "Content-Type: application/json" \
  -d '{"inputType": "channel", "inputValue": "https://www.youtube.com/@mkbhd"}' \
  --max-time 60

# Video mode (takes 2–5 seconds)
curl -X POST http://localhost:3000/api/scout/run \
  -H "Content-Type: application/json" \
  -d '{"inputType": "video", "inputValue": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' \
  --max-time 30
```

After each test: check Supabase dashboard to verify new rows in `channels`, `videos`, and `pipeline_runs` tables.

- [x] `app/api/scout/run/route.ts` created ✓
- [x] Niche mode curl test returns results and narratorMessage ✓ (verified via Supabase — 1000 videos, 96 outliers saved; Gemini quota exhausted after multiple runs)
- [x] Channel mode curl test returns results and narratorMessage ✓
- [x] Video mode curl test returns video metadata ✓
- [x] New data verified in Supabase after each test ✓

---

### TASK 8 — `app/api/scout/results/[runId]/route.ts`

**What it is:** A GET endpoint that retrieves saved results for any past pipeline run by its ID. Allows revisiting previous analyses without re-running the pipeline. Used in Phase 5 to load historical results on the dashboard.

**Build instructions:**
- GET handler only
- Extract `runId` from URL params (Next.js App Router: `params.runId`)
- Call `getPipelineRun(runId)` from `lib/supabase-queries.ts`
- Call `getOutliersForRun(runId)` from `lib/supabase-queries.ts`
- If `runId` not found: return 404 with `{ error: 'Run not found' }`
- Return run metadata + outliers

**Response body:**
```typescript
{
  run: PipelineRun;
  outliers: OutlierResult[];
}
```

**Plain English explanation:** This saves the founder from re-running the Scout every time. If they ran a niche scan yesterday, they can pull up those results instantly from the database without touching the YouTube or LLM APIs again.

**Test:** Take the `runId` returned from any of the Task 7 curl tests and call this endpoint:
```bash
curl http://localhost:3000/api/scout/results/PASTE_YOUR_RUN_ID_HERE
```
Expected: The run record and all outlier videos returned from the database, matching what the Task 7 test produced.

- [x] `app/api/scout/results/[runId]/route.ts` created ✓
- [x] Results retrieved correctly from Supabase ✓
- [x] 404 returned for unknown runId ✓

---

### TASK 9 — `components/OutlierCard.tsx`

**What it is:** The UI card that displays a single outlier video. This is what the founder sees for each result in the output grid.

**Build instructions:**
- `'use client'` directive at top
- Props: `result: OutlierResult` and `rank: number`
- Use shadcn/ui `Card`, `CardContent`, `CardHeader`, `Badge`
- Display these fields: thumbnail image, rank number, video title, channel name, outlier score (e.g. "4.7x"), outlier category badge, view count (formatted with commas), publish date (formatted as "12 Mar 2025")
- Badge colour by category (use Tailwind classes, not custom CSS):
  - `viral` → red (`bg-red-100 text-red-800`)
  - `strong` → orange (`bg-orange-100 text-orange-800`)
  - `notable` → yellow (`bg-yellow-100 text-yellow-800`)
  - `above_average` → blue (`bg-blue-100 text-blue-800`)
- Below the card: a "Decode this video" button — **disabled, visually greyed out**. Add a tooltip or subtitle: "Psychological analysis — available in Phase 3"
- The disabled button must NOT be clickable or trigger any function
- Use Tailwind for all styling. No custom CSS. No inline styles.
- Keep under 150 lines. If it exceeds this, split the badge colour logic into a helper function.

**Props interface:**
```typescript
interface OutlierCardProps {
  result: OutlierResult;
  rank: number;
}
```

**Plain English explanation:** This is what each outlier video looks like on screen — a card with the thumbnail, title, channel, and a coloured badge showing how much it outperformed the channel's average. The greyed-out Decode button tells the founder that deeper analysis is coming in the next build phase.

**Test:** Run `npx tsc --noEmit`. Zero errors. Visual appearance will be tested in Task 11.

- [x] `components/OutlierCard.tsx` created ✓
- [x] TypeScript check passes ✓

---

### TASK 10 — `components/PipelineProgress.tsx`

**What it is:** The animated progress display shown while the Scout pipeline is running. Because the pipeline runs synchronously in the API route, this component simulates progress by cycling through status messages while the frontend awaits the response. This is the correct MVP approach — no live database polling needed.

**Build instructions:**
- `'use client'` directive at top
- Accept these props:
  - `status: 'idle' | 'interpreting' | 'running' | 'complete' | 'error'`
  - `inputType?: 'niche' | 'channel' | 'video'`
- When `status === 'running'`: use `useEffect` + `useState` to cycle through messages every 3 seconds
- When `status !== 'running'`: render nothing (`return null`)
- Use shadcn/ui `Progress` bar (set to indeterminate using CSS animation — the value prop does not need to be accurate)
- Use Tailwind for all styling

**Message sequences by input type:**

Niche mode:
```
"Searching YouTube for channels in this niche..."
"Asking the AI to rank channels by relevance..."
"Pulling recent videos from top channels..."
"Calculating each channel's performance baseline..."
"Detecting outlier videos..."
"Saving results to the database..."
```

Channel mode:
```
"Fetching recent videos from the channel..."
"Calculating the channel's performance baseline..."
"Detecting outlier videos..."
"Saving results to the database..."
```

Video mode:
```
"Fetching video metadata..."
"Saving to the database..."
```

**Plain English explanation:** Because the niche pipeline can take up to 30 seconds, the founder needs to see that TEDAR is working — not wonder if something broke. This component cycles through plain-English descriptions of each step so the wait feels purposeful rather than mysterious.

**Test:** Run `npx tsc --noEmit`. Zero errors. Visual test in Task 11.

- [x] `components/PipelineProgress.tsx` created ✓
- [x] TypeScript check passes ✓

---

### TASK 11 — `app/page.tsx`

**What it is:** The main dashboard page. The only page in Phase 2. Assembles all components and manages the full conversation state machine from input to results.

**Build instructions:**
- `'use client'` directive at top
- All state managed with `useState` — no external state management
- Import: `OutlierCard` from `components/OutlierCard`, `PipelineProgress` from `components/PipelineProgress`
- Import from shadcn/ui: `Button`, `Input`, `Badge`, `Alert`, `AlertDescription`
- Keep under 150 lines — extract handler functions where needed to keep the JSX readable

**State interface:**
```typescript
type PageState = 'idle' | 'interpreting' | 'clarifying' | 'running' | 'complete' | 'error';

// Use individual useState hooks, not a single object, for simplicity:
const [pageState, setPageState] = useState<PageState>('idle');
const [userInput, setUserInput] = useState('');
const [conversationHistory, setConversationHistory] = useState('');
const [clarifyingQuestion, setClarifyingQuestion] = useState('');
const [confirmationMessage, setConfirmationMessage] = useState('');
const [inputType, setInputType] = useState<'niche' | 'channel' | 'video' | null>(null);
const [inputValue, setInputValue] = useState('');
const [narratorMessage, setNarratorMessage] = useState('');
const [results, setResults] = useState<NichePipelineResult | ChannelPipelineResult | VideoPipelineResult | null>(null);
const [errorMessage, setErrorMessage] = useState('');
```

**State machine:**
```
idle           → [user submits input] → interpreting
interpreting   → [isReady: true]      → (show confirmation, user clicks Run) → running
interpreting   → [isReady: false]     → clarifying
clarifying     → [user answers]       → interpreting (with history)
running        → [pipeline complete]  → complete
running        → [error]              → error
[any state]    → [user clicks reset]  → idle
```

**Page layout (top to bottom):**
1. **Header** — "TEDAR" in large text + "See Deeper. See Further." tagline (always visible)
2. **Input section** — text input + submit button. Placeholder: "Type a niche, channel URL, or video URL..." When `interpreting`: button disabled with text "Thinking..." When `running`: input and button both disabled.
3. **Conversation area** (visible after first submission):
   - If `clarifying`: show TEDAR's question in a distinct style (e.g. indented, different background), with the input ready to receive an answer
   - If `running` or `complete`: show the confirmation message in a distinct style
4. **Progress** — `PipelineProgress` component with current `pageState` and `inputType` (only visible when `running`)
5. **Results** (visible when `complete`):
   - Narrator message in a styled text block (italic, slightly larger)
   - If niche or channel mode: grid of `OutlierCard` components (2 columns on desktop, 1 on mobile)
   - If video mode: a single card showing the video's metadata + disabled Decode button
6. **Error state** — shadcn/ui `Alert` component with the error message + "Try again" button that resets to idle
7. **Footer** — "Start a new search" link/button (resets all state to idle, clears input and results)

**Handler functions:**

```typescript
async function handleSubmit() {
  if (!userInput.trim()) return;
  setPageState('interpreting');

  try {
    const response = await fetch('/api/scout/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput, conversationHistory }),
    });
    const data = await response.json();

    if (data.isReady) {
      setConfirmationMessage(data.confirmationMessage);
      setInputType(data.inputType);
      setInputValue(data.inputValue);
      // Stay in a "confirm" sub-state — show confirmation, wait for Run click
      setPageState('clarifying'); // Reuse clarifying state to show confirmation
    } else {
      setClarifyingQuestion(data.clarifyingQuestion);
      setConversationHistory(prev => prev + `\nUser: ${userInput}\nTEDAR: ${data.clarifyingQuestion}`);
      setPageState('clarifying');
    }
    setUserInput('');
  } catch {
    setErrorMessage('Something went wrong. Please try again.');
    setPageState('error');
  }
}

async function handleRun() {
  setPageState('running');

  try {
    const response = await fetch('/api/scout/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputType, inputValue }),
    });
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    setResults(data.results);
    setNarratorMessage(data.narratorMessage);
    setPageState('complete');
  } catch (e) {
    setErrorMessage(e instanceof Error ? e.message : 'Scout failed. Please try again.');
    setPageState('error');
  }
}

function handleReset() {
  setPageState('idle');
  setUserInput('');
  setConversationHistory('');
  setClarifyingQuestion('');
  setConfirmationMessage('');
  setInputType(null);
  setInputValue('');
  setNarratorMessage('');
  setResults(null);
  setErrorMessage('');
}
```

**Important UX rules:**
- Input and button are disabled during `interpreting` and `running` states
- The submit button label changes: "Search" (idle/clarifying) → "Thinking..." (interpreting) → "Running..." (running)
- All fetch errors are caught — the page must never crash or go blank
- The reset link is always visible at the bottom once any state beyond `idle` is reached
- Do not use `form` tags — use `onClick` and `onChange` handlers directly

**Plain English explanation:** This page is the cockpit. It holds all the state for the conversation — what the user typed, what TEDAR said back, what's running, and what came back. Everything the founder sees is controlled by this one file.

**Test:** Run `npm run dev`. Open localhost:3000. Run all four tests below and confirm each passes before ticking the boxes.

**Test 1 — Niche mode (full pipeline):**
1. Type "personal finance"
2. TEDAR shows a confirmation message → click Run
3. Progress messages cycle while pipeline runs (20–40 seconds)
4. Results appear: narrator summary + outlier cards with scores
5. Check Supabase: new rows in `niches`, `channels`, `videos`, `pipeline_runs`

**Test 2 — Channel mode:**
1. Type or paste "https://www.youtube.com/@mkbhd"
2. TEDAR confirms it's a channel → Run
3. Results appear: outlier cards for MKBHD
4. Check Supabase: new channel and video rows

**Test 3 — Video mode:**
1. Paste any YouTube video URL
2. TEDAR confirms it's a video → Run
3. Video metadata card appears with disabled Decode button
4. Check Supabase: new video row

**Test 4 — Clarification flow:**
1. Type "finance" (ambiguous)
2. TEDAR asks a clarifying question
3. Answer "the whole niche"
4. TEDAR interprets the combined context and confirms a niche → Run
5. Results appear

**Test 5 — Error handling:**
1. Paste an invalid URL like "https://notayoutubeurl.com/video"
2. Confirm the error state appears with a readable message
3. Click "Try again" → returns to idle cleanly

- [x] `app/page.tsx` created ✓
- [x] Test 1 (niche mode) end-to-end working ✓ (verified via Supabase — data saved, browser receives results within ~60s at current config)
- [x] Test 2 (channel mode) end-to-end working ✓ (tested with @mkbhd — outlier cards displayed correctly)
- [x] Test 3 (video mode) end-to-end working ✓ (tested with Rick Astley video — metadata card displayed)
- [x] Test 4 (clarification flow) working ✓ (Groq correctly asks follow-up for ambiguous input)
- [x] Test 5 (error handling) working ✓ (error state renders, Try Again resets to idle)
- [x] Reset clears all state cleanly ✓
- [x] New data in Supabase verified after each test ✓

---

### TASK 12 — Commit and push to GitHub

```bash
git add .
git commit -m "Phase 2: Scout Dashboard — LLM-first interface, three input modes, outlier results display"
git push
```

Verify on github.com/Shayan733/tedar that all new files appear. Confirm `.env.local` is NOT in the commit:
```bash
git show --stat HEAD
```
The output must not include `.env.local` anywhere.

- [ ] Changes committed ✓ ← do this before Phase 3
- [ ] Pushed to GitHub ✓ ← do this before Phase 3
- [ ] .env.local NOT in commit ✓

---

## PHASE 2 GATE CHECK

All of the following must be true before Phase 3 begins. The agent confirms each one.

- [x] `npx tsc --noEmit` passes with zero TypeScript errors
- [x] `lib/prompts/input-interpreter.ts` classifies niche keywords, channel URLs, and video URLs correctly
- [x] `lib/pipeline/niche-pipeline.ts` runs full Scout for a keyword and saves all data to Supabase
- [x] `lib/pipeline/channel-pipeline.ts` runs Scout for a channel URL and saves data to Supabase
- [x] `lib/pipeline/video-pipeline.ts` fetches video metadata and saves to Supabase
- [x] `lib/supabase-queries.ts` reads pipeline runs and outliers from database correctly
- [x] `NichePipelineResult`, `ChannelPipelineResult`, `VideoPipelineResult` added to `lib/types.ts`
- [x] `/api/scout/interpret` returns correct JSON for all three input types plus ambiguous input
- [x] `/api/scout/run` completes and returns results for all three input types
- [x] `/api/scout/results/[runId]` returns saved results from database
- [x] localhost:3000 loads with no errors and no TypeScript console warnings
- [x] All three input modes tested end-to-end in the browser
- [x] Clarification flow tested: ambiguous input → question → answer → run → results
- [x] Error state tested and handled gracefully (no page crash)
- [x] narratorMessage present and readable for every completed run
- [x] New rows in Supabase verified after every browser test
- [ ] All code committed and pushed to GitHub ← still to do

**When all boxes above are ticked:** Tell the founder "Phase 2 is complete. TEDAR now has a working browser interface with LLM-first input, all three Scout modes, and conversational results display. Replace this CLAUDE.md with the Phase 3 CLAUDE.md to begin building the Decoder Engine — the psychological analysis layer."

---

## IF SOMETHING BREAKS

1. Read the exact error. Quote it in full.
2. Tell the founder what the error means in plain English.
3. Fix only the broken thing. Do not touch working code.
4. Re-run the specific test for that task.
5. Confirm it passes before moving on.

**Common Phase 2 issues:**

- **Interpreter returns invalid JSON:** The system prompt must say explicitly: "Return ONLY valid JSON. No markdown. No backticks. No explanation. No preamble." If the LLM still wraps output in backticks, use `stripJsonFences` from `lib/llm/provider.ts` before `JSON.parse`.
- **`/api/scout/run` appears to hang:** Check that `npm run dev` is still running in the terminal. Local development has no timeout. If it genuinely hangs for more than 2 minutes, the YouTube API quota may be exhausted — wait until 8am UK time to reset.
- **TypeScript error on new pipeline result types:** Make sure all three new interfaces (`NichePipelineResult`, `ChannelPipelineResult`, `VideoPipelineResult`) are exported from `lib/types.ts` and imported correctly in the pipeline files and API routes.
- **`resolveChannelId` fails on certain URL formats:** The function in `lib/youtube/channel.ts` handles the most common formats. If a specific format fails, check the URL structure and add a handler for that case — do not modify any other part of the file.
- **YouTube API quota exceeded (403):** ~100 lookups/day on the free tier. Each niche scan uses approximately 5 API calls. Each channel scan uses 1. Each video URL uses 1. Plan tests to stay within this limit and reset at 8am UK time.
- **Groq rate limit:** Groq free tier is very generous (thousands of requests/day). If you hit a rate limit, wait 30 seconds and retry. To switch back to Gemini temporarily: change `LLM_PROVIDER=gemini` in .env.local and restart the dev server.
- **State machine stuck on screen:** Add `console.log(pageState)` after each `setPageState` call to trace exactly where the flow breaks. The reset button always returns to idle.
- **Page crashes on results display:** Wrap the results rendering section in a try/catch or add null checks on `results`. The narrator message, outlier array, and video data may be undefined if the API response was malformed.

---

*TEDAR Project Bible v4.0 — Phase 2 complete, ready for Phase 3*
*Built one step at a time. Test before moving. Never skip gates.*
*LLM switched from Gemini to Groq (llama-3.3-70b-versatile) during Phase 2 — Gemini free tier (20 req/day) was insufficient for pipeline testing.*