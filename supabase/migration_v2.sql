-- Declawed — Migration v2
-- Run these ALTER TABLE statements in the Supabase SQL editor after the initial schema.sql
-- https://supabase.com/dashboard/project/<your-project>/sql

-- =========================================================
-- Analyses: new columns for notes, share tokens, re-analysis
-- =========================================================

-- User's personal note on an analysis (max 500 chars enforced in API)
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS note TEXT;

-- Share token for read-only public sharing (/shared/:token)
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS share_token TEXT;

-- Original lease text stored so users can re-analyze without re-uploading.
-- NULL for image-based analyses.
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS source_text TEXT;

-- Unique index on share_token so lookups are fast and tokens don't collide
CREATE UNIQUE INDEX IF NOT EXISTS analyses_share_token_idx
  ON public.analyses(share_token)
  WHERE share_token IS NOT NULL;
