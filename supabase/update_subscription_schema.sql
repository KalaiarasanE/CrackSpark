-- 1. Alter user_subscriptions Table to add manual verification columns
ALTER TABLE public.user_subscriptions 
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_type TEXT,
  ADD COLUMN IF NOT EXISTS amount NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS admin_remark TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'none' CHECK (payment_status IN ('none', 'pending', 'approved', 'rejected'));

-- 2. Create payment_requests Table
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  amount NUMERIC NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,
  payment_method TEXT NOT NULL,
  screenshot_url TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending' NOT NULL CHECK (payment_status IN ('pending', 'approved', 'rejected')),
  admin_remark TEXT,
  verified_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  verified_at TIMESTAMPTZ
);

-- Enable RLS for payment_requests
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for payment_requests (if not already existing)
DROP POLICY IF EXISTS "Users can view their own payment requests" ON public.payment_requests;
CREATE POLICY "Users can view their own payment requests" 
  ON public.payment_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payment requests" ON public.payment_requests;
CREATE POLICY "Users can insert their own payment requests" 
  ON public.payment_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all payment requests" ON public.payment_requests;
CREATE POLICY "Admins can manage all payment requests" 
  ON public.payment_requests FOR ALL 
  USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

-- 3. Create user_notifications Table
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  link_to TEXT,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for user_notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for user_notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.user_notifications;
CREATE POLICY "Users can view their own notifications" 
  ON public.user_notifications FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL OR auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.user_notifications;
CREATE POLICY "Anyone can insert notifications" 
  ON public.user_notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.user_notifications;
CREATE POLICY "Users can update their own notifications" 
  ON public.user_notifications FOR UPDATE 
  USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

-- 4. Enable replication for realtime updates on payment_requests, user_subscriptions, and user_notifications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Add payment_requests
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'payment_requests'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_requests;
    END IF;

    -- Add user_subscriptions
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'user_subscriptions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;
    END IF;

    -- Add user_notifications
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'user_notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Do nothing
END;
$$;
