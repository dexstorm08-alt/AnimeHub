-- Large Anime Scraping Progress Tracking Setup
-- Run this in your Supabase SQL Editor

-- 1. Create scraping progress table
CREATE TABLE scraping_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  anime_title VARCHAR(255) NOT NULL,
  total_episodes INTEGER NOT NULL,
  completed_episodes INTEGER DEFAULT 0,
  failed_episodes INTEGER DEFAULT 0,
  current_chunk INTEGER DEFAULT 1,
  total_chunks INTEGER NOT NULL,
  chunk_size INTEGER DEFAULT 50,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'paused', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  UNIQUE(anime_id)
);

-- 2. Create episode scraping log table for detailed tracking
CREATE TABLE episode_scraping_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scraping_progress_id UUID REFERENCES scraping_progress(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  chunk_number INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'scraping', 'success', 'failed', 'skipped')),
  video_url TEXT,
  error_message TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX idx_scraping_progress_anime_id ON scraping_progress(anime_id);
CREATE INDEX idx_scraping_progress_status ON scraping_progress(status);
CREATE INDEX idx_episode_scraping_log_progress_id ON episode_scraping_log(scraping_progress_id);
CREATE INDEX idx_episode_scraping_log_episode_number ON episode_scraping_log(scraping_progress_id, episode_number);

-- 4. Enable RLS
ALTER TABLE scraping_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_scraping_log ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
CREATE POLICY "Anyone can view scraping progress" ON scraping_progress
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage scraping progress" ON scraping_progress
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view episode scraping log" ON episode_scraping_log
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage episode scraping log" ON episode_scraping_log
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scraping_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create trigger for updated_at
CREATE TRIGGER update_scraping_progress_updated_at 
  BEFORE UPDATE ON scraping_progress
  FOR EACH ROW EXECUTE FUNCTION update_scraping_progress_updated_at();

-- 8. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Setup complete! 🎌
-- You can now track large anime scraping progress.
