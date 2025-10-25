# 🎌 AnimeHub Backend Setup Guide

## 🏗️ Architecture Overview

```
Frontend (React) ↔ API Routes (Next.js) ↔ Supabase (PostgreSQL + Auth + Storage)
```

## 📋 Database Schema

### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  subscription_type VARCHAR(20) DEFAULT 'free', -- free, premium, vip
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Anime Table
```sql
CREATE TABLE anime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  title_japanese VARCHAR(255),
  description TEXT,
  poster_url TEXT,
  banner_url TEXT,
  trailer_url TEXT,
  rating DECIMAL(3,1),
  year INTEGER,
  status VARCHAR(20), -- ongoing, completed, upcoming
  type VARCHAR(20), -- tv, movie, ova, special
  genres TEXT[], -- Array of genres
  studios TEXT[], -- Array of studios
  total_episodes INTEGER,
  duration INTEGER, -- minutes per episode
  age_rating VARCHAR(10), -- G, PG, PG-13, R
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Episodes Table
```sql
CREATE TABLE episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title VARCHAR(255),
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  duration INTEGER, -- seconds
  is_premium BOOLEAN DEFAULT FALSE,
  air_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(anime_id, episode_number)
);
```

### 4. User Progress Table
```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  progress_seconds INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  last_watched TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, episode_id)
);
```

### 5. User Favorites Table
```sql
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, anime_id)
);
```

### 6. User Watchlist Table
```sql
CREATE TABLE user_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, anime_id)
);
```

### 7. Reviews Table
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  review_text TEXT,
  is_spoiler BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, anime_id)
);
```

## 🔐 Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- User progress policies
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

-- Similar policies for favorites, watchlist, and reviews...
```

## 📁 File Storage Structure

```
/anime-posters/
/anime-banners/
/anime-thumbnails/
/anime-videos/
  /[anime-id]/
    /episode-1.mp4
    /episode-2.mp4
    ...
```

## 🔑 Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🚀 Next Steps

1. Set up Supabase project
2. Run the SQL schema
3. Configure storage buckets
4. Set up authentication
5. Create API routes
6. Test the integration
