-- Migration v5: share-to-unlock / referral tracking
-- Run in Supabase SQL editor (Dashboard → SQL Editor → Run)

-- Track who referred this user (populated from user_metadata at signup time via trigger)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Prevent double-rewarding: set to TRUE once the referrer has received their bonus for this user
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_reward_given BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for referral lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by
  ON public.profiles (referred_by)
  WHERE referred_by IS NOT NULL;

-- =========================================================
-- Update handle_new_user trigger to store referred_by from signup metadata
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_id UUID;
BEGIN
  -- Safely parse referred_by from user_metadata (invalid UUIDs are ignored)
  BEGIN
    ref_id := (NEW.raw_user_meta_data->>'referred_by')::UUID;
  EXCEPTION WHEN OTHERS THEN
    ref_id := NULL;
  END;

  INSERT INTO public.profiles (id, email, full_name, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    ref_id
  )
  ON CONFLICT (id) DO UPDATE SET
    email     = EXCLUDED.email,
    full_name = CASE
                  WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = ''
                  THEN EXCLUDED.full_name
                  ELSE public.profiles.full_name
                END,
    referred_by = CASE
                    WHEN public.profiles.referred_by IS NULL
                    THEN EXCLUDED.referred_by
                    ELSE public.profiles.referred_by
                  END;
  RETURN NEW;
END;
$$;

-- =========================================================
-- RPC: increment referrer's analyses_limit by 1 when a referral is rewarded
-- Called from the /api/referral-complete Cloudflare Function
-- =========================================================
CREATE OR REPLACE FUNCTION public.reward_referrer(referrer_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET analyses_limit = analyses_limit + 1
  WHERE id = referrer_id;
$$;
