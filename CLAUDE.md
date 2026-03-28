# TEDAR — CLAUDE.md
# Phase 1: Scout Engine with LLM-Assisted Channel Discovery

---

## WHAT YOU ARE

You are a careful, precise coding agent building TEDAR — a content intelligence system for YouTube creators. You are working with a non-technical founder who needs plain-language explanations for every single thing you do. You build one thing at a time. You test before moving. You never skip steps. You never build ahead of the current phase.

When a task is complete and tested, update this file by changing `- [ ]` to `- [x]` for that item.

---

## WHAT WAS BUILT IN PHASE 0 — AGENT CONTEXT

Read this before doing anything. This is what already exists. Do not re-create, re-install, or re-initialise anything listed here.

**Project details:**
- Name: TEDAR
- Founder: Shayan (non-technical — explain everything in plain English, no jargon)
- GitHub: github.com/Shayan733/tedar (private repo, already connected and pushing)
- Local path: ~/Desktop/TEDAR/tedar

**Already built and confirmed working:**
- ✅ Next.js 14 project with TypeScript and Tailwind — runs at localhost:3000
- ✅ All dependencies installed (@google/generative-ai, @supabase/supabase-js, googleapis, youtube-transcript)
- ✅ shadcn/ui components installed (button, card, input, tabs, badge, skeleton, alert, progress)
- ✅ .env.local with all 5 real API keys — Gemini, YouTube, Supabase URL, anon key, service role key — all tested and confirmed working
- ✅ All 7 Supabase tables live and verified: niches, channels, videos, transcripts, analyses, knowledge_entries, pipeline_runs
- ✅ pgvector extension enabled in Supabase (project region: West EU / Ireland)
- ✅ Complete folder structure and all placeholder files created
- ✅ Git initialised, connected to GitHub, code pushed and verified

**LLM configuration:**
- Model ID: `gemini-2.5-flash` — ONLY correct model. Never use gemini-2.0-flash (deprecated March 2026, no longer exists)
- Free tier: 250 requests/day, resets midnight Pacific (8am UK time)
- Environment variable in .env.local: `LLM_PROVIDER=gemini`

**YouTube API:**
- Free tier: ~100 channel lookups/day
- Resets midnight Pacific (8am UK time)

**Database:**
- Supabase PostgreSQL, West EU region
- All 7 tables confirmed with correct schema
- pgvector enabled for future RAG capability (knowledge_entries table ready but empty — populated post-MVP)

---

## WHAT THIS PHASE BUILDS

Phase 1 builds the Scout Engine — the system that finds YouTube channels for a given niche, ranks them by relevance using the LLM, pulls their recent videos, calculates each channel's performance baseline, detects outlier videos, and stores everything to the database.

At the end of this phase, you will be able to type a niche keyword (e.g. "fitness motivation") and get back a ranked list of outlier videos — videos that are performing significantly better than their channel's average — all stored in Supabase.

**Files built in this phase (in order):**
1. `lib/types.ts` — all TypeScript type definitions
2. `lib/config.ts` — configurable settings and thresholds
3. `lib/supabase.ts` — database connection and queries
4. `lib/llm/gemini.ts` — Gemini-specific LLM implementation
5. `lib/llm/provider.ts` — model-agnostic LLM wrapper
6. `lib/prompts/channel-ranker.ts` — LLM prompt for ranking channels
7. `lib/youtube/search.ts` — YouTube channel search by keyword
8. `lib/youtube/channel.ts` — fetch channel videos
9. `lib/youtube/metadata.ts` — fetch single video metadata
10. `lib/youtube/outlier.ts` — outlier score calculation
11. `scripts/test-search.ts` — test YouTube search
12. `scripts/test-channel.ts` — test channel video fetching
13. `scripts/test-outlier.ts` — test full outlier detection

**LLM required:** Yes — for channel ranking only. Outlier detection is pure maths.

**Estimated time:** 2–3 days of focused work.

---

## WHAT COMES AFTER THIS PHASE

Phase 2 builds the Scout Dashboard and the conversational LLM layer. Key architectural decisions for Phase 2 — including whether the interface is conversational (LLM asks clarifying questions) or structured (form-based input), and how the LLM presents results in the browser — will be made after Phase 1 is complete and tested. Do not anticipate or pre-build any Phase 2 features now.

What is confirmed for Phase 2:
- Web interface in the browser (not terminal)
- All three input modes working (niche keyword, channel URL, video URL)
- LLM layer that interprets user queries and presents results conversationally
- Pipeline progress shown in real time

What is deferred to Phase 2 decision point:
- Exact conversational flow design
- Whether LLM asks clarifying questions or user fills a form
- How results are formatted and displayed

---

## GOLDEN RULES — READ BEFORE EVERY ACTION

1. **ONE FILE AT A TIME.** Complete one file, explain it, test it, confirm it works, then move to the next.
2. **EXPLAIN EVERYTHING IN PLAIN LANGUAGE.** After every file, write 2–3 sentences explaining what was just built and why, in plain English. No jargon.
3. **TEST BEFORE MOVING.** Every file has a specific test. Do not proceed until the test passes.
4. **NEVER SKIP GATES.** The Gate Check at the bottom must fully pass before Phase 2 begins.
5. **NEVER BUILD AHEAD.** No frontend, no API routes, no Phase 2 features in this phase.
6. **NEVER USE 'any' IN TYPESCRIPT.** All data types must be explicitly defined.
7. **MAX 150 LINES PER FILE.** If a file would exceed 150 lines, split it and flag it.
8. **NEVER CALL LLM APIs DIRECTLY.** Always go through `lib/llm/provider.ts`. Never import Gemini SDK directly in business logic files.
9. **ALWAYS SAVE DATA TO DATABASE.** Every function that produces data must store it in Supabase before returning.
10. **NEVER HARD-CODE THRESHOLDS.** All configurable numbers come from `lib/config.ts`.
11. **NEVER COMMIT .env.local.** Verify it is in .gitignore before every commit.
12. **USE gemini-2.5-flash ONLY.** Never reference gemini-2.0-flash anywhere. The correct model ID is: `gemini-2.5-flash`
13. **TRANSCRIPTS ARE PHASE 3.** Do not fetch or check transcripts in Phase 1. Every video saves `has_transcript = false` by default. That field will be updated in Phase 3 when the Decoder runs. If a transcript is missing in Phase 3, the user will be notified and given the option to paste one manually.

---

## APPROVED TECH STACK

| What | Technology | Notes |
|---|---|---|
| Framework | Next.js 14, App Router, TypeScript | Already installed |
| Database | Supabase (PostgreSQL) | Already set up with 7 tables |
| LLM Default | Google Gemini 2.5 Flash | Model ID: `gemini-2.5-flash` |
| LLM Wrapper | lib/llm/provider.ts | NEVER call Gemini SDK directly in other files |
| YouTube Data | YouTube Data API v3 | Official API, free tier |
| Transcripts | youtube-transcript | Already installed, used in Phase 3 |
| Package manager | npm | Do not use yarn, pnpm, or bun |

---

## CRITICAL: HOW THE SCOUT WORKS

Before building, understand what the Scout does. Explain this to the founder if asked.

**In plain English:**
1. Founder types "fitness motivation"
2. YouTube Search API finds 50 channels related to that keyword
3. The LLM reads those 50 channels and picks the top 20 most relevant ones, giving each a relevance score
4. For each of the top 20 channels, we pull their last 50 videos
5. We calculate each channel's average view count (ignoring their top 5% to avoid skewing the average)
6. Any video with 3x or more views than that average is flagged as an outlier
7. Everything gets saved to Supabase — channels, videos, outlier scores

**The outlier score formula:**
```
outlierScore = videoViews / channelBaseline
channelBaseline = average views of last 50 videos, excluding top 5%

Categories:
< 0.5     = 'underperformer'
0.5–1.5   = 'normal'
1.5–3.0   = 'above_average'
3.0–5.0   = 'notable'      ← default flag threshold
5.0–10.0  = 'strong'
> 10.0    = 'viral'
```

---

## PHASE 1 TASK LIST

Work through these in exact order. One file at a time. Tick each box when complete and tested.

---

### TASK 1 — `lib/types.ts`

**What it is:** The master type definitions file. Every other file in the project imports types from here. Build this first so TypeScript can validate everything that follows.

**Build instructions:**
- Define all interfaces listed below
- Never use `any` — every field must have an explicit type
- Export every interface

**Interfaces to define:**

```typescript
// Niche
interface NicheData {
  id?: string;
  name: string;
  keywords: string[];
  channelCount: number;
  lastScannedAt?: string;
  createdAt?: string;
}

// Channel
interface ChannelData {
  id?: string;
  youtubeChannelId: string;
  channelName: string;
  channelUrl?: string;
  subscriberCount?: number;
  totalVideoCount?: number;
  nicheId?: string;
  avgViews?: number;
  relevanceScore?: number;
  lastScannedAt?: string;
  createdAt?: string;
}

// Video
interface VideoData {
  id?: string;
  youtubeVideoId: string;
  channelId?: string;
  title: string;
  description?: string;
  url: string;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  durationSeconds?: number;
  publishedAt?: string;
  thumbnailUrl?: string;
  tags?: string[];
  outlierScore?: number;
  outlierCategory?: OutlierCategory;
  hasTranscript?: boolean;
  hasAnalysis?: boolean;
  createdAt?: string;
  // Channel info (joined from channels table)
  channelName?: string;
  channelUrl?: string;
}

// Outlier category type
type OutlierCategory =
  | 'underperformer'
  | 'normal'
  | 'above_average'
  | 'notable'
  | 'strong'
  | 'viral';

// Outlier result (video + its score context)
interface OutlierResult {
  video: VideoData;
  outlierScore: number;
  outlierCategory: OutlierCategory;
  channelAvgViews: number;
  channelName: string;
  rank: number;
}

// Channel search result (from YouTube Search API)
interface ChannelSearchResult {
  youtubeChannelId: string;
  channelName: string;
  channelUrl: string;
  description?: string;
  subscriberCount?: number;
  thumbnailUrl?: string;
}

// LLM-ranked channel
interface RankedChannel extends ChannelSearchResult {
  relevanceScore: number;
  relevanceReason: string;
}

// Pipeline config
interface PipelineConfig {
  flagThreshold: number;
  flagMetric: 'views' | 'engagement_rate' | 'view_velocity' | 'comment_ratio';
  maxChannelsToScan: number;
  maxVideosPerChannel: number;
  maxOutliersToAnalyse: number;
}

// Pipeline run
interface PipelineRun {
  id?: string;
  inputType: 'niche' | 'channel' | 'video';
  inputValue: string;
  channelsFound: number;
  videosScanned: number;
  outliersFound: number;
  analysesCompleted: number;
  briefsGenerated: number;
  status: 'running' | 'completed' | 'failed';
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

// LLM response
interface LLMResponse {
  text: string;
  tokensUsed?: number;
}
```

**Test:** Run `npx tsc --noEmit` in the terminal. It must complete with zero errors. If there are errors, fix them before moving on.

- [x] `lib/types.ts` created ✓
- [x] `npx tsc --noEmit` passes with zero errors ✓

---

### TASK 2 — `lib/config.ts`

**What it is:** The single source of truth for all configurable numbers and settings. Nothing is ever hard-coded elsewhere. If a number needs to change, it changes here and nowhere else.

**Build instructions:**
- Import `PipelineConfig` from `lib/types.ts`
- Export `DEFAULT_CONFIG` as a constant
- Export individual threshold constants

```typescript
import { PipelineConfig } from './types';

export const DEFAULT_CONFIG: PipelineConfig = {
  flagThreshold: 3.0,           // Videos 3x above channel average are flagged
  flagMetric: 'views',          // Default metric for outlier detection
  maxChannelsToScan: 20,        // Max channels to scan per niche
  maxVideosPerChannel: 50,      // Videos pulled per channel
  maxOutliersToAnalyse: 20,     // Max outliers to send to Decoder
};

export const OUTLIER_THRESHOLDS = {
  underperformer: 0.5,
  normal: 1.5,
  above_average: 3.0,
  notable: 5.0,
  strong: 10.0,
  // above 10.0 = viral
};

export const MAX_TRANSCRIPT_WORDS = 15000;
export const LLM_TEMPERATURE = 0.3;
export const LLM_MAX_TOKENS = 4096;
export const YOUTUBE_MAX_RESULTS = 50;
export const CHANNEL_BASELINE_TRIM_PERCENT = 0.05; // Exclude top 5% when calculating baseline
```

**Plain English explanation to give founder:** This file is the control panel for TEDAR's settings. The `flagThreshold: 3.0` means "only show me videos that got 3 times more views than the channel's average." The founder can change any of these numbers here and the change applies everywhere in the system automatically.

**Test:** Run `npx tsc --noEmit`. Zero errors.

- [x] `lib/config.ts` created ✓
- [x] `npx tsc --noEmit` passes with zero errors ✓

---

### TASK 3 — `lib/supabase.ts`

**What it is:** The database connection file and all database query functions for Phase 1. Every piece of data the Scout produces gets saved through the functions in this file.

**Build instructions:**
- Create the Supabase client using environment variables
- Create two clients: one for browser (anon key) and one for server (service role key)
- Add upsert functions for niches, channels, videos, and pipeline_runs
- Handle errors clearly — if a database save fails, throw with a descriptive message

**Key functions to implement:**

```typescript
// Connect to Supabase
export const supabase = createClient(url, anonKey);
export const supabaseAdmin = createClient(url, serviceRoleKey);

// Upsert a niche (insert if new, update if exists)
export async function upsertNiche(niche: NicheData): Promise<string>
// Returns the niche ID

// Upsert a channel
export async function upsertChannel(channel: ChannelData): Promise<string>
// Returns the channel ID

// Upsert a video (with outlier score)
export async function upsertVideo(video: VideoData): Promise<string>
// Returns the video ID

// Create a pipeline run record
export async function createPipelineRun(
  inputType: PipelineRun['inputType'],
  inputValue: string
): Promise<string>
// Returns the pipeline run ID

// Update a pipeline run with progress
export async function updatePipelineRun(
  id: string,
  updates: Partial<PipelineRun>
): Promise<void>

// Get videos for a channel (used to check if already scanned)
export async function getChannelVideos(channelId: string): Promise<VideoData[]>
```

**Important:** Use `supabaseAdmin` (service role) for all write operations. Use `supabase` (anon) only for reads.

**Test:** Run `npx tsc --noEmit`. Zero errors. Then run this quick connection test in terminal:
```bash
npx ts-node -e "import('./lib/supabase').then(m => m.supabase.from('niches').select('count').then(r => console.log('✅ DB connected:', r)))"
```

- [x] `lib/supabase.ts` created ✓
- [x] TypeScript check passes ✓
- [x] Database connection test passes ✓

---

### TASK 4 — `lib/llm/gemini.ts`

**What it is:** The Gemini-specific LLM implementation. This file knows how to talk to Google's Gemini API. It is the only file that imports the Gemini SDK directly.

**Build instructions:**
- Import `@google/generative-ai`
- Use model: `gemini-2.5-flash` — this is the ONLY correct model ID. Never use gemini-2.0-flash.
- Set temperature from `LLM_TEMPERATURE` in config
- Set max tokens from `LLM_MAX_TOKENS` in config
- Handle rate limiting: if a 429 error occurs, wait 60 seconds and retry once
- Handle parse errors: if JSON is expected but response is malformed, retry once
- Export a single function: `generateWithGemini(systemPrompt: string, userMessage: string): Promise<LLMResponse>`

**Critical pattern:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLM_TEMPERATURE, LLM_MAX_TOKENS } from '../config';
import { LLMResponse } from '../types';

const MODEL_ID = 'gemini-2.5-flash'; // NEVER change this to 2.0

export async function generateWithGemini(
  systemPrompt: string,
  userMessage: string
): Promise<LLMResponse> {
  // implementation here
}
```

**Plain English explanation:** This file is the translator that speaks Google's language. When TEDAR needs to ask the AI something, it sends the question through this file. The temperature setting (0.3) means the AI gives consistent, reliable answers rather than creative ones — which is what we want for analysis.

**Test:** Run `npx tsc --noEmit`. Zero errors.

- [x] `lib/llm/gemini.ts` created ✓
- [x] TypeScript check passes ✓

---

### TASK 5 — `lib/llm/provider.ts`

**What it is:** The model-agnostic wrapper. This is the ONLY file that the rest of the application calls when it needs the LLM. It reads the `LLM_PROVIDER` environment variable and routes to the correct implementation. Switching LLM providers requires changing one env var — nothing else.

**Build instructions:**
- Read `LLM_PROVIDER` from environment variables
- If `LLM_PROVIDER=gemini` → route to `generateWithGemini`
- If `LLM_PROVIDER=claude` → throw "Claude provider not yet implemented"
- If `LLM_PROVIDER=openai` → throw "OpenAI provider not yet implemented"
- Export a single function: `generateLLMResponse`

```typescript
export async function generateLLMResponse(
  systemPrompt: string,
  userMessage: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<LLMResponse>
```

**Plain English explanation:** This file is the switchboard. Every part of TEDAR that needs AI asks this single function. The function then decides which AI to use based on the environment variable. This is why switching from Gemini to Claude is one line change — you change `LLM_PROVIDER=gemini` to `LLM_PROVIDER=claude` in .env.local and this file handles the rest.

**Test:** Run `npx tsc --noEmit`. Zero errors. Then test the provider routes correctly:
```bash
npx ts-node -e "
process.env.LLM_PROVIDER='gemini';
process.env.GEMINI_API_KEY='$(grep GEMINI_API_KEY .env.local | cut -d= -f2)';
import('./lib/llm/provider').then(m => 
  m.generateLLMResponse('You are a test.', 'Say OK in one word.')
  .then(r => console.log('✅ LLM provider works:', r.text))
  .catch(e => console.log('❌', e.message))
)"
```

- [x] `lib/llm/provider.ts` created ✓
- [x] TypeScript check passes ✓
- [x] Provider test passes ✓

---

### TASK 6 — `lib/prompts/channel-ranker.ts`

**What it is:** The LLM prompt that takes 50 YouTube channels found by YouTube Search and ranks the top 20 by relevance to the niche keyword. This is what makes TEDAR's channel discovery intelligent rather than just taking whatever YouTube returns.

**Build instructions:**
- Export a single function: `buildChannelRankerPrompt`
- The system prompt instructs the LLM to act as a niche relevance expert
- The user message includes the niche keyword and the list of channels as JSON
- The output must be valid JSON — instruct the LLM explicitly to return ONLY JSON, no preamble, no markdown, no backticks
- The JSON output format must be an array of ranked channels with relevanceScore and relevanceReason

**Function signature:**
```typescript
export function buildChannelRankerPrompt(
  nicheKeyword: string,
  channels: ChannelSearchResult[]
): { systemPrompt: string; userMessage: string }
```

**System prompt must instruct the LLM to:**
- Return ONLY a JSON array, nothing else — no explanation, no markdown
- Select the top 20 most relevant channels for the exact niche
- Exclude channels that are only tangentially related
- Give each channel a relevanceScore from 0–100
- Give each channel a one-sentence relevanceReason
- Sort by relevanceScore descending

**Expected JSON output format:**
```json
[
  {
    "youtubeChannelId": "UCxxxxxxx",
    "channelName": "Channel Name",
    "relevanceScore": 92,
    "relevanceReason": "Exclusively covers fitness motivation content with 80% of videos directly on-topic"
  }
]
```

**Test:** Run `npx tsc --noEmit`. Zero errors.

- [x] `lib/prompts/channel-ranker.ts` created ✓
- [x] TypeScript check passes ✓

---

### TASK 7 — `lib/youtube/search.ts`

**What it is:** Searches YouTube for channels matching a niche keyword. Returns up to 50 candidate channels for the LLM to rank.

**Build instructions:**
- Use the `googleapis` package
- Use YouTube Search API with `type: 'channel'`
- Return up to `YOUTUBE_MAX_RESULTS` (50) results
- Return typed `ChannelSearchResult[]`
- Handle errors: API key missing, quota exceeded, network error
- Validate environment variable at module load time

**Function signature:**
```typescript
export async function searchChannels(
  keyword: string
): Promise<ChannelSearchResult[]>
```

**Plain English explanation:** This function is TEDAR's first step — it asks YouTube "give me up to 50 channels related to this topic." YouTube returns a list of channels. We then pass that list to the LLM to pick the most relevant ones.

**Test:** Create `scripts/test-search.ts` and run it:
```typescript
// scripts/test-search.ts
import { searchChannels } from '../lib/youtube/search';

async function main() {
  console.log('Testing YouTube channel search...');
  const results = await searchChannels('fitness motivation');
  console.log(`✅ Found ${results.length} channels`);
  console.log('First 3 results:');
  results.slice(0, 3).forEach(c => {
    console.log(`  - ${c.channelName} (${c.youtubeChannelId})`);
  });
}

main().catch(console.error);
```

Run with: `npx ts-node scripts/test-search.ts`

Expected: 50 channels returned, first 3 printed with names and IDs.

- [x] `lib/youtube/search.ts` created ✓
- [x] `scripts/test-search.ts` created ✓
- [x] Test returns 50 channels with no errors ✓

---

### TASK 8 — `lib/youtube/channel.ts`

**What it is:** Fetches the most recent videos from a YouTube channel. This is how TEDAR builds the video list it then scores for outliers.

**Build instructions:**
- Two functions: `resolveChannelId` and `getChannelVideos`
- `resolveChannelId` handles any input format: channel URL, @handle, or raw channel ID
- `getChannelVideos` returns the most recent N videos with full metadata
- Use `googleapis` YouTube Data API
- Return typed `VideoData[]`

**Function signatures:**
```typescript
export async function resolveChannelId(input: string): Promise<string>
// Input can be: "https://youtube.com/@mkbhd", "@mkbhd", "UCBcRF18a7Qf58cCRy5xuWwQ"
// Returns: raw YouTube channel ID

export async function getChannelVideos(
  channelId: string,
  maxResults: number
): Promise<VideoData[]>
// Returns most recent maxResults videos with metadata
```

**Test:** Add to `scripts/test-channel.ts`:
```typescript
import { resolveChannelId, getChannelVideos } from '../lib/youtube/channel';

async function main() {
  const channelId = await resolveChannelId('https://www.youtube.com/@mkbhd');
  console.log('✅ Resolved channel ID:', channelId);
  
  const videos = await getChannelVideos(channelId, 10);
  console.log(`✅ Got ${videos.length} videos`);
  console.log('Most recent:', videos[0].title, '| Views:', videos[0].viewCount);
}

main().catch(console.error);
```

Run with: `npx ts-node scripts/test-channel.ts`

Expected: Channel ID resolved, 10 videos returned with titles and view counts.

- [x] `lib/youtube/channel.ts` created ✓
- [x] `scripts/test-channel.ts` created ✓
- [x] Test resolves channel ID and returns 10 videos ✓

---

### TASK 9 — `lib/youtube/metadata.ts`

**What it is:** Fetches metadata for a single YouTube video by URL or ID. Used when a user pastes a specific video URL (Mode 3 input).

**Build instructions:**
- Single function: `getVideoData`
- Handle all YouTube URL formats: full URL, short URL (youtu.be), embed URL, URL with timestamp
- Extract video ID from any format
- Fetch metadata via YouTube Data API
- Return typed `VideoData`
- Throw clear error if video not found

**Function signature:**
```typescript
export async function getVideoData(videoUrl: string): Promise<VideoData>
```

**Test:** Run `npx tsc --noEmit`. Zero errors. Quick manual test:
```bash
npx ts-node -e "
import('./lib/youtube/metadata').then(m =>
  m.getVideoData('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  .then(v => console.log('✅ Got video:', v.title, '| Views:', v.viewCount))
  .catch(e => console.log('❌', e.message))
)"
```

- [x] `lib/youtube/metadata.ts` created ✓
- [x] TypeScript check passes ✓
- [x] Manual test returns video title and view count ✓

---

### TASK 10 — `lib/youtube/outlier.ts`

**What it is:** The core Scout logic. Takes a list of videos for a channel and calculates which ones are significantly outperforming the channel's average. This is the mathematical heart of the Scout Engine.

**Build instructions:**
- Three functions: `calculateChannelBaseline`, `categoriseOutlier`, `detectOutliers`
- Import all thresholds from `lib/config.ts` — never hard-code numbers here
- The baseline excludes the top 5% of videos by view count (uses `CHANNEL_BASELINE_TRIM_PERCENT`)
- `categoriseOutlier` maps a score to an `OutlierCategory`
- `detectOutliers` returns only videos above the `flagThreshold`

**Function signatures:**
```typescript
export function calculateChannelBaseline(videos: VideoData[]): number
// Returns average view count, excluding top 5% by views

export function categoriseOutlier(score: number): OutlierCategory
// Maps score to category using OUTLIER_THRESHOLDS from config

export function detectOutliers(
  videos: VideoData[],
  channelName: string,
  config: PipelineConfig
): OutlierResult[]
// Returns only videos above flagThreshold, sorted by score descending
```

**Plain English explanation:** This function is the "what's unusual?" detector. It calculates what a "normal" video looks like for a channel, then flags anything that performed much better than normal.

**Why the algorithm is built this way — these reasons must be included as code comments:**

- **Trimmed mean (exclude top 5%):** If a channel has one video with 10M views and everything else averages 100K, a simple average produces a false baseline of ~300K, making real outliers look normal. Excluding top 5% gives the channel's true typical performance. Standard statistical technique.
- **3x default threshold:** Normal video performance varies roughly 0.5x–2x the average due to natural variance (timing, thumbnail, topic). Anything above 3x is statistically unusual. Mirrors thresholds used in academic studies on viral content diffusion.
- **50 videos per channel:** Fewer than 30 gives an unreliable baseline — one bad month skews everything. More than 50 adds API cost without meaningfully improving accuracy.
- **Four configurable metrics:** View count alone misses videos that drive unusually high discussion or fast early growth. The four metrics catch different types of outlier behaviour.

**Test:** Add to `scripts/test-outlier.ts`:
```typescript
import { resolveChannelId, getChannelVideos } from '../lib/youtube/channel';
import { detectOutliers } from '../lib/youtube/outlier';
import { DEFAULT_CONFIG } from '../lib/config';

async function main() {
  const channelId = await resolveChannelId('https://www.youtube.com/@mkbhd');
  const videos = await getChannelVideos(channelId, 50);
  console.log(`✅ Got ${videos.length} videos`);
  
  const outliers = detectOutliers(videos, 'MKBHD', DEFAULT_CONFIG);
  console.log(`✅ Found ${outliers.length} outliers`);
  
  outliers.slice(0, 5).forEach((o, i) => {
    console.log(`${i+1}. [${o.outlierCategory.toUpperCase()}] ${o.video.title}`);
    console.log(`   Score: ${o.outlierScore.toFixed(1)}x | Views: ${o.video.viewCount.toLocaleString()}`);
  });
}

main().catch(console.error);
```

Run with: `npx ts-node scripts/test-outlier.ts`

Expected: Top 5 outliers printed with scores and categories. Manually verify on YouTube that the top result genuinely has more views than the channel average.

- [x] `lib/youtube/outlier.ts` created ✓
- [x] `scripts/test-outlier.ts` created ✓
- [x] Test returns outliers with correct scores ✓
- [x] Manually verified top outlier is genuinely high-performing ✓

---

### TASK 11 — Full Scout Integration Test

**What it is:** A full end-to-end test that runs the complete Scout flow — keyword → channel discovery → LLM ranking → video scanning → outlier detection → database storage — and verifies everything is saved to Supabase.

**Build instructions:**
- Add to `scripts/test-search.ts` or create a new `scripts/test-scout-full.ts`
- Run the full pipeline manually in sequence
- After running, check Supabase dashboard to verify data was saved

**Full test script:**
```typescript
import { searchChannels } from '../lib/youtube/search';
import { buildChannelRankerPrompt } from '../lib/prompts/channel-ranker';
import { generateLLMResponse } from '../lib/llm/provider';
import { getChannelVideos } from '../lib/youtube/channel';
import { detectOutliers } from '../lib/youtube/outlier';
import { upsertNiche, upsertChannel, upsertVideo, createPipelineRun, updatePipelineRun } from '../lib/supabase';
import { DEFAULT_CONFIG } from '../lib/config';
import { RankedChannel } from '../lib/types';

async function main() {
  const keyword = 'personal finance';
  console.log(`\n🔍 Starting Scout for: "${keyword}"\n`);

  // Step 1: Create pipeline run
  const runId = await createPipelineRun('niche', keyword);
  console.log('✅ Pipeline run created:', runId);

  // Step 2: Create niche record
  const nicheId = await upsertNiche({ name: keyword, keywords: [keyword], channelCount: 0 });
  console.log('✅ Niche saved to DB:', nicheId);

  // Step 3: Search YouTube for channels
  const candidates = await searchChannels(keyword);
  console.log(`✅ Found ${candidates.length} candidate channels on YouTube`);

  // Step 4: LLM ranks channels
  const { systemPrompt, userMessage } = buildChannelRankerPrompt(keyword, candidates);
  const llmResponse = await generateLLMResponse(systemPrompt, userMessage);
  
  let rankedChannels: RankedChannel[] = [];
  try {
    rankedChannels = JSON.parse(llmResponse.text);
    console.log(`✅ LLM ranked ${rankedChannels.length} channels`);
    console.log('Top 3:');
    rankedChannels.slice(0, 3).forEach(c => 
      console.log(`  - ${c.channelName} (score: ${c.relevanceScore}) — ${c.relevanceReason}`)
    );
  } catch (e) {
    console.log('❌ Failed to parse LLM response:', llmResponse.text.slice(0, 200));
    return;
  }

  await updatePipelineRun(runId, { channelsFound: rankedChannels.length });

  // Step 5: Scan top 3 channels (limit for test)
  const topChannels = rankedChannels.slice(0, 3);
  let totalVideos = 0;
  let allOutliers: any[] = [];

  for (const channel of topChannels) {
    const channelId = await upsertChannel({
      youtubeChannelId: channel.youtubeChannelId,
      channelName: channel.channelName,
      channelUrl: channel.channelUrl,
      nicheId,
      relevanceScore: channel.relevanceScore,
    });

    const videos = await getChannelVideos(channel.youtubeChannelId, DEFAULT_CONFIG.maxVideosPerChannel);
    totalVideos += videos.length;

    const outliers = detectOutliers(videos, channel.channelName, DEFAULT_CONFIG);
    allOutliers = [...allOutliers, ...outliers];

    // Save all videos to DB
    for (const video of videos) {
      const outlier = outliers.find(o => o.video.youtubeVideoId === video.youtubeVideoId);
      await upsertVideo({
        ...video,
        channelId,
        outlierScore: outlier?.outlierScore,
        outlierCategory: outlier?.outlierCategory,
      });
    }

    console.log(`✅ ${channel.channelName}: ${videos.length} videos, ${outliers.length} outliers`);
  }

  await updatePipelineRun(runId, {
    videosScanned: totalVideos,
    outliersFound: allOutliers.length,
    status: 'completed',
    completedAt: new Date().toISOString(),
  });

  console.log(`\n🎯 Scout complete!`);
  console.log(`   Channels scanned: ${topChannels.length}`);
  console.log(`   Videos found: ${totalVideos}`);
  console.log(`   Outliers detected: ${allOutliers.length}`);
  console.log(`\nTop 5 outliers across all channels:`);
  allOutliers
    .sort((a, b) => b.outlierScore - a.outlierScore)
    .slice(0, 5)
    .forEach((o, i) => {
      console.log(`${i+1}. [${o.outlierCategory.toUpperCase()}] ${o.video.title}`);
      console.log(`   ${o.channelName} | ${o.outlierScore.toFixed(1)}x | ${o.video.viewCount.toLocaleString()} views`);
    });

  console.log('\n✅ Check your Supabase dashboard — data should be in channels, videos, and pipeline_runs tables');
}

main().catch(console.error);
```

Run with: `npx ts-node scripts/test-scout-full.ts`

**After running:** Go to Supabase dashboard → Table Editor → check:
- `niches` table: 1 row for "personal finance"
- `channels` table: 3 rows (top 3 channels)
- `videos` table: ~150 rows (50 per channel) — every row has `has_transcript = false` by default. This is correct. Transcript fetching is Phase 3, not Phase 1. The field exists so Phase 3 can update it without schema changes.
- `pipeline_runs` table: 1 row with status "completed"

- [x] Full integration test script created ✓
- [x] Test runs without errors ✓
- [x] Data verified in Supabase dashboard ✓
- [x] Outlier scores make sense when checked against YouTube manually ✓

---

### TASK 12 — Commit and push to GitHub

Run in terminal:
```bash
git add .
git commit -m "Phase 1: Scout Engine — channel discovery, outlier detection, database storage"
git push
```

Verify on github.com/Shayan733/tedar that the new files appear. Confirm `.env.local` is NOT in the commit.

- [ ] Changes committed ✓
- [ ] Pushed to GitHub ✓
- [ ] .env.local NOT in commit ✓

---

## PHASE 1 GATE CHECK

All of the following must be true before Phase 2 begins:

- [ ] `npx tsc --noEmit` passes with zero TypeScript errors
- [ ] `lib/types.ts` defines all required interfaces
- [ ] `lib/config.ts` exports DEFAULT_CONFIG and all threshold constants
- [ ] `lib/supabase.ts` connects to database and upsert functions work
- [ ] `lib/llm/provider.ts` routes correctly to Gemini
- [ ] `lib/llm/gemini.ts` uses model ID `gemini-2.5-flash` (verified in code)
- [ ] YouTube channel search returns results for a test keyword
- [ ] Outlier detection produces scores that match manual YouTube verification
- [ ] Full integration test runs end-to-end without errors
- [ ] Data appears in Supabase: niches, channels, videos, pipeline_runs tables all have rows
- [ ] All code committed and pushed to GitHub

**When all boxes above are ticked:** Tell the founder "Phase 1 is complete. The Scout Engine is working. Replace this CLAUDE.md with the Phase 2 CLAUDE.md to begin building the Scout Dashboard and three input modes."

---

## IF SOMETHING BREAKS

1. Read the exact error. Quote it in full.
2. Explain it to the founder in plain English.
3. Fix only the broken thing. Do not touch working code.
4. Re-run the specific test for that file.
5. Confirm it passes before moving on.

**Common Phase 1 issues:**

- **YouTube API quota exceeded:** The free tier allows ~100 channel lookups/day. If you hit the limit, wait until midnight Pacific (8am UK) and resume.
- **Gemini quota exceeded (429):** Wait 60 seconds and retry. The free tier resets daily at midnight Pacific.
- **TypeScript errors on import:** Make sure every interface is exported from `lib/types.ts` and imported correctly in each file.
- **Supabase upsert fails:** Check that the column names in the upsert exactly match the database column names (snake_case in DB, camelCase in TypeScript — the supabase.ts file handles the translation).
- **LLM returns non-JSON:** The channel ranker prompt must explicitly say "return ONLY valid JSON, no markdown, no backticks, no explanation." If it still fails, add a JSON extraction step that strips any surrounding text.

---

*TEDAR Project Bible v3.0 — Phase 1 of 7*
*Built one step at a time. Test before moving. Never skip gates.*