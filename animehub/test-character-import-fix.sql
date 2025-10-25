-- Test Character Import After Database Fix
-- Run this after running fix-character-import-database.sql

-- 1. Check if tables exist and have correct structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('anime_characters', 'anime_relations', 'anime_studios')
ORDER BY table_name, ordinal_position;

-- 2. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('anime_characters', 'anime_relations', 'anime_studios')
ORDER BY tablename, policyname;

-- 3. Test insert into anime_characters (this should work now)
DO $$
DECLARE
  test_anime_id UUID;
BEGIN
  -- Get a real anime ID from your database
  SELECT id INTO test_anime_id FROM anime LIMIT 1;
  
  IF test_anime_id IS NOT NULL THEN
    -- Test insert
    INSERT INTO anime_characters (anime_id, name, name_japanese, role) 
    VALUES (test_anime_id, 'Test Character', 'テストキャラクター', 'main')
    ON CONFLICT (anime_id, name) DO NOTHING;
    
    RAISE NOTICE 'SUCCESS: Character insert test passed for anime: %', test_anime_id;
    
    -- Clean up
    DELETE FROM anime_characters WHERE name = 'Test Character';
    RAISE NOTICE 'Test data cleaned up successfully';
  ELSE
    RAISE NOTICE 'WARNING: No anime found in database to test with';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Character insert test failed: %', SQLERRM;
END $$;

-- 4. Test insert into anime_studios
DO $$
BEGIN
  INSERT INTO anime_studios (name, name_japanese) 
  VALUES ('Test Studio', 'テストスタジオ')
  ON CONFLICT (name) DO NOTHING;
  
  RAISE NOTICE 'SUCCESS: Studio insert test passed';
  
  -- Clean up
  DELETE FROM anime_studios WHERE name = 'Test Studio';
  RAISE NOTICE 'Studio test data cleaned up successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Studio insert test failed: %', SQLERRM;
END $$;

-- 5. Test insert into anime_relations
DO $$
DECLARE
  test_anime_id UUID;
BEGIN
  -- Get a real anime ID from your database
  SELECT id INTO test_anime_id FROM anime LIMIT 1;
  
  IF test_anime_id IS NOT NULL THEN
    -- Test insert
    INSERT INTO anime_relations (anime_id, related_anime_id, relation_type, title) 
    VALUES (test_anime_id, 'test-123', 'sequel', 'Test Related Anime')
    ON CONFLICT (anime_id, related_anime_id, relation_type) DO NOTHING;
    
    RAISE NOTICE 'SUCCESS: Relations insert test passed for anime: %', test_anime_id;
    
    -- Clean up
    DELETE FROM anime_relations WHERE related_anime_id = 'test-123';
    RAISE NOTICE 'Relations test data cleaned up successfully';
  ELSE
    RAISE NOTICE 'WARNING: No anime found in database to test with';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Relations insert test failed: %', SQLERRM;
END $$;

SELECT 'All tests completed! Check the messages above for results.' as test_summary;
