-- Sample SQL to add video URLs to your episodes
-- Replace the anime_id and episode_number with actual values from your database

-- Example 1: YouTube video URL
UPDATE episodes 
SET video_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'  -- Replace with actual YouTube URL
WHERE anime_id = 'your-anime-id' AND episode_number = 1;

-- Example 2: Direct video URL (MP4)
UPDATE episodes 
SET video_url = 'https://example.com/videos/episode1.mp4'  -- Replace with actual video URL
WHERE anime_id = 'your-anime-id' AND episode_number = 2;

-- Example 3: HLS stream URL
UPDATE episodes 
SET video_url = 'https://example.com/streams/episode1.m3u8'  -- Replace with actual HLS URL
WHERE anime_id = 'your-anime-id' AND episode_number = 3;

-- Example 4: Multiple episodes with YouTube URLs
UPDATE episodes 
SET video_url = 'https://www.youtube.com/watch?v=VIDEO_ID_1'
WHERE anime_id = 'anime-id-1' AND episode_number = 1;

UPDATE episodes 
SET video_url = 'https://www.youtube.com/watch?v=VIDEO_ID_2'
WHERE anime_id = 'anime-id-1' AND episode_number = 2;

UPDATE episodes 
SET video_url = 'https://www.youtube.com/watch?v=VIDEO_ID_3'
WHERE anime_id = 'anime-id-1' AND episode_number = 3;

-- Example 5: Batch update for multiple episodes
UPDATE episodes 
SET video_url = CASE episode_number
    WHEN 1 THEN 'https://www.youtube.com/watch?v=EP1_VIDEO_ID'
    WHEN 2 THEN 'https://www.youtube.com/watch?v=EP2_VIDEO_ID'
    WHEN 3 THEN 'https://www.youtube.com/watch?v=EP3_VIDEO_ID'
    WHEN 4 THEN 'https://example.com/videos/episode4.mp4'
    WHEN 5 THEN 'https://example.com/streams/episode5.m3u8'
    ELSE video_url
END
WHERE anime_id = 'your-anime-id';

-- To check your current episodes and their video URLs:
-- SELECT anime_id, episode_number, title, video_url 
-- FROM episodes 
-- WHERE anime_id = 'your-anime-id'
-- ORDER BY episode_number;

-- To see all episodes without video URLs:
-- SELECT anime_id, episode_number, title 
-- FROM episodes 
-- WHERE video_url IS NULL OR video_url = ''
-- ORDER BY anime_id, episode_number;
