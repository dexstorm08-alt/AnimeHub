-- Import Analytics Tables Setup
-- Run this in your Supabase SQL Editor

-- Create import analytics table
CREATE TABLE IF NOT EXISTS import_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('search', 'trending', 'seasonal', 'bulk')),
  source VARCHAR(20) NOT NULL CHECK (source IN ('jikan', 'anilist')),
  query TEXT,
  imported_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  genres TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create import reports table
CREATE TABLE IF NOT EXISTS import_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT UNIQUE NOT NULL,
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')),
  period TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  analytics_data JSONB NOT NULL,
  recommendations TEXT[],
  insights TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_import_analytics_created_at ON import_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_import_analytics_event_type ON import_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_import_analytics_source ON import_analytics(source);
CREATE INDEX IF NOT EXISTS idx_import_reports_generated_at ON import_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_import_reports_type ON import_reports(report_type);

-- Create functions for service initialization
CREATE OR REPLACE FUNCTION create_import_analytics_table()
RETURNS void AS $$
BEGIN
  -- Table creation is handled above, this function is just for service initialization
  NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_import_reports_table()
RETURNS void AS $$
BEGIN
  -- Table creation is handled above, this function is just for service initialization
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE import_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can manage analytics" ON import_analytics
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage reports" ON import_reports
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Create a function to get analytics summary
CREATE OR REPLACE FUNCTION get_import_analytics_summary(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_imports BIGINT,
  successful_imports BIGINT,
  failed_imports BIGINT,
  total_anime_imported BIGINT,
  total_anime_skipped BIGINT,
  average_duration_ms NUMERIC,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_imports,
    COUNT(*) FILTER (WHERE error_count = 0) as successful_imports,
    COUNT(*) FILTER (WHERE error_count > 0) as failed_imports,
    COALESCE(SUM(imported_count), 0) as total_anime_imported,
    COALESCE(SUM(skipped_count), 0) as total_anime_skipped,
    COALESCE(AVG(duration_ms), 0) as average_duration_ms,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE error_count = 0)::NUMERIC / COUNT(*)::NUMERIC) * 100
      ELSE 0 
    END as success_rate
  FROM import_analytics
  WHERE created_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get genre statistics
CREATE OR REPLACE FUNCTION get_genre_statistics(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  genre TEXT,
  import_count BIGINT,
  anime_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(genres) as genre,
    COUNT(*) as import_count,
    SUM(imported_count) as anime_count
  FROM import_analytics
  WHERE created_at >= NOW() - INTERVAL '1 day' * days_back
    AND genres IS NOT NULL
    AND array_length(genres, 1) > 0
  GROUP BY unnest(genres)
  ORDER BY anime_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get daily trends
CREATE OR REPLACE FUNCTION get_daily_import_trends(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  import_count BIGINT,
  anime_count BIGINT,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    created_at::DATE as date,
    COUNT(*) as import_count,
    SUM(imported_count) as anime_count,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE error_count = 0)::NUMERIC / COUNT(*)::NUMERIC) * 100
      ELSE 0 
    END as success_rate
  FROM import_analytics
  WHERE created_at >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY created_at::DATE
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up old analytics data
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete analytics older than 1 year
  DELETE FROM import_analytics 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete reports older than 6 months
  DELETE FROM import_reports 
  WHERE created_at < NOW() - INTERVAL '6 months';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic cleanup (if you have pg_cron extension)
-- SELECT cron.schedule('cleanup-analytics', '0 3 * * 0', 'SELECT cleanup_old_analytics();');
