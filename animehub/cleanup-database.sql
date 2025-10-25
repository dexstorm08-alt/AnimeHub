-- DATABASE CLEANUP SCRIPT
-- Run this in your Supabase SQL Editor to clean unnecessary data

-- Step 1: Clean up unnecessary characters (keep only main characters)
DELETE FROM anime_characters 
WHERE role != 'main';

-- Step 2: Clean up unnecessary studio relations (keep only first 2 per anime)
WITH ranked_studios AS (
  SELECT 
    id,
    anime_id,
    ROW_NUMBER() OVER (PARTITION BY anime_id ORDER BY created_at) as rn
  FROM anime_studio_relations
)
DELETE FROM anime_studio_relations 
WHERE id IN (
  SELECT id FROM ranked_studios WHERE rn > 2
);

-- Step 3: Clean up orphaned studios (studios not linked to any anime)
DELETE FROM anime_studios 
WHERE id NOT IN (
  SELECT DISTINCT studio_id FROM anime_studio_relations
);

-- Step 4: Clean up unnecessary relations (keep only important ones)
DELETE FROM anime_relations 
WHERE relation_type NOT IN (
  'sequel', 'prequel', 'adaptation', 'side_story'
);

-- Step 5: Show cleanup results
SELECT 'Cleanup completed!' as message;

-- Step 6: Show current data counts
SELECT 
  'Characters' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN role = 'main' THEN 1 END) as main_characters
FROM anime_characters
UNION ALL
SELECT 
  'Studios' as table_name,
  COUNT(*) as total_count,
  COUNT(*) as main_studios
FROM anime_studios
UNION ALL
SELECT 
  'Studio Relations' as table_name,
  COUNT(*) as total_count,
  COUNT(*) as main_relations
FROM anime_studio_relations
UNION ALL
SELECT 
  'Anime Relations' as table_name,
  COUNT(*) as total_count,
  COUNT(*) as main_relations
FROM anime_relations;

-- Step 7: Show character role distribution
SELECT 
  role,
  COUNT(*) as count
FROM anime_characters
GROUP BY role
ORDER BY count DESC;

-- Success message
SELECT 'Database cleanup completed successfully! Now import fresh data with optimized settings.' as final_message;
