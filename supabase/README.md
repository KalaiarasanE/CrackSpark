# 🚀 Supabase Setup & Troubleshooting Guide for CrackSpark

## 📌 Why Supabase might not work and how to fix it:

### 1. Database Schema missing tables or RLS policies
- **Issue**: If `schema.sql` was not run on your Supabase project, or if older migration scripts were run, tables like `user_notifications`, `user_reviews`, `exam_countdowns`, `mock_questions`, `contact_messages`, and `payment_requests` may be missing.
- **Fix**: Open your **Supabase Dashboard** -> **SQL Editor** -> **New Query**, copy the complete content of `supabase/schema.sql` and click **RUN**.

### 2. Environment Variables (.env)
Ensure your `.env` file contains the correct project credentials:
```env
VITE_SUPABASE_URL=https://wspaqtirqslarbzrnkhf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
SUPABASE_URL=https://wspaqtirqslarbzrnkhf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
```

### 3. Google OAuth & Auth Redirect URLs
- Go to **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
- Add the following Site URL and Redirect URLs:
  - **Site URL**: `https://crackspark.in` (or your domain / `http://localhost:5173`)
  - **Redirect URLs**:
    - `http://localhost:5173/auth/callback`
    - `http://localhost:5173/auth/google/callback`
    - `https://crackspark.in/auth/callback`
    - `https://crackspark.in/auth/google/callback`

### 4. Enable Supabase Realtime
- Go to **Supabase Dashboard** -> **Database** -> **Publications**.
- Ensure `supabase_realtime` is enabled for:
  - `user_notifications`
  - `logged_in_users`
  - `notifications`
  - `user_subscriptions`
  - `payment_requests`
  - `contact_messages`
  - `user_reviews`
  - `exam_countdowns`

### 5. Storage Buckets Setup
The master SQL script automatically creates three public storage buckets:
- `resources` (Study materials & PDFs)
- `avatars` (User profile images)
- `payment-screenshots` (Payment verification receipts)
