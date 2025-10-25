-- Anime Relations Setup
-- This script creates tables to support anime seasons, sequels, prequels, and related content

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

-- 3. Anime Studios Table (if not exists)
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

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_anime_relations_anime_id ON anime_relations(anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_relations_related_anime_id ON anime_relations(related_anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_relations_type ON anime_relations(relation_type);
CREATE INDEX IF NOT EXISTS idx_anime_characters_anime_id ON anime_characters(anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_characters_role ON anime_characters(role);
CREATE INDEX IF NOT EXISTS idx_anime_studio_relations_anime_id ON anime_studio_relations(anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_studio_relations_studio_id ON anime_studio_relations(studio_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE anime_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime_studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime_studio_relations ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies
-- Allow authenticated users to read all data
CREATE POLICY "Allow authenticated users to read anime_relations" ON anime_relations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read anime_characters" ON anime_characters
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read anime_studios" ON anime_studios
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read anime_studio_relations" ON anime_studio_relations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to manage all data
CREATE POLICY "Allow admins to manage anime_relations" ON anime_relations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.subscription_type = 'admin'
    )
  );

CREATE POLICY "Allow admins to manage anime_characters" ON anime_characters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.subscription_type = 'admin'
    )
  );

CREATE POLICY "Allow admins to manage anime_studios" ON anime_studios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.subscription_type = 'admin'
    )
  );

CREATE POLICY "Allow admins to manage anime_studio_relations" ON anime_studio_relations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.subscription_type = 'admin'
    )
  );

-- 8. Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_anime_relations_updated_at 
  BEFORE UPDATE ON anime_relations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anime_characters_updated_at 
  BEFORE UPDATE ON anime_characters 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anime_studios_updated_at 
  BEFORE UPDATE ON anime_studios 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Insert some sample data for testing
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

-- 10. Create views for easier querying
CREATE OR REPLACE VIEW anime_with_relations AS
SELECT 
  a.*,
  ARRAY_AGG(DISTINCT ar.relation_type) as relation_types,
  ARRAY_AGG(DISTINCT ra.title) FILTER (WHERE ra.title IS NOT NULL) as related_titles
FROM anime a
LEFT JOIN anime_relations ar ON a.id = ar.anime_id
LEFT JOIN anime ra ON ar.related_anime_id = ra.id
GROUP BY a.id;

CREATE OR REPLACE VIEW anime_with_characters AS
SELECT 
  a.*,
  COUNT(ac.id) as character_count,
  ARRAY_AGG(DISTINCT ac.name) FILTER (WHERE ac.name IS NOT NULL) as character_names
FROM anime a
LEFT JOIN anime_characters ac ON a.id = ac.anime_id
GROUP BY a.id;

-- 11. Create a function to get related anime
CREATE OR REPLACE FUNCTION get_related_anime(anime_uuid UUID, relation_types TEXT[] DEFAULT NULL)
RETURNS TABLE (
  related_anime_id UUID,
  title VARCHAR(255),
  poster_url TEXT,
  year INTEGER,
  type VARCHAR(20),
  status VARCHAR(20),
  relation_type VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ra.id,
    ra.title,
    ra.poster_url,
    ra.year,
    ra.type,
    ra.status,
    ar.relation_type
  FROM anime_relations ar
  JOIN anime ra ON ar.related_anime_id = ra.id
  WHERE ar.anime_id = anime_uuid
  AND (relation_types IS NULL OR ar.relation_type = ANY(relation_types))
  ORDER BY ra.year DESC;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Anime relations setup completed successfully!' as message;
