-- Insert Mock Data from Frontend into Database
-- Copy and paste this into Supabase SQL Editor after running database-schema.sql

-- First, let's clear any existing data (optional - only if you want to start fresh)
-- DELETE FROM user_progress;
-- DELETE FROM user_favorites;
-- DELETE FROM user_watchlist;
-- DELETE FROM reviews;
-- DELETE FROM episodes;
-- DELETE FROM anime;
-- DELETE FROM users;

-- Insert Anime Data (from your mock data)

-- 1. Spirited Away
INSERT INTO anime (id, title, title_japanese, description, poster_url, banner_url, rating, year, status, type, genres, studios, total_episodes, duration, age_rating) VALUES
('00000000-0000-0000-0000-000000000001', 'Spirited Away', '千と千尋の神隠し', 'A young girl becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.', 'https://readdy.ai/api/search-image?query=Young%20girl%20in%20magical%20spirit%20world%2C%20colorful%20spirits%20and%20creatures%20around%2C%20Studio%20Ghibli%20art%20style%2C%20warm%20lighting%2C%20enchanted%20bathhouse%20setting%2C%20simple%20background%20highlighting%20character&width=300&height=400&seq=anime1&orientation=portrait', 'https://readdy.ai/api/search-image?query=Studio%20Ghibli%20inspired%20magical%20forest%20with%20floating%20spirits%20and%20glowing%20lights%2C%20ethereal%20atmosphere%2C%20watercolor%20style%2C%20soft%20green%20and%20golden%20tones%2C%20mystical%20creatures%20in%20background&width=800&height=500&seq=hero1&orientation=landscape', 9.3, 2001, 'completed', 'movie', ARRAY['Fantasy', 'Adventure', 'Family'], ARRAY['Studio Ghibli'], 1, 125, 'PG');

-- 2. Princess Mononoke
INSERT INTO anime (id, title, title_japanese, description, poster_url, banner_url, rating, year, status, type, genres, studios, total_episodes, duration, age_rating) VALUES
('00000000-0000-0000-0000-000000000002', 'Princess Mononoke', 'もののけ姫', 'On a journey to find the cure for a Tatarigami curse, Ashitaka finds himself in the middle of a war between the forest gods and Tatara, a mining colony.', 'https://readdy.ai/api/search-image?query=Warrior%20princess%20with%20forest%20spirits%2C%20ancient%20Japanese%20setting%2C%20mystical%20atmosphere%2C%20Studio%20Ghibli%20character%20design%2C%20nature%20elements%2C%20simple%20background%20highlighting%20main%20character&width=300&height=400&seq=anime2&orientation=portrait', 'https://readdy.ai/api/search-image?query=Ancient%20forest%20with%20mystical%20creatures%20and%20nature%20spirits%2C%20magical%20atmosphere%2C%20Studio%20Ghibli%20style%2C%20lush%20green%20environment%20with%20ethereal%20lighting%2C%20peaceful%20and%20enchanting%20scene&width=800&height=500&seq=hero2&orientation=landscape', 9.1, 1997, 'completed', 'movie', ARRAY['Fantasy', 'Drama', 'Adventure'], ARRAY['Studio Ghibli'], 1, 134, 'PG-13');

-- 3. My Neighbor Totoro
INSERT INTO anime (id, title, title_japanese, description, poster_url, banner_url, rating, year, status, type, genres, studios, total_episodes, duration, age_rating) VALUES
('00000000-0000-0000-0000-000000000003', 'My Neighbor Totoro', 'となりのトトロ', 'When two girls move to the country to be near their ailing mother, they have adventures with the wondrous forest spirits who live nearby.', 'https://readdy.ai/api/search-image?query=Large%20friendly%20forest%20creature%20with%20children%2C%20countryside%20setting%2C%20gentle%20and%20warm%20atmosphere%2C%20Studio%20Ghibli%20style%2C%20soft%20colors%2C%20simple%20background%20highlighting%20characters&width=300&height=400&seq=anime3&orientation=portrait', 'https://readdy.ai/api/search-image?query=Whimsical%20countryside%20scene%20with%20magical%20forest%20creatures%2C%20soft%20pastel%20colors%2C%20dreamy%20atmosphere%2C%20Studio%20Ghibli%20inspired%20landscape%20with%20gentle%20spirits%20and%20nature%20elements&width=800&height=500&seq=hero3&orientation=landscape', 8.9, 1988, 'completed', 'movie', ARRAY['Fantasy', 'Family', 'Adventure'], ARRAY['Studio Ghibli'], 1, 86, 'G');

-- 4. Howl's Moving Castle
INSERT INTO anime (id, title, title_japanese, description, poster_url, banner_url, rating, year, status, type, genres, studios, total_episodes, duration, age_rating) VALUES
('00000000-0000-0000-0000-000000000004', 'Howls Moving Castle', 'ハウルの動く城', 'When an unconfident young woman is cursed with an old body by a spiteful witch, her only chance of breaking the spell lies with a self-indulgent yet insecure young wizard.', 'https://readdy.ai/api/search-image?query=Elegant%20wizard%20with%20blonde%20hair%20and%20magical%20elements%2C%20steampunk%20fantasy%20setting%2C%20romantic%20atmosphere%2C%20Studio%20Ghibli%20character%20design%2C%20soft%20lighting%2C%20simple%20background%20highlighting%20character&width=300&height=400&seq=anime4&orientation=portrait', 'https://readdy.ai/api/search-image?query=Magical%20steampunk%20castle%20floating%20in%20clouds%2C%20whimsical%20architecture%2C%20soft%20golden%20and%20pink%20sunset%20colors%2C%20enchanted%20atmosphere%20with%20floating%20elements%2C%20Studio%20Ghibli%20aesthetic&width=800&height=500&seq=hero4&orientation=landscape', 9.0, 2004, 'completed', 'movie', ARRAY['Fantasy', 'Romance', 'Adventure'], ARRAY['Studio Ghibli'], 1, 119, 'PG');

-- 5. Castle in the Sky
INSERT INTO anime (id, title, title_japanese, description, poster_url, banner_url, rating, year, status, type, genres, studios, total_episodes, duration, age_rating) VALUES
('00000000-0000-0000-0000-000000000005', 'Castle in the Sky', '天空の城ラピュタ', 'A young boy and a girl with a magic crystal must race against pirates and foreign agents in a search for a legendary floating castle.', 'https://readdy.ai/api/search-image?query=Young%20adventurers%20with%20magical%20crystal%2C%20floating%20castle%20elements%2C%20steampunk%20fantasy%20atmosphere%2C%20Studio%20Ghibli%20art%20style%2C%20adventure%20theme%2C%20simple%20background%20highlighting%20characters&width=300&height=400&seq=anime5&orientation=portrait', 'https://readdy.ai/api/search-image?query=Floating%20island%20castle%20in%20the%20sky%20with%20ancient%20ruins%2C%20magical%20crystals%2C%20soft%20blue%20and%20white%20clouds%2C%20ethereal%20lighting%2C%20adventure%20atmosphere%2C%20Studio%20Ghibli%20inspired%20fantasy%20landscape&width=800&height=500&seq=hero5&orientation=landscape', 8.8, 1986, 'completed', 'movie', ARRAY['Fantasy', 'Adventure', 'Steampunk'], ARRAY['Studio Ghibli'], 1, 125, 'PG');

-- 6. Kiki's Delivery Service
INSERT INTO anime (id, title, title_japanese, description, poster_url, banner_url, rating, year, status, type, genres, studios, total_episodes, duration, age_rating) VALUES
('00000000-0000-0000-0000-000000000006', 'Kikis Delivery Service', '魔女の宅急便', 'A young witch moves to a new town and starts a delivery service using her flying ability.', 'https://readdy.ai/api/search-image?query=Young%20witch%20flying%20on%20broomstick%20with%20black%20cat%2C%20coastal%20town%20setting%2C%20magical%20atmosphere%2C%20Studio%20Ghibli%20character%20design%2C%20bright%20and%20cheerful%20colors%2C%20simple%20background%20highlighting%20character&width=300&height=400&seq=anime6&orientation=portrait', NULL, 8.7, 1989, 'completed', 'movie', ARRAY['Fantasy', 'Family', 'Coming of Age'], ARRAY['Studio Ghibli'], 1, 103, 'G');

-- 7. The Wind Rises
INSERT INTO anime (id, title, title_japanese, description, poster_url, banner_url, rating, year, status, type, genres, studios, total_episodes, duration, age_rating) VALUES
('00000000-0000-0000-0000-000000000007', 'The Wind Rises', '風立ちぬ', 'The story of Jiro Horikoshi, the man who designed Japanese fighter planes during World War II.', 'https://readdy.ai/api/search-image?query=Aircraft%20designer%20with%20vintage%20planes%2C%20historical%20Japan%20setting%2C%20dreamy%20atmosphere%2C%20Studio%20Ghibli%20art%20style%2C%20soft%20colors%20and%20lighting%2C%20simple%20background%20highlighting%20character%20and%20aircraft&width=300&height=400&seq=anime7&orientation=portrait', NULL, 8.5, 2013, 'completed', 'movie', ARRAY['Drama', 'Historical', 'Romance'], ARRAY['Studio Ghibli'], 1, 126, 'PG-13');

-- 8. Ponyo
INSERT INTO anime (id, title, title_japanese, description, poster_url, banner_url, rating, year, status, type, genres, studios, total_episodes, duration, age_rating) VALUES
('00000000-0000-0000-0000-000000000008', 'Ponyo', '崖の上のポニョ', 'A goldfish princess who becomes human to be with a 5-year-old boy.', 'https://readdy.ai/api/search-image?query=Magical%20fish%20girl%20with%20red%20hair%2C%20underwater%20and%20coastal%20setting%2C%20colorful%20and%20vibrant%20atmosphere%2C%20Studio%20Ghibli%20style%2C%20ocean%20elements%2C%20simple%20background%20highlighting%20character&width=300&height=400&seq=anime8&orientation=portrait', NULL, 8.4, 2008, 'completed', 'movie', ARRAY['Fantasy', 'Family', 'Adventure'], ARRAY['Studio Ghibli'], 1, 101, 'G');

-- 9. The Tale of Princess Kaguya
INSERT INTO anime (id, title, title_japanese, description, poster_url, banner_url, rating, year, status, type, genres, studios, total_episodes, duration, age_rating) VALUES
('00000000-0000-0000-0000-000000000009', 'The Tale of Princess Kaguya', 'かぐや姫の物語', 'A story of a tiny girl who was found inside a shining stalk of bamboo.', 'https://readdy.ai/api/search-image?query=Beautiful%20princess%20in%20traditional%20Japanese%20clothing%2C%20bamboo%20forest%20setting%2C%20ethereal%20and%20delicate%20atmosphere%2C%20watercolor%20art%20style%2C%20soft%20pastels%2C%20simple%20background%20highlighting%20character&width=300&height=400&seq=anime9&orientation=portrait', NULL, 8.6, 2013, 'completed', 'movie', ARRAY['Fantasy', 'Drama', 'Historical'], ARRAY['Studio Ghibli'], 1, 137, 'PG');

-- 10. Grave of the Fireflies
INSERT INTO anime (id, title, title_japanese, description, poster_url, banner_url, rating, year, status, type, genres, studios, total_episodes, duration, age_rating) VALUES
('00000000-0000-0000-0000-000000000010', 'Grave of the Fireflies', '火垂るの墓', 'A tragic story of two siblings trying to survive in Japan during World War II.', 'https://readdy.ai/api/search-image?query=Two%20children%20with%20fireflies%20glowing%20around%20them%2C%20wartime%20Japan%20setting%2C%20emotional%20and%20touching%20atmosphere%2C%20Studio%20Ghibli%20art%20style%2C%20warm%20lighting%2C%20simple%20background%20highlighting%20characters&width=300&height=400&seq=anime10&orientation=portrait', NULL, 9.2, 1988, 'completed', 'movie', ARRAY['Drama', 'War', 'Family'], ARRAY['Studio Ghibli'], 1, 89, 'PG-13');

-- 11. Whisper of the Heart
INSERT INTO anime (id, title, title_japanese, description, poster_url, banner_url, rating, year, status, type, genres, studios, total_episodes, duration, age_rating) VALUES
('00000000-0000-0000-0000-000000000011', 'Whisper of the Heart', '耳をすませば', 'A love story between a girl who loves reading books and a boy who has previously read all the books in the library.', 'https://readdy.ai/api/search-image?query=Young%20girl%20reading%20books%20with%20magical%20cat%20figurine%2C%20cozy%20library%20setting%2C%20dreamy%20atmosphere%2C%20Studio%20Ghibli%20character%20design%2C%20warm%20colors%2C%20simple%20background%20highlighting%20character&width=300&height=400&seq=anime11&orientation=portrait', NULL, 8.3, 1995, 'completed', 'movie', ARRAY['Romance', 'Drama', 'Coming of Age'], ARRAY['Studio Ghibli'], 1, 111, 'G');

-- 12. From Up on Poppy Hill
INSERT INTO anime (id, title, title_japanese, description, poster_url, banner_url, rating, year, status, type, genres, studios, total_episodes, duration, age_rating) VALUES
('00000000-0000-0000-0000-000000000012', 'From Up on Poppy Hill', 'コクリコ坂から', 'A group of Yokohama teens look to save their school''s clubhouse from the wrecking ball in preparations for the 1964 Tokyo Olympics.', 'https://readdy.ai/api/search-image?query=Young%20students%20in%201960s%20Japan%2C%20school%20and%20harbor%20setting%2C%20nostalgic%20atmosphere%2C%20Studio%20Ghibli%20art%20style%2C%20vintage%20colors%2C%20simple%20background%20highlighting%20characters&width=300&height=400&seq=anime12&orientation=portrait', NULL, 8.1, 2011, 'completed', 'movie', ARRAY['Romance', 'Drama', 'Historical'], ARRAY['Studio Ghibli'], 1, 91, 'G');

-- Insert Episodes for each anime (all are movies, so 1 episode each)

INSERT INTO episodes (id, anime_id, episode_number, title, description, thumbnail_url, video_url, duration, is_premium) VALUES
-- Spirited Away
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, 'Spirited Away', 'Full movie - A young girl becomes trapped in a strange new world of spirits.', 'https://readdy.ai/api/search-image?query=Magical%20bathhouse%20interior%20with%20spirits%2C%20colorful%20and%20mystical%20atmosphere%2C%20Studio%20Ghibli%20scene%2C%20warm%20lighting%2C%20detailed%20architecture%2C%20simple%20background&width=200&height=120&seq=continue1&orientation=landscape', 'https://example.com/videos/spirited-away.mp4', 7500, false),

-- Princess Mononoke
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 1, 'Princess Mononoke', 'Full movie - On a journey to find the cure for a Tatarigami curse.', NULL, 'https://example.com/videos/princess-mononoke.mp4', 8040, false),

-- My Neighbor Totoro
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 1, 'My Neighbor Totoro', 'Full movie - When two girls move to the country to be near their ailing mother.', 'https://readdy.ai/api/search-image?query=Forest%20scene%20with%20large%20friendly%20creature%2C%20children%20playing%2C%20magical%20atmosphere%2C%20Studio%20Ghibli%20style%2C%20green%20and%20natural%20colors%2C%20simple%20background&width=200&height=120&seq=continue2&orientation=landscape', 'https://example.com/videos/totoro.mp4', 5160, false),

-- Howl's Moving Castle
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 1, 'Howls Moving Castle', 'Full movie - When an unconfident young woman is cursed with an old body.', NULL, 'https://example.com/videos/howl-moving-castle.mp4', 7140, false),

-- Castle in the Sky
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 1, 'Castle in the Sky', 'Full movie - A young boy and a girl with a magic crystal.', NULL, 'https://example.com/videos/castle-in-sky.mp4', 7500, false),

-- Kiki's Delivery Service
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', 1, 'Kikis Delivery Service', 'Full movie - A young witch moves to a new town and starts a delivery service.', 'https://readdy.ai/api/search-image?query=Coastal%20town%20from%20above%20with%20witch%20flying%2C%20magical%20delivery%20scene%2C%20Studio%20Ghibli%20atmosphere%2C%20bright%20colors%2C%20simple%20background&width=200&height=120&seq=continue3&orientation=landscape', 'https://example.com/videos/kiki-delivery.mp4', 6180, false),

-- The Wind Rises
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', 1, 'The Wind Rises', 'Full movie - The story of Jiro Horikoshi, the man who designed Japanese fighter planes.', NULL, 'https://example.com/videos/wind-rises.mp4', 7560, false),

-- Ponyo
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000008', 1, 'Ponyo', 'Full movie - A goldfish princess who becomes human to be with a 5-year-old boy.', 'https://readdy.ai/api/search-image?query=Underwater%20scene%20with%20magical%20fish%2C%20colorful%20ocean%20environment%2C%20Studio%20Ghibli%20style%2C%20vibrant%20blues%20and%20corals%2C%20simple%20background&width=200&height=120&seq=continue4&orientation=landscape', 'https://example.com/videos/ponyo.mp4', 6060, false),

-- The Tale of Princess Kaguya
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000009', 1, 'The Tale of Princess Kaguya', 'Full movie - A story of a tiny girl who was found inside a shining stalk of bamboo.', NULL, 'https://example.com/videos/princess-kaguya.mp4', 8220, false),

-- Grave of the Fireflies
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', 1, 'Grave of the Fireflies', 'Full movie - A tragic story of two siblings trying to survive in Japan during World War II.', NULL, 'https://example.com/videos/grave-fireflies.mp4', 5340, false),

-- Whisper of the Heart
('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', 1, 'Whisper of the Heart', 'Full movie - A love story between a girl who loves reading books and a boy.', NULL, 'https://example.com/videos/whisper-heart.mp4', 6660, false),

-- From Up on Poppy Hill
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000012', 1, 'From Up on Poppy Hill', 'Full movie - A group of Yokohama teens look to save their school''s clubhouse.', NULL, 'https://example.com/videos/poppy-hill.mp4', 5460, false);

-- Insert Sample Users (for testing)

INSERT INTO users (id, email, username, subscription_type) VALUES
('20000000-0000-0000-0000-000000000001', 'admin@animehub.com', 'admin', 'vip'),
('20000000-0000-0000-0000-000000000002', 'premium@example.com', 'premium_user', 'premium'),
('20000000-0000-0000-0000-000000000003', 'free@example.com', 'free_user', 'free'),
('20000000-0000-0000-0000-000000000004', 'test@example.com', 'test_user', 'free');

-- Insert Sample User Progress (from your continueWatching data)

INSERT INTO user_progress (user_id, episode_id, progress_seconds, is_completed, last_watched) VALUES
-- Spirited Away - 45% progress
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 3375, false, NOW() - INTERVAL '2 days'),

-- My Neighbor Totoro - 78% progress  
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 4025, false, NOW() - INTERVAL '1 day'),

-- Kiki's Delivery Service - 23% progress
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006', 1421, false, NOW() - INTERVAL '3 hours'),

-- Ponyo - 67% progress
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008', 4060, false, NOW() - INTERVAL '5 hours');

-- Insert Sample Favorites (based on your trending data)

INSERT INTO user_favorites (user_id, anime_id) VALUES
-- Premium user favorites
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'), -- Spirited Away
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'), -- Princess Mononoke
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004'), -- Howl's Moving Castle
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010'), -- Grave of the Fireflies

-- Free user favorites
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003'), -- My Neighbor Totoro
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006'), -- Kiki's Delivery Service
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000008'); -- Ponyo

-- Insert Sample Watchlist

INSERT INTO user_watchlist (user_id, anime_id) VALUES
-- Premium user watchlist
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000009'), -- The Tale of Princess Kaguya
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011'), -- Whisper of the Heart

-- Free user watchlist
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005'), -- Castle in the Sky
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000007'); -- The Wind Rises

-- Insert Sample Reviews

INSERT INTO reviews (user_id, anime_id, rating, review_text, is_spoiler) VALUES
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 10, 'Absolute masterpiece! The animation, story, and characters are all perfect. A true work of art that everyone should watch.', false),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 9, 'Beautiful animation and deep themes about nature and industrialization. Miyazaki at his finest.', false),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 9, 'Such a heartwarming and magical film. Totoro is absolutely adorable!', false),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 8, 'Great steampunk fantasy with amazing visuals. The moving castle is incredible!', false),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000010', 10, 'One of the most emotionally powerful films ever made. Bring tissues!', false);

-- Verify the data was inserted correctly
SELECT 'Anime Count:' as info, COUNT(*) as count FROM anime
UNION ALL
SELECT 'Episodes Count:', COUNT(*) FROM episodes
UNION ALL  
SELECT 'Users Count:', COUNT(*) FROM users
UNION ALL
SELECT 'User Progress Count:', COUNT(*) FROM user_progress
UNION ALL
SELECT 'Favorites Count:', COUNT(*) FROM user_favorites
UNION ALL
SELECT 'Watchlist Count:', COUNT(*) FROM user_watchlist
UNION ALL
SELECT 'Reviews Count:', COUNT(*) FROM reviews;

-- Show some sample data
SELECT 'Sample Anime:' as info;
SELECT id, title, rating, year, genres FROM anime LIMIT 5;

SELECT 'Sample Episodes:' as info;
SELECT e.episode_number, e.title, a.title as anime_title FROM episodes e 
JOIN anime a ON e.anime_id = a.id LIMIT 5;

SELECT 'Sample User Progress:' as info;
SELECT u.username, a.title, e.episode_number, up.progress_seconds, up.is_completed 
FROM user_progress up
JOIN users u ON up.user_id = u.id
JOIN episodes e ON up.episode_id = e.id
JOIN anime a ON e.anime_id = a.id;

-- Mock data insertion complete! 🎌
-- Your anime streaming platform now has all the Studio Ghibli films from your mock data.
