-- AnimeHub Database Schema
-- Copy and paste this entire file into your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  subscription_type VARCHAR(20) DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium', 'vip')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Anime Table
CREATE TABLE anime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  title_japanese VARCHAR(255),
  description TEXT,
  poster_url TEXT,
  banner_url TEXT,
  trailer_url TEXT,
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  year INTEGER,
  status VARCHAR(20) CHECK (status IN ('ongoing', 'completed', 'upcoming')),
  type VARCHAR(20) CHECK (type IN ('tv', 'movie', 'ova', 'special')),
  genres TEXT[],
  studios TEXT[],
  total_episodes INTEGER,
  duration INTEGER, -- minutes per episode
  age_rating VARCHAR(10) CHECK (age_rating IN ('G', 'PG', 'PG-13', 'R', '18+')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Episodes Table
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(anime_id, episode_number)
);

-- 4. User Progress Table
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  progress_seconds INTEGER DEFAULT 0 CHECK (progress_seconds >= 0),
  is_completed BOOLEAN DEFAULT FALSE,
  last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, episode_id)
);

-- 5. User Favorites Table
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, anime_id)
);

-- 6. User Watchlist Table
CREATE TABLE user_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, anime_id)
);

-- 7. Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  review_text TEXT,
  is_spoiler BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, anime_id)
);

-- 8. Create Indexes for Better Performance
CREATE INDEX idx_anime_genres ON anime USING GIN (genres);
CREATE INDEX idx_anime_year ON anime (year);
CREATE INDEX idx_anime_rating ON anime (rating);
CREATE INDEX idx_anime_status ON anime (status);
CREATE INDEX idx_anime_type ON anime (type);
CREATE INDEX idx_episodes_anime_id ON episodes (anime_id);
CREATE INDEX idx_episodes_number ON episodes (anime_id, episode_number);
CREATE INDEX idx_user_progress_user_id ON user_progress (user_id);
CREATE INDEX idx_user_progress_last_watched ON user_progress (last_watched);
CREATE INDEX idx_user_favorites_user_id ON user_favorites (user_id);
CREATE INDEX idx_user_watchlist_user_id ON user_watchlist (user_id);
CREATE INDEX idx_reviews_anime_id ON reviews (anime_id);
CREATE INDEX idx_reviews_rating ON reviews (rating);

-- 9. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS Policies

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Anime policies (public read access)
CREATE POLICY "Anyone can view anime" ON anime
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert anime" ON anime
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update anime" ON anime
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can delete anime" ON anime
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Episodes policies (public read access)
CREATE POLICY "Anyone can view episodes" ON episodes
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert episodes" ON episodes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update episodes" ON episodes
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can delete episodes" ON episodes
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- User progress policies
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

-- User favorites policies
CREATE POLICY "Users can view own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites" ON user_favorites
  FOR ALL USING (auth.uid() = user_id);

-- User watchlist policies
CREATE POLICY "Users can view own watchlist" ON user_watchlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own watchlist" ON user_watchlist
  FOR ALL USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own reviews" ON reviews
  FOR ALL USING (auth.uid() = user_id);

-- 11. Create Functions for Updated Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Create Triggers for Updated Timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anime_updated_at BEFORE UPDATE ON anime
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Insert Sample Data (Optional - for testing)

-- Insert sample users
INSERT INTO users (id, email, username, subscription_type) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'admin@animehub.com', 'admin', 'vip'),
  ('550e8400-e29b-41d4-a716-446655440001', 'user@example.com', 'animefan', 'premium'),
  ('550e8400-e29b-41d4-a716-446655440002', 'free@example.com', 'freeuser', 'free');

-- Insert sample anime
INSERT INTO anime (id, title, title_japanese, description, rating, year, status, type, genres, studios, total_episodes, duration, age_rating) VALUES
  ('660e8400-e29b-41d4-a716-446655440000', 'Spirited Away', '千と千尋の神隠し', 'A young girl becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.', 9.3, 2001, 'completed', 'movie', ARRAY['Fantasy', 'Adventure', 'Family'], ARRAY['Studio Ghibli'], 1, 125, 'PG'),
  ('660e8400-e29b-41d4-a716-446655440001', 'Princess Mononoke', 'もののけ姫', 'On a journey to find the cure for a Tatarigami curse, Ashitaka finds himself in the middle of a war between the forest gods and Tatara, a mining colony.', 9.1, 1997, 'completed', 'movie', ARRAY['Fantasy', 'Drama', 'Adventure'], ARRAY['Studio Ghibli'], 1, 134, 'PG-13'),
  ('660e8400-e29b-41d4-a716-446655440002', 'My Neighbor Totoro', 'となりのトトロ', 'When two girls move to the country to be near their ailing mother, they have adventures with the wondrous forest spirits who live nearby.', 8.9, 1988, 'completed', 'movie', ARRAY['Fantasy', 'Family', 'Adventure'], ARRAY['Studio Ghibli'], 1, 86, 'G'),
  ('660e8400-e29b-41d4-a716-446655440003', 'Attack on Titan', '進撃の巨人', 'Humanity fights for survival against the Titans.', 9.0, 2013, 'completed', 'tv', ARRAY['Action', 'Drama', 'Fantasy'], ARRAY['Wit Studio', 'MAPPA'], 75, 24, 'R'),
  ('660e8400-e29b-41d4-a716-446655440004', 'Demon Slayer', '鬼滅の刃', 'A young boy becomes a demon slayer to save his sister.', 8.8, 2019, 'ongoing', 'tv', ARRAY['Action', 'Supernatural', 'Historical'], ARRAY['Ufotable'], 44, 23, 'R');

-- Insert sample episodes
INSERT INTO episodes (id, anime_id, episode_number, title, description, duration, is_premium) VALUES
  -- Spirited Away (movie)
  ('770e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 1, 'Spirited Away', 'Full movie', 7500, false),
  
  -- Princess Mononoke (movie)
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 1, 'Princess Mononoke', 'Full movie', 8040, false),
  
  -- My Neighbor Totoro (movie)
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 1, 'My Neighbor Totoro', 'Full movie', 5160, false),
  
  -- Attack on Titan (sample episodes)
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 1, 'To You, in 2000 Years', 'Eren dreams of a mysterious girl.', 1440, false),
  ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', 2, 'That Day', 'The Colossal Titan appears.', 1440, false),
  ('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440003', 3, 'A Dim Light Amid Despair', 'Eren joins the military.', 1440, true),
  
  -- Demon Slayer (sample episodes)
  ('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440004', 1, 'Cruelty', 'Tanjiro becomes a demon slayer.', 1380, false),
  ('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440004', 2, 'Trainer Sakonji Urokodaki', 'Training begins.', 1380, false),
  ('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440004', 3, 'Sabito and Makomo', 'Advanced training.', 1380, true);

-- Insert sample user progress
INSERT INTO user_progress (user_id, episode_id, progress_seconds, is_completed) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440000', 3600, false),
  ('550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 720, false),
  ('550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440006', 1380, true);

-- Insert sample favorites
INSERT INTO user_favorites (user_id, anime_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440000'),
  ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003'),
  ('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001');

-- Insert sample watchlist
INSERT INTO user_watchlist (user_id, anime_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004'),
  ('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003');

-- Insert sample reviews
INSERT INTO reviews (user_id, anime_id, rating, review_text, is_spoiler) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440000', 10, 'Masterpiece! One of the greatest animated films ever made.', false),
  ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 9, 'Incredible storytelling and animation. Must watch!', false),
  ('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 8, 'Beautiful film with deep themes about nature and humanity.', false);

-- 14. Create Storage Buckets (Run these in Storage section, not SQL editor)
-- Go to Storage in Supabase dashboard and create these buckets:
-- - anime-posters (public)
-- - anime-banners (public)  
-- - anime-thumbnails (public)
-- - anime-videos (private)

-- 15. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Database schema setup complete! 🎌
-- You can now start using your anime streaming platform backend.
