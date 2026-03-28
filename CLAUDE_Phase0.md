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

**Estimated time:** 60–90 minutes (mostly waiting for installs and setting up Supabase).

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
- ✅ Supabase — account ready, needs a new project created for TEDAR

---

## PHASE 0 TASK LIST

Work through these in order. Do not skip ahead. Tick each box when complete.

---

### TASK 1 — Create the Next.js project

- [ ] Run the project creation command below in the terminal, in whatever folder you want TEDAR to live in (e.g. your Documents or Projects folder):

```bash
npx create-next-app@latest tedar --typescript --tailwind --app --src-dir=false --import-alias '@/*'
```

When prompted, accept all defaults.

**What this does in plain English:** This creates a new web application called "tedar" with TypeScript (a version of JavaScript that catches errors early) and Tailwind (a styling system). The `--app` flag uses the modern Next.js structure. This single command gives us a working website.

**Test:** When it finishes, run:
```bash
cd tedar
npm run dev
```
Open your browser and go to `http://localhost:3000`. You should see the default Next.js welcome page. If you see it, this task is complete. Press `Ctrl+C` to stop the server.

- [ ] TESTED AND WORKING ✓

---

### TASK 2 — Install all dependencies

Inside the `tedar` folder, run these two commands one at a time:

```bash
npm install @google/generative-ai @supabase/supabase-js googleapis youtube-transcript
```

```bash
npm install -D @types/node
```

**What this does in plain English:** This installs the external tools TEDAR needs — the Google Gemini AI connector, the Supabase database connector, the YouTube API connector, and the transcript puller. Think of these as the specialist tools being added to the toolbox.

**Test:** Run `npm run dev` again. The site still loads at localhost:3000 with no errors in the terminal. If you see errors, paste them here and we'll fix them before moving on.

- [ ] TESTED AND WORKING ✓

---

### TASK 3 — Set up shadcn/ui

Run these commands inside the `tedar` folder:

```bash
npx shadcn-ui@latest init
```

When prompted:
- Style: **Default**
- Base colour: **Slate**
- CSS variables: **Yes**

Then install the specific components TEDAR needs:

```bash
npx shadcn-ui@latest add button card input tabs badge skeleton alert progress
```

**What this does in plain English:** shadcn/ui is a set of pre-built, professional-looking interface pieces — buttons, cards, input boxes, progress bars. Instead of designing these from scratch, we install them ready-made. This is what makes the product look professional without needing a designer.

**Test:** Run `npm run dev`. Site still loads. No errors. The components are installed into a new `components/ui/` folder — you should see files there like `button.tsx`, `card.tsx` etc.

- [ ] TESTED AND WORKING ✓

---

### TASK 4 — Create the environment variables file

Create a file called `.env.local` in the root of the `tedar` folder (same level as `package.json`). Add this exact content, replacing the placeholder values with real keys:

```bash
# TEDAR Environment Variables
# DO NOT COMMIT THIS FILE TO GIT — IT CONTAINS SECRET KEYS

# ── LLM Configuration ──────────────────────────────────────────
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key_here
# ANTHROPIC_API_KEY=    ← uncomment this when switching to Claude
# OPENAI_API_KEY=       ← uncomment this when switching to GPT

# ── YouTube ────────────────────────────────────────────────────
YOUTUBE_API_KEY=your_youtube_key_here

# ── Supabase ───────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

**What the LLM_PROVIDER line means in plain English:** This single line controls which AI brain TEDAR uses. Right now it says `gemini` — which means it uses the free Google Gemini model. If you ever want to switch to Claude or GPT, you change this one line. Nothing else in the code needs to change. That is the entire point of the model-agnostic architecture.

**Where to get the Supabase keys:** Complete Task 5 first (creating the Supabase project), then come back and fill in the three Supabase lines.

**IMPORTANT:** Verify that `.env.local` is in your `.gitignore` file. Open `.gitignore` and confirm this line exists:
```
.env.local
```
If it's not there, add it. This prevents your secret keys from ever being uploaded to GitHub.

- [ ] .env.local file created with all keys filled in ✓
- [ ] Confirmed .env.local is in .gitignore ✓

---

### TASK 5 — Create the Supabase project

**This task is done by the founder in the browser, not by the coding agent.**

The founder should:

1. Go to **supabase.com** and sign in
2. Click **"New project"**
3. Name it: `tedar`
4. Choose a strong database password (save it somewhere safe)
5. Choose region: **West EU (Ireland)** — closest to UK
6. Click **"Create new project"** — wait ~2 minutes for it to provision
7. Once ready, go to **Settings → API**
8. Copy these three values into `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`

**What Supabase is in plain English:** Supabase is the database where TEDAR stores everything — every channel scanned, every video found, every analysis run, every score assigned. Think of it as a very organised filing cabinet that lives on the internet. It comes with a visual dashboard so you can see all your data without writing any code. The free tier stores up to 500MB, which is more than enough for the entire MVP phase and early growth.

**Why three different keys:** The URL is just the address of your database (safe to share). The anon key is for the browser (read-only operations, safe to be public). The service_role key is the master key (read/write everything — keep this secret, never expose it to the browser).

- [ ] Supabase project created ✓
- [ ] All three Supabase values added to .env.local ✓

---

### TASK 6 — Enable pgvector in Supabase

In your Supabase project dashboard:

1. Go to **Database → Extensions**
2. Search for **vector**
3. Enable the **vector** extension

**What this does in plain English:** pgvector is a special capability that lets the database store and search "embeddings" — mathematical representations of meaning. TEDAR will use this in a future phase to build a knowledge base that can find similar patterns across thousands of analysed videos. We enable it now so it's ready when we need it. Enabling it later can cause complications.

- [ ] pgvector extension enabled ✓

---

### TASK 7 — Create all 7 database tables

In your Supabase dashboard, go to **SQL Editor** and run the following SQL. You can run it all at once as a single block.

**What this does in plain English:** This creates all 7 "filing sections" of TEDAR's database. Think of each table as a separate spreadsheet with specific columns. We create all of them now even though most will be empty until later phases — this is intentional. The database structure needs to exist before we write any code that uses it.

```sql
-- ── Table 1: niches ──────────────────────────────────────────────────────────
-- Stores the topic areas TEDAR scans (e.g. "fitness motivation", "personal finance")
CREATE TABLE niches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  channel_count INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Table 2: channels ────────────────────────────────────────────────────────
-- Stores YouTube channels discovered during Scout scans
CREATE TABLE channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  youtube_channel_id TEXT UNIQUE NOT NULL,
  channel_name TEXT NOT NULL,
  channel_url TEXT,
  subscriber_count BIGINT,
  total_video_count INTEGER,
  niche_id UUID REFERENCES niches(id),
  avg_views BIGINT,
  relevance_score DECIMAL(4,2),
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Table 3: videos ──────────────────────────────────────────────────────────
-- Stores every video found during Scout scans, with outlier scores
CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  youtube_video_id TEXT UNIQUE NOT NULL,
  channel_id UUID REFERENCES channels(id),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  view_count BIGINT,
  like_count BIGINT,
  comment_count BIGINT,
  duration_seconds INTEGER,
  published_at TIMESTAMPTZ,
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  outlier_score DECIMAL(6,2),
  outlier_category TEXT CHECK (outlier_category IN (
    'underperformer','normal','above_average',
    'notable','strong','viral'
  )),
  has_transcript BOOLEAN DEFAULT false,
  has_analysis BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Table 4: transcripts ─────────────────────────────────────────────────────
-- Stores the full spoken text of each analysed video
CREATE TABLE transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) UNIQUE,
  full_text TEXT NOT NULL,
  word_count INTEGER,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Table 5: analyses ────────────────────────────────────────────────────────
-- Stores every Decoder and Builder LLM output
CREATE TABLE analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id),
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('decode','build')),
  llm_provider TEXT NOT NULL,
  llm_model TEXT NOT NULL,
  prompt_version TEXT,
  result JSONB NOT NULL,
  overall_score INTEGER,
  dimension_scores JSONB,
  processing_time_ms INTEGER,
  tokens_input INTEGER,
  tokens_output INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Table 6: knowledge_entries ───────────────────────────────────────────────
-- Future RAG knowledge base. Created now, populated post-MVP.
CREATE TABLE knowledge_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL CHECK (domain IN (
    'cognitive_psychology','emotion_science',
    'visual_psychology','audio_music',
    'performance_direction','production_craft',
    'social_behavioural'
  )),
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'principle','benchmark','pattern','anti_pattern'
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT,
  niche_specific TEXT,
  score_reference INTEGER,
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Table 7: pipeline_runs ───────────────────────────────────────────────────
-- Tracks every automated pipeline execution in real time
CREATE TABLE pipeline_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  input_type TEXT NOT NULL CHECK (input_type IN ('niche','channel','video')),
  input_value TEXT NOT NULL,
  channels_found INTEGER DEFAULT 0,
  videos_scanned INTEGER DEFAULT 0,
  outliers_found INTEGER DEFAULT 0,
  analyses_completed INTEGER DEFAULT 0,
  briefs_generated INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ── Indexes (make database queries fast) ─────────────────────────────────────
CREATE INDEX idx_videos_channel ON videos(channel_id);
CREATE INDEX idx_videos_outlier ON videos(outlier_score DESC);
CREATE INDEX idx_videos_published ON videos(published_at DESC);
CREATE INDEX idx_videos_category ON videos(outlier_category);
CREATE INDEX idx_analyses_video ON analyses(video_id);
CREATE INDEX idx_analyses_type ON analyses(analysis_type);
CREATE INDEX idx_channels_niche ON channels(niche_id);
CREATE INDEX idx_knowledge_domain ON knowledge_entries(domain);
CREATE INDEX idx_pipeline_status ON pipeline_runs(status);
```

After running this SQL, go to **Table Editor** in Supabase and verify you can see all 7 tables: `niches`, `channels`, `videos`, `transcripts`, `analyses`, `knowledge_entries`, `pipeline_runs`.

- [ ] All SQL run without errors ✓
- [ ] All 7 tables visible in Supabase Table Editor ✓

---

### TASK 8 — Create the folder structure

Inside the `tedar` folder, create the following empty folders and files. Empty files are fine — the content gets added in later phases. The structure must match exactly.

Run these commands from inside the `tedar` folder:

```bash
mkdir -p app/api/scout/discover
mkdir -p app/api/scout/scan
mkdir -p app/api/scout/pipeline
mkdir -p app/api/decode
mkdir -p app/api/build
mkdir -p app/results
mkdir -p app/video
mkdir -p components
mkdir -p lib/llm
mkdir -p lib/prompts
mkdir -p lib/youtube
mkdir -p lib/pipeline
mkdir -p scripts
mkdir -p data/niches
```

Then create these empty placeholder files:

```bash
touch app/api/scout/discover/route.ts
touch app/api/scout/scan/route.ts
touch app/api/scout/pipeline/route.ts
touch app/api/decode/route.ts
touch app/api/build/route.ts
touch lib/llm/provider.ts
touch lib/llm/gemini.ts
touch lib/llm/claude.ts
touch lib/llm/openai.ts
touch lib/prompts/channel-ranker.ts
touch lib/prompts/k1-decoder.ts
touch lib/prompts/k1-builder.ts
touch lib/youtube/search.ts
touch lib/youtube/channel.ts
touch lib/youtube/metadata.ts
touch lib/youtube/transcript.ts
touch lib/youtube/outlier.ts
touch lib/pipeline/runner.ts
touch lib/pipeline/niche-pipeline.ts
touch lib/pipeline/channel-pipeline.ts
touch lib/pipeline/video-pipeline.ts
touch lib/analysis.ts
touch lib/builder.ts
touch lib/supabase.ts
touch lib/config.ts
touch lib/types.ts
touch scripts/test-search.ts
touch scripts/test-channel.ts
touch scripts/test-outlier.ts
touch scripts/test-decoder.ts
touch scripts/test-builder.ts
touch scripts/test-pipeline.ts
touch scripts/seed-dataset.ts
touch data/niches/fitness.json
touch data/niches/personal-finance.json
```

**What this does in plain English:** This creates the skeleton of the entire project — all the folders and empty files where the code will eventually live. It's like building the rooms of a house before putting furniture in them. Having the structure in place now means the LLM coding agent always knows where things go.

**Test:** Open the `tedar` folder in VS Code. The file tree on the left should show all these folders and files. Run `npm run dev` — site still loads at localhost:3000 with no errors.

- [ ] All folders created ✓
- [ ] All placeholder files created ✓
- [ ] npm run dev still works ✓

---

### TASK 9 — Initialise Git and make the first commit

```bash
git init
git add .
git commit -m "Phase 0: Project foundation, database schema, folder structure"
```

**IMPORTANT — verify .env.local was NOT committed:**
```bash
git show --stat HEAD
```
The output must NOT include `.env.local` anywhere. If it does, stop immediately and fix the `.gitignore` before proceeding.

**What this does in plain English:** Git is a version control system — it saves snapshots of your code at each stage. This first snapshot captures the entire Phase 0 setup. If anything ever breaks in the future, you can always go back to this clean starting point.

- [ ] Git initialised ✓
- [ ] First commit made ✓
- [ ] Confirmed .env.local is NOT in the commit ✓

---

## PHASE 0 GATE CHECK

All of the following must be true before Phase 1 begins. The agent confirms each one.

- [ ] `npm run dev` runs without errors and localhost:3000 loads in the browser
- [ ] All 7 tables exist in Supabase (verified in Table Editor)
- [ ] pgvector extension is enabled in Supabase
- [ ] `.env.local` exists with all 5 keys filled in (GEMINI_API_KEY, YOUTUBE_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- [ ] `.env.local` is NOT in Git (verified with `git show --stat HEAD`)
- [ ] All folders and placeholder files exist
- [ ] Git repository initialised with first commit

**When all boxes above are ticked:** Tell the founder "Phase 0 is complete. All systems are in place. Replace this CLAUDE.md with the Phase 1 CLAUDE.md to begin building the Scout Engine."

---

## IF SOMETHING BREAKS

1. Read the exact error message. Copy it in full.
2. Tell the founder what the error says in plain English.
3. Fix only the broken thing. Do not change anything else.
4. Re-run the test for that task.
5. Confirm it passes before moving on.

Common issues in Phase 0:
- **npx create-next-app fails:** Check that Node.js 18+ is installed (`node --version`). If below 18, download the LTS version from nodejs.org.
- **Supabase SQL fails with "extension not found":** pgvector may not be enabled yet. Complete Task 6 first, then re-run the SQL.
- **npm install fails:** Delete the `node_modules` folder and `package-lock.json`, then run `npm install` again.
- **localhost:3000 not loading:** Make sure you ran `npm run dev` from inside the `tedar` folder, not from a parent folder.

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
