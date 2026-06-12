# TEDAR — Content Intelligence for YouTube Creators

**Live:** [tedar.vercel.app](https://tedar.vercel.app)

TEDAR answers the one question every media professional asks and no analytics
dashboard answers: **why did that video win?**

Views, CTR, and retention graphs tell you *that* a video outperformed. They
never tell you *why* — and "why" is the only part you can replicate. TEDAR
closes that gap with a three-engine pipeline that finds outlier videos,
decodes the psychology behind them from both directions (the script **and**
the audience), and converts the findings into a production brief you can
actually shoot.

---

## The problem it solves

A creator or content strategist studying a competitor's breakout video today
does this manually: scrub the video, skim hundreds of comments, guess at what
made it work, and write a brief from intuition. It takes hours per video and
the conclusions are unfalsifiable hunches.

TEDAR turns that into a five-minute, evidence-cited workflow:

| Stage | Question it answers | Engine |
|---|---|---|
| **Scout** | Which videos in this niche are true outliers? | Trimmed-mean baseline + outlier scoring over up to 100 videos/channel |
| **Decode (K1)** | What does the *script* do to the viewer's brain? | LLM analysis grounded in Kahneman (System 1/2), Berger (STEPPS), Loewenstein (information gaps) — every claim cited to a transcript quote |
| **Decode (Audience)** | What did the *audience* actually feel? | Analysis of the 50 most-liked comments — sentiment, emotional triggers, resonant themes, standout comments as evidence |
| **Build** | How do I apply this to *my* channel? | Production brief + script outline calibrated to the creator's context |

The two decoders are deliberately paired: the K1 Decoder reads the content's
*intent*, the Audience Decoder reads the crowd's *response*, and the
**expectation gap** between them is where the real insight lives.

## Product principles

- **Transcript preview before analysis** — the user sees exactly what TEDAR is
  about to analyse and commits deliberately. No black box.
- **Chain-of-thought progress** — analyses stream their reasoning steps live
  over SSE instead of showing a spinner.
- **History is permanent** — re-analysing a video creates a new run, never
  overwrites the old one. Reads always surface the latest run; the full
  history stays queryable (`/api/history?videoId=...`).
- **Everything is exportable** — the library exports the latest analysis per
  video as CSV or JSON for use outside the app.

## Architecture

```
Next.js 16 (App Router, TypeScript, Tailwind v4, shadcn/ui)
│
├── Scout engine          lib/pipeline/*  lib/youtube/*
│     niche → discover channels → scan → outlier detection (trimmed mean)
│
├── Decode engines
│     prepare   lib/prepare.ts        metadata + transcript (Edge runtime —
│                                     InnerTube captions, no scraping package)
│     K1        lib/analysis.ts       Groq llama-3.3-70b via lib/llm/provider.ts
│     audience  lib/audience.ts       top comments via YouTube Data API → LLM
│
├── Builder engine        lib/builder.ts  Gemini 2.5 Flash
│
├── Library & history     lib/supabase-library.ts  lib/supabase-history.ts
│     latest-run dedup on read, append-only run history, stats snapshots
│
└── Supabase (Postgres)   videos · transcripts · analyses · channels · niches
                          pipeline_runs · *_snapshots (time series)
```

**Streaming:** all long-running analyses stream progress as Server-Sent Events
(`lib/streaming.ts`) so the UI narrates the work in real time.

**LLM abstraction:** no engine calls a model API directly — everything routes
through `lib/llm/provider.ts`, so providers are swappable per engine via env
vars (`LLM_PROVIDER`, `BUILDER_LLM_PROVIDER`).

## API surface

| Route | Method | Purpose |
|---|---|---|
| `/api/scout/interpret` | POST | Classify free-text input (niche / channel / video) |
| `/api/scout/discover` | POST | Find + rank top channels for a niche |
| `/api/scout/scan` | POST | Scan one channel, return outliers |
| `/api/decode/prepare` | POST | Fetch metadata + transcript for preview (Edge) |
| `/api/decode` | POST (SSE) | Run K1 psychological analysis |
| `/api/decode/audience` | POST (SSE) | Run audience-reaction analysis |
| `/api/build` | POST (SSE) | Generate production brief |
| `/api/library` | GET | All videos with latest analysis per type |
| `/api/library/refresh` | POST | Re-fetch live stats + append snapshot |
| `/api/history` | GET | Full analysis run history for a video |
| `/api/export` | GET | Download latest analyses as CSV/JSON |

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in Supabase, YouTube, Groq, Gemini keys
npm run dev
```

Apply `supabase/migrations/20260612000001_consolidation.sql` in the Supabase
SQL editor once (allows the `audience` analysis type and adds the
history-read index).

Verify: `npx tsc --noEmit && npm run lint && npm run build`

## Origin

TEDAR consolidates two projects: the original TEDAR (Scout/K1 Decode/Build
loop) and **DP-YT-PIPELINE**, a Python/Flask pipeline for audience-reaction
analysis of short films. The audience decoder, permanent analysis history,
library with stats snapshots, and CSV/JSON export were ported from the Python
pipeline and rebuilt as typed TypeScript on TEDAR's schema and streaming
infrastructure.
