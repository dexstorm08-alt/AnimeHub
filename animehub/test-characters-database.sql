-- Test script to check if character database setup is working

-- 1. Check if anime_characters table exists and has the right structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'anime_characters' 
ORDER BY ordinal_position;

-- 2. Check if there are any characters in the database
SELECT COUNT(*) as total_characters FROM anime_characters;

-- 3. Check if there are any anime in the database
SELECT COUNT(*) as total_anime FROM anime;

-- 4. Sample character data (if any exists)
SELECT 
  ac.name,
  ac.name_japanese,
  ac.name_romaji,
  ac.role,
  a.title as anime_title
FROM anime_characters ac
JOIN anime a ON ac.anime_id = a.id
LIMIT 5;

-- 5. Check for any import errors or issues
SELECT 
  ac.name,
  ac.role,
  CASE 
    WHEN ac.name IS NULL THEN 'Missing name'
    WHEN ac.role IS NULL THEN 'Missing role'
    WHEN ac.anime_id IS NULL THEN 'Missing anime_id'
    ELSE 'OK'
  END as status
FROM anime_characters ac
LIMIT 10;
