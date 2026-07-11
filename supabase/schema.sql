-- Supabase Database Schema
-- Run these queries in your Supabase SQL Editor to enable cloud-side persistence for bookmarks and progress checklist features.

-- 1. Create Bookmarks Table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exam_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, exam_key)
);

-- 2. Create Roadmap Progress Table (Step-by-step checklist)
CREATE TABLE IF NOT EXISTS public.roadmap_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exam_id TEXT NOT NULL,
  step_number INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, exam_id, step_number)
);

-- 3. Create Weekly Study Progress Table
CREATE TABLE IF NOT EXISTS public.weekly_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exam_id TEXT NOT NULL,
  week_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, exam_id, week_name)
);

-- 4. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  publish_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  important_links JSONB DEFAULT '[]'::jsonb NOT NULL,
  is_pinned BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Create Previous Year Papers Table
CREATE TABLE IF NOT EXISTS public.previous_papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_name TEXT NOT NULL,
  year INT NOT NULL,
  subject TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Create Mock Tests Table
CREATE TABLE IF NOT EXISTS public.mock_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id TEXT NOT NULL,
  title TEXT NOT NULL,
  questions_count INT NOT NULL,
  duration TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  pdf_url TEXT,
  questions_json JSONB,
  is_enabled BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Create Current Affairs Table
CREATE TABLE IF NOT EXISTS public.current_affairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  pdf_url TEXT,
  image_url TEXT,
  category TEXT NOT NULL,
  period TEXT NOT NULL,
  publish_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Create Study Materials Table
CREATE TABLE IF NOT EXISTS public.study_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Create FAQs Table
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. Create Exam Details Table (for admin official website configuration)
CREATE TABLE IF NOT EXISTS public.exam_details (
  exam_key TEXT PRIMARY KEY,
  official_website_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS) for privacy
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.previous_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_affairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_details ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies so users can only access their own data
CREATE POLICY "Users can manage their own bookmarks" 
  ON public.bookmarks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own roadmap progress" 
  ON public.roadmap_progress FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own weekly progress" 
  ON public.weekly_progress FOR ALL USING (auth.uid() = user_id);

-- Read access policies (open to public read)
CREATE POLICY "Public read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Public read previous_papers" ON public.previous_papers FOR SELECT USING (true);
CREATE POLICY "Public read mock_tests" ON public.mock_tests FOR SELECT USING (true);
CREATE POLICY "Public read current_affairs" ON public.current_affairs FOR SELECT USING (true);
CREATE POLICY "Public read study_materials" ON public.study_materials FOR SELECT USING (true);
CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Public read exam_details" ON public.exam_details FOR SELECT USING (true);

-- Admin mutation policies (only kalaiarasane28@gmail.com can manage)
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL 
  USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');
CREATE POLICY "Admins can manage previous_papers" ON public.previous_papers FOR ALL 
  USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');
CREATE POLICY "Admins can manage mock_tests" ON public.mock_tests FOR ALL 
  USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');
CREATE POLICY "Admins can manage current_affairs" ON public.current_affairs FOR ALL 
  USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');
CREATE POLICY "Admins can manage study_materials" ON public.study_materials FOR ALL 
  USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');
CREATE POLICY "Admins can manage faqs" ON public.faqs FOR ALL 
  USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');
CREATE POLICY "Admins can manage exam_details" ON public.exam_details FOR ALL 
  USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

-- 11. Storage bucket configuration and object policies
-- Create 'resources' bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for public read access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'resources');

-- Storage policies for admin write access (email kalaiarasane28@gmail.com)
CREATE POLICY "Admin Insert Objects" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'resources' AND auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

CREATE POLICY "Admin Update Objects" ON storage.objects FOR UPDATE 
  USING (bucket_id = 'resources' AND auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

CREATE POLICY "Admin Delete Objects" ON storage.objects FOR DELETE 
  USING (bucket_id = 'resources' AND auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

-- 12. Create User Subscriptions Table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  is_subscribed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for user_subscriptions
CREATE POLICY "Users can read their own subscription" 
  ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update their own subscription" 
  ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
  ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" 
  ON public.user_subscriptions FOR SELECT USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

CREATE POLICY "Admins can manage all subscriptions" 
  ON public.user_subscriptions FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');


-- 13. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for users table
CREATE POLICY "Allow anon insert user profile" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.users FOR SELECT USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');
CREATE POLICY "Admins can manage all profiles" ON public.users FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

-- Automatically handle user profile creation on signup via database trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    -- Insert into public.users if email doesn't exist
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = new.email) THEN
      INSERT INTO public.users (id, full_name, email, profile_image, created_at)
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email,
        new.raw_user_meta_data->>'avatar_url',
        COALESCE(new.created_at, NOW())
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore any errors during users insert
  END;
  
  BEGIN
    -- Insert into public.user_subscriptions
    INSERT INTO public.user_subscriptions (user_id, email, name, is_subscribed, created_at, updated_at)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      false,
      COALESCE(new.created_at, NOW()),
      COALESCE(new.created_at, NOW())
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore any errors during user_subscriptions insert
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 14. Create Logged In Users Table
CREATE TABLE IF NOT EXISTS public.logged_in_users (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  profile_image TEXT,
  login_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_active_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'Online' NOT NULL CHECK (status IN ('Online', 'Offline'))
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.logged_in_users ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for logged_in_users table
CREATE POLICY "Admins can manage all logged_in_users" 
  ON public.logged_in_users FOR ALL 
  USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

CREATE POLICY "Users can read their own status" 
  ON public.logged_in_users FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own status" 
  ON public.logged_in_users FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own status" 
  ON public.logged_in_users FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable replication for realtime updates on logged_in_users and notifications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.logged_in_users;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Do nothing
END;
$$;


-- 15. Create delete_user_by_admin function for admin user deletion
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Check if the current user is the admin (kalaiarasane28@gmail.com)
  IF auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com' THEN
    DELETE FROM auth.users WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized: Only admins can delete users';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Create 'avatars' storage bucket and configure security policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for public read access to avatars
CREATE POLICY "Public Access Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Storage policies for users to insert their own avatars
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for users to update their own avatars
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for users to delete their own avatars
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);


-- 17. Create payment_requests table
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

-- Alter table to add verified_by if table already exists
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS verified_by TEXT;

-- Alter user_subscriptions table to support manual verification details
ALTER TABLE public.user_subscriptions 
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_type TEXT,
  ADD COLUMN IF NOT EXISTS amount NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS admin_remark TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'none' CHECK (payment_status IN ('none', 'pending', 'approved', 'rejected'));

-- Enable Row Level Security (RLS) for payment_requests
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Policies for payment_requests
CREATE POLICY "Users can view their own payment requests" 
  ON public.payment_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment requests" 
  ON public.payment_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payment requests" 
  ON public.payment_requests FOR ALL 
  USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

-- Create storage bucket 'payment-screenshots' if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for public read access to payment screenshots
CREATE POLICY "Public Access Payment Screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'payment-screenshots');

-- Storage policies for users to insert their own payment screenshots
CREATE POLICY "Users can upload their own payment screenshots" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for users to update their own payment screenshots
CREATE POLICY "Users can update their own payment screenshots" ON storage.objects FOR UPDATE
  USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for users to delete their own payment screenshots
CREATE POLICY "Users can delete their own payment screenshots" ON storage.objects FOR DELETE
  USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable replication for realtime updates on payment_requests and user_subscriptions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_requests;
    -- Note: user_subscriptions is already in publication or we can add it safely
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'user_subscriptions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Do nothing
END;
$$;



