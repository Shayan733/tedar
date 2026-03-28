# TEDAR — CLAUDE.md
# Phase 0: Project Foundation + Database Setup

---

## WHAT YOU ARE

You are a careful, precise coding agent building TEDAR — a content intelligence system for YouTube creators. You are working with a non-technical founder who needs plain-language explanations for every single thing you do. You build one thing at a time. You test before moving. You never skip steps. You never build ahead of the current phase.

When a task is complete and tested, update this file by changing `- [ ]` to `- [x]` for that item.

---

## WHAT THIS PHASE BUILDS

Phase 0 sets up the entire project foundation. No product features are built here. This phase produces:

- A working Next.js project running at localhost:3000
- All dependencies installed
- The correct folder structure (empty files are fine)
- All environment variables configured
- A live Supabase database with all 7 tables created and ready
- Git repository initialised

**Why this matters:** Every phase that follows depends on this foundation being correct. The database must exist from day one because every piece of data captured from Phase 1 onward is stored immediately. Nothing is ever discarded.

---

## WHAT COMES AFTER THIS PHASE

Phase 1 builds the Scout Engine — the system that finds YouTube channels, detects which videos are performing unusually well, and stores everything to the database. It will not work unless Phase 0's database tables exist. Do not build any Phase 1 code now.

---

## GOLDEN RULES — READ BEFORE EVERY ACTION

These rules apply to every phase, not just Phase 0. They are repeated in every CLAUDE.md.

1. **ONE THING AT A TIME.** Complete one task, explain it, confirm it works, then move to the next.
2. **EXPLAIN EVERYTHING IN PLAIN LANGUAGE.** The founder is non-technical. After every file or action, write 2–3 sentences explaining what was just done and why, in plain English. No jargon.
3. **TEST BEFORE MOVING.** Every task has a test. Do not proceed until the test passes.
4. **NEVER SKIP GATES.** The Gate Check at the bottom of this file must fully pass before Phase 1 begins.
5. **NEVER BUILD AHEAD.** Do not create any files or features beyond what is listed in this phase.
6. **NEVER USE 'any' IN TYPESCRIPT.** All data types must be explicitly defined.
7. **MAX 150 LINES PER FILE.** If a file would be longer, flag it and split it logically.
8. **NEVER COMMIT .env.local.** This file contains secret API keys and must never go into Git.
9. **ALWAYS SAVE DATA TO DATABASE.** Any function that produces data must store it in Supabase. (Relevant from Phase 1 onward, not Phase 0.)
10. **NEVER HARD-CODE THRESHOLDS.** Any configurable number lives in `lib/config.ts`. (Relevant from Phase 1 onward.)

---

## APPROVED TECH STACK

Do not introduce any technology not listed here. If something seems missing, ask before adding it.

| What | Technology | Notes |
|---|---|---|
| Framework | Next.js 14, App Router, TypeScript | Frontend + backend in one project |
| Styling | Tailwind CSS + shadcn/ui | Pre-built components, no custom CSS |
| Database | Supabase (PostgreSQL) | Free tier, visual dashboard, pgvector included |
| LLM Default | Google Gemini 2.5 Flash | Free tier, swappable via env var |
| LLM Wrapper | lib/llm/provider.ts | NEVER call any LLM API directly |
| YouTube Data | YouTube Data API v3 | Official API, free tier |
| Transcripts | youtube-transcript npm package | Free, no API key needed |
| Deployment | Vercel | Free tier, used in later phases |
| Package manager | npm | Do not use yarn, pnpm, or bun |

---

## API KEYS THE FOUNDER HAS

- ✅ YouTube Data API v3 key — ready
- ✅ Gemini 2.5 Flash API key — ready (from aistudio.google.com)
- ✅ Supabase — account ready, project created for TEDAR

---

## PHASE 0 TASK LIST

### TASK 1 — Create the Next.js project
- [x] Project created ✓
- [x] TESTED AND WORKING ✓

### TASK 2 — Install all dependencies
- [x] TESTED AND WORKING ✓

### TASK 3 — Set up shadcn/ui
- [x] TESTED AND WORKING ✓

### TASK 4 — Create the environment variables file
- [x] .env.local file created with all keys filled in ✓
- [x] Confirmed .env.local is in .gitignore ✓

### TASK 5 — Create the Supabase project *(completed by founder)*
- [x] Supabase project created ✓
- [x] All three Supabase values added to .env.local ✓

### TASK 6 — Enable pgvector in Supabase *(completed by founder)*
- [x] pgvector extension enabled ✓

### TASK 7 — Create all 7 database tables *(completed by founder)*
- [x] All SQL run without errors ✓
- [x] All 7 tables visible in Supabase Table Editor ✓

### TASK 8 — Create the folder structure
- [x] All folders created ✓
- [x] All placeholder files created ✓
- [x] npm run dev still works ✓

### TASK 9 — Initialise Git and make the first commit
- [x] Git initialised ✓
- [x] First commit made ✓
- [x] Confirmed .env.local is NOT in the commit ✓

---

## PHASE 0 GATE CHECK

- [x] `npm run dev` runs without errors and localhost:3000 loads in the browser
- [x] All 7 tables exist in Supabase (verified in Table Editor)
- [x] pgvector extension is enabled in Supabase
- [x] `.env.local` exists with all 5 keys filled in
- [x] `.env.local` is NOT in Git
- [x] All folders and placeholder files exist
- [x] Git repository initialised with first commit

**Phase 0 is complete. All systems are in place. Replace this CLAUDE.md with the Phase 1 CLAUDE.md to begin building the Scout Engine.**

---

## CONTEXT FOR THE NEXT PHASE

Phase 1 will build the Scout Engine. It will:
- Connect to the YouTube Search API to find channels by keyword
- Use the LLM to rank and filter those channels by niche relevance
- Pull the most recent videos from each channel
- Calculate each channel's average performance baseline
- Detect outlier videos that significantly outperform that baseline
- Store everything to the Supabase database

The first file built in Phase 1 will be `lib/types.ts` — the TypeScript type definitions that every other file depends on.

---

*TEDAR Project Bible v3.0 — Phase 0 of 7*
*Built one step at a time. Test before moving. Never skip gates.*
