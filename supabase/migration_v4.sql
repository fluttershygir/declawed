-- Migration v4: account settings support
-- Run in Supabase SQL editor (Dashboard → SQL Editor → Run)

-- Add user_preferences JSONB column to profiles for notification toggles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_preferences JSONB DEFAULT '{}'::jsonb;

-- Add stripe_customer_id for billing portal lookups (populated by webhook on checkout)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Index for quick Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles (stripe_customer_id);
