-- SQL functions for Scheduled Import System
-- Run these in your Supabase SQL Editor

-- Create scheduled imports table
CREATE TABLE IF NOT EXISTS scheduled_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  source VARCHAR(20) CHECK (source IN ('jikan', 'anilist')) DEFAULT 'jikan',
  type VARCHAR(20) CHECK (type IN ('trending', 'seasonal', 'search')) NOT NULL,
  search_query TEXT,
  limit_count INTEGER DEFAULT 10 CHECK (limit_count > 0 AND limit_count <= 100),
  frequency VARCHAR(20) CHECK (frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'daily',
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  auto_approve BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create import logs table
CREATE TABLE IF NOT EXISTS import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES scheduled_imports(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('success', 'partial', 'failed')) NOT NULL,
  imported INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,
  errors TEXT[],
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_imports_next_run ON scheduled_imports(next_run);
CREATE INDEX IF NOT EXISTS idx_scheduled_imports_enabled ON scheduled_imports(enabled);
CREATE INDEX IF NOT EXISTS idx_import_logs_config_id ON import_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_started_at ON import_logs(started_at);

-- Create function to create scheduled imports table (for service initialization)
CREATE OR REPLACE FUNCTION create_scheduled_imports_table()
RETURNS void AS $$
BEGIN
  -- Table creation is handled above, this function is just for service initialization
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to create import logs table (for service initialization)
CREATE OR REPLACE FUNCTION create_import_logs_table()
RETURNS void AS $$
BEGIN
  -- Table creation is handled above, this function is just for service initialization
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to scheduled_imports table
DROP TRIGGER IF EXISTS update_scheduled_imports_updated_at ON scheduled_imports;
CREATE TRIGGER update_scheduled_imports_updated_at
  BEFORE UPDATE ON scheduled_imports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default scheduled import configurations
INSERT INTO scheduled_imports (name, enabled, source, type, limit_count, frequency, auto_approve) VALUES
  ('Daily Trending Anime', true, 'jikan', 'trending', 10, 'daily', false),
  ('Weekly Seasonal Anime', true, 'jikan', 'seasonal', 15, 'weekly', false),
  ('Popular Shounen Anime', true, 'jikan', 'search', 20, 'monthly', false)
ON CONFLICT DO NOTHING;

-- Update search query for the search type import
UPDATE scheduled_imports 
SET search_query = 'shounen action anime' 
WHERE name = 'Popular Shounen Anime';

-- Set initial next_run times for existing configurations
UPDATE scheduled_imports 
SET next_run = NOW() + INTERVAL '1 hour'
WHERE next_run IS NULL;

-- Create a view for import statistics
CREATE OR REPLACE VIEW import_statistics AS
SELECT 
  si.id,
  si.name,
  si.enabled,
  si.type,
  si.frequency,
  si.last_run,
  si.next_run,
  COUNT(il.id) as total_runs,
  SUM(il.imported) as total_imported,
  SUM(il.skipped) as total_skipped,
  AVG(il.duration_ms) as avg_duration_ms,
  COUNT(CASE WHEN il.status = 'success' THEN 1 END) as successful_runs,
  COUNT(CASE WHEN il.status = 'partial' THEN 1 END) as partial_runs,
  COUNT(CASE WHEN il.status = 'failed' THEN 1 END) as failed_runs
FROM scheduled_imports si
LEFT JOIN import_logs il ON si.id = il.config_id
GROUP BY si.id, si.name, si.enabled, si.type, si.frequency, si.last_run, si.next_run;

-- Grant necessary permissions (adjust based on your RLS policies)
ALTER TABLE scheduled_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your admin user requirements)
-- These policies assume you have an admin role or similar
CREATE POLICY "Admins can manage scheduled imports" ON scheduled_imports
  FOR ALL USING (true); -- Adjust this based on your admin authentication

CREATE POLICY "Admins can view import logs" ON import_logs
  FOR ALL USING (true); -- Adjust this based on your admin authentication

-- Create a function to get due imports (for the scheduler)
CREATE OR REPLACE FUNCTION get_due_imports()
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  enabled BOOLEAN,
  source VARCHAR(20),
  type VARCHAR(20),
  search_query TEXT,
  limit_count INTEGER,
  frequency VARCHAR(20),
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  auto_approve BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.id,
    si.name,
    si.enabled,
    si.source,
    si.type,
    si.search_query,
    si.limit_count,
    si.frequency,
    si.last_run,
    si.next_run,
    si.auto_approve
  FROM scheduled_imports si
  WHERE si.enabled = true 
    AND si.next_run <= NOW()
  ORDER BY si.next_run ASC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update next run time
CREATE OR REPLACE FUNCTION update_next_run(import_id UUID)
RETURNS void AS $$
DECLARE
  import_frequency VARCHAR(20);
BEGIN
  SELECT frequency INTO import_frequency
  FROM scheduled_imports
  WHERE id = import_id;
  
  UPDATE scheduled_imports
  SET 
    last_run = NOW(),
    next_run = CASE 
      WHEN import_frequency = 'daily' THEN NOW() + INTERVAL '1 day'
      WHEN import_frequency = 'weekly' THEN NOW() + INTERVAL '1 week'
      WHEN import_frequency = 'monthly' THEN NOW() + INTERVAL '1 month'
      ELSE NOW() + INTERVAL '1 day'
    END,
    updated_at = NOW()
  WHERE id = import_id;
END;
$$ LANGUAGE plpgsql;
