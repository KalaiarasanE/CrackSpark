-- SQL Query to create mock_questions table in Supabase
-- Run this in your Supabase SQL Editor to set up the Mock Test questions database.

CREATE TABLE IF NOT EXISTS public.mock_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_category TEXT NOT NULL,
  pdf_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer VARCHAR(1) NOT NULL, -- 'A', 'B', 'C', 'D'
  explanation TEXT DEFAULT '' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexing for fast search filtering in user view
CREATE INDEX IF NOT EXISTS idx_mock_questions_pdf_id ON public.mock_questions(pdf_id);
CREATE INDEX IF NOT EXISTS idx_mock_questions_exam_category ON public.mock_questions(exam_category);

-- Enable Row Level Security (RLS)
ALTER TABLE public.mock_questions ENABLE ROW LEVEL SECURITY;

-- Enable SELECT access for all authenticated users/visitors
CREATE POLICY "Allow read access for all users"
ON public.mock_questions FOR SELECT
USING (true);

-- Enable ALL operations for administrators
CREATE POLICY "Allow all actions for admin/system"
ON public.mock_questions FOR ALL
USING (true)
WITH CHECK (true);
