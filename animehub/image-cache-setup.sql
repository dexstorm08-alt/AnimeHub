-- Image Cache Table Setup
-- Run this in your Supabase SQL Editor

-- Create image cache table
CREATE TABLE IF NOT EXISTS image_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  optimized_url TEXT NOT NULL,
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  format VARCHAR(10) DEFAULT 'webp',
  size_bytes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_image_cache_key ON image_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_image_cache_expires ON image_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_image_cache_created ON image_cache(created_at);

-- Create function to create image cache table (for service initialization)
CREATE OR REPLACE FUNCTION create_image_cache_table()
RETURNS void AS $$
BEGIN
  -- Table creation is handled above, this function is just for service initialization
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE image_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view cached images" ON image_cache
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage cache" ON image_cache
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Create a function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_image_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM image_cache 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get cache statistics
CREATE OR REPLACE FUNCTION get_image_cache_stats()
RETURNS TABLE (
  total_images BIGINT,
  total_size BIGINT,
  oldest_entry TIMESTAMP WITH TIME ZONE,
  newest_entry TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_images,
    COALESCE(SUM(size_bytes), 0) as total_size,
    MIN(created_at) as oldest_entry,
    MAX(created_at) as newest_entry
  FROM image_cache;
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic cleanup (if you have pg_cron extension)
-- SELECT cron.schedule('cleanup-image-cache', '0 2 * * *', 'SELECT cleanup_expired_image_cache();');
