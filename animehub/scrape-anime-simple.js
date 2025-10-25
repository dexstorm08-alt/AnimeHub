import * as cheerio from 'cheerio';
import axios from 'axios';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Apply stealth plugin to avoid detection
chromium.use(StealthPlugin());

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
    // Step 1: Fast search with Cheerio
    console.log('🔍 Step 1: Searching with Cheerio...');
    const BASE_URL = 'https://hianime.do';
    const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    const searchUrl = `${BASE_URL}/search?keyword=${encodeURIComponent(animeTitle)}`;
    console.log('Search URL:', searchUrl);
    
    const searchResponse = await axios.get(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000
    });

    const $ = cheerio.load(searchResponse.data);
    
    // Find anime link
    const animeLink = $('.film_list-wrap .flw-item a[href*="/watch/"]').first().attr('href');
    if (!animeLink) {
      throw new Error('No anime links found');
    }
    
    const fullAnimeLink = animeLink.startsWith('http') ? animeLink : BASE_URL + animeLink;
    const foundAnimeId = animeLink.match(/watch\/[^?]+-(\d+)/)?.[1];
    
    if (!foundAnimeId) {
      throw new Error('Anime ID not found in URL');
    }
    
    console.log('✅ Cheerio search successful:', { fullAnimeLink, foundAnimeId });

    // Step 2: Quick Puppeteer test (with shorter timeout)
    console.log('🎥 Step 2: Testing Puppeteer video extraction (quick)...');
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });

    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 720 },
      bypassCSP: true,
      javaScriptEnabled: true,
    });

    const page = await context.newPage();

    // Navigate to the anime page
    console.log('🌐 Navigating to anime page...');
    await page.goto(fullAnimeLink, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for content to load and try multiple times
    console.log('⏳ Waiting for dynamic content to load...');
    await page.waitForTimeout(5000);
    
    // Try to wait for iframe to load
    try {
      await page.waitForSelector('iframe[src]', { timeout: 10000 });
      console.log('✅ Found iframe with src attribute');
    } catch (e) {
      console.log('No iframe with src found, continuing...');
    }

    // Quick check for video elements
    console.log('🔍 Looking for video elements...');
    
    // Check if page loaded properly
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Debug: Check page content for video-related elements
    const pageContent = await page.content();
    console.log('Page contains "embed":', pageContent.includes('embed'));
    console.log('Page contains "player":', pageContent.includes('player'));
    console.log('Page contains "m3u8":', pageContent.includes('m3u8'));
    
    // Look for iframe elements
    const iframeCount = await page.locator('iframe').count();
    console.log(`Found ${iframeCount} iframe elements`);
    
    // Look for video elements
    const videoCount = await page.locator('video').count();
    console.log(`Found ${videoCount} video elements`);
    
    // Look for any elements with video-related attributes
    const videoElements = await page.$$eval('[src*="embed"], [src*="player"], [data-src*="embed"], [data-src*="player"]', (elements) => {
      return elements.map(el => ({
        tagName: el.tagName,
        src: el.src,
        dataSrc: el.getAttribute('data-src'),
        className: el.className,
        id: el.id
      }));
    });
    
    if (videoElements.length > 0) {
      console.log('Found video-related elements:', videoElements);
    }

    // Try to get iframe src if available
    let streamUrl = '';
    if (iframeCount > 0) {
      try {
        // Get all iframe elements and their sources
        const iframeSources = await page.$$eval('iframe', (iframes) => {
          return iframes.map(iframe => ({
            src: iframe.src,
            dataSrc: iframe.getAttribute('data-src'),
            id: iframe.id,
            className: iframe.className
          }));
        });
        
        console.log('All iframe sources:', iframeSources);
        
        // Find the first valid source
        for (const iframe of iframeSources) {
          if (iframe.src && iframe.src !== 'about:blank') {
            streamUrl = iframe.src;
            console.log('✅ Found iframe source:', streamUrl);
            break;
          } else if (iframe.dataSrc) {
            streamUrl = iframe.dataSrc;
            console.log('✅ Found iframe data-src:', streamUrl);
            break;
          }
        }
      } catch (e) {
        console.log('Could not extract iframe src:', e.message);
      }
    }

    // Try to get video src if available
    if (!streamUrl && videoCount > 0) {
      try {
        const videoSrc = await page.$eval('video', (el) => el.src);
        if (videoSrc) {
          streamUrl = videoSrc;
          console.log('✅ Found video source:', streamUrl);
        }
      } catch (e) {
        console.log('Could not extract video src');
      }
    }

    await browser.close();

    if (streamUrl) {
      console.log('🎉 Scraping successful!');
      console.log('Stream URL:', streamUrl);
      
      // Save to database
      const episodeData = {
        anime_id: animeId,
        episode_number: episodeNumber,
        title: `${animeTitle} - Episode ${episodeNumber}`,
        video_url: streamUrl,
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
    } else {
      console.log('❌ Could not find video stream URL');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

scrapeAnimeFromCommandLine();
