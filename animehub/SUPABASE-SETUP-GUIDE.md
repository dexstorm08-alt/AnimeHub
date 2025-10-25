# 🚀 Supabase Setup Guide for AnimeHub

## The Issue
Your admin panel is showing "Request timeout" because Supabase is not configured. The app is trying to connect to a placeholder database URL.

## Quick Fix

### Step 1: Create Supabase Project
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project name: `animehub` (or any name you prefer)
5. Enter database password (save this!)
6. Choose region closest to you
7. Click "Create new project"

### Step 2: Get Your Credentials
1. Wait for project to be ready (2-3 minutes)
2. Go to **Settings** → **API**
3. Copy these values:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 3: Create Environment File
1. In your project root (`animehub` folder), create a file called `.env.local`
2. Add these lines (replace with your actual values):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Create Database Tables
Run this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create anime table
CREATE TABLE anime (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_japanese TEXT,
  description TEXT,
  poster_url TEXT,
  banner_url TEXT,
  trailer_url TEXT,
  rating DECIMAL(3,1),
  year INTEGER,
  status TEXT CHECK (status IN ('ongoing', 'completed', 'upcoming')),
  type TEXT CHECK (type IN ('tv', 'movie', 'ova', 'special')),
  genres TEXT[],
  studios TEXT[],
  total_episodes INTEGER,
  duration INTEGER,
  age_rating TEXT CHECK (age_rating IN ('G', 'PG', 'PG-13', 'R', '18+')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create episodes table
CREATE TABLE episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  duration INTEGER,
  is_premium BOOLEAN DEFAULT FALSE,
  air_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - you can restrict later)
CREATE POLICY "Allow all operations on anime" ON anime FOR ALL USING (true);
CREATE POLICY "Allow all operations on episodes" ON episodes FOR ALL USING (true);
```

### Step 5: Restart Development Server
1. Stop your current dev server (Ctrl+C)
2. Run: `npm run dev`
3. Check browser console - you should see "✅ Supabase Authentication Configured Successfully!"

## Test the Fix
1. Go to Admin Panel → Anime Management
2. Click "Add New Anime"
3. Click "Demo Data" button
4. Click "Create Anime"
5. Should work without timeout!

## Troubleshooting

### Still getting timeout?
- Check `.env.local` file exists in `animehub` folder
- Verify URLs don't have extra spaces
- Restart dev server after creating `.env.local`
- Check browser console for error messages

### Database errors?
- Make sure you ran the SQL commands in Supabase
- Check if tables exist in Supabase dashboard
- Verify RLS policies are set correctly

### Need help?
- Check Supabase docs: [https://supabase.com/docs](https://supabase.com/docs)
- Supabase Discord: [https://discord.supabase.com](https://discord.supabase.com)

---

**Note**: This setup creates a basic database structure. You can add more tables (users, favorites, etc.) later as needed.
