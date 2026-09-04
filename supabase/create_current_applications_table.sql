-- =========================================================================
-- CRACKSPARK - CURRENT APPLICATIONS TABLE MIGRATION
-- Run this in your Supabase SQL Editor:
-- (Supabase Dashboard > SQL Editor > New Query > Paste & Run)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.current_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  website_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for ordering by recency
CREATE INDEX IF NOT EXISTS idx_current_applications_created_at ON public.current_applications(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.current_applications ENABLE ROW LEVEL SECURITY;

-- 1. Public Read: Any visitor/aspirant can read current applications
DROP POLICY IF EXISTS "Public read current_applications" ON public.current_applications;
CREATE POLICY "Public read current_applications" 
  ON public.current_applications FOR SELECT 
  USING (true);

-- 2. Admin Management: Admin can insert, update, and delete current applications
DROP POLICY IF EXISTS "Admins can manage current_applications" ON public.current_applications;
CREATE POLICY "Admins can manage current_applications" 
  ON public.current_applications FOR ALL 
  USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');
