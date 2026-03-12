-- Declawed — Migration v3
-- Run these statements in the Supabase SQL editor.
-- https://supabase.com/dashboard/project/<your-project>/sql

-- =========================================================
-- Profiles: add full_name column
-- =========================================================

-- Full name collected at sign-up and synced from user_metadata.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Index for any future lookup by name
CREATE INDEX IF NOT EXISTS profiles_full_name_idx ON public.profiles(full_name);
