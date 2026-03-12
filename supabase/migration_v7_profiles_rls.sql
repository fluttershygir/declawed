-- migration_v7: Ensure profiles table has RLS enabled with correct per-user policies.
-- Run this in: Supabase Dashboard → SQL Editor

-- 1. Enable RLS (safe to run again if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Users can read only their own profile row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Users can view own profile'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view own profile"
        ON public.profiles
        FOR SELECT
        USING (auth.uid() = id);
    $policy$;
  END IF;
END $$;

-- 3. Users can update only their own profile row
--    WITH CHECK prevents updating the id to someone else's uid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Users can update own profile'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update own profile"
        ON public.profiles
        FOR UPDATE
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    $policy$;
  END IF;
END $$;

-- 4. Service role (used by Cloudflare Workers) bypasses RLS by design —
--    no changes needed there. The SUPABASE_SERVICE_ROLE_KEY has full access.
