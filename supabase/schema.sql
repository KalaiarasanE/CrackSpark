-- =========================================================================
-- CRACKSPARK GOVERNMENT EXAM PORTAL - COMPLETE MASTER DATABASE SCHEMA
-- Paste and execute this entire script in your Supabase SQL Editor:
-- (Supabase Dashboard > SQL Editor > New Query > Paste & Run)
-- =========================================================================

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

-- 4. Create Notifications Table (Portal-wide announcements)
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

-- 10. Create Exam Details Table (Official website configuration)
CREATE TABLE IF NOT EXISTS public.exam_details (
  exam_key TEXT PRIMARY KEY,
  official_website_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. Create User Subscriptions Table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  is_subscribed BOOLEAN DEFAULT false NOT NULL,
  start_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  plan_type TEXT,
  amount NUMERIC,
  payment_method TEXT,
  transaction_id TEXT,
  admin_remark TEXT,
  payment_status TEXT DEFAULT 'none' CHECK (payment_status IN ('none', 'pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. Create Users Profile Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. Create Logged In Users Table (Online/Offline Realtime Presence)
CREATE TABLE IF NOT EXISTS public.logged_in_users (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  profile_image TEXT,
  login_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_active_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'Online' NOT NULL CHECK (status IN ('Online', 'Offline'))
);

-- 14. Create Payment Requests Table (QR / UPI Payment Submissions)
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

-- 15. Create User Notifications Table (User & Admin Targeted Alerts)
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  link_to TEXT,
  notification_type TEXT,
  related_exam TEXT,
  related_resource_id TEXT,
  redirect_url TEXT,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 16. Create Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 17. Create Mock Questions Table
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
  correct_answer VARCHAR(1) NOT NULL,
  explanation TEXT DEFAULT '' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 18. Create Exam Countdowns Table
CREATE TABLE IF NOT EXISTS public.exam_countdowns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_name TEXT NOT NULL,
  exam_category TEXT NOT NULL,
  exam_datetime TIMESTAMPTZ NOT NULL,
  badge TEXT,
  color TEXT DEFAULT 'amber' NOT NULL,
  display_order INT DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 19. Create User Reviews Table
CREATE TABLE IF NOT EXISTS public.user_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  user_name TEXT NOT NULL,
  profile_image TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title TEXT NOT NULL,
  review_description TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 20. Create Exams Table
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  exam_key TEXT UNIQUE NOT NULL,
  official_website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =========================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_progress_user_id ON public.roadmap_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_progress_user_id ON public.weekly_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_exam_id ON public.study_materials(exam_id);
CREATE INDEX IF NOT EXISTS idx_mock_tests_exam_id ON public.mock_tests(exam_id);
CREATE INDEX IF NOT EXISTS idx_mock_questions_mock_test_id ON public.mock_questions(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_mock_questions_exam_category ON public.mock_questions(exam_category);
CREATE INDEX IF NOT EXISTS idx_previous_papers_exam_name ON public.previous_papers(exam_name);
CREATE INDEX IF NOT EXISTS idx_faqs_exam_id ON public.faqs(exam_id);
CREATE INDEX IF NOT EXISTS idx_current_affairs_category ON public.current_affairs(category);
CREATE INDEX IF NOT EXISTS idx_current_affairs_period ON public.current_affairs(period);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON public.payment_requests(user_id);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
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
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logged_in_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_countdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- User Personal Data Policies (with WITH CHECK)
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can manage their own bookmarks" 
  ON public.bookmarks FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own roadmap progress" ON public.roadmap_progress;
CREATE POLICY "Users can manage their own roadmap progress" 
  ON public.roadmap_progress FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own weekly progress" ON public.weekly_progress;
CREATE POLICY "Users can manage their own weekly progress" 
  ON public.weekly_progress FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can read their own subscription" 
  ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert/update their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can insert/update their own subscription" 
  ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can update their own subscription" 
  ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow anon insert user profile" ON public.users;
CREATE POLICY "Allow anon insert user profile" ON public.users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read their own profile" ON public.users;
CREATE POLICY "Users can read their own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Logged In Users Policies
DROP POLICY IF EXISTS "Users can read their own status" ON public.logged_in_users;
CREATE POLICY "Users can read their own status" ON public.logged_in_users FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own status" ON public.logged_in_users;
CREATE POLICY "Users can insert their own status" ON public.logged_in_users FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own status" ON public.logged_in_users;
CREATE POLICY "Users can update their own status" ON public.logged_in_users FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Payment Requests Policies
DROP POLICY IF EXISTS "Users can view their own payment requests" ON public.payment_requests;
CREATE POLICY "Users can view their own payment requests" ON public.payment_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payment requests" ON public.payment_requests;
CREATE POLICY "Users can insert their own payment requests" ON public.payment_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Notifications Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.user_notifications;
CREATE POLICY "Users can view their own notifications" 
  ON public.user_notifications FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL OR auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.user_notifications;
CREATE POLICY "Anyone can insert notifications" ON public.user_notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.user_notifications;
CREATE POLICY "Users can update their own notifications" 
  ON public.user_notifications FOR UPDATE 
  USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

-- Contact Messages Policies
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- User Reviews Policies
DROP POLICY IF EXISTS "Public read approved reviews" ON public.user_reviews;
CREATE POLICY "Public read approved reviews" ON public.user_reviews FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Users can insert/update their own review" ON public.user_reviews;
CREATE POLICY "Users can insert/update their own review" ON public.user_reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Public Read Policies
DROP POLICY IF EXISTS "Public read notifications" ON public.notifications;
CREATE POLICY "Public read notifications" ON public.notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read previous_papers" ON public.previous_papers;
CREATE POLICY "Public read previous_papers" ON public.previous_papers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read mock_tests" ON public.mock_tests;
CREATE POLICY "Public read mock_tests" ON public.mock_tests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read current_affairs" ON public.current_affairs;
CREATE POLICY "Public read current_affairs" ON public.current_affairs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read study_materials" ON public.study_materials;
CREATE POLICY "Public read study_materials" ON public.study_materials FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read faqs" ON public.faqs;
CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read exam_details" ON public.exam_details;
CREATE POLICY "Public read exam_details" ON public.exam_details FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read mock_questions" ON public.mock_questions;
CREATE POLICY "Public read mock_questions" ON public.mock_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read exam_countdowns" ON public.exam_countdowns;
CREATE POLICY "Public read exam_countdowns" ON public.exam_countdowns FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read exams" ON public.exams;
CREATE POLICY "Public read exams" ON public.exams FOR SELECT USING (true);

-- Admin Mutation Policies (Only kalaiarasane28@gmail.com)
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can manage previous_papers" ON public.previous_papers;
CREATE POLICY "Admins can manage previous_papers" ON public.previous_papers FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can manage mock_tests" ON public.mock_tests;
CREATE POLICY "Admins can manage mock_tests" ON public.mock_tests FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can manage current_affairs" ON public.current_affairs;
CREATE POLICY "Admins can manage current_affairs" ON public.current_affairs FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can manage study_materials" ON public.study_materials;
CREATE POLICY "Admins can manage study_materials" ON public.study_materials FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can manage faqs" ON public.faqs;
CREATE POLICY "Admins can manage faqs" ON public.faqs FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can manage exam_details" ON public.exam_details;
CREATE POLICY "Admins can manage exam_details" ON public.exam_details FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
CREATE POLICY "Admins can view all profiles" ON public.users FOR SELECT USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.users;
CREATE POLICY "Admins can manage all profiles" ON public.users FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can manage all logged_in_users" ON public.logged_in_users;
CREATE POLICY "Admins can manage all logged_in_users" ON public.logged_in_users FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can manage all payment requests" ON public.payment_requests;
CREATE POLICY "Admins can manage all payment requests" ON public.payment_requests FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view contact messages" ON public.contact_messages FOR SELECT USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can manage mock_questions" ON public.mock_questions;
CREATE POLICY "Admins can manage mock_questions" ON public.mock_questions FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can manage exam_countdowns" ON public.exam_countdowns;
CREATE POLICY "Admins can manage exam_countdowns" ON public.exam_countdowns FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can manage user_reviews" ON public.user_reviews;
CREATE POLICY "Admins can manage user_reviews" ON public.user_reviews FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;
CREATE POLICY "Admins can manage exams" ON public.exams FOR ALL USING (auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

-- =========================================================================
-- STORAGE BUCKETS & SECURITY POLICIES
-- =========================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', true) ON CONFLICT (id) DO NOTHING;

-- Storage Public Read
DROP POLICY IF EXISTS "Public Access Resources" ON storage.objects;
CREATE POLICY "Public Access Resources" ON storage.objects FOR SELECT USING (bucket_id = 'resources');

DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
CREATE POLICY "Public Access Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public Access Payment Screenshots" ON storage.objects;
CREATE POLICY "Public Access Payment Screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'payment-screenshots');

-- Storage Admin Write for Resources
DROP POLICY IF EXISTS "Admin Insert Objects" ON storage.objects;
CREATE POLICY "Admin Insert Objects" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources' AND auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admin Update Objects" ON storage.objects;
CREATE POLICY "Admin Update Objects" ON storage.objects FOR UPDATE USING (bucket_id = 'resources' AND auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

DROP POLICY IF EXISTS "Admin Delete Objects" ON storage.objects;
CREATE POLICY "Admin Delete Objects" ON storage.objects FOR DELETE USING (bucket_id = 'resources' AND auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com');

-- Storage User Write for Avatars
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage User Write for Payment Screenshots
DROP POLICY IF EXISTS "Users can upload their own payment screenshots" ON storage.objects;
CREATE POLICY "Users can upload their own payment screenshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own payment screenshots" ON storage.objects;
CREATE POLICY "Users can update their own payment screenshots" ON storage.objects FOR UPDATE USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own payment screenshots" ON storage.objects;
CREATE POLICY "Users can delete their own payment screenshots" ON storage.objects FOR DELETE USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =========================================================================
-- DATABASE FUNCTIONS & TRIGGERS
-- =========================================================================

-- Function: Automatically handle user profile & subscription creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
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
    -- Ignore error
  END;
  
  BEGIN
    INSERT INTO public.user_subscriptions (user_id, email, name, is_subscribed, payment_status, created_at, updated_at)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      false,
      'none',
      COALESCE(new.created_at, NOW()),
      COALESCE(new.created_at, NOW())
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore error
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Delete user by admin RPC
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS void AS $$
BEGIN
  IF auth.jwt() ->> 'email' = 'kalaiarasane28@gmail.com' THEN
    DELETE FROM auth.users WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized: Only admins can delete users';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: New User Registered -> User Notification
CREATE OR REPLACE FUNCTION public.notify_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_notifications (user_id, title, message, type, link_to, is_read)
  VALUES (
    null,
    'New User Registration',
    'A new user has registered: ' || COALESCE(new.full_name, new.email),
    'new_user',
    '/admin?section=users',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_user_registered ON public.users;
CREATE TRIGGER on_new_user_registered
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_user();

-- Trigger: New Review Submitted -> User Notification
CREATE OR REPLACE FUNCTION public.notify_new_review()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_notifications (user_id, title, message, type, link_to, is_read)
  VALUES (
    null,
    'New User Review',
    'A new review has been submitted by ' || COALESCE(new.user_name, 'Aspirant'),
    'review',
    '/admin?section=reviews',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_review_submitted ON public.user_reviews;
CREATE TRIGGER on_new_review_submitted
  AFTER INSERT ON public.user_reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_review();

-- Trigger: New Contact Form Message -> User Notification
CREATE OR REPLACE FUNCTION public.notify_new_contact_message()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_notifications (user_id, title, message, type, link_to, is_read)
  VALUES (
    null,
    'New Contact Message',
    'New contact message received from ' || new.name || ' (' || new.email || ')',
    'contact',
    '/admin?section=overview',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_contact_message ON public.contact_messages;
CREATE TRIGGER on_new_contact_message
  AFTER INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_contact_message();

-- =========================================================================
-- SUPABASE REALTIME REPLICATION SETUP
-- =========================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'logged_in_users') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.logged_in_users;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_notifications') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_subscriptions') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'payment_requests') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_requests;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'contact_messages') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'exam_countdowns') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_countdowns;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_reviews') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_reviews;
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignore error
END;
$$;
