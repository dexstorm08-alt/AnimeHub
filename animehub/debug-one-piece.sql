-- Debug One Piece data
-- Check if One Piece exists in anime table
SELECT id, title, title_japanese, anilist_id, mal_id 
FROM anime 
WHERE title ILIKE '%one piece%' OR title_japanese ILIKE '%ワンピース%'
ORDER BY created_at DESC;

-- Check One Piece characters
SELECT ac.name, ac.name_japanese, ac.role, ac.image_url
FROM anime_characters ac
JOIN anime a ON ac.anime_id = a.id
WHERE a.title ILIKE '%one piece%' OR a.title_japanese ILIKE '%ワンピース%'
ORDER BY ac.role, ac.name;

-- Check One Piece relations
SELECT ar.relation_type, ar.title as related_title, ar.anilist_id, ar.mal_id
FROM anime_relations ar
JOIN anime a ON ar.anime_id = a.id
WHERE a.title ILIKE '%one piece%' OR a.title_japanese ILIKE '%ワンピース%'
ORDER BY ar.relation_type, ar.title;

-- Check if One Punch Man is incorrectly related to One Piece
SELECT ar.relation_type, ar.title as related_title, ar.anilist_id, ar.mal_id
FROM anime_relations ar
JOIN anime a ON ar.anime_id = a.id
WHERE a.title ILIKE '%one piece%' OR a.title_japanese ILIKE '%ワンピース%'
AND ar.title ILIKE '%one punch%'
ORDER BY ar.relation_type, ar.title;
