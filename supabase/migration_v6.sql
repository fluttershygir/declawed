-- Migration v6: schema cache refresh + helpers
-- Run in Supabase SQL editor (Dashboard → SQL Editor → Run)

-- Force PostgREST to reload the schema cache so full_name column is visible
NOTIFY pgrst, 'reload schema';

-- =========================================================
-- RPC: update full_name — bypasses schema cache issues
-- Called from AccountSettings when saving display name
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_full_name(user_id UUID, new_name TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET full_name = new_name
  WHERE id = user_id;
$$;

-- Ensure user_preferences JSONB column exists (needed for notification prefs)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_preferences JSONB NOT NULL DEFAULT '{}';
