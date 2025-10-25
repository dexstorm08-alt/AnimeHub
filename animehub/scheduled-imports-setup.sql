-- Episode Scraping Scheduled Imports Table
-- This table stores configuration for automated episode scraping (different from anime data import)

CREATE TABLE IF NOT EXISTS episode_scraping_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT TRUE,
  interval_hours INTEGER DEFAULT 24 CHECK (interval_hours > 0),
  anime_limit INTEGER DEFAULT 50 CHECK (anime_limit > 0),
  batch_size INTEGER DEFAULT 10 CHECK (batch_size > 0),
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_episode_scraping_schedules_enabled ON episode_scraping_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_episode_scraping_schedules_next_run ON episode_scraping_schedules(next_run);
CREATE INDEX IF NOT EXISTS idx_episode_scraping_schedules_name ON episode_scraping_schedules(name);

-- Insert default scheduled import configuration
INSERT INTO episode_scraping_schedules (name, enabled, interval_hours, anime_limit, batch_size, next_run)
VALUES (
  'Daily Episode Import',
  TRUE,
  24,
  50,
  10,
  NOW() + INTERVAL '24 hours'
) ON CONFLICT (name) DO NOTHING;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_episode_scraping_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_episode_scraping_schedules_updated_at ON episode_scraping_schedules;
CREATE TRIGGER trigger_update_episode_scraping_schedules_updated_at
  BEFORE UPDATE ON episode_scraping_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_episode_scraping_schedules_updated_at();

-- Create a function to calculate next run time when interval changes
CREATE OR REPLACE FUNCTION calculate_episode_scraping_next_run()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate next_run if enabled and interval_hours changed
  IF NEW.enabled = TRUE AND (OLD.interval_hours != NEW.interval_hours OR OLD.enabled = FALSE) THEN
    NEW.next_run = NOW() + (NEW.interval_hours || ' hours')::INTERVAL;
  ELSIF NEW.enabled = FALSE THEN
    NEW.next_run = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate next run time
DROP TRIGGER IF EXISTS trigger_calculate_episode_scraping_next_run ON episode_scraping_schedules;
CREATE TRIGGER trigger_calculate_episode_scraping_next_run
  BEFORE UPDATE ON episode_scraping_schedules
  FOR EACH ROW
  EXECUTE FUNCTION calculate_episode_scraping_next_run();

-- Grant necessary permissions (adjust as needed for your setup)
GRANT SELECT, INSERT, UPDATE, DELETE ON episode_scraping_schedules TO authenticated;
-- Note: No sequence needed for UUID with gen_random_uuid()

-- Enable Row Level Security
ALTER TABLE episode_scraping_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your admin authentication)
CREATE POLICY "Authenticated users can manage episode scraping schedules" ON episode_scraping_schedules
  FOR ALL USING (true); -- Adjust this based on your admin authentication

-- Create a function to get due imports (for the scheduler)
CREATE OR REPLACE FUNCTION get_due_episode_scraping_imports()
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  enabled BOOLEAN,
  interval_hours INTEGER,
  anime_limit INTEGER,
  batch_size INTEGER,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ess.id,
    ess.name,
    ess.enabled,
    ess.interval_hours,
    ess.anime_limit,
    ess.batch_size,
    ess.last_run,
    ess.next_run
  FROM episode_scraping_schedules ess
  WHERE ess.enabled = true 
    AND ess.next_run <= NOW()
  ORDER BY ess.next_run ASC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update next run time for episode scraping
CREATE OR REPLACE FUNCTION update_episode_scraping_next_run(schedule_id UUID)
RETURNS void AS $$
DECLARE
  schedule_interval INTEGER;
BEGIN
  SELECT interval_hours INTO schedule_interval
  FROM episode_scraping_schedules
  WHERE id = schedule_id;
  
  UPDATE episode_scraping_schedules
  SET 
    last_run = NOW(),
    next_run = NOW() + (schedule_interval || ' hours')::INTERVAL,
    updated_at = NOW()
  WHERE id = schedule_id;
END;
$$ LANGUAGE plpgsql;
