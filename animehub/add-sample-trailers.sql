-- Add sample trailer URLs to existing anime for testing
-- Run this in your Supabase SQL Editor

-- Sample trailer URLs (you can replace these with actual anime trailers)
UPDATE anime 
SET trailer_url = 'https://www.youtube.com/watch?v=4h7YqZ_7m6I'
WHERE title ILIKE '%naruto%' OR title ILIKE '%attack%' OR title ILIKE '%demon%';

UPDATE anime 
SET trailer_url = 'https://www.youtube.com/watch?v=8Qn_spdM5Zg'
WHERE title ILIKE '%one piece%' OR title ILIKE '%dragon ball%';

UPDATE anime 
SET trailer_url = 'https://www.youtube.com/watch?v=5s7_WbiR79E'
WHERE title ILIKE '%my hero%' OR title ILIKE '%spirited away%';

UPDATE anime 
SET trailer_url = 'https://www.youtube.com/watch?v=4h7YqZ_7m6I'
WHERE title ILIKE '%studio ghibli%' OR title ILIKE '%ghibli%';

-- Add trailers to a few more anime
UPDATE anime 
SET trailer_url = 'https://www.youtube.com/watch?v=8Qn_spdM5Zg'
WHERE id IN (
  SELECT id FROM anime 
  WHERE trailer_url IS NULL 
  LIMIT 3
);

-- Verify the updates
SELECT id, title, trailer_url 
FROM anime 
WHERE trailer_url IS NOT NULL 
ORDER BY title;
