-- Declawed Supabase Schema
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/<your-project>/sql

-- =========================================================
-- PROFILES TABLE
-- Automatically populated by trigger on auth.users insert.
-- =========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email                 TEXT,
  plan                  TEXT        NOT NULL DEFAULT 'free',  -- 'free' | 'one' | 'pro' | 'unlimited'
  analyses_used         INTEGER     NOT NULL DEFAULT 0,
  analyses_limit        INTEGER     NOT NULL DEFAULT 1,
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- ANALYSES TABLE
-- Stores analysis history for paid/logged-in users.
-- =========================================================
CREATE TABLE IF NOT EXISTS public.analyses (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename    TEXT,
  verdict     TEXT,
  result      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own row
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Analyses: users can read their own rows
CREATE POLICY "analyses_select_own" ON public.analyses
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (used by Cloudflare Workers with SUPABASE_SERVICE_ROLE_KEY)
-- This is handled automatically when using the service role key — it bypasses RLS.

-- =========================================================
-- TRIGGER: auto-create profile on signup
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- RPC: atomic increment for analyses_used
-- Called from the Cloudflare Worker after a successful analysis.
-- =========================================================
CREATE OR REPLACE FUNCTION public.increment_analyses_used(user_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET analyses_used = analyses_used + 1
  WHERE id = user_id;
$$;

-- =========================================================
-- RPC: upgrade user plan (called after Stripe webhook / payment verify)
-- =========================================================
CREATE OR REPLACE FUNCTION public.upgrade_user_plan(
  user_id UUID,
  new_plan TEXT,
  new_limit INTEGER
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET plan = new_plan,
      analyses_limit = new_limit,
      analyses_used = 0
  WHERE id = user_id;
$$;

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS analyses_user_id_idx ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS analyses_created_at_idx ON public.analyses(created_at DESC);
