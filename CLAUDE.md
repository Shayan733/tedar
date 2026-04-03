# TEDAR — CLAUDE.md
# Phase 4: Builder Engine — Production Direction Brief

---

## WHAT YOU ARE

You are a careful, precise coding agent building TEDAR — a content intelligence system for YouTube creators. You are working with a non-technical founder who needs plain-language explanations for every single thing you do. You build one thing at a time. You test before moving. You never skip steps. You never build ahead of the current phase.

When a task is complete and tested, update this file by changing `- [ ]` to `- [x]` for that item.

---

## WHAT WAS BUILT IN PHASES 0–3 — AGENT CONTEXT

Read this before doing anything. This is what already exists. Do not re-create, re-install, or re-initialise anything listed here.

**Project details:**
- Name: TEDAR
- Founder: Shayan (non-technical — explain everything in plain English, no jargon)
- GitHub: github.com/Shayan733/tedar (private repo, connected and pushing)
- Local path: ~/Desktop/TEDAR/tedar

**Already built and confirmed working:**
- ✅ Next.js 14 project with TypeScript and Tailwind — runs at localhost:3000
- ✅ All dependencies installed
- ✅ 11 Supabase tables live and populated with real data
- ✅ Git connected to GitHub, Phases 0–3 committed and pushed
- ✅ Full Scout Engine — niche, channel, and video input modes working
- ✅ Full Decoder Engine — transcript fetch, K1 analysis, cache, decode page working
- ✅ 3–5+ real decode analyses in the `analyses` table (analysis_type = 'decode')

**Phase 3 files confirmed working — do not rewrite any of these:**
- ✅ `lib/types.ts` — all interfaces including DecoderResult, EngagementScore, DimensionScores, PsychologicalFormula, ReplicationBrief, ScriptOutline, KeyMoment, TranscriptData, AnalysisRecord
- ✅ `lib/supabase.ts` — all database functions including upsertTranscript, upsertAnalysis, getAnalysisByVideoId, getVideoByYoutubeId
- ✅ `lib/youtube/transcript.ts` — transcript fetcher with error handling
- ✅ `lib/prompts/k1-decoder.ts` — K1 prompt version k1-v1.1, knowledgeBrief parameter accepted
- ✅ `lib/analysis.ts` — full decode pipeline with cache, retry, database save
- ✅ `app/api/decode/route.ts` — decode API with cached flag in meta
- ✅ `components/AnalysisCard.tsx` — four tabs: Formula, Scores, Brief, Script
- ✅ `components/FormulaTab.tsx`, `ScoresTab.tsx`, `BriefTab.tsx`, `ScriptTab.tsx`
- ✅ `app/decode/[videoId]/page.tsx` — server component with await params
- ✅ `app/decode/[videoId]/DecodeLoader.tsx` — client component, handles live decode

**LLM configuration — CURRENT ACTIVE STATE:**
- **Decoder calls:** Groq `llama-3.3-70b-versatile` via `LLM_PROVIDER=groq`
- **Builder calls:** Gemini 2.5 Flash via `BUILDER_LLM_PROVIDER=gemini`
- These are two separate env vars — the Builder uses its own provider config
- Never call any LLM API directly — always through `lib/llm/provider.ts`
- Groq limit: 12,000 TPM. Builder calls are smaller (~3,000 tokens) — no constraint issue.
- Gemini limit: 20 req/day. Builder is one call per brief. Manage usage accordingly.

**Quality gate context from Phase 3:**
- Formula and Scores tabs: working well, specific, non-generic ✅
- Brief and Script tabs: directionally correct but shallow — llama-3.3-70b limitation ⚠️
- Builder runs on Gemini 2.5 Flash — expected to produce deeper, more prescriptive output
- The Builder is a fresh LLM call with a different prompt — it can compensate for Decoder shallowness

**Config values — do not change these:**
- `MAX_TRANSCRIPT_WORDS: 2500` — do not increase (Groq TPM limit)
- `maxChannelsToScan: 5` — do not change
- `maxVideosPerChannel: 100` — do not change
- `LLM_TEMPERATURE: 0.3` — applies to both Decoder and Builder
- `LLM_MAX_TOKENS: 2048` — applies to Decoder. Builder uses 3000 (set in builder.ts directly)

---

## BUGS FIXED IN PHASES 1–3 — DO NOT REINTRODUCE

1. **next/image crash** — Use `<img>` tag for YouTube thumbnails. Domain whitelisted in next.config.ts.
2. **Video pipeline UUID error** — Never pass YouTube channel ID string into channel_id DB column. Always use Supabase UUID.
3. **"Unknown Channel" bug** — Always call fetchChannelName() helper. Never assume channelName is populated from getChannelVideos alone.
4. **TypeScript error on Next.js params** — Always `await params` before accessing route parameters in server components.
5. **Browser timeout** — maxChannelsToScan is 5, maxVideosPerChannel is 100. Never revert.
6. **Supabase upsert without unique constraint** — Use select-then-update/insert pattern, not .upsert(onConflict). transcripts and analyses tables have no unique constraint on video_id.

---

## WHAT THIS PHASE BUILDS

Phase 4 builds the Builder Engine. It takes a completed DecoderResult — already saved in the database from Phase 3 — and produces a personalised production direction brief: a specific hook with suggested phrasing, a beat-by-beat content structure, and a script outline. Every instruction is backed by a reason and a knowledge domain.

**The key difference between the Decoder and the Builder:**
- The Decoder is analytical: "here is WHY this video worked, scored against psychology frameworks"
- The Builder is prescriptive: "here is WHAT TO DO to replicate it, with specific language and structure"
- They are always separate LLM calls with separate prompts. Never combine them. Mixing produces muddled output.

**At the end of this phase, the founder can:**
1. View a decoded video's analysis on the decode page
2. Click "Build Production Brief" and enter their channel name and niche
3. See a personalised brief with a specific hook strategy, beat-by-beat structure, and script outline
4. Read every instruction with the domain and reason behind it
5. Copy any section to clipboard for use in production

**Files built in this phase (in order):**
1. New types added to `lib/types.ts` — BuilderResult, BuilderInstruction, CreatorContext, ProductionBrief, BriefRecord
2. New database functions added to `lib/supabase.ts` — upsertBrief, getBriefByAnalysisId
3. `lib/prompts/k1-builder.ts` — The Builder system prompt
4. `lib/builder.ts` — Builder orchestrator
5. `app/api/build/route.ts` — Build API endpoint
6. `components/BuilderCard.tsx` — Production brief display component
7. Update `app/decode/[videoId]/page.tsx` — Add "Build Production Brief" button and brief display
8. `scripts/test-builder.ts` — Integration test
9. Commit and push to GitHub

**LLM calls in this phase:**
- One Builder call per brief generation (~1,500 token system prompt + DecoderResult JSON)
- All Builder calls go through `lib/llm/provider.ts` with `BUILDER_LLM_PROVIDER=gemini`

**Estimated time:** 2–3 days.

---

## WHAT COMES AFTER THIS PHASE

Phase 5 builds the full automated pipeline orchestrator — connecting Scout, Decoder, and Builder into one automated sequence with no manual steps between them. It also adds scheduled weekly scans and streaming progress updates.

**Do not build any of the following in Phase 4:**
- Pipeline automation or scheduling
- Auth or user accounts
- Payments
- System 2 / Knowledge System (Phase 6)
- Transcript timeline feature (noted for Phase 5+)
- Deployment to Vercel (run locally only)

---

## GOLDEN RULES — READ BEFORE EVERY ACTION

1. **ONE FILE AT A TIME.** Complete one file, explain it, test it, confirm it works, then move to the next.
2. **EXPLAIN EVERYTHING IN PLAIN LANGUAGE.** After every file, write 2–3 sentences explaining what was just built and why. No jargon.
3. **TEST BEFORE MOVING.** Every file has a specific test. Do not proceed until the test passes.
4. **NEVER SKIP GATES.** The Gate Check at the bottom must fully pass before Phase 5 begins.
5. **NEVER BUILD AHEAD.** No pipeline automation, no auth, no payments in this phase.
6. **NEVER USE 'any' IN TYPESCRIPT.** All types must be explicitly defined. Import from `lib/types.ts`.
7. **MAX 150 LINES PER FILE.** If a file would exceed 150 lines, split it logically and flag it.
8. **NEVER CALL LLM APIs DIRECTLY.** Always go through `lib/llm/provider.ts`.
9. **ALWAYS SAVE DATA TO DATABASE.** Builder results go to the `analyses` table with `analysis_type = 'build'`. Save before returning.
10. **NEVER HARD-CODE THRESHOLDS.** All configurable numbers come from `lib/config.ts`.
11. **NEVER COMMIT .env.local.** Verify it is in .gitignore before every commit.
12. **DECODER AND BUILDER ARE ALWAYS SEPARATE LLM CALLS.** Never combine them into one prompt. Never pass the transcript to the Builder. The Builder's only input is the DecoderResult JSON + CreatorContext.
13. **BUILDER USES GEMINI.** The Builder LLM provider is Gemini 2.5 Flash via BUILDER_LLM_PROVIDER env var. The Decoder uses Groq. These are separate configurations.
14. **DO NOT REWRITE PHASE 1–3 FILES.** Import from them. Do not modify them unless fixing a bug.
15. **FLEXIBLE ARCHITECTURE.** The Builder must accept optional `visualDirection` and `audioDirection` parameters even though they are empty at MVP. This prevents structural rewrites when dormant domains are activated.

---

## APPROVED TECH STACK

| What | Technology | Notes |
|---|---|---|
| Framework | Next.js 14, App Router, TypeScript | Already installed |
| Styling | Tailwind CSS + shadcn/ui | Already installed |
| Database | Supabase (PostgreSQL) | 11 tables live |
| Decoder LLM | Groq llama-3.3-70b-versatile | Via LLM_PROVIDER=groq |
| Builder LLM | Gemini 2.5 Flash | Via BUILDER_LLM_PROVIDER=gemini |
| LLM Wrapper | lib/llm/provider.ts | NEVER call APIs directly |
| State management | React useState only | No Redux, Zustand, or external state |
| Package manager | npm | Do not use yarn, pnpm, or bun |

---

## CRITICAL: HOW THE BUILDER WORKS — READ BEFORE BUILDING

**In plain English:**

The Builder is the translation layer between "why this video worked" and "how to make one like it."

The Decoder tells you: *"This video worked because it opened a specific information gap at 0:23, combined with loss aversion framing, producing anxious curiosity."*

The Builder takes that and tells you: *"Open your video with this structure: '[Most people in your situation] are [specific negative outcome] because they don't know [thing you're about to explain]. In the next 12 minutes I'll show you exactly how to fix it.' This activates loss aversion before the viewer has consciously evaluated whether to stay — System 1 processing fires before System 2 can reject the premise."*

The key requirement of every Builder output: **every instruction must include why it works.** The domain (cognitive_psychology, emotion_science, social_behavioural) and the reason (the specific mechanism) must be attached to every single instruction. A brief without reasoning is generic advice. A brief with reasoning is psychological architecture.

**The Builder's three outputs:**

1. **Production Brief** — four sections:
   - Hook strategy with specific suggested phrasing (not "use a hook" — actual words)
   - Beat-by-beat content structure with timing guidance
   - Priority triggers — the 2–3 mechanisms to prioritise
   - Avoidance notes — what NOT to do based on what was absent or weak

2. **Script Outline** — four beats:
   - Hook beat (0–30s): exact approach and suggested opening words
   - Evidence beats (2–4 beats): how to sequence for curiosity maintenance
   - Payoff beat: how to resolve the gap satisfyingly
   - Close beat: optimised for sharing behaviour

3. **Domain-backed instructions** — every instruction wrapped with:
   - `instruction`: what to do
   - `reason`: why it works (the cognitive mechanism)
   - `domain`: which knowledge domain this comes from
   - `confidence`: how strongly the Decoder analysis supports this

---

## PHASE 4 TASK LIST

Work through these in exact order. One file at a time. Tick each box when complete and tested.

---

### TASK 1 — Add new types to `lib/types.ts`

**What it is:** The new TypeScript interfaces the Builder needs. Add to the existing file — do not replace what is already there. Export every interface.

**Add these interfaces:**

```typescript
// The creator's channel context — adapts the brief to their specific situation
interface CreatorContext {
  channelName: string;
  niche: string;
  typicalContentStyle?: string;  // Optional — "educational", "entertainment", "storytelling"
  targetAudience?: string;       // Optional — "beginners", "intermediate professionals"
}

// A single instruction in the production brief — always includes reasoning
interface BuilderInstruction {
  instruction: string;           // What to do — specific, not generic
  reason: string;                // Why it works — the cognitive mechanism
  domain: 'cognitive_psychology' | 'emotion_science' | 'social_behavioural' |
          'visual_psychology' | 'audio_music' | 'performance_direction' | 'production_craft';
  confidence: 'low' | 'medium' | 'high';
}

// The production brief — what the creator does before filming
interface ProductionBrief {
  hookStrategy: BuilderInstruction;         // How to open — specific phrasing included
  contentStructure: BuilderInstruction;     // Pacing, structure, pattern interrupt placement
  priorityTriggers: BuilderInstruction[];   // Top 2-3 mechanisms to prioritise
  avoidanceNotes: string;                   // What NOT to do — based on weak/absent dimensions
}

// The script outline — beat by beat
interface ScriptOutline {
  hookBeat: BuilderInstruction;             // Opening 30 seconds — exact approach + suggested words
  evidenceBeats: BuilderInstruction[];      // 2-4 middle beats — sequenced for curiosity
  payoffBeat: BuilderInstruction;           // Resolution — how to satisfy the gap
  closeBeat: BuilderInstruction;            // Final 30 seconds — sharing behaviour
}

// The full Builder output
interface BuilderResult {
  creatorContext: CreatorContext;
  productionBrief: ProductionBrief;
  scriptOutline: ScriptOutline;
  sourceAnalysisId: string;       // The analysis ID this brief was built from
  promptVersion: string;
}

// For saving to the analyses table (analysis_type = 'build')
interface BriefRecord {
  id?: string;
  videoId: string;               // Supabase UUID — not YouTube ID
  analysisType: 'build';
  llmProvider: string;
  llmModel: string;
  promptVersion: string;
  result: BuilderResult;
  overallScore?: number;         // Not scored for briefs — leave undefined
  dimensionScores?: undefined;   // Not applicable for briefs
  processingTimeMs?: number;
  createdAt?: string;
}
```

**Test:** Run `npx tsc --noEmit`. Zero errors. If any existing interface conflicts with a new one, fix the conflict — do not delete existing interfaces.

- [x] New types added to `lib/types.ts` ✓
- [x] `npx tsc --noEmit` passes with zero errors ✓

---

### TASK 2 — Add Phase 4 database functions to `lib/supabase.ts`

**What it is:** Two new database functions for saving and retrieving Builder results. Add at the end of the existing file. Do not modify existing functions.

**Check file length first.** If `lib/supabase.ts` is already near 150 lines after Phase 3 additions, create `lib/supabase-builder.ts` for these functions and flag it.

**Functions to add:**

```typescript
// Save a Builder result to the analyses table (analysis_type = 'build')
// Uses select-then-insert pattern — no upsert (same pattern as Phase 3)
// After saving, update videos.has_analysis = true (already true from decode, but confirm)
export async function upsertBrief(brief: BriefRecord): Promise<string>
// Returns the record ID

// Retrieve a saved brief by the analysis ID that generated it
// analysisId = the ID of the 'decode' analysis record the brief was built from
export async function getBriefByAnalysisId(
  analysisId: string
): Promise<BriefRecord | null>
// Returns the brief record if it exists, null if not
```

**Important — the analyses table stores both decode and build records:**

The same `analyses` table holds both types. When you call `getBriefByAnalysisId`, query like this:

```typescript
const { data } = await supabase
  .from('analyses')
  .select('*')
  .eq('analysis_type', 'build')
  .eq('result->sourceAnalysisId', analysisId)  // sourceAnalysisId is inside the JSONB result column
  .single();
```

**Plain English explanation:** The Builder saves its output to the same database table as the Decoder — the analyses table. It is tagged differently (`analysis_type = 'build'` vs `'decode'`). This keeps all analysis data in one place. When a creator comes back to view their brief, we look it up by the decode analysis ID that produced it.

**Test:** Run `npx tsc --noEmit`. Zero errors.

- [x] Phase 4 database functions added ✓
- [x] TypeScript check passes ✓

---

### TASK 3 — `lib/prompts/k1-builder.ts`

**What it is:** The Builder system prompt. This is the second most important file in the project after the K1 Decoder prompt. The Builder prompt must produce output that is prescriptive and specific — not analytical. It speaks in imperatives, not observations.

**This file will exceed 150 lines — flagging now.** The Builder prompt requires sufficient detail to prevent generic output. Keep it in one file. Do not split.

**Function signature:**

```typescript
export const BUILDER_PROMPT_VERSION = 'k1-builder-v1.0';

export function buildBuilderPrompt(
  decoderResult: DecoderResult,
  creatorContext: CreatorContext,
  options?: {
    visualDirection?: string;   // Reserved for future — ignore if undefined
    audioDirection?: string;    // Reserved for future — ignore if undefined
  }
): { systemPrompt: string; userMessage: string }
```

The `options` parameter with `visualDirection` and `audioDirection` must be accepted but ignored at MVP. This is the Flexible Architecture rule — it prevents a structural rewrite when dormant domains are activated.

---

**THE SYSTEM PROMPT MUST CONTAIN THESE SEVEN SECTIONS IN ORDER:**

---

**Section 1 — Identity & Voice (100–150 words)**

The Builder is a specialist creative director, not an analyst. It does not explain what the Decoder found — it translates findings into specific creative decisions. Its voice is direct, imperative, and specific. It never gives generic advice. Every instruction it produces must be specific enough that a creator could not apply it to a video in a different niche without modification.

Opening instruction to include verbatim:

> "You are TEDAR's Builder — a specialist creative director that translates psychological analysis into specific production decisions. You do not explain why a video worked — the Decoder already did that. You tell the creator exactly what to do, in what sequence, with what specific language, to replicate the formula. Every instruction you produce must be specific to this creator's niche and this video's formula. If an instruction could apply to any video, it is wrong. Rewrite it until it cannot."

---

**Section 2 — The Translation Rule (100–150 words)**

The Builder takes each high-scoring psychological dimension and translates it into a concrete creative decision. This is the core job.

The translation rule — include this explicitly:

```
High information gap score → Specific hook structure with suggested phrasing
High loss aversion score → Specific framing language using loss not gain
High STEPPS social currency → Specific insider-knowledge positioning language
High STEPPS practical value → Specific actionable format with timing
High emotion score → Specific emotional trigger with arousal classification
Low story score → Note in avoidanceNotes: do not add narrative if the formula works without it
```

The Builder only translates what the Decoder found. It does not invent mechanisms that were not present in the analysis. If a dimension scored below 40, it does not appear in the productionBrief or scriptOutline as a priority trigger — it appears only in avoidanceNotes if relevant.

---

**Section 3 — Instruction Quality Rules (200–250 words)**

Every instruction produced must meet these standards. State each explicitly:

**Specificity rule:** Every `instruction` field must name the creator's niche and the specific mechanism. Bad: "Use a hook that creates curiosity." Good: "Open your [niche] video with a direct statement that your viewer is currently experiencing [specific problem relevant to niche] — name the cost before naming the solution."

**Reasoning rule:** Every `reason` field must explain the cognitive mechanism — not just name it. Bad: "This activates loss aversion." Good: "This activates loss aversion framing — the viewer's brain weights the implied loss of staying uninformed as approximately twice the value of the potential gain from watching. They stay because not staying feels costly."

**Phrasing rule:** Every `hookBeat` and at least two `evidenceBeats` must include suggested phrasing — words the creator can actually use or adapt. Not a description of what to say. Actual suggested words.

**Domain accuracy rule:** Use only these domain values exactly as written — `cognitive_psychology`, `emotion_science`, `social_behavioural`. Do not invent domain names. Do not use `visual_psychology`, `audio_music`, `performance_direction`, or `production_craft` — these are dormant at MVP.

**Confidence calibration:**
- `high`: the Decoder analysis directly supports this instruction with a score of 70+
- `medium`: the Decoder analysis supports this with a score of 50–70
- `low`: this is a reasonable extension from the detected pattern but not directly evidenced

---

**Section 4 — Adapting to Creator Context (100–150 words)**

Every instruction must be adapted to the `creatorContext` provided. The niche and channel name are not decoration — they must appear in the actual instruction text.

Rules:
- The hook phrasing must reference the creator's niche specifically
- The evidence beats must be sequenced for the attention patterns of that niche's audience
- The close beat must reference what sharing behaviour looks like in that niche
- If `typicalContentStyle` is provided — honour it. An entertainment creator and an educational creator with the same psychological formula need different instructions.
- If `targetAudience` is provided — hook language must speak directly to that audience

The test: if you replaced the creator's niche with a different niche and the instructions still worked — they are not adapted enough. Rewrite them.

---

**Section 5 — The Script Outline Rules (150–200 words)**

The `scriptOutline` is the most common place generic output appears. These rules prevent it:

**hookBeat must contain:**
- The specific mechanism being activated (from the Decoder's primaryMechanism)
- The suggested opening words — actual phrasing, not a description of phrasing
- The timing constraint: what must be established within the first 30 seconds

**evidenceBeats must:**
- Number 2–4 beats depending on the video's scoring pattern
- Each beat must name what psychological mechanism it maintains
- At least one beat must plant a secondary information gap before the primary is resolved
- Beat sequence must build tension — each beat should make the viewer feel they are closer to the answer but not there yet

**payoffBeat must:**
- Resolve the primary gap opened in the hookBeat fully and satisfyingly
- Name the specific information being delivered
- Include a note: if the payoff disappoints, it damages trust and suppresses future sharing

**closeBeat must:**
- Activate STEPPS Practical Value or Social Currency — whichever scored higher
- Suggest a forward-looking statement the creator can use
- Be designed for sharing — the viewer should want to send this ending to someone

---

**Section 6 — Output Format (200–300 words)**

Return ONLY valid JSON matching the `BuilderResult` type exactly. No markdown. No backticks. No explanation before or after. Response must start with `{` and end with `}`.

Include this quality example showing what a CORRECT builder instruction looks like:

```json
{
  "creatorContext": {
    "channelName": "FinanceWithShayan",
    "niche": "personal finance",
    "typicalContentStyle": "educational"
  },
  "productionBrief": {
    "hookStrategy": {
      "instruction": "Open with a direct statement of a financial mistake and its monthly cost — without naming the solution. Suggested opening: 'Most people saving money in a standard savings account are losing between £200 and £400 every year without knowing it. In this video I'll show you exactly where it's going and how to stop it in the next 10 minutes.' Do not reveal the solution in the hook.",
      "reason": "This activates loss aversion framing before System 1 processes the rational value of the content. The viewer's brain weights the implied ongoing loss (money leaving their account monthly) as twice the psychological weight of an equivalent gain. They stay because not staying feels costly — Kahneman's asymmetric loss framing at 2:1 impact ratio.",
      "domain": "cognitive_psychology",
      "confidence": "high"
    },
    "contentStructure": {
      "instruction": "Structure as: problem establishment (2 min) → mechanism explanation (3 min) → secondary gap plant (1 min) → solution reveal (3 min) → implementation steps (2 min) → close. Plant the secondary gap ('but that's only half the problem') at the 5-minute mark before the primary gap resolves.",
      "reason": "This pacing maintains the information gap through the video's midpoint, preventing the retention drop that occurs when viewers sense the value has already been delivered. Secondary gaps reset the attention clock.",
      "domain": "cognitive_psychology",
      "confidence": "high"
    },
    "priorityTriggers": [
      {
        "instruction": "Frame every piece of advice as stopping a loss, not gaining a benefit. 'Stop losing £X' not 'Earn £X more'.",
        "reason": "Loss framing produces 2x the psychological impact of gain framing per Kahneman's prospect theory. This video's loss aversion score of 84 indicates the formula depends on this framing being maintained throughout.",
        "domain": "cognitive_psychology",
        "confidence": "high"
      }
    ],
    "avoidanceNotes": "Story arc scored 34 — do not add personal narrative or case studies. This formula works without them and adding story structure would dilute the practical value signal that scored 85."
  },
  "scriptOutline": {
    "hookBeat": {
      "instruction": "Suggested words: 'Most people saving money in a [savings account / ISA / current account] are losing between [£X and £Y] every year — and it's not their fault because nobody explains this. In the next [X] minutes I'll show you exactly where it's going and the three steps to stop it.' Deliver directly to camera. No preamble. No intro music over this line.",
      "reason": "Opening with a direct loss statement activates System 1 before System 2 can evaluate whether to engage. The viewer feels the loss before they decide whether the video is worth watching — removing the rational skip decision.",
      "domain": "cognitive_psychology",
      "confidence": "high"
    },
    "evidenceBeats": [
      {
        "instruction": "Beat 1 (minute 1-3): Establish the scale of the problem using a specific number. 'The average UK saver is leaving £340 per year in avoidable fees.' Name the mechanism — not just that fees exist, but exactly how they compound. Make the viewer feel the gap more acutely before providing relief.",
        "reason": "Deepening the problem before offering the solution maintains the information gap in open state and increases the psychological weight of the eventual payoff.",
        "domain": "cognitive_psychology",
        "confidence": "high"
      }
    ],
    "payoffBeat": {
      "instruction": "Deliver the complete, specific answer with implementable steps. Name the exact product, account, or action. A payoff that says 'it depends on your situation' after this level of anticipation damages trust and suppresses sharing. The payoff must fully resolve the specific gap opened in the hook.",
      "reason": "Resolution of the information gap produces a dopamine response. If the resolution is incomplete or vague, the emotional response is frustration rather than satisfaction — suppressing the sharing behaviour the STEPPS framework predicts.",
      "domain": "cognitive_psychology",
      "confidence": "high"
    },
    "closeBeat": {
      "instruction": "Suggested close: 'If you switch to [specific action] this week, you'll stop losing [specific amount] by [specific timeframe]. That's it. One change.' Follow with: 'Share this with one person you know who's still using a [standard account] — they're losing money right now.' This activates STEPPS Social Currency — the sharer looks knowledgeable.",
      "reason": "Forward-looking specific outcomes activate STEPPS Practical Value. The share prompt activates Social Currency — the viewer wants to be the person who told their friend about this. Both mechanisms in the close = higher sharing rate.",
      "domain": "cognitive_psychology",
      "confidence": "high"
    }
  },
  "sourceAnalysisId": "uuid-of-decode-analysis",
  "promptVersion": "k1-builder-v1.0"
}
```

---

**Section 7 — Anti-Patterns (100–150 words)**

The Builder must never produce any of the following:

**Anti-pattern 1: Generic instructions that apply to any video.**
Bad: "Create a hook that generates curiosity."
Good: "Open your [personal finance] video with a direct statement that your viewer is currently losing [specific resource] — name the cost before the solution."

**Anti-pattern 2: Instructions without phrasing.**
The hookBeat and at least two evidenceBeats must contain suggested words — not descriptions of what to say.

**Anti-pattern 3: Inventing mechanisms the Decoder did not find.**
If steppsSocialCurrency scored 30, do not make it a priority trigger. Build from what is actually there.

**Anti-pattern 4: Avoidance notes that are vague.**
Bad: "Avoid being too generic."
Good: "Story arc scored 28 — do not add narrative structure. This formula works on practical value alone."

---

**After building the prompt, test it manually before Task 4:**

```bash
npx ts-node -e "
import('./lib/supabase').then(async db => {
  // Get a real decode analysis from the database
  const { data } = await db.supabaseAdmin
    .from('analyses')
    .select('*')
    .eq('analysis_type', 'decode')
    .limit(1)
    .single();

  if (!data) { console.log('No decode analyses found'); return; }
  
  const { buildBuilderPrompt } = await import('./lib/prompts/k1-builder');
  const { generateLLMResponse } = await import('./lib/llm/provider');
  
  const context = { channelName: 'TestChannel', niche: 'personal finance' };
  const { systemPrompt, userMessage } = buildBuilderPrompt(data.result, context);
  
  // Temporarily use gemini for this test
  process.env.LLM_PROVIDER = 'gemini';
  const response = await generateLLMResponse(systemPrompt, userMessage, {
    temperature: 0.3, maxTokens: 3000
  });
  
  console.log('--- RAW RESPONSE (first 2000 chars) ---');
  console.log(response.text.slice(0, 2000));
})
"
```

Evaluate the raw output against three questions:
1. Does the hookStrategy contain actual suggested phrasing — real words, not a description?
2. Does each instruction name the creator's niche specifically?
3. Does each reason explain the cognitive mechanism — not just name it?

If any answer is No: revise the relevant section and re-test before Task 4.

- [x] `lib/prompts/k1-builder.ts` created ✓
- [x] `BUILDER_PROMPT_VERSION` constant set ✓
- [x] `options` parameter with `visualDirection` and `audioDirection` accepted ✓
- [x] TypeScript check passes ✓
- [x] Manual prompt test run against a real decode result ✓
- [x] All three evaluation questions answered Yes ✓

---

### TASK 4 — `lib/builder.ts`

**What it is:** The Builder orchestrator. A single function that takes a decode analysis ID and creator context, retrieves the DecoderResult, builds the prompt, calls Gemini, parses and validates the result, saves everything to the database, and returns the structured brief.

**Build instructions:**
- Import `getBriefByAnalysisId`, `upsertBrief`, `getAnalysisByVideoId` from `lib/supabase.ts`
- Import `buildBuilderPrompt`, `BUILDER_PROMPT_VERSION` from `lib/prompts/k1-builder.ts`
- Import `generateLLMResponse` from `lib/llm/provider.ts`
- Import `stripJsonFences` from `lib/llm/provider.ts`

**Function signature:**

```typescript
export async function buildBrief(
  analysisId: string,           // ID of the 'decode' analysis to build from
  creatorContext: CreatorContext,
  options?: {
    visualDirection?: string;   // Reserved — ignore if undefined
    audioDirection?: string;    // Reserved — ignore if undefined
    forceRefresh?: boolean;     // If true, bypass cache and re-run
  }
): Promise<BuilderResult>
```

**Pipeline steps in exact order:**

```
1. Check cache: getBriefByAnalysisId(analysisId)
   → If brief exists AND forceRefresh !== true: return brief.result immediately
2. Load the decode analysis: getAnalysisByVideoId approach — 
   query analyses table WHERE id = analysisId AND analysis_type = 'decode'
   → If not found: throw Error('Decode analysis not found. Run the Decoder first.')
3. Extract decoderResult from the analysis record
4. buildBuilderPrompt(decoderResult, creatorContext, options)
5. Record start time
6. Set LLM_PROVIDER temporarily to BUILDER_LLM_PROVIDER env var for this call
   OR: pass provider override to generateLLMResponse
7. generateLLMResponse(systemPrompt, userMessage, { temperature: 0.3, maxTokens: 3000 })
8. Record processingTimeMs
9. stripJsonFences(response.text) → JSON.parse → validate shape against BuilderResult
   → If parse fails: retry once
   → If second attempt fails: throw Error('Brief could not be generated. Please try again.')
10. Add sourceAnalysisId and promptVersion to the result
11. upsertBrief({
      videoId: analysis.videoId,
      analysisType: 'build',
      llmProvider: process.env.BUILDER_LLM_PROVIDER ?? 'gemini',
      llmModel: 'gemini-2.5-flash',
      promptVersion: BUILDER_PROMPT_VERSION,
      result: builderResult,
      processingTimeMs
    })
12. Return builderResult
```

**Handling the dual LLM provider:**

The Builder must use Gemini, not Groq. The cleanest implementation: read `BUILDER_LLM_PROVIDER` from environment separately from `LLM_PROVIDER`. Add this to `.env.local`:

```bash
BUILDER_LLM_PROVIDER=gemini
```

In `lib/builder.ts`, before calling `generateLLMResponse`, temporarily override the provider:

```typescript
const originalProvider = process.env.LLM_PROVIDER;
process.env.LLM_PROVIDER = process.env.BUILDER_LLM_PROVIDER ?? 'gemini';
const response = await generateLLMResponse(systemPrompt, userMessage, options);
process.env.LLM_PROVIDER = originalProvider; // restore
```

This is a clean MVP approach that does not require changes to `lib/llm/provider.ts`.

**Plain English explanation:** This function does for the Builder what `lib/analysis.ts` does for the Decoder — it orchestrates the full pipeline so the API route only needs to call one function. It checks if a brief already exists for this analysis (cache), loads the Decoder's findings, builds the prompt, calls Gemini, parses the response, saves the result, and returns it.

**Test:** Create `scripts/test-builder.ts`:

```typescript
// scripts/test-builder.ts
import { buildBrief } from '../lib/builder';
import { supabaseAdmin } from '../lib/supabase';

async function main() {
  // Get a real decode analysis from the database
  const { data: analyses } = await supabaseAdmin
    .from('analyses')
    .select('id, video_id, result')
    .eq('analysis_type', 'decode')
    .limit(2);

  if (!analyses || analyses.length === 0) {
    console.log('❌ No decode analyses in database. Run the decoder first.');
    return;
  }

  // Test with two different creator contexts to verify adaptation
  const contexts = [
    { channelName: 'FinanceWithShayan', niche: 'personal finance' },
    { channelName: 'TechReviewsUK', niche: 'tech reviews' },
  ];

  for (let i = 0; i < Math.min(analyses.length, 2); i++) {
    const analysis = analyses[i];
    const context = contexts[i];

    console.log(`\n--- Building brief ${i + 1} for: ${context.channelName} ---`);
    const start = Date.now();

    try {
      const result = await buildBrief(analysis.id, context);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      console.log(`✅ Brief built in ${elapsed}s`);
      console.log(`Hook strategy (first 150 chars): ${result.productionBrief.hookStrategy.instruction.slice(0, 150)}...`);
      console.log(`Hook domain: ${result.productionBrief.hookStrategy.domain}`);
      console.log(`Hook confidence: ${result.productionBrief.hookStrategy.confidence}`);
      console.log(`Priority triggers: ${result.productionBrief.priorityTriggers.length}`);
      console.log(`Evidence beats: ${result.scriptOutline.evidenceBeats.length}`);
      console.log(`Script hook (first 100 chars): ${result.scriptOutline.hookBeat.instruction.slice(0, 100)}...`);
    } catch (e) {
      console.log(`❌ Failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  // Test cache: run the same analysis again — should return instantly
  console.log(`\n--- Testing cache (same analysis, should be instant) ---`);
  const start = Date.now();
  await buildBrief(analyses[0].id, contexts[0]);
  const elapsed = Date.now() - start;
  console.log(elapsed < 1000
    ? `✅ Cache working — returned in ${elapsed}ms`
    : `⚠️ Cache may not be working — took ${elapsed}ms`
  );

  // Verify briefs appear in Supabase
  const { data: briefs } = await supabaseAdmin
    .from('analyses')
    .select('id, analysis_type, llm_model')
    .eq('analysis_type', 'build');

  console.log(`\n✅ Briefs in Supabase: ${briefs?.length ?? 0}`);
  console.log('Check Supabase analyses table — should see rows with analysis_type = build');
}

main().catch(console.error);
```

Run with: `npx ts-node scripts/test-builder.ts`

**After running, manually evaluate the hookStrategy from each brief:**
- Does it contain actual suggested words a creator could use?
- Does it name the creator's specific niche?
- Does the reason explain the cognitive mechanism — not just name it?

If both briefs pass: proceed to Task 5. If not: identify which section of the Builder prompt produced the weak output and fix only that section. Re-test before proceeding.

- [x] `lib/builder.ts` created ✓
- [x] `BUILDER_LLM_PROVIDER=gemini` added to `.env.local` ✓
- [x] `scripts/test-builder.ts` created ✓
- [x] Both briefs build without errors ✓
- [x] Cache returns in under 1 second ✓
- [x] Briefs verified in Supabase `analyses` table with `analysis_type = 'build'` ✓
- [x] Manual quality check: hookStrategy contains specific phrasing, not generic advice ✓

---

### TASK 5 — `app/api/build/route.ts`

**What it is:** The API endpoint that the browser calls when the founder clicks "Build Production Brief." Receives the analysis ID and creator context, calls `buildBrief`, and returns the result.

**Build instructions:**
- POST handler only
- Read from request body: `analysisId: string`, `channelName: string`, `niche: string`
- Optional from body: `typicalContentStyle?: string`, `targetAudience?: string`, `forceRefresh?: boolean`
- Validate that `analysisId`, `channelName`, and `niche` are all present — return 400 if any missing
- Construct `CreatorContext` from the request body fields
- Call `buildBrief(analysisId, creatorContext, { forceRefresh })`
- Return standard response format

**Request body:**
```typescript
{
  analysisId: string;
  channelName: string;
  niche: string;
  typicalContentStyle?: string;
  targetAudience?: string;
  forceRefresh?: boolean;
}
```

**Response body:**
```typescript
// Success
{
  data: BuilderResult;
  meta: {
    processingTimeMs: number;
    cached: boolean;
  }
}

// Error
{
  error: string;
  code: string;
}
```

**Error codes to handle:**
- `MISSING_FIELDS` — analysisId, channelName, or niche not provided (400)
- `ANALYSIS_NOT_FOUND` — no decode analysis found for this analysisId (404)
- `BUILD_FAILED` — LLM call or JSON parse failed after retry (500)
- `INTERNAL_ERROR` — any other error (500)

**Plain English explanation:** This file is the door between the browser and the Builder. The browser sends the analysis ID and creator's channel details through this door, and the production brief comes back out. All the complex logic is in `lib/builder.ts` — this route just validates the request and forwards it.

**Test:** With `npm run dev` running:

```bash
# Get a real analysis ID from Supabase first, then:

# Test 1: Build a brief (takes 5-15 seconds — Gemini call)
curl -X POST http://localhost:3000/api/build \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "PASTE_REAL_ANALYSIS_ID_HERE",
    "channelName": "FinanceWithShayan",
    "niche": "personal finance"
  }' \
  --max-time 60

# Test 2: Same request — should return cached in under 1 second
curl -X POST http://localhost:3000/api/build \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "SAME_ANALYSIS_ID",
    "channelName": "FinanceWithShayan",
    "niche": "personal finance"
  }' \
  --max-time 10

# Test 3: Missing fields — should return 400
curl -X POST http://localhost:3000/api/build \
  -H "Content-Type: application/json" \
  -d '{"analysisId": "some-id"}' \
  --max-time 10
```

Expected: Test 1 returns full BuilderResult with `cached: false` and a processing time of 5–15 seconds. Test 2 returns same result with `cached: true` in under 1 second. Test 3 returns 400 with `MISSING_FIELDS` code.

- [x] `app/api/build/route.ts` created ✓
- [x] Test 1: fresh brief returns correctly with Gemini output ✓
- [x] Test 2: cached brief returns in under 1 second ✓
- [x] Test 3: missing fields returns 400 ✓

---

### TASK 6 — `components/BuilderCard.tsx`

**What it is:** The UI component that displays the full Builder output. Two sections: Production Brief and Script Outline. Every instruction shows with its domain badge and reason.

**Build instructions:**
- `'use client'` directive at top
- Props: `result: BuilderResult`
- Use shadcn/ui `Card`, `CardContent`, `CardHeader`, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Badge`
- Two tabs: "Brief" and "Script"
- Copy-to-clipboard button on each section using the browser's `navigator.clipboard.writeText` API
- Keep under 150 lines — if it exceeds this, split into `BriefSection.tsx` and `ScriptSection.tsx`

**Tab 1 — "Brief"**

Four sections:

**Hook Strategy:**
- The instruction text prominently in a styled box
- Domain badge (`cognitive_psychology` → "Cognitive Psychology" etc.)
- Confidence badge (high = green, medium = amber, low = grey)
- Reason in smaller italic text below

**Content Structure:**
- Same layout as Hook Strategy

**Priority Triggers:**
- Numbered list (1, 2, 3)
- Each trigger: instruction text + domain badge + reason

**What to Avoid:**
- Plain text — `result.productionBrief.avoidanceNotes`
- Styled differently (amber background) to distinguish from positive instructions

**Tab 2 — "Script"**

Four sections:

**Hook (0–30s):**
- Large styled box — this is the most important section
- Instruction text
- Suggested phrasing highlighted (if the instruction contains suggested words in quotes, style them differently)
- Domain + confidence badges
- Reason below

**Evidence Beats:**
- Numbered list: Beat 1, Beat 2, Beat 3, Beat 4 (however many exist)
- Each beat: instruction + domain badge + reason

**Payoff:**
- Same layout as Hook section

**Close:**
- Same layout as Hook section

**Domain badge colour mapping:**
```typescript
const domainColours = {
  cognitive_psychology: 'bg-blue-100 text-blue-800',
  emotion_science: 'bg-purple-100 text-purple-800',
  social_behavioural: 'bg-green-100 text-green-800',
};
```

**Plain English explanation:** This component is the reading experience for the Builder's output. It turns the JSON brief into a structured, readable brief the founder can actually use in production. The domain badges and reasons make every instruction traceable back to the science.

**Test:** Run `npx tsc --noEmit`. Zero errors. Visual test in Task 7.

- [x] `components/BuilderCard.tsx` created ✓
- [x] Both tabs render correctly ✓
- [x] Domain badges display with correct colours ✓
- [x] Confidence badges display correctly ✓
- [x] Copy-to-clipboard works on each section ✓
- [x] TypeScript check passes ✓

---

### TASK 7 — Update `app/decode/[videoId]/page.tsx`

**What it is:** Add the "Build Production Brief" flow to the existing decode page. The founder enters their channel name and niche, clicks Build, and the brief appears below the analysis.

**What to change:**

The decode page is currently a server component that renders the AnalysisCard. This task adds a client component `BriefBuilder` that handles the brief generation interaction.

**New file: `app/decode/[videoId]/BriefBuilder.tsx`** (client component)

This is a client component because it manages interactive state (form input, loading, result display).

```typescript
'use client';
// Props: analysisId: string (the Supabase ID of the decode analysis)
// State:
//   channelName: string (input)
//   niche: string (input)
//   briefState: 'idle' | 'building' | 'complete' | 'error'
//   briefResult: BuilderResult | null
//   errorMessage: string

// Layout:
// 1. A simple form: two inputs (Channel Name, Niche) + "Build Brief" button
//    Show only when briefState === 'idle'
// 2. Loading state: spinner + "Building your production brief... 10-20 seconds"
//    Show when briefState === 'building'
// 3. BuilderCard component with the result
//    Show when briefState === 'complete'
// 4. Error state with retry button
//    Show when briefState === 'error'
```

**Changes to `app/decode/[videoId]/page.tsx`:**

Add the `BriefBuilder` component below the `AnalysisCard`. Pass the decode analysis ID as a prop.

To get the analysis ID: after loading the analysis from the database with `getAnalysisByVideoId`, use `analysis.id` (the Supabase record ID, not the video ID).

**Important:** The page must handle the case where no decode analysis exists yet. If `DecodeLoader` is shown (live decode in progress), do not show `BriefBuilder` — the analysis ID is not available until the decode completes. `BriefBuilder` only appears after the analysis is complete and its ID is known.

**Plain English explanation:** This adds a second step to the decode page. After the founder sees the psychological analysis, they enter their channel name and niche, click Build, and TEDAR generates a personalised production brief for their specific channel. The analysis and the brief live on the same page — the creator sees why the video worked and what to do about it in one place.

**Test:** Run `npm run dev`. Navigate to a decode page for a video that already has an analysis. Confirm:
1. The form appears below the AnalysisCard
2. Enter "TestChannel" and "personal finance" → click Build
3. Loading spinner appears for 10-20 seconds
4. BuilderCard appears with Brief and Script tabs
5. Check Supabase — new row in `analyses` table with `analysis_type = 'build'`
6. Refresh the page → click Build again with same inputs → brief returns in under 1 second (cached)

- [x] `app/decode/[videoId]/BriefBuilder.tsx` created ✓
- [x] `app/decode/[videoId]/page.tsx` updated ✓
- [x] Form appears below AnalysisCard on decode page ✓
- [x] Build flow completes and displays BuilderCard ✓
- [x] Cached brief returns in under 1 second on second request ✓
- [x] New row verified in Supabase `analyses` table ✓
- [x] TypeScript check passes ✓

---

### TASK 8 — Commit and push to GitHub

```bash
git add .
git commit -m "Phase 4: Builder Engine — production direction brief, Gemini integration, build page"
git push
```

Verify on github.com/Shayan733/tedar that all new files appear. Confirm `.env.local` is NOT in the commit:

```bash
git show --stat HEAD
```

The output must not include `.env.local` anywhere.

- [x] Changes committed ✓
- [x] Pushed to GitHub ✓
- [x] `.env.local` NOT in commit ✓

---

## PHASE 4 GATE CHECK

All of the following must be true before Phase 5 begins:

- [x] `npx tsc --noEmit` passes with zero TypeScript errors
- [x] All new types defined in `lib/types.ts`: BuilderResult, BuilderInstruction, CreatorContext, ProductionBrief, BriefRecord
- [x] `lib/supabase.ts`: upsertBrief and getBriefByAnalysisId working
- [x] `BUILDER_LLM_PROVIDER=gemini` in `.env.local`
- [x] `lib/prompts/k1-builder.ts`: BUILDER_PROMPT_VERSION set, options parameter accepted, all 7 sections present
- [x] `lib/builder.ts`: cache check, Gemini call, retry on JSON parse failure, database save all working
- [x] `/api/build` route: returns cached results instantly, runs fresh Gemini call when needed, 400 on missing fields
- [x] `components/BuilderCard.tsx`: both tabs render, domain badges correct, copy-to-clipboard works
- [x] `app/decode/[videoId]/BriefBuilder.tsx`: form, loading state, result display, error state all working
- [x] Full browser flow tested: decode page → enter channel + niche → Build → brief appears
- [x] Supabase `analyses` table: rows with `analysis_type = 'build'` verified
- [x] Brief quality check: hookStrategy contains specific phrasing — not generic advice
- [x] All code committed and pushed to GitHub

**When all boxes above are ticked:** Tell the founder "Phase 4 is complete. The Builder Engine is working. TEDAR now produces both psychological analysis and personalised production briefs. Replace this CLAUDE.md with the Phase 5 CLAUDE.md to begin building the full automated pipeline."

---

## IF SOMETHING BREAKS

1. Read the exact error. Quote it in full.
2. Tell the founder what the error means in plain English.
3. Fix only the broken thing. Do not touch working code.
4. Re-run the specific test for that task.
5. Confirm it passes before moving on.

**Common Phase 4 issues:**

- **Gemini returns invalid JSON:** The Builder prompt must say "Return ONLY valid JSON. No markdown. No backticks. No explanation before or after." Use `stripJsonFences` before `JSON.parse`. Retry once if it fails.

- **`BUILDER_LLM_PROVIDER` not being picked up:** Check that the env var is in `.env.local` and that `npm run dev` was restarted after adding it. Next.js caches env vars at startup — a restart is required after any `.env.local` change.

- **Brief is generic despite the prompt:** Gemini 2.5 Flash is significantly better than llama 70B for this task. If the output is still generic, the issue is likely the `creatorContext` not being injected into the prompt correctly. Check that `channelName` and `niche` appear in the actual instruction text of the hookStrategy.

- **Cache not working for briefs:** Check `getBriefByAnalysisId` — the JSONB query on `result->sourceAnalysisId` must match how the sourceAnalysisId was stored. Log the raw Supabase response to verify.

- **BriefBuilder form not appearing on decode page:** Check that the decode analysis ID is being passed correctly from the server component to the client component. The ID comes from the `analysis.id` field of the Supabase record — not from the video ID or the YouTube ID.

- **Gemini 20 req/day limit hit:** If you exhaust the daily Gemini quota during testing, switch `BUILDER_LLM_PROVIDER=groq` temporarily to continue testing the flow. The brief quality will be lower but the architecture will still work. Reset to `gemini` the next day.

- **TypeScript error on domain type:** The `domain` field must be one of the exact string literals defined in the union type. If Gemini returns `"Cognitive Psychology"` instead of `"cognitive_psychology"` — add a normalisation step in `lib/builder.ts` that lowercases and underscores the domain value before validation.

---

*TEDAR Project Bible v5.0 — Phase 4 of 7*
*Built one step at a time. Test before moving. Never skip gates.*
*The Builder translates science into production decisions. Every instruction must earn its place.*