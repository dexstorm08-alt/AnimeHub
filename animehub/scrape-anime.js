import { HybridHiAnimeScraperService } from './src/services/hybridHiAnimeScraperService.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function scrapeAnimeFromCommandLine() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node scrape-anime.js <animeTitle> <animeId> [episodeNumber]');
    console.log('Example: node scrape-anime.js "One Piece" "21" 1');
    process.exit(1);
  }

  const animeTitle = args[0];
  const animeId = args[1];
  const episodeNumber = parseInt(args[2]) || 1;

  console.log(`🎬 Scraping "${animeTitle}" (ID: ${animeId}), Episode ${episodeNumber}...`);

  try {
    const result = await HybridHiAnimeScraperService.scrapeAnimeEpisode(animeTitle, episodeNumber, {
      headless: true,
      timeout: 30000,
      retries: 2
    });

    if (result.success && result.streamUrl) {
      // Save to database
      const episodeData = {
        anime_id: animeId,
        episode_number: episodeNumber,
        title: `${animeTitle} - Episode ${episodeNumber}`,
        video_url: result.streamUrl,
        thumbnail_url: `https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bd${animeId}-5n5yZ6K1J1oH.jpg`,
        duration: 1440, // Default to 24 mins
        description: `Episode ${episodeNumber} of ${animeTitle}`,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('episodes').upsert(episodeData, {
        onConflict: ['anime_id', 'episode_number']
      });

      if (error) {
        console.error('❌ Database error:', error.message);
      } else {
        console.log('🎉 Episode saved to database successfully!');
      }

      console.log('✅ Scraping successful!');
      console.log('Stream URL:', result.streamUrl);
    } else {
      console.log('❌ Scraping failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

scrapeAnimeFromCommandLine();
