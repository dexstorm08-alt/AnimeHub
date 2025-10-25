-- Database Views for AnimeHub
-- Create materialized views and regular views for better performance

-- 1. Materialized View for Popular Anime (refreshed hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_anime AS
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
  a.updated_at,
  -- Calculate popularity score based on user activity
  COALESCE(
    (SELECT COUNT(*) FROM user_favorites uf WHERE uf.anime_id = a.id) * 2 +
    (SELECT COUNT(*) FROM user_watchlist uw WHERE uw.anime_id = a.id) +
    (SELECT COUNT(*) FROM user_progress up 
     JOIN episodes e ON up.episode_id = e.id 
     WHERE e.anime_id = a.id AND up.last_watched > NOW() - INTERVAL '30 days') * 3 +
    (SELECT COUNT(*) FROM reviews r WHERE r.anime_id = a.id AND r.rating >= 7) * 1.5,
    0
  ) as popularity_score,
  -- Count of recent activity
  (SELECT COUNT(*) FROM user_progress up 
   JOIN episodes e ON up.episode_id = e.id 
   WHERE e.anime_id = a.id AND up.last_watched > NOW() - INTERVAL '7 days') as recent_activity
FROM anime a
WHERE a.status IN ('ongoing', 'completed')
ORDER BY popularity_score DESC, a.rating DESC NULLS LAST;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_popular_anime_score ON popular_anime (popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_popular_anime_recent ON popular_anime (recent_activity DESC);

-- 2. Materialized View for Trending Anime (based on recent activity)
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_anime AS
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
  a.updated_at,
  -- Trending score based on recent activity
  COALESCE(
    (SELECT COUNT(*) FROM user_progress up 
     JOIN episodes e ON up.episode_id = e.id 
     WHERE e.anime_id = a.id AND up.last_watched > NOW() - INTERVAL '7 days') * 5 +
    (SELECT COUNT(*) FROM user_favorites uf 
     WHERE uf.anime_id = a.id AND uf.created_at > NOW() - INTERVAL '7 days') * 3 +
    (SELECT COUNT(*) FROM user_watchlist uw 
     WHERE uw.anime_id = a.id AND uw.created_at > NOW() - INTERVAL '7 days') * 2,
    0
  ) as trending_score
FROM anime a
WHERE a.status IN ('ongoing', 'completed')
  AND a.created_at > NOW() - INTERVAL '2 years' -- Only recent anime can trend
ORDER BY trending_score DESC, a.rating DESC NULLS LAST;

-- Create index on trending view
CREATE INDEX IF NOT EXISTS idx_trending_anime_score ON trending_anime (trending_score DESC);

-- 3. View for User Watch Progress with Anime Details
CREATE OR REPLACE VIEW user_watch_progress_detailed AS
SELECT 
  up.id as progress_id,
  up.user_id,
  up.progress_seconds,
  up.is_completed,
  up.last_watched,
  up.created_at as progress_created_at,
  -- Episode details
  e.id as episode_id,
  e.episode_number,
  e.title as episode_title,
  e.description as episode_description,
  e.thumbnail_url,
  e.video_url,
  e.duration as episode_duration,
  e.is_premium,
  e.air_date,
  -- Anime details
  a.id as anime_id,
  a.title as anime_title,
  a.title_japanese,
  a.description as anime_description,
  a.poster_url,
  a.banner_url,
  a.rating as anime_rating,
  a.year,
  a.status as anime_status,
  a.type as anime_type,
  a.genres,
  a.studios,
  a.total_episodes,
  a.duration as anime_duration,
  a.age_rating,
  -- Progress percentage
  CASE 
    WHEN e.duration > 0 THEN (up.progress_seconds::DECIMAL / e.duration * 100)::DECIMAL(5,2)
    ELSE 0 
  END as progress_percentage
FROM user_progress up
JOIN episodes e ON up.episode_id = e.id
JOIN anime a ON e.anime_id = a.id;

-- 4. View for Anime with Episode Counts and User Stats
CREATE OR REPLACE VIEW anime_with_stats AS
SELECT 
  a.*,
  -- Episode statistics
  COUNT(e.id) as actual_episode_count,
  COUNT(CASE WHEN e.is_premium = false THEN 1 END) as free_episode_count,
  COUNT(CASE WHEN e.is_premium = true THEN 1 END) as premium_episode_count,
  -- User statistics
  (SELECT COUNT(*) FROM user_favorites uf WHERE uf.anime_id = a.id) as favorite_count,
  (SELECT COUNT(*) FROM user_watchlist uw WHERE uw.anime_id = a.id) as watchlist_count,
  (SELECT COUNT(*) FROM user_progress up 
   JOIN episodes e ON up.episode_id = e.id 
   WHERE e.anime_id = a.id) as total_watches,
  (SELECT COUNT(*) FROM user_progress up 
   JOIN episodes e ON up.episode_id = e.id 
   WHERE e.anime_id = a.id AND up.is_completed = true) as completed_watches,
  -- Review statistics
  (SELECT COUNT(*) FROM reviews r WHERE r.anime_id = a.id) as review_count,
  (SELECT AVG(r.rating) FROM reviews r WHERE r.anime_id = a.id) as user_rating_avg,
  -- Recent activity
  (SELECT COUNT(*) FROM user_progress up 
   JOIN episodes e ON up.episode_id = e.id 
   WHERE e.anime_id = a.id AND up.last_watched > NOW() - INTERVAL '7 days') as recent_activity
FROM anime a
LEFT JOIN episodes e ON a.id = e.anime_id
GROUP BY a.id;

-- 5. View for Genre Statistics
CREATE OR REPLACE VIEW genre_stats AS
SELECT 
  genre,
  COUNT(*) as anime_count,
  AVG(rating) as avg_rating,
  COUNT(CASE WHEN status = 'ongoing' THEN 1 END) as ongoing_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN status = 'upcoming' THEN 1 END) as upcoming_count
FROM (
  SELECT unnest(genres) as genre, rating, status
  FROM anime
) genre_data
GROUP BY genre
ORDER BY anime_count DESC, avg_rating DESC;

-- 6. View for User Activity Summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  u.id as user_id,
  u.username,
  u.email,
  u.subscription_type,
  u.created_at as user_created_at,
  -- Activity counts
  (SELECT COUNT(*) FROM user_progress up WHERE up.user_id = u.id) as total_episodes_watched,
  (SELECT COUNT(*) FROM user_progress up WHERE up.user_id = u.id AND up.is_completed = true) as completed_episodes,
  (SELECT COUNT(*) FROM user_favorites uf WHERE uf.user_id = u.id) as favorite_count,
  (SELECT COUNT(*) FROM user_watchlist uw WHERE uw.user_id = u.id) as watchlist_count,
  (SELECT COUNT(*) FROM reviews r WHERE r.user_id = u.id) as review_count,
  -- Recent activity
  (SELECT COUNT(*) FROM user_progress up 
   WHERE up.user_id = u.id AND up.last_watched > NOW() - INTERVAL '7 days') as recent_activity,
  -- Last activity
  (SELECT MAX(up.last_watched) FROM user_progress up WHERE up.user_id = u.id) as last_activity
FROM users u;

-- 7. Function to Refresh Materialized Views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS TEXT AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY popular_anime;
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_anime;
  RETURN 'Materialized views refreshed successfully at ' || NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. Function to Get Anime Recommendations for User
CREATE OR REPLACE FUNCTION get_anime_recommendations(
  user_uuid UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  poster_url TEXT,
  rating DECIMAL,
  year INTEGER,
  genres TEXT[],
  recommendation_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH user_preferences AS (
    -- Get user's favorite genres
    SELECT unnest(a.genres) as genre, COUNT(*) as genre_count
    FROM anime a
    JOIN user_favorites uf ON a.id = uf.anime_id
    WHERE uf.user_id = user_uuid
    GROUP BY unnest(a.genres)
  ),
  user_watched AS (
    -- Get anime user has already watched
    SELECT DISTINCT e.anime_id
    FROM user_progress up
    JOIN episodes e ON up.episode_id = e.id
    WHERE up.user_id = user_uuid
  )
  SELECT 
    a.id,
    a.title,
    a.poster_url,
    a.rating,
    a.year,
    a.genres,
    -- Calculate recommendation score
    COALESCE(
      (SELECT SUM(up.genre_count) 
       FROM user_preferences up 
       WHERE up.genre = ANY(a.genres)) * 2 +
      a.rating * 0.5 +
      CASE WHEN a.status = 'ongoing' THEN 1 ELSE 0 END,
      0
    ) as recommendation_score
  FROM anime a
  WHERE a.id NOT IN (SELECT anime_id FROM user_watched)
    AND a.status IN ('ongoing', 'completed')
  ORDER BY recommendation_score DESC, a.rating DESC NULLS LAST
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON popular_anime TO anon, authenticated;
GRANT SELECT ON trending_anime TO anon, authenticated;
GRANT SELECT ON user_watch_progress_detailed TO anon, authenticated;
GRANT SELECT ON anime_with_stats TO anon, authenticated;
GRANT SELECT ON genre_stats TO anon, authenticated;
GRANT SELECT ON user_activity_summary TO authenticated;

GRANT EXECUTE ON FUNCTION refresh_materialized_views TO authenticated;
GRANT EXECUTE ON FUNCTION get_anime_recommendations TO anon, authenticated;

-- Create a scheduled job to refresh materialized views (this would need to be set up in Supabase)
-- For now, you can call refresh_materialized_views() manually or set up a cron job

-- Views and materialized views created successfully! 📊
