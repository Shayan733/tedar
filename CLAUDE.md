# TEDAR — CLAUDE.md
# Phase 3: Decoder Engine — Psychological Analysis

---

## WHAT YOU ARE

You are a careful, precise coding agent building TEDAR — a content intelligence system for YouTube creators. You are working with a non-technical founder who needs plain-language explanations for every single thing you do. You build one thing at a time. You test before moving. You never skip steps. You never build ahead of the current phase.

When a task is complete and tested, update this file by changing `- [ ]` to `- [x]` for that item.

---

## WHAT WAS BUILT IN PHASES 0, 1, AND 2 — AGENT CONTEXT

Read this before doing anything. This is what already exists. Do not re-create, re-install, or re-initialise anything listed here.

**Project details:**
- Name: TEDAR
- Founder: Shayan (non-technical — explain everything in plain English, no jargon)
- GitHub: github.com/Shayan733/tedar (private repo, connected and pushing)
- Local path: ~/Desktop/TEDAR/tedar

**Already built and confirmed working:**
- ✅ Next.js 14 project with TypeScript and Tailwind — runs at localhost:3000
- ✅ All dependencies installed including `youtube-transcript` (already installed — do not reinstall)
- ✅ shadcn/ui components: button, card, input, tabs, badge, skeleton, alert, progress
- ✅ .env.local with all API keys configured and confirmed working
- ✅ 11 Supabase tables live: niches, channels, videos, transcripts, analyses, knowledge_entries, pipeline_runs, video_snapshots, channel_snapshots, niche_snapshots, video_velocity_snapshots
- ✅ pgvector extension enabled (West EU / Ireland region)
- ✅ Git connected to GitHub, Phases 0–2 committed and pushed at bfc40a3

**Phase 1 and Phase 2 files — do not rewrite any of these:**
- ✅ `lib/types.ts` — all TypeScript interfaces (Phase 3 adds new types to this file)
- ✅ `lib/config.ts` — all configurable thresholds including BASELINE_MODE_CONFIG and TREND_MODE_CONFIG
- ✅ `lib/supabase.ts` — database connection + all upsert and snapshot functions (Phase 3 adds new functions)
- ✅ `lib/supabase-queries.ts` — read-only dashboard queries
- ✅ `lib/llm/groq.ts` — Groq llama-3.3-70b-versatile (ACTIVE LLM)
- ✅ `lib/llm/gemini.ts` — Gemini 2.5 Flash (FALLBACK only — 20 req/day)
- ✅ `lib/llm/provider.ts` — model-agnostic wrapper with stripJsonFences utility
- ✅ `lib/prompts/channel-ranker.ts` — channel ranking prompt
- ✅ `lib/prompts/input-interpreter.ts` — user input classifier
- ✅ `lib/youtube/search.ts` — YouTube channel search
- ✅ `lib/youtube/channel.ts` — paginated video fetch (2 × 50 = 100 videos) with fetchChannelName helper
- ✅ `lib/youtube/metadata.ts` — single video metadata
- ✅ `lib/youtube/outlier.ts` — outlier scoring (trimmed mean baseline)
- ✅ `lib/pipeline/niche-pipeline.ts` — full niche Scout pipeline
- ✅ `lib/pipeline/channel-pipeline.ts` — single channel Scout
- ✅ `lib/pipeline/video-pipeline.ts` — single video metadata fetch
- ✅ `app/api/scout/interpret/route.ts` — LLM input classifier API
- ✅ `app/api/scout/run/route.ts` — pipeline runner with narrator summary
- ✅ `app/api/scout/results/[runId]/route.ts` — results retrieval
- ✅ `components/OutlierCard.tsx` — video result card (Decode button currently disabled — Phase 3 activates it)
- ✅ `components/PipelineProgress.tsx` — animated progress display
- ✅ `app/page.tsx` — full dashboard, 6-state machine, all three input modes working
- ✅ `next.config.ts` — YouTube thumbnail domain whitelisted

**Phase 2 gate passed — verified:**
- 1,000+ videos in database, 96+ outliers detected and scored
- All 5 browser tests passed (niche mode, channel mode, video mode, clarification flow, error handling)
- All 19 verification tests passed

**LLM configuration — CURRENT ACTIVE STATE:**
- **Active LLM:** Groq `llama-3.3-70b-versatile`
- **Fallback:** Gemini 2.5 Flash — 20 req/day (not 250 — confirmed empirically)
- **Env var:** `LLM_PROVIDER=groq`
- **Groq is active.** Every LLM call in this phase goes through Groq via `lib/llm/provider.ts`.
- Never reference `gemini-2.0-flash` anywhere. If Gemini is needed as fallback, the model ID is `gemini-2.5-flash`.

**YouTube API:**
- Free tier: ~100 channel lookups/day, resets midnight Pacific (8am UK time)

**Database:**
- Supabase PostgreSQL, West EU / Ireland region
- 11 tables total (7 core + 4 snapshot tables, all append-only)
- `transcripts` table: currently empty — Phase 3 fills this
- `analyses` table: currently empty — Phase 3 fills this
- Current storage: ~35MB (~7% of 500MB free tier)

**Config values — do not change these:**
- `maxChannelsToScan: 5` (was 20 — reduced to prevent browser timeout, do not revert)
- `maxVideosPerChannel: 100` (two paginated API calls, do not reduce)
- `flagThreshold: 3.0` (BASELINE_MODE_CONFIG)

---

## BUGS FIXED IN PHASE 2 — DO NOT REINTRODUCE

These five bugs were fixed and committed. Do not recreate them.

1. **next/image crash** — YouTube thumbnails use `<img>` tag + domain whitelisted in `next.config.ts`. Do not switch back to `next/image` for YouTube thumbnails.
2. **Video pipeline UUID error** — Never pass the YouTube channel ID string directly into `channel_id` on the videos table. Always use the Supabase UUID from `upsertChannel`.
3. **"Unknown Channel" in database** — `fetchChannelName()` helper in `lib/youtube/channel.ts` must always be called. Never assume `channelName` is populated from `getChannelVideos` alone.
4. **TypeScript error on Next.js params** — Always `await params` before accessing route parameters in Next.js server components.
5. **Browser timeout** — `maxChannelsToScan` is 5, not 20. `maxVideosPerChannel` is 100, not 50. Never revert these.

---

## WHAT THIS PHASE BUILDS

Phase 3 builds the Decoder Engine — the psychological analysis layer. This is the core product feature. It takes any YouTube video, pulls its transcript, sends it through the K1 psychological framework, and produces a structured analysis explaining exactly why the video performed the way it did.

**At the end of this phase, the founder can:**
1. Click "Decode this video" on any outlier card in the dashboard
2. See TEDAR pull the transcript, run it through the K1 framework, and produce a psychological analysis
3. Read the analysis across four tabs: Psychological Formula, Dimension Scores, Replication Brief, Script Outline
4. See each score as a colour-coded bar with the reasoning attached

**What the Decoder does in plain English:**

The Decoder takes what someone said in a video (the transcript) and analyses why those words, in that structure and sequence, caused people to watch, engage, and share. It does this by applying four peer-reviewed psychological frameworks simultaneously — Kahneman's attention theory, Berger's sharing science, Loewenstein's curiosity model, and Salt's attention architecture. It gives every dimension a score from 0–100, identifies the primary psychological mechanism driving the video's performance, and produces a brief a creator can use to replicate the formula.

**Files built in this phase (in order):**
1. New types added to `lib/types.ts` — DecoderResult, EngagementScore, DimensionScores, PsychologicalFormula, ReplicationBrief, ScriptOutline, KeyMoment, TranscriptData, AnalysisRecord
2. New database functions added to `lib/supabase.ts` — upsertTranscript, upsertAnalysis, getAnalysisByVideoId, getVideoByYoutubeId
3. `lib/youtube/transcript.ts` — transcript fetcher
4. `lib/prompts/k1-decoder.ts` — **THE MOST IMPORTANT FILE IN THE ENTIRE PROJECT**
5. `lib/analysis.ts` — Decoder orchestrator
6. `app/api/decode/route.ts` — decode API with caching
7. Update `components/OutlierCard.tsx` — activate Decode button
8. `components/AnalysisCard.tsx` — full analysis display
9. `app/decode/[videoId]/page.tsx` — decode results page
10. `scripts/test-decoder.ts` — integration test
11. Commit and push to GitHub

**LLM calls in this phase:**
- One Decoder call per video analysis (~2,000–4,000 token system prompt + transcript)
- All calls go through `lib/llm/provider.ts` → Groq

**Estimated time:** 3–5 days (most of the time should be spent on Task 4 — the K1 prompt).

---

## WHAT COMES AFTER THIS PHASE

Phase 4 builds the Builder Engine — it takes the Decoder's psychological analysis and translates it into a personalised, beat-by-beat production brief for the creator's specific channel. Phase 4 depends entirely on Phase 3 producing consistent, well-structured `DecoderResult` JSON. If the Decoder output is inconsistent or generic, the Builder cannot be built reliably.

**Do not build any of the following in Phase 3:**
- Builder prompts or Builder output (`lib/prompts/k1-builder.ts` and `lib/builder.ts` are placeholder files — leave them empty)
- Auth or user accounts
- Payments
- Deployment to Vercel
- Any Phase 5 pipeline automation
- System 2 / Knowledge System (Phase 6)

---

## GOLDEN RULES — READ BEFORE EVERY ACTION

1. **ONE FILE AT A TIME.** Complete one file, explain it, test it, confirm it works, then move to the next.
2. **EXPLAIN EVERYTHING IN PLAIN LANGUAGE.** After every file, write 2–3 sentences explaining what was just built and why. No jargon.
3. **TEST BEFORE MOVING.** Every file has a specific test. Do not proceed until the test passes.
4. **NEVER SKIP GATES.** The Gate Check at the bottom must fully pass before Phase 4 begins. The K1 prompt quality gate is non-negotiable — if 3/5 analyses are not good, rewrite the prompt before proceeding.
5. **NEVER BUILD AHEAD.** No Builder, no auth, no payments, no Phase 4+ features in this phase.
6. **NEVER USE 'any' IN TYPESCRIPT.** All types must be explicitly defined. Import from `lib/types.ts`.
7. **MAX 150 LINES PER FILE.** If a file would exceed 150 lines, split it logically and flag it.
8. **NEVER CALL LLM APIs DIRECTLY.** Always go through `lib/llm/provider.ts`. Never import the Groq SDK in any file outside `lib/llm/groq.ts`.
9. **ALWAYS SAVE DATA TO DATABASE.** Transcripts go to the `transcripts` table. Analysis results go to the `analyses` table. Both must be saved before the function returns.
10. **NEVER HARD-CODE THRESHOLDS.** All configurable numbers come from `lib/config.ts`.
11. **NEVER COMMIT .env.local.** Verify it is in .gitignore before every commit.
12. **THE K1 PROMPT IS THE PRODUCT.** Spend more time on Task 4 than any other task. A generic analysis means the product has failed. Test it against real outlier videos before proceeding. If it produces generic output, rewrite it — do not move to Task 5 until the quality gate for Task 4 passes.
13. **DO NOT REWRITE PHASE 1/2 FILES.** Import from them. Do not modify them unless fixing a bug.
14. **CACHE BEFORE DECODE.** The decode API must always check whether a video has already been analysed before calling the LLM. If the analysis exists in the database, return it immediately — no LLM call needed.
15. **NEVER RE-INTRODUCE THE PHASE 2 BUGS.** Listed above. Check against them before every file.

---

## APPROVED TECH STACK

| What | Technology | Notes |
|---|---|---|
| Framework | Next.js 14, App Router, TypeScript | Already installed |
| Styling | Tailwind CSS + shadcn/ui | Already installed |
| Database | Supabase (PostgreSQL) | 11 tables live |
| LLM — Active | Groq `llama-3.3-70b-versatile` | Always via `lib/llm/provider.ts` |
| LLM — Fallback | Gemini 2.5 Flash | 20 req/day — switch via LLM_PROVIDER env var |
| YouTube | YouTube Data API v3 | Via `lib/youtube/` files |
| Transcripts | `youtube-transcript` npm package | Already installed — do not reinstall |
| State management | React useState only | No Redux, Zustand, or external state |
| Package manager | npm | Do not use yarn, pnpm, or bun |

---

## CRITICAL: HOW THE DECODER WORKS — READ BEFORE BUILDING

**In plain English:**

1. A video URL comes in (from the Decode button on an OutlierCard, or a direct paste)
2. TEDAR pulls the video's transcript — the full spoken words from the auto-captions
3. TEDAR also pulls the video's metadata — title, view count, description, publish date
4. The transcript and metadata are packaged and sent to the LLM alongside the K1 framework prompt — a detailed set of psychological analysis instructions
5. The LLM reads the transcript through four psychological lenses simultaneously and scores each dimension 0–100
6. The LLM identifies the primary mechanism driving the video's performance, names the specific transcript moments that activated each trigger, and produces a replication brief and script outline
7. The result is saved to the database and displayed on the decode page

**The K1 framework — four sources:**
- **Kahneman** — System 1 vs System 2: is the content processed automatically (emotional, fast) or deliberately (rational, slow)? Loss aversion framing: is it about what the viewer stands to lose?
- **Berger STEPPS** — six sharing mechanisms: Social Currency, Triggers, Emotion (high-arousal only), Public, Practical Value, Stories
- **Loewenstein** — Information Gap: does the content create a specific, resolvable curiosity gap early? Is it maintained? Does the payoff satisfy?
- **Salt** — Attention Architecture: sensory loading, pattern interrupts, attention arc across the video's length

**What "good" output looks like vs "bad" output:**

Good: *"At 00:23, when the presenter says 'most people do this backwards,' a prospective information gap is opened — Loewenstein's asymmetric knowledge framing. The viewer perceives a specific, resolvable gap (what is the correct order?) and stays to close it. This activates System 1 processing via loss aversion: 'I might be doing this wrong.' Information gap score: 88. System 1 activation: 82. Interaction effect: these two dimensions working together produce multiplicative rather than additive engagement."*

Bad: *"The video has a strong hook and good storytelling. The presenter is engaging and covers the topic clearly. The information is useful and practical."*

**The second output is worthless.** It describes any video. It names no mechanism. It cites no transcript moment. It produces no actionable replication guidance. The K1 prompt must make the LLM produce the first type, not the second type. This is the entire purpose of Task 4.

---

## PHASE 3 TASK LIST

Work through these in exact order. One file at a time. Tick each box when complete and tested.

---

### TASK 1 — Add new types to `lib/types.ts`

**What it is:** The new TypeScript interfaces that the Decoder engine needs. Add these to the existing `lib/types.ts` file — do not replace what is already there. Every interface must be exported.

**Add these interfaces:**

```typescript
// Individual dimension scores — one score per psychological dimension
interface DimensionScores {
  system1Activation: number;       // 0-100: automatic, emotional processing
  informationGap: number;          // 0-100: curiosity gap (Loewenstein)
  steppsSocialCurrency: number;    // 0-100: makes viewer look good
  steppsTriggers: number;          // 0-100: linked to frequent environmental cues
  steppsEmotion: number;           // 0-100: high-arousal emotion (awe/anger/anxiety/amusement)
  steppsPublic: number;            // 0-100: visible, social proof built in
  steppsPracticalValue: number;    // 0-100: immediately usable information
  steppsStories: number;           // 0-100: narrative structure
  attentionArchitecture: number;   // 0-100: pacing, pattern interrupts, sensory loading
  lossAversion: number;            // 0-100: framed around what viewer stands to lose
}

// A specific moment in the transcript where a mechanism fires
interface KeyMoment {
  timestamp: string;               // e.g. "00:23" — approximate, from transcript
  transcriptQuote: string;         // exact words from the transcript
  mechanism: string;               // name of the psychological mechanism triggered
  dimensionsActivated: string[];   // which DimensionScores fields this moment activates
}

// The "formula" — what combination of mechanisms drove the video's performance
interface PsychologicalFormula {
  primaryMechanism: string;        // the single most powerful driver (e.g. "Prospective Information Gap + Loss Aversion")
  mechanismDescription: string;   // plain-English explanation of why the primary mechanism worked
  supportingMechanisms: string[];  // other mechanisms present and contributing
  interactionEffects: string;      // how the mechanisms work together (additive vs multiplicative)
  keyMoments: KeyMoment[];         // 3-5 specific transcript moments where mechanisms fire
}

// The engagement score with confidence and interaction notes
interface EngagementScore {
  overall: number;                 // 0-100: weighted product of all dimensions
  confidence: 'low' | 'medium' | 'high';
  dimensions: DimensionScores;
  interactionNotes: string;        // where two or more dimensions amplify each other
}

// What a creator should do to replicate the formula
interface ReplicationBrief {
  hookStrategy: string;            // how to open: information gap type, framing, suggested approach
  contentStructure: string;        // pacing, pattern interrupt placement, narrative arc
  priorityTriggers: string[];      // the 2-3 mechanisms to prioritise in the new video
  avoidanceNotes: string;          // what NOT to do based on what was absent or weak
}

// Beat-by-beat script structure
interface ScriptOutline {
  hookBeat: string;                // opening 30 seconds: exact approach and suggested phrasing
  evidenceBeats: string[];         // 2-4 middle beats: how to sequence for curiosity maintenance
  payoffBeat: string;              // resolution: how to satisfy the gap without disappointing
  closeBeat: string;               // final 30 seconds: optimised for sharing behaviour
}

// The full Decoder output
interface DecoderResult {
  psychologicalFormula: PsychologicalFormula;
  engagementScore: EngagementScore;
  replicationBrief: ReplicationBrief;
  scriptOutline: ScriptOutline;
}

// For saving transcripts to the transcripts table
interface TranscriptData {
  id?: string;
  videoId: string;              // Supabase UUID — not YouTube ID
  fullText: string;
  wordCount: number;
  language: string;
  createdAt?: string;
}

// For saving analysis results to the analyses table
interface AnalysisRecord {
  id?: string;
  videoId: string;              // Supabase UUID — not YouTube ID
  analysisType: 'decode' | 'build';
  llmProvider: string;
  llmModel: string;
  promptVersion: string;
  result: DecoderResult;
  overallScore: number;
  dimensionScores: DimensionScores;
  processingTimeMs?: number;
  tokensInput?: number;
  tokensOutput?: number;
  createdAt?: string;
}
```

**Test:** Run `npx tsc --noEmit`. Zero errors. If existing types in the file conflict with any new interface, fix the conflict — do not delete the existing interfaces.

- [x] New types added to `lib/types.ts` ✓
- [x] `npx tsc --noEmit` passes with zero errors ✓

---

### TASK 2 — Add Phase 3 database functions to `lib/supabase.ts`

**What it is:** Four new database functions added to the existing `lib/supabase.ts`. Phase 3 needs to save transcripts, save analysis results, check if a video has already been analysed, and look up a video by its YouTube ID. Add these functions at the end of the existing file. Do not modify any existing functions.

**Check the file length first.** If `lib/supabase.ts` is already at or near 150 lines, create a new file `lib/supabase-decoder.ts` for these four functions and import from it. Flag this to the founder.

**Functions to add:**

```typescript
// Save a transcript to the transcripts table
// Called once per video after transcript is successfully fetched
// If a transcript already exists for this videoId, update it (upsert)
export async function upsertTranscript(transcript: TranscriptData): Promise<string>
// Returns the transcript record ID

// Save a Decoder or Builder analysis result to the analyses table
export async function upsertAnalysis(analysis: AnalysisRecord): Promise<string>
// Returns the analysis record ID

// Check if a video has already been decoded
// Used by the decode API to avoid re-running the LLM if a result is cached
export async function getAnalysisByVideoId(
  videoId: string,
  analysisType: 'decode' | 'build'
): Promise<AnalysisRecord | null>
// Returns the analysis record if it exists, null if not

// Look up a video by its YouTube video ID (not Supabase UUID)
// Used when the decode route receives a YouTube URL and needs the Supabase record
export async function getVideoByYoutubeId(
  youtubeVideoId: string
): Promise<VideoData | null>
// Returns the video record if it exists, null if not
```

**Important — after saving an analysis, update the video record:**

After calling `upsertAnalysis`, also update the video's `has_analysis` column to `true`:

```typescript
await supabaseAdmin
  .from('videos')
  .update({ has_analysis: true })
  .eq('id', analysis.videoId);
```

Similarly, after calling `upsertTranscript`, update `has_transcript = true` on the video record.

**Plain English explanation:** These four functions give the Decoder the database tools it needs — a way to save transcripts, a way to save analyses, and critically, a way to check if we've already analysed a video so we don't waste LLM calls on the same video twice. The second time someone decodes a video, the result comes back instantly from the database.

**Test:** Run `npx tsc --noEmit`. Zero errors.

- [x] Phase 3 database functions added to `lib/supabase-decoder.ts` (supabase.ts was 258 lines — over limit) ✓
- [x] `npx tsc --noEmit` passes with zero errors ✓

---

### TASK 3 — `lib/youtube/transcript.ts`

**What it is:** Fetches the full transcript (spoken words) of any YouTube video using auto-generated captions. Returns clean plain text ready to send to the LLM.

**Build instructions:**
- Use the `youtube-transcript` npm package — already installed
- Extract the video ID from any YouTube URL format before fetching (re-use the ID extraction logic pattern from `lib/youtube/metadata.ts`)
- Join all transcript segments into a single plain-text string with spaces
- Remove excessive whitespace and line breaks
- Truncate at `MAX_TRANSCRIPT_WORDS` (15,000 words from `lib/config.ts`) — if the transcript exceeds this, take the first 15,000 words. A 15,000-word transcript is approximately 30 minutes of speech, which covers all but the longest YouTube videos.
- Return the clean plain text string

**Function signature:**
```typescript
export async function getTranscript(videoId: string): Promise<string>
// videoId: raw YouTube video ID (not a URL) — e.g. "dQw4w9WgXcQ"
// Returns: clean plain text of the spoken content
// Throws: TranscriptError with a user-friendly message if transcript unavailable
```

**Error handling — these specific errors must be caught and re-thrown with clear messages:**
- No captions available: *"This video doesn't have captions available. Approximately 5% of YouTube videos lack auto-captions. Try a different video."*
- Private or deleted video: *"This video is private or has been deleted."*
- Any other fetch error: *"Could not retrieve transcript for this video. Please try again."*

**Plain English explanation:** This function goes and reads everything the person said in the video. YouTube automatically generates text captions for most videos — we pull those captions, join them into one long piece of text, and that becomes the input for the psychological analysis. Without the transcript, there is nothing for the Decoder to analyse.

**Test:** Run `npx tsc --noEmit`. Zero errors. Then test manually:

```bash
npx ts-node -e "
import('./lib/youtube/transcript').then(m =>
  m.getTranscript('dQw4w9WgXcQ')
  .then(t => console.log('✅ Got transcript. Words:', t.split(' ').length, '| First 100 chars:', t.slice(0, 100)))
  .catch(e => console.log('❌', e.message))
)"
```

Expected: Word count printed (likely 100–5,000 depending on video), first 100 characters of transcript text shown.

Also test the error case:

```bash
npx ts-node -e "
import('./lib/youtube/transcript').then(m =>
  m.getTranscript('THIS_IS_NOT_A_REAL_ID')
  .then(t => console.log('Unexpected success'))
  .catch(e => console.log('✅ Error handled correctly:', e.message))
)"
```

Expected: A user-friendly error message (not a raw stack trace).

- [x] `lib/youtube/transcript.ts` created ✓
- [x] TypeScript check passes ✓
- [x] Transcript fetches successfully for a real video ✓
- [x] Error case handled with user-friendly message ✓

---

### TASK 4 — `lib/prompts/k1-decoder.ts`

> **THIS IS THE MOST IMPORTANT FILE IN THE ENTIRE PROJECT.**
> **Spend more time on this file than all other files in this phase combined.**
> **The quality of this prompt is the quality of TEDAR.**
> **Do not move to Task 5 until this prompt passes the quality test at the end of this task.**

**What it is:** The system prompt that instructs the LLM how to perform psychological analysis on a YouTube video transcript. This prompt IS the Decoder. The code around it is just plumbing.

**Function signature:**
```typescript
export function buildDecoderPrompt(
  videoData: VideoData,
  transcript: string,
  knowledgeBrief?: string  // Optional — for Phase 6 K2 injection. Ignore if undefined.
): { systemPrompt: string; userMessage: string }
```

The `knowledgeBrief` parameter is reserved for Phase 6 (System 2 Knowledge integration). In Phase 3, it will always be `undefined`. The function must accept it but do nothing with it if it is not provided. This prevents a structural rewrite in Phase 6.

**Prompt version:** Set as a constant `DECODER_PROMPT_VERSION = 'k1-v1.0'`. This is saved to the analyses table so changes to the prompt are traceable.

**LLM settings to use:**
- Temperature: `LLM_TEMPERATURE` (0.3) — imported from `lib/config.ts`
- Max tokens: `LLM_MAX_TOKENS` (4,096) — imported from `lib/config.ts`

---

**THE SYSTEM PROMPT MUST CONTAIN THESE TEN SECTIONS IN ORDER:**

---

**Section 1 — Identity & Voice (100–200 words)**

The model is TEDAR's Decoder — a specialist psychological analysis system. It does not describe what a video does. It explains the cognitive process the video triggers in the viewer's brain, with specific reference to the exact transcript moment that activated it. Every claim must name a mechanism. Every mechanism must cite a transcript moment.

Example opening line to use verbatim:
> "You are TEDAR's Decoder — a specialist psychological analysis system trained on peer-reviewed cognitive science. You do not describe videos. You explain what specific transcript moments trigger in the viewer's brain, and why those triggers produce engagement, retention, and sharing behaviour."

Prohibit in the identity section:
- Generic observations ("the presenter is engaging")
- Advice available in any YouTube tips article
- Describing what the video is about (content summary is not analysis)

---

**Section 2 — Kahneman: System 1, System 2, Loss Aversion (200–300 words)**

Define the three Kahneman mechanisms and their scoring criteria:

**System 1 activation** (fast, automatic, emotional):
- Score high (70+) when the content triggers an emotional response BEFORE rational evaluation — when the viewer feels something before they think about it
- Look for: urgency language, threat framing, identity-relevant statements, visceral imagery in words
- Score low when the content requires deliberate effort to engage with from the first 30 seconds

**System 2 engagement** (slow, deliberate, rational):
- Score high when the content requires and rewards deliberate thinking
- Note: System 2 alone does not drive sharing. High-performing content typically activates System 1 first, then rewards System 2 engagement.

**Loss aversion framing**:
- Score high (75+) when content is framed around what the viewer stands to LOSE rather than what they stand to gain
- Psychological research finding to include verbatim: "Loss framing produces approximately twice the psychological impact of equivalent gain framing."
- Look for: "most people don't know...", "you're probably doing this wrong", "the mistake that costs you...", "before it's too late"

---

**Section 3 — Berger: STEPPS (300–400 words)**

Define all six STEPPS dimensions with scoring criteria. Each must include what a high score (70+) requires as evidence:

**Social Currency** — Does sharing this content make the viewer look good?
- High score: content contains explicit "insider knowledge" framing, makes the viewer appear well-informed or ahead of the curve
- Look for: "most people don't know this", references to information the viewer's social circle lacks

**Triggers** — Is the content associated with frequent environmental cues?
- High score: content is linked to something the viewer encounters daily (morning routines, money stress, fitness guilt, phone use)
- Triggers that fire often produce more recall and more sharing

**Emotion** — Does it activate HIGH-AROUSAL emotion?
- Critical distinction: high-arousal emotions (awe, anger, anxiety, amusement, excitement) DRIVE sharing. Low-arousal emotions (contentment, sadness, calm) do NOT.
- Score high only when a high-arousal emotion is clearly activated
- Name the specific emotion — do not write "emotion" as if it is one thing

**Public** — Is the behaviour advocated visible to others?
- High score: the content encourages an action that others can see — starting a habit, changing an opinion, sharing the video itself

**Practical Value** — Is the information immediately usable?
- High score: viewer can act on this information today. "News you can use."
- Generic advice scores low even if correct

**Stories** — Is the information delivered through narrative?
- High score: information is embedded in a story arc with a protagonist, a problem, and a resolution
- Fact lists score low regardless of how useful the facts are

---

**Section 4 — Loewenstein: Information Gap Theory (200–300 words)**

Define the mechanism: curiosity as psychological discomfort arising from a perceived gap between what the viewer knows and what they want to know. The discomfort demands resolution — the viewer stays to close the gap.

Scoring criteria (all five must be evaluated):
1. Is the gap **specific** and **resolvable**? (Not vague and infinite — "there's more to learn" is not a gap)
2. Is it introduced **within the first 30 seconds**? (Gaps introduced after 60 seconds rarely retain viewers who haven't already decided to stay)
3. Is it **maintained** without resolving prematurely? (Resolving at 1:00 in a 10:00 video wastes the retention mechanism)
4. Does the **resolution satisfy**? (A disappointing payoff damages trust and suppresses sharing of future content)
5. Are **secondary gaps planted** during the resolution of the primary gap? (The highest-performing content opens the next gap before closing the current one)

**High score (80+)** requires: specific gap opened early, maintained with secondary gaps, satisfying resolution.

---

**Section 5 — Salt: Attention Architecture (200–300 words)**

Define the three components:

**Sensory loading** — How much is competing for the viewer's attention simultaneously? High loading (fast edits, overlapping audio, text on screen, rapid topic changes) keeps System 1 engaged but fatigues viewers who need System 2 for complex ideas.

**Pattern interrupts** — Deliberate structural changes that reset the viewer's attention timer. The human attention span resets on unexpected change — a new camera angle, a sudden question, a topic pivot, a change in pace or tone. Score high when interrupts appear at regular intervals (every 60–90 seconds is typical for high-retention content).

**Attention arc** — The overall shape of engagement across the video. Does it: front-load and decay (common in low-retention content)? Build to a crescendo (highest-retention pattern)? Maintain flat high intensity (exhausting for long videos)?

Scoring: evaluate pacing variation, interrupt frequency, cognitive recovery moments between high-intensity peaks.

---

**Section 6 — Active Knowledge Domains (100–150 words)**

Instruct the model on exactly which domains to draw from in its analysis:

1. **Cognitive psychology** (Kahneman, Berger, Loewenstein, Salt — as defined above)
2. **Emotion science** (arousal and valence classification: high/low arousal × positive/negative valence. Classify each identified emotion into this grid. High-arousal positive = awe, excitement, amusement. High-arousal negative = anxiety, anger, disgust.)
3. **Social/behavioural** (Cialdini's influence principles — reciprocity, commitment/consistency, social proof, authority, liking, scarcity — apply where present in the transcript)

State explicitly that visual, audio, performance, and production domains are NOT scored in this analysis. These domains require multimodal input that is not available at MVP.

---

**Section 7 — K2 Knowledge Integration (50–100 words) — CONDITIONAL**

If `knowledgeBrief` is provided and non-empty, inject this section:
> "The following knowledge brief has been retrieved from TEDAR's calibrated knowledge base for this niche. Use it to calibrate your scores against validated benchmarks and identify whether the patterns you observe match or diverge from established niche patterns."

Then append the knowledge brief text.

If `knowledgeBrief` is undefined or empty, omit this section entirely. Do not include a placeholder or empty section.

---

**Section 8 — Scoring Rules (200–300 words)**

Define the 0–100 scale:
- **0–20:** Absent or counterproductive — the mechanism is missing or the content actively works against it
- **21–40:** Present but weak — discernible but underdeveloped, unlikely to be a meaningful driver
- **41–60:** Functional — present and working, but not exceptional. Would not distinguish this video from average content.
- **61–80:** Strong — clearly deliberate and well-executed. A meaningful contributor to performance.
- **81–100:** Exceptional — rare. Likely a primary driver of the video's outperformance. Present in fewer than 10% of videos analysed.

**Interaction effects** (must be stated explicitly in the rules):
> "When two or more high-scoring dimensions reinforce each other, the effect is multiplicative, not additive. High information gap (85+) combined with high loss aversion (80+) produces greater engagement than either would alone. Always note when interaction effects are present — they are often the most important insight in the entire analysis."

**Confidence calibration:**
- `low`: transcript is under 500 words, or language is ambiguous, or fewer than 3 dimensions have clear transcript evidence
- `medium`: clear evidence for 4–6 dimensions, some ambiguity on the rest
- `high`: clear transcript moment evidence for 7+ dimensions, high overall confidence in the primary mechanism identification

---

**Section 9 — Output Format (300–500 words)**

The exact JSON structure matching the `DecoderResult` type. Include this complete example of a CORRECT analysis output. The LLM must use this as its quality target:

```json
{
  "psychologicalFormula": {
    "primaryMechanism": "Prospective Information Gap + System 1 Loss Framing",
    "mechanismDescription": "The video opens by implying the viewer is currently making a costly mistake they don't know about. This triggers System 1 processing (threat response) before the viewer has consciously evaluated the claim. The specific, resolvable information gap — what is the mistake and how do I fix it — keeps retention high until the payoff. This is the highest-performing combination in instructional content: loss framing that opens an information gap.",
    "supportingMechanisms": ["High practical value", "STEPPS Triggers (money anxiety — frequent cue)", "STEPPS Social Currency (insider knowledge framing)"],
    "interactionEffects": "Loss aversion (score: 84) and information gap (score: 91) are interacting multiplicatively. The viewer is not just curious — they are anxious about a gap in their knowledge that is costing them. This is stronger than curiosity alone.",
    "keyMoments": [
      {
        "timestamp": "00:18",
        "transcriptQuote": "most people are losing money every month without realising it, and it's not their fault",
        "mechanism": "Loss aversion framing + prospective information gap opening",
        "dimensionsActivated": ["lossAversion", "informationGap", "system1Activation"]
      },
      {
        "timestamp": "02:45",
        "transcriptQuote": "and here's what nobody tells you about compound interest",
        "mechanism": "Secondary information gap planted mid-video before primary gap resolved",
        "dimensionsActivated": ["informationGap", "steppsSocialCurrency"]
      }
    ]
  },
  "engagementScore": {
    "overall": 81,
    "confidence": "high",
    "dimensions": {
      "system1Activation": 79,
      "informationGap": 91,
      "steppsSocialCurrency": 72,
      "steppsTriggers": 68,
      "steppsEmotion": 61,
      "steppsPublic": 34,
      "steppsPracticalValue": 83,
      "steppsStories": 41,
      "attentionArchitecture": 65,
      "lossAversion": 84
    },
    "interactionNotes": "Information gap and loss aversion are the dominant interaction. Together they create anxious curiosity — the viewer doesn't just want to know, they feel they need to know. This combination scores exceptionally in personal finance content across TEDAR's dataset."
  },
  "replicationBrief": {
    "hookStrategy": "Open with a loss framing statement that implies the viewer is already affected by a mistake they don't know about. Make the gap specific and personal: not 'most people don't know about X' but 'most people in [specific situation] are losing [specific resource] because of X.' Name the cost. Don't name the solution yet.",
    "contentStructure": "Plant the secondary gap at the 40–50% mark, before the primary gap is fully resolved. Each evidence beat should feel like progress toward the answer while opening a new sub-question. Resolve the primary gap fully in the final 20% — an unsatisfying resolution suppresses sharing.",
    "priorityTriggers": ["Loss aversion framing in the hook", "Specific resolvable information gap", "High practical value — actionable steps the viewer can take today"],
    "avoidanceNotes": "The story arc score (41) and public/social proof score (34) are both below functional. A replication does not need to improve these. The formula works without them. Focus on the three priority triggers above."
  },
  "scriptOutline": {
    "hookBeat": "Open with a direct statement of a mistake and its cost. Suggested phrasing structure: '[Most/Many] people [in your situation] are [specific negative outcome] because of [thing the viewer doesn't know yet]. In this video I'll show you exactly what it is and how to fix it.' Do not reveal the answer. Do not be vague. The more specific the cost, the stronger the loss framing.",
    "evidenceBeats": [
      "Beat 1: Establish the scale of the problem. Make the viewer feel the gap more acutely before providing relief.",
      "Beat 2: Introduce the mechanism — WHY this mistake is so common. Plant secondary gap: 'but that's only half the problem.'",
      "Beat 3: Resolve the secondary gap. Introduce the specific fix.",
      "Beat 4 (optional): Social proof or real-world example of the fix working."
    ],
    "payoffBeat": "Deliver the complete, actionable answer to the original gap. Be specific. A payoff that says 'it depends' after building this level of anticipation damages trust. Name the exact steps.",
    "closeBeat": "End with a forward-looking statement that activates STEPPS Practical Value: 'If you apply this today, you'll [specific measurable outcome] within [timeframe].' This is what drives sharing — the viewer wants to share something that made them feel capable."
  }
}
```

---

**Section 10 — Anti-Patterns (150–250 words)**

The model must never do any of the following. Each anti-pattern must be stated explicitly with an example of the bad output and why it fails:

1. **Name a mechanism without citing a transcript moment.**
Bad: "The video uses an information gap."
Why this fails: which moment opens the gap? What specific words? Without this, the analysis cannot be replicated.

2. **Assign a score without explaining it.**
Bad: "Information gap: 78."
Why this fails: what evidence justifies 78 and not 45 or 91?

3. **Give generic output that could apply to any video.**
Bad: "The presenter is engaging and covers the topic well."
Why this fails: this describes nothing specific. It provides no replication guidance.

4. **Describe content instead of analysing it.**
Bad: "The video explains five strategies for saving money."
Why this fails: content description is not psychological analysis.

5. **Classify emotion without naming the specific emotion and its arousal level.**
Bad: "The video triggers emotion."
Why this fails: all content triggers some emotion. Only high-arousal emotions drive sharing. Name the emotion. Name the arousal level.

6. **Produce the same analysis for different videos.**
Every output must be specific to this transcript. If the analysis would be true of any video in this niche, it is not an analysis — it is a template. Reject template thinking.

---

**After building the prompt, test it manually before moving to Task 5.**

Run this test:

```bash
npx ts-node -e "
import('./lib/youtube/metadata').then(meta =>
  meta.getVideoData('PASTE_A_REAL_OUTLIER_VIDEO_URL_HERE')
  .then(async videoData => {
    const { getTranscript } = await import('./lib/youtube/transcript');
    const transcript = await getTranscript(videoData.youtubeVideoId);

    const { buildDecoderPrompt } = await import('./lib/prompts/k1-decoder');
    const { systemPrompt, userMessage } = buildDecoderPrompt(videoData, transcript);

    const { generateLLMResponse } = await import('./lib/llm/provider');
    const response = await generateLLMResponse(systemPrompt, userMessage, {
      temperature: 0.3, maxTokens: 4096
    });

    console.log('--- RAW RESPONSE ---');
    console.log(response.text.slice(0, 2000));
    console.log('--- END ---');
  })
)"
```

Replace `PASTE_A_REAL_OUTLIER_VIDEO_URL_HERE` with a URL from an outlier video in your Supabase database.

**Evaluate the raw output against these four questions:**
1. Does it name specific transcript moments with timestamps? (Yes / No)
2. Does it name specific psychological mechanisms — not "good hook" but the actual mechanism name? (Yes / No)
3. Does it explain WHY each mechanism produces the engagement effect it does? (Yes / No)
4. Would the replication brief give a creator something specific to do — not generic advice? (Yes / No)

**If the answer to any of these is No: rewrite the relevant section of the system prompt and re-test. Do not move to Task 5 until all four answers are Yes.**

- [x] `lib/prompts/k1-decoder.ts` created ✓
- [x] Prompt version constant set: `DECODER_PROMPT_VERSION = 'k1-v1.0'` ✓
- [x] `knowledgeBrief` optional parameter accepted ✓
- [x] TypeScript check passes ✓
- [x] Manual prompt test run against a real outlier video ✓
- [x] All four evaluation questions answered Yes ✓

---

### TASK 5 — `lib/analysis.ts`

**What it is:** The Decoder orchestrator. A single function that runs the complete decode pipeline: takes a video URL, pulls transcript and metadata, builds the prompt, calls the LLM, parses and validates the result, saves everything to the database, and returns the structured analysis.

**Build instructions:**
- Import `getVideoData` from `lib/youtube/metadata.ts`
- Import `getTranscript` from `lib/youtube/transcript.ts`
- Import `buildDecoderPrompt`, `DECODER_PROMPT_VERSION` from `lib/prompts/k1-decoder.ts`
- Import `generateLLMResponse` from `lib/llm/provider.ts`
- Import `upsertTranscript`, `upsertAnalysis`, `getAnalysisByVideoId`, `getVideoByYoutubeId` from `lib/supabase.ts` (or `lib/supabase-decoder.ts`)
- Import `upsertVideo` from `lib/supabase.ts`
- Import `stripJsonFences` from `lib/llm/provider.ts`
- Import `LLM_TEMPERATURE`, `LLM_MAX_TOKENS` from `lib/config.ts`

**Function signature:**
```typescript
export async function decodeVideo(
  videoUrl: string,
  options?: {
    knowledgeBrief?: string;   // Reserved for Phase 6 — ignore if undefined
    forceRefresh?: boolean;    // If true, bypass cache and re-run analysis
  }
): Promise<DecoderResult>
```

**Pipeline steps in exact order:**

```
1. Extract video ID from URL
2. Look up video in DB: getVideoByYoutubeId(youtubeVideoId)
   → If not found: getVideoData(videoUrl) → upsertVideo(video) → get Supabase video ID
   → If found: use existing Supabase video ID
3. Check cache: getAnalysisByVideoId(supabaseVideoId, 'decode')
   → If analysis exists AND forceRefresh !== true: return analysis.result immediately
4. getTranscript(youtubeVideoId)
5. upsertTranscript({ videoId: supabaseVideoId, fullText, wordCount, language: 'en' })
6. buildDecoderPrompt(videoData, transcript, options?.knowledgeBrief)
7. Record start time
8. generateLLMResponse(systemPrompt, userMessage, { temperature: 0.3, maxTokens: 4096 })
9. Record processingTimeMs
10. stripJsonFences(response.text) → JSON.parse → validate shape against DecoderResult
    → If parse fails: retry once with added instruction "Return only valid JSON"
    → If second attempt fails: throw Error('Analysis could not be completed. Please try again.')
11. upsertAnalysis({
      videoId: supabaseVideoId,
      analysisType: 'decode',
      llmProvider: process.env.LLM_PROVIDER ?? 'groq',
      llmModel: 'llama-3.3-70b-versatile',
      promptVersion: DECODER_PROMPT_VERSION,
      result: decoderResult,
      overallScore: decoderResult.engagementScore.overall,
      dimensionScores: decoderResult.engagementScore.dimensions,
      processingTimeMs
    })
12. Return decoderResult
```

**Plain English explanation:** This function does all the work so the API route and the page don't have to. It handles the full sequence: find or fetch the video, check if we've already analysed it (cache), get the transcript, build the prompt, ask the LLM, parse the answer, and save everything. Any part of the system that wants to decode a video calls this single function.

**Test:** Create `scripts/test-decoder.ts`:

```typescript
// scripts/test-decoder.ts
import { decodeVideo } from '../lib/analysis';

async function main() {
  const testVideos = [
    'PASTE_OUTLIER_VIDEO_1_URL',  // An outlier from your Supabase database
    'PASTE_OUTLIER_VIDEO_2_URL',  // A different outlier — different niche or style
  ];

  for (const url of testVideos) {
    console.log(`\n--- Decoding: ${url} ---\n`);
    const start = Date.now();
    try {
      const result = await decodeVideo(url);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      console.log(`✅ Analysis complete in ${elapsed}s`);
      console.log(`Primary mechanism: ${result.psychologicalFormula.primaryMechanism}`);
      console.log(`Overall score: ${result.engagementScore.overall}/100 (${result.engagementScore.confidence} confidence)`);
      console.log(`\nTop 3 dimension scores:`);

      const scores = result.engagementScore.dimensions;
      const sorted = Object.entries(scores).sort(([,a],[,b]) => b - a).slice(0, 3);
      sorted.forEach(([dim, score]) => console.log(`  ${dim}: ${score}`));

      console.log(`\nKey moment 1: "${result.psychologicalFormula.keyMoments[0]?.transcriptQuote?.slice(0, 80)}..."`);
      console.log(`Mechanism: ${result.psychologicalFormula.keyMoments[0]?.mechanism}`);

      console.log(`\nHook strategy: ${result.replicationBrief.hookStrategy.slice(0, 150)}...`);
      console.log(`\n✅ Saved to Supabase — check analyses and transcripts tables`);
    } catch (e) {
      console.log(`❌ Failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  // Test cache: run the same video again — should return instantly
  console.log(`\n--- Testing cache (same video, should be instant) ---`);
  const start = Date.now();
  await decodeVideo(testVideos[0]);
  const elapsed = Date.now() - start;
  if (elapsed < 1000) {
    console.log(`✅ Cache working — returned in ${elapsed}ms`);
  } else {
    console.log(`⚠️ Cache may not be working — took ${elapsed}ms`);
  }
}

main().catch(console.error);
```

Run with: `npx ts-node scripts/test-decoder.ts`

**After running:** Check Supabase dashboard:
- `transcripts` table: new rows for each decoded video
- `analyses` table: new rows with `analysis_type = 'decode'`, `overall_score` populated
- `videos` table: `has_transcript = true` and `has_analysis = true` for decoded videos

- [x] `lib/analysis.ts` created ✓
- [x] `scripts/test-decoder.ts` created ✓
- [x] Both test videos decode without errors ✓
- [x] Cache test returns in under 1 second (387ms) ✓
- [x] New rows verified in Supabase `transcripts` and `analyses` tables ✓
- [x] `has_transcript` and `has_analysis` updated on video records ✓

---

### TASK 6 — `app/api/decode/route.ts`

**What it is:** The API endpoint that the browser calls when the Decode button is clicked. Receives a video URL, calls `decodeVideo` from `lib/analysis.ts`, and returns the result.

**Build instructions:**
- POST handler only
- Read `videoUrl: string` from request body
- Read optional `forceRefresh: boolean` from request body
- Validate that `videoUrl` is present — return 400 with `{ error: 'Video URL is required', code: 'INVALID_URL' }` if missing
- Call `decodeVideo(videoUrl, { forceRefresh: forceRefresh ?? false })`
- Return standard response format:
  - Success: `{ data: DecoderResult, meta: { processingTimeMs: number, cached: boolean } }`
  - Error: `{ error: string, code: string }` with status 500
- The `cached` field in meta should be `true` if the result came from the database, `false` if it was a fresh LLM call. Pass this information through from `lib/analysis.ts` (add a second return value or wrapper object if needed to signal whether the result was cached).

**Request body:**
```typescript
{ videoUrl: string; forceRefresh?: boolean }
```

**Plain English explanation:** This file is the door between the browser and the Decoder. The browser sends a video URL through this door, and the Decoder's analysis comes back out. Nothing else. All the complex logic is in `lib/analysis.ts` — this route just forwards the request and returns the result.

**Test:** With `npm run dev` running:

```bash
# Test 1: decode a real video
curl -X POST http://localhost:3000/api/decode \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "PASTE_A_REAL_OUTLIER_VIDEO_URL"}' \
  --max-time 120

# Test 2: run the same URL again — should return cached result quickly
curl -X POST http://localhost:3000/api/decode \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "SAME_URL_AS_TEST_1"}' \
  --max-time 10

# Test 3: missing URL
curl -X POST http://localhost:3000/api/decode \
  -H "Content-Type: application/json" \
  -d '{}' \
  --max-time 10
```

Expected: Test 1 returns full DecoderResult with `cached: false`. Test 2 returns same result with `cached: true` in under 2 seconds. Test 3 returns 400 with `INVALID_URL` error code.

- [x] `app/api/decode/route.ts` created ✓
- [x] Test 1: fresh analysis returns correctly ✓
- [x] Test 2: cached analysis returns in under 2 seconds ✓
- [x] Test 3: missing URL returns 400 ✓

---

### TASK 7 — Update `components/OutlierCard.tsx`

**What it is:** Activate the "Decode this video" button that was built in Phase 2 but disabled. The button now navigates to the decode page for that video.

**What to change:**
- The Decode button changes from `disabled` to active
- On click: navigate to `/decode/[videoId]` where `videoId` is `result.video.youtubeVideoId`
- Use Next.js `useRouter` for navigation (or an `<a>` tag — either is fine)
- Remove the "available in Phase 3" subtitle text — it is no longer needed
- Change button variant from greyed-out to a styled active state. Suggested: `variant="default"` with a distinctive colour that stands out from the card. Use Tailwind utility classes only.
- The button text: "Decode this video"

**What NOT to change:**
- The card layout, thumbnail display, badge colours, scoring display — none of these change
- The component's props interface — it remains the same
- The component file must remain under 150 lines

**Plain English explanation:** The Decode button was always there — it just did nothing until the Decoder was built. This task flips the switch. The button now takes the founder directly to a page showing the full psychological analysis of that video.

**Test:** Run `npm run dev`. Open localhost:3000. Run a niche or channel scan. When the outlier cards appear, the Decode button should be active and clickable. Click one — it should navigate to `/decode/[videoId]`. (The decode page does not exist yet — a 404 is fine at this point. Confirm the URL is correct.)

- [x] `components/OutlierCard.tsx` updated — Decode button active ✓
- [x] TypeScript check passes ✓
- [x] Clicking button navigates to correct `/decode/[videoId]` URL ✓

---

### TASK 8 — `components/AnalysisCard.tsx`

**What it is:** The component that displays the full Decoder output. Four tabs: Formula, Scores, Brief, Script. This is what makes the Decoder's output readable and useful rather than a wall of JSON.

**Build instructions:**
- `'use client'` directive at top
- Props: `result: DecoderResult` and `videoData: VideoData`
- Use shadcn/ui `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Card`, `CardContent`, `Badge`
- Four tabs with these exact names and contents:

**Tab 1 — "Formula"**

Display:
- Large heading: `result.psychologicalFormula.primaryMechanism`
- Paragraph: `result.psychologicalFormula.mechanismDescription`
- Sub-section "Supporting Mechanisms": list of `result.psychologicalFormula.supportingMechanisms`
- Sub-section "Interaction Effects": `result.psychologicalFormula.interactionEffects`
- Sub-section "Key Moments": for each `KeyMoment` in `keyMoments`, display:
  - Timestamp badge (e.g. `00:23`)
  - Transcript quote in italic
  - Mechanism name in bold
  - Dimensions activated as small badges

**Tab 2 — "Scores"**

Display:
- Overall score as a large number with a coloured background (green > 70, amber 40–70, red < 40)
- Confidence badge (`low`, `medium`, or `high`)
- Interaction notes paragraph
- A score bar for each of the 10 dimensions:
  - Label (human-readable — convert camelCase to readable: `system1Activation` → "System 1 Activation", `informationGap` → "Information Gap", `steppsSocialCurrency` → "Social Currency", etc.)
  - A progress bar (use a `div` with percentage width in Tailwind — `w-[${score}%]` is NOT valid Tailwind dynamic class — use inline style for the width: `style={{ width: \`${score}%\` }}`)
  - The number on the right
  - Colour the bar: green for > 70, amber for 40–70, red for < 40

**Tab 3 — "Brief"**

Display:
- Section "Hook Strategy": `result.replicationBrief.hookStrategy`
- Section "Content Structure": `result.replicationBrief.contentStructure`
- Section "Priority Triggers" as a numbered list: `result.replicationBrief.priorityTriggers`
- Section "What to Avoid": `result.replicationBrief.avoidanceNotes`

**Tab 4 — "Script"**

Display:
- Section "Hook (0–30s)": `result.scriptOutline.hookBeat`
- Section "Evidence Beats" as a numbered list: `result.scriptOutline.evidenceBeats`
- Section "Payoff": `result.scriptOutline.payoffBeat`
- Section "Close": `result.scriptOutline.closeBeat`

**Important — keep under 150 lines:** If the component grows beyond 150 lines, extract tab content into separate small components: `FormulaTab.tsx`, `ScoresTab.tsx`, `BriefTab.tsx`, `ScriptTab.tsx`. Each should be a simple display component with typed props.

**Plain English explanation:** This component is the reading experience for the Decoder's output. Without it, the output is just a JSON blob. With it, the founder can read through the psychological formula, check each dimension score, and extract the exact brief and script structure they need to replicate the video.

**Test:** Run `npx tsc --noEmit`. Zero errors. Visual test in Task 9.

- [x] `components/AnalysisCard.tsx` created ✓
- [x] All four tabs render correctly ✓
- [x] TypeScript check passes ✓

---

### TASK 9 — `app/decode/[videoId]/page.tsx`

**What it is:** The decode results page. Loads the video's metadata and its analysis from the database. If the analysis does not exist yet, triggers the decode pipeline. Displays the result using `AnalysisCard`.

**Build instructions:**
- Server component (no `'use client'` directive — fetches data server-side before rendering)
- Receives `videoId` (YouTube video ID) from URL params — remember to `await params` before accessing
- Flow:
  1. Look up the video in the database using `getVideoByYoutubeId(videoId)`
  2. If not found: redirect to homepage with an error message
  3. Check if analysis exists using `getAnalysisByVideoId(supabaseVideoId, 'decode')`
  4. If analysis exists: render the page with cached data immediately
  5. If analysis does not exist: render a loading state that triggers a client-side decode call (see below)
- At the top of the page: display the video thumbnail, title, channel name, view count, and outlier score (if available)
- Below: render `<AnalysisCard result={analysis.result} videoData={video} />`

**Handling the "not yet decoded" case:**

If the analysis does not exist when the page loads, render a client component `DecodeLoader` that:
- Shows a loading spinner with the message "Analysing this video... This takes 20–40 seconds"
- On mount (`useEffect`), calls `fetch('/api/decode', { method: 'POST', body: JSON.stringify({ videoUrl: video.url }) })`
- When the fetch completes, displays `<AnalysisCard result={data.data} videoData={video} />`
- If the fetch fails, shows an error message with a "Try again" button

**Page layout:**
```
[Video thumbnail — 16:9 if available, or a simple thumbnail image]
[Title — large text]
[Channel name] · [View count] · [Outlier score badge if score exists]
[horizontal rule]
[AnalysisCard with four tabs]
```

**Plain English explanation:** This is the page the founder lands on after clicking "Decode this video." If the video has already been decoded, the analysis appears instantly. If it hasn't been decoded yet, the page shows a loading message while the analysis runs, then displays the result when it's ready. Either way, the founder ends up reading the same analysis page.

**Test:** Run `npm run dev`. Navigate to `/decode/[videoId]` using a real YouTube video ID from your Supabase database.

Test 1 — Video with existing analysis (from Task 5): Should load instantly, no loading spinner, AnalysisCard shows all four tabs.

Test 2 — Video with no existing analysis: Should show loading spinner, trigger the decode API, and display the analysis after 20–40 seconds.

Test 3 — Full flow from dashboard: Open localhost:3000 → run a niche scan → click Decode on an outlier card → confirm the decode page loads and displays the analysis.

- [x] `app/decode/[videoId]/page.tsx` created ✓
- [ ] Test 1: cached analysis loads instantly ✓
- [ ] Test 2: live decode triggers and displays correctly ✓
- [ ] Test 3: full flow from dashboard to decode page works ✓
- [x] TypeScript check passes ✓

---

### TASK 10 — Quality Gate: Test 5 Analyses

**This task is not a code task. It is a quality gate.**

Run the decoder against 5 different videos from your Supabase database — ideally from at least 2 different niches. For each, evaluate the output against these four questions:

| # | Video (paste URL) | Specific mechanisms named? | Transcript moments cited? | Replication brief actionable? | Would surprise a creator? |
|---|---|---|---|---|---|
| 1 | | Yes / No | Yes / No | Yes / No | Yes / No |
| 2 | | Yes / No | Yes / No | Yes / No | Yes / No |
| 3 | | Yes / No | Yes / No | Yes / No | Yes / No |
| 4 | | Yes / No | Yes / No | Yes / No | Yes / No |
| 5 | | Yes / No | Yes / No | Yes / No | Yes / No |

**Pass criteria:** At least 3 of the 5 analyses must answer Yes to all four questions.

**If the gate fails:** Return to `lib/prompts/k1-decoder.ts`. Read each analysis and identify specifically which section of the prompt produced the weak output. Fix only that section. Re-test the failing videos. Do not proceed to Task 11 until the pass criteria is met.

- [ ] 5 analyses run ✓
- [ ] At least 3/5 pass all four quality questions ✓
- [ ] If prompt was revised: new version committed with updated `DECODER_PROMPT_VERSION` constant ✓

---

### TASK 11 — Commit and push to GitHub

```bash
git add .
git commit -m "Phase 3: Decoder Engine — K1 psychological analysis, transcript pipeline, decode page"
git push
```

Verify on github.com/Shayan733/tedar that all new files appear. Confirm `.env.local` is NOT in the commit:

```bash
git show --stat HEAD
```

The output must not include `.env.local` anywhere.

- [ ] Changes committed ✓
- [ ] Pushed to GitHub ✓
- [ ] `.env.local` NOT in commit ✓

---

## PHASE 3 GATE CHECK

All of the following must be true before Phase 4 begins. The agent confirms each one.

- [ ] `npx tsc --noEmit` passes with zero TypeScript errors
- [ ] All new types defined in `lib/types.ts`: DecoderResult, EngagementScore, DimensionScores, PsychologicalFormula, ReplicationBrief, ScriptOutline, KeyMoment, TranscriptData, AnalysisRecord
- [ ] `lib/supabase.ts` (or `lib/supabase-decoder.ts`): upsertTranscript, upsertAnalysis, getAnalysisByVideoId, getVideoByYoutubeId all working
- [ ] `lib/youtube/transcript.ts`: fetches real transcripts, handles errors with user-friendly messages
- [ ] `lib/prompts/k1-decoder.ts`: prompt version constant set, knowledgeBrief parameter accepted, all 10 sections present
- [ ] `lib/analysis.ts`: full decode pipeline including cache check, database save, and error handling
- [ ] `/api/decode` route: returns cached results instantly, runs fresh analysis when cache is empty
- [ ] `components/OutlierCard.tsx`: Decode button is active and navigates to correct URL
- [ ] `components/AnalysisCard.tsx`: all four tabs render with correct data
- [ ] `app/decode/[videoId]/page.tsx`: loads cached analysis instantly, triggers live decode when needed
- [ ] Supabase `transcripts` table: populated with real transcript data
- [ ] Supabase `analyses` table: populated with decode results, `overall_score` column has values
- [ ] Supabase `videos` table: `has_transcript` and `has_analysis` columns updated to true for decoded videos
- [ ] Quality gate passed: at least 3/5 analyses are specific, mechanism-naming, transcript-citing, actionable
- [ ] Full browser flow tested: dashboard → outlier card → Decode button → decode page displays analysis
- [ ] All code committed and pushed to GitHub

**When all boxes above are ticked:** Tell the founder "Phase 3 is complete. The Decoder Engine is working. The K1 psychological analysis is producing output specific enough to act on. Replace this CLAUDE.md with the Phase 4 CLAUDE.md to begin building the Builder Engine — the production direction brief."

---

## IF SOMETHING BREAKS

1. Read the exact error. Quote it in full.
2. Tell the founder what the error means in plain English.
3. Fix only the broken thing. Do not touch working code.
4. Re-run the specific test for that task.
5. Confirm it passes before moving on.

**Common Phase 3 issues:**

- **Transcript not available for a video:** About 5% of YouTube videos have no auto-captions. This is expected. The error should be caught in `lib/youtube/transcript.ts` and returned as a user-friendly message ("This video doesn't have captions available. Try a different video."). Do not let this crash the pipeline.

- **LLM returns invalid JSON:** The K1 prompt must instruct the model: "Return ONLY valid JSON matching this exact structure. No markdown. No backticks. No explanation before or after the JSON." Use `stripJsonFences` from `lib/llm/provider.ts` before `JSON.parse`. If the response still fails to parse, retry once. If the second attempt fails, throw a user-facing error.

- **Analysis output is generic despite the prompt:** This is a prompt quality problem, not a code problem. Read the anti-patterns section of the K1 prompt. The most common failure mode is Section 1 not being strong enough — the model needs to understand it is a specialist, not a general content advisor. Add more explicit negative examples in Section 10.

- **Score bar progress width not working in Tailwind:** Tailwind cannot interpolate dynamic class names like `w-[${score}%]` at runtime. Use inline styles instead: `style={{ width: \`${score}%\` }}` on a coloured div.

- **`await params` TypeScript error:** Ensure the page component is `async` and that `params` is typed as `Promise<{ videoId: string }>`. The correct pattern in Next.js 16:
  ```typescript
  export default async function DecodePage({
    params,
  }: {
    params: Promise<{ videoId: string }>;
  }) {
    const { videoId } = await params;
    // ...
  }
  ```

- **Cache not working (every decode triggers a new LLM call):** Check `getAnalysisByVideoId` — it should be querying by the Supabase UUID (`videoId`), not the YouTube video ID. Also verify `has_analysis` is being set to `true` on the video record after the first decode.

- **Decode page shows 404 for a video that exists:** Check that `OutlierCard.tsx` is navigating to `/decode/[youtubeVideoId]` and that `app/decode/[videoId]/page.tsx` is receiving and awaiting that parameter correctly.

- **Groq rate limit hit (30 req/min):** For batch testing multiple videos in quick succession, add a 2-second delay between decode calls in the test script. Normal single-video use will never hit this limit.

---

*TEDAR Project Bible v5.0 — Phase 3 of 7*
*Built one step at a time. Test before moving. Never skip gates.*
*The K1 prompt is the product. Everything else is plumbing.*