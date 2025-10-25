-- Database Optimization Script for AnimeHub
-- Run this in your Supabase SQL Editor

-- 1. Add Missing Indexes for Performance

-- Text search index for anime titles (GIN index for better search performance)
CREATE INDEX IF NOT EXISTS idx_anime_title_search ON anime USING GIN (to_tsvector('english', title));

-- Composite index for user progress queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_user_progress_composite ON user_progress (user_id, episode_id, last_watched DESC);

-- Index for anime sorting by rating and year (popular queries)
CREATE INDEX IF NOT EXISTS idx_anime_rating_year ON anime (rating DESC NULLS LAST, year DESC NULLS LAST);

-- Partial indexes for common filter conditions
CREATE INDEX IF NOT EXISTS idx_anime_ongoing ON anime (id, title, poster_url, rating) WHERE status = 'ongoing';
CREATE INDEX IF NOT EXISTS idx_anime_completed ON anime (id, title, poster_url, rating) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_episodes_premium ON episodes (anime_id, episode_number) WHERE is_premium = true;

-- Index for genre filtering (array contains operations)
CREATE INDEX IF NOT EXISTS idx_anime_genres_gin ON anime USING GIN (genres);

-- Index for studio filtering
CREATE INDEX IF NOT EXISTS idx_anime_studios_gin ON anime USING GIN (studios);

-- Index for year-based filtering
CREATE INDEX IF NOT EXISTS idx_anime_year_type ON anime (year, type) WHERE year IS NOT NULL;

-- Index for user favorites and watchlist queries
CREATE INDEX IF NOT EXISTS idx_user_favorites_composite ON user_favorites (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_composite ON user_watchlist (user_id, created_at DESC);

-- Index for reviews with rating
CREATE INDEX IF NOT EXISTS idx_reviews_anime_rating ON reviews (anime_id, rating DESC, created_at DESC);

-- Index for episodes with anime relationship
CREATE INDEX IF NOT EXISTS idx_episodes_anime_episode_composite ON episodes (anime_id, episode_number, is_premium);

-- 2. Optimize Existing Indexes (verify they exist)
-- These should already exist from the original schema, but let's ensure they do
CREATE INDEX IF NOT EXISTS idx_anime_genres ON anime USING GIN (genres);
CREATE INDEX IF NOT EXISTS idx_anime_year ON anime (year);
CREATE INDEX IF NOT EXISTS idx_anime_rating ON anime (rating);
CREATE INDEX IF NOT EXISTS idx_anime_status ON anime (status);
CREATE INDEX IF NOT EXISTS idx_anime_type ON anime (type);
CREATE INDEX IF NOT EXISTS idx_episodes_anime_id ON episodes (anime_id);
CREATE INDEX IF NOT EXISTS idx_episodes_number ON episodes (anime_id, episode_number);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_last_watched ON user_progress (last_watched);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_id ON user_watchlist (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_anime_id ON reviews (anime_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews (rating);

-- 3. Add Statistics for Query Planner
-- Update table statistics to help the query planner make better decisions
ANALYZE anime;
ANALYZE episodes;
ANALYZE user_progress;
ANALYZE user_favorites;
ANALYZE user_watchlist;
ANALYZE reviews;

-- 4. Create Function for Efficient Anime Search
CREATE OR REPLACE FUNCTION search_anime_optimized(
  search_term TEXT DEFAULT '',
  genre_filter TEXT DEFAULT NULL,
  year_filter INTEGER DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  type_filter TEXT DEFAULT NULL,
  rating_min DECIMAL DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  title_japanese VARCHAR,
  description TEXT,
  poster_url TEXT,
  banner_url TEXT,
  rating DECIMAL,
  year INTEGER,
  status VARCHAR,
  type VARCHAR,
  genres TEXT[],
  studios TEXT[],
  total_episodes INTEGER,
  duration INTEGER,
  age_rating VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.title_japanese,
    a.description,
    a.poster_url,
    a.banner_url,
    a.rating,
    a.year,
    a.status,
    a.type,
    a.genres,
    a.studios,
    a.total_episodes,
    a.duration,
    a.age_rating,
    a.created_at,
    a.updated_at
  FROM anime a
  WHERE 
    (search_term = '' OR a.title ILIKE '%' || search_term || '%' OR a.description ILIKE '%' || search_term || '%')
    AND (genre_filter IS NULL OR a.genres @> ARRAY[genre_filter])
    AND (year_filter IS NULL OR a.year = year_filter)
    AND (status_filter IS NULL OR a.status = status_filter)
    AND (type_filter IS NULL OR a.type = type_filter)
    AND (rating_min IS NULL OR a.rating >= rating_min)
  ORDER BY 
    CASE 
      WHEN search_term != '' THEN 
        ts_rank(to_tsvector('english', a.title), plainto_tsquery('english', search_term))
      ELSE 0 
    END DESC,
    a.rating DESC NULLS LAST,
    a.year DESC NULLS LAST
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- 5. Create Function for User Progress with Anime Details
CREATE OR REPLACE FUNCTION get_user_progress_with_anime(user_uuid UUID)
RETURNS TABLE (
  progress_id UUID,
  anime_id UUID,
  anime_title VARCHAR,
  anime_poster TEXT,
  episode_id UUID,
  episode_number INTEGER,
  episode_title VARCHAR,
  progress_seconds INTEGER,
  is_completed BOOLEAN,
  last_watched TIMESTAMPTZ,
  total_episodes INTEGER,
  anime_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id as progress_id,
    a.id as anime_id,
    a.title as anime_title,
    a.poster_url as anime_poster,
    e.id as episode_id,
    e.episode_number,
    e.title as episode_title,
    up.progress_seconds,
    up.is_completed,
    up.last_watched,
    a.total_episodes,
    a.rating as anime_rating
  FROM user_progress up
  JOIN episodes e ON up.episode_id = e.id
  JOIN anime a ON e.anime_id = a.id
  WHERE up.user_id = user_uuid
  ORDER BY up.last_watched DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Performance Monitoring Queries
-- Query to check index usage
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Query to identify slow queries (requires pg_stat_statements extension)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- This would need to be enabled by Supabase admin

-- 7. Cleanup and Maintenance
-- Function to clean up old user progress (older than 1 year for completed episodes)
CREATE OR REPLACE FUNCTION cleanup_old_progress()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_progress 
  WHERE is_completed = true 
    AND last_watched < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION search_anime_optimized TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_progress_with_anime TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_progress TO authenticated;

-- Database optimization complete! 🚀
-- These indexes and functions should significantly improve query performance.
