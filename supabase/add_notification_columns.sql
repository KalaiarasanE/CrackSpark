-- SQL Migration Script
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query) to add the advanced metadata columns for the notifications pipeline.

ALTER TABLE public.user_notifications 
  ADD COLUMN IF NOT EXISTS notification_type TEXT,
  ADD COLUMN IF NOT EXISTS related_exam TEXT,
  ADD COLUMN IF NOT EXISTS related_resource_id TEXT,
  ADD COLUMN IF NOT EXISTS redirect_url TEXT;

-- Verify/Ensure replication is enabled for user_notifications realtime updates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'user_notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
    END IF;
  END IF;
END $$;
