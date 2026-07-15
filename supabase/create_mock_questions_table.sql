-- SQL Query to create/migrate mock_questions table in Supabase
-- Run this in your Supabase SQL Editor to set up the Mock Test questions database.

CREATE TABLE IF NOT EXISTS public.mock_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_category TEXT NOT NULL,
  mock_test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE NOT NULL,
  question_number INT DEFAULT 1 NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer VARCHAR(1) NOT NULL, -- 'A', 'B', 'C', 'D'
  explanation TEXT DEFAULT '' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Migration/Alter statements for existing installations:
DO $$
BEGIN
  -- Rename pdf_id to mock_test_id if pdf_id exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mock_questions' AND column_name = 'pdf_id') THEN
    ALTER TABLE public.mock_questions RENAME COLUMN pdf_id TO mock_test_id;
  END IF;

  -- Add question_number column if it does not exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mock_questions' AND column_name = 'question_number') THEN
    ALTER TABLE public.mock_questions ADD COLUMN question_number INT DEFAULT 1;
    ALTER TABLE public.mock_questions ALTER COLUMN question_number DROP DEFAULT;
  END IF;
END $$;

-- Indexing for fast search filtering in user view
CREATE INDEX IF NOT EXISTS idx_mock_questions_mock_test_id ON public.mock_questions(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_mock_questions_exam_category ON public.mock_questions(exam_category);

-- Enable Row Level Security (RLS)
ALTER TABLE public.mock_questions ENABLE ROW LEVEL SECURITY;

-- Enable SELECT access for all authenticated users/visitors
DROP POLICY IF EXISTS "Allow read access for all users" ON public.mock_questions;
CREATE POLICY "Allow read access for all users"
ON public.mock_questions FOR SELECT
USING (true);

-- Enable ALL operations for administrators
DROP POLICY IF EXISTS "Allow all actions for admin/system" ON public.mock_questions;
CREATE POLICY "Allow all actions for admin/system"
ON public.mock_questions FOR ALL
USING (true)
WITH CHECK (true);
