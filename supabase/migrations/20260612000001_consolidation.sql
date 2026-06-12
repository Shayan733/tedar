-- TEDAR — Consolidation migration (Audience Decoder + analysis history)
-- Run this once in the Supabase SQL editor (or `supabase db push`) before
-- deploying the consolidated build.
--
-- 1. Allow the new 'audience' analysis type. If `analyses.analysis_type` has a
--    CHECK constraint listing allowed values, replace it; if not, this is a no-op.
-- 2. Add an index for the history/dedup reads (latest run per video + type).
--
-- Idempotent: safe to run more than once.

DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  -- Drop any CHECK constraint on analyses that references analysis_type
  FOR constraint_rec IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'analyses'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%analysis_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.analyses DROP CONSTRAINT %I', constraint_rec.conname);
  END LOOP;
END $$;

ALTER TABLE public.analyses
  ADD CONSTRAINT analyses_analysis_type_check
  CHECK (analysis_type IN ('decode', 'build', 'audience'));

-- Latest-run-per-video reads order by created_at DESC filtered on (video_id, analysis_type)
CREATE INDEX IF NOT EXISTS idx_analyses_video_type_created
  ON public.analyses (video_id, analysis_type, created_at DESC);
