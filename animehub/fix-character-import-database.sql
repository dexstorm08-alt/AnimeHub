-- COMPREHENSIVE DATABASE FIX FOR CHARACTER IMPORT
-- Run this entire script in your Supabase SQL Editor

-- Step 1: Drop existing tables if they exist (to recreate with correct schema)
DROP TABLE IF EXISTS anime_studio_relations CASCADE;
DROP TABLE IF EXISTS anime_characters CASCADE;
DROP TABLE IF EXISTS anime_relations CASCADE;
DROP TABLE IF EXISTS anime_studios CASCADE;

-- Step 2: Create tables with correct schema

-- 1. Anime Relations Table
CREATE TABLE IF NOT EXISTS anime_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  related_anime_id TEXT NOT NULL, -- Can be MAL ID or AniList ID
  relation_type VARCHAR(50) NOT NULL, -- e.g., 'sequel', 'prequel', 'adaptation', 'side_story', 'summary', 'alternative', 'other'
  anilist_id INTEGER, -- AniList ID of the related anime
  mal_id INTEGER,     -- MyAnimeList ID of the related anime
  title VARCHAR(255),
  format VARCHAR(50),
  status VARCHAR(50),
  episodes INTEGER,
  year INTEGER,
  poster_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicate relations
  UNIQUE(anime_id, related_anime_id, relation_type)
);

-- 2. Anime Characters Table
CREATE TABLE IF NOT EXISTS anime_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_japanese VARCHAR(255),
  name_romaji VARCHAR(255),
  image_url TEXT,
  role VARCHAR(50) CHECK (role IN ('main', 'supporting', 'antagonist', 'background')),
  description TEXT,
  voice_actor VARCHAR(255),
  voice_actor_japanese VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicate characters for the same anime by name
  UNIQUE(anime_id, name) 
);

-- 3. Anime Studios Table
CREATE TABLE IF NOT EXISTS anime_studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anilist_id INTEGER UNIQUE, -- AniList ID for the studio
  name VARCHAR(255) NOT NULL UNIQUE,
  name_japanese VARCHAR(255),
  description TEXT,
  website TEXT,
  logo_url TEXT,
  founded_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Anime-Studio Relations Table
CREATE TABLE IF NOT EXISTS anime_studio_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  studio_id UUID REFERENCES anime_studios(id) ON DELETE CASCADE,
  role VARCHAR(50) CHECK (role IN ('animation', 'production', 'music', 'sound', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(anime_id, studio_id, role)
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_anime_relations_anime_id ON anime_relations(anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_relations_related_anime_id ON anime_relations(related_anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_relations_type ON anime_relations(relation_type);
CREATE INDEX IF NOT EXISTS idx_anime_characters_anime_id ON anime_characters(anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_characters_role ON anime_characters(role);
CREATE INDEX IF NOT EXISTS idx_anime_studio_relations_anime_id ON anime_studio_relations(anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_studio_relations_studio_id ON anime_studio_relations(studio_id);

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE anime_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime_studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime_studio_relations ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop any existing policies first
DROP POLICY IF EXISTS "Allow authenticated users to read anime_relations" ON anime_relations;
DROP POLICY IF EXISTS "Allow authenticated users to read anime_characters" ON anime_characters;
DROP POLICY IF EXISTS "Allow authenticated users to read anime_studios" ON anime_studios;
DROP POLICY IF EXISTS "Allow authenticated users to read anime_studio_relations" ON anime_studio_relations;
DROP POLICY IF EXISTS "Allow admins to manage anime_relations" ON anime_relations;
DROP POLICY IF EXISTS "Allow admins to manage anime_characters" ON anime_characters;
DROP POLICY IF EXISTS "Allow admins to manage anime_studios" ON anime_studios;
DROP POLICY IF EXISTS "Allow admins to manage anime_studio_relations" ON anime_studio_relations;

-- Step 6: Create PERMISSIVE RLS Policies for authenticated users
-- This allows any authenticated user to manage these tables (needed for import)

CREATE POLICY "Allow authenticated users to manage anime_relations" ON anime_relations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage anime_characters" ON anime_characters
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage anime_studios" ON anime_studios
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage anime_studio_relations" ON anime_studio_relations
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 7: Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_anime_relations_updated_at ON anime_relations;
CREATE TRIGGER update_anime_relations_updated_at 
  BEFORE UPDATE ON anime_relations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_anime_characters_updated_at ON anime_characters;
CREATE TRIGGER update_anime_characters_updated_at 
  BEFORE UPDATE ON anime_characters 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_anime_studios_updated_at ON anime_studios;
CREATE TRIGGER update_anime_studios_updated_at 
  BEFORE UPDATE ON anime_studios 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Insert some sample studios for testing
INSERT INTO anime_studios (name, name_japanese, founded_year) VALUES
  ('Studio Ghibli', 'スタジオジブリ', 1985),
  ('Toei Animation', '東映アニメーション', 1948),
  ('Madhouse', 'マッドハウス', 1972),
  ('Bones', 'ボンズ', 1998),
  ('Ufotable', 'ユーフォーテーブル', 2000),
  ('MAPPA', 'MAPPA', 2011),
  ('Wit Studio', 'ウィットスタジオ', 2012),
  ('A-1 Pictures', 'A-1 Pictures', 2005)
ON CONFLICT (name) DO NOTHING;

-- Step 10: Test the setup
SELECT 'Database setup completed successfully!' as message;

-- Step 11: Verify tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'anime_%'
ORDER BY table_name;

-- Step 12: Test insert permissions
DO $$
BEGIN
  -- Test if we can insert into anime_characters
  INSERT INTO anime_characters (anime_id, name, role) 
  VALUES ('00000000-0000-0000-0000-000000000000', 'Test Character', 'main')
  ON CONFLICT (anime_id, name) DO NOTHING;
  
  -- Clean up test data
  DELETE FROM anime_characters WHERE name = 'Test Character';
  
  RAISE NOTICE 'Character insert test passed!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Character insert test failed: %', SQLERRM;
END $$;

-- Success message
SELECT 'All database fixes applied successfully! Character import should now work.' as final_message;
