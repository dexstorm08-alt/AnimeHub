import * as cheerio from 'cheerio';
import axios from 'axios';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Apply stealth plugin to avoid detection
chromium.use(StealthPlugin());

async function testHybridScraper() {
  console.log('🧪 Testing Hybrid HiAnime Scraper...');
  
  const BASE_URL = 'https://hianime.do';
  const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const animeTitle = 'One Piece';
  
  try {
    // Step 1: Fast search with Cheerio
    console.log('🔍 Step 1: Searching with Cheerio...');
    const searchUrl = `${BASE_URL}/search?keyword=${encodeURIComponent(animeTitle)}`;
    
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
    const animeId = animeLink.match(/watch\/[^?]+-(\d+)/)?.[1];
    
    if (!animeId) {
      throw new Error('Anime ID not found');
    }
    
    console.log('✅ Cheerio search successful:', { fullAnimeLink, animeId });

    // Step 2: Dynamic video extraction with Puppeteer
    console.log('🎥 Step 2: Extracting video with Puppeteer...');
    
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
    await page.goto(fullAnimeLink, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for the page to load completely
    await page.waitForTimeout(5000);

    // Try to find video elements
    let streamUrl = '';
    
    // Method 1: Look for iframe elements
    try {
      await page.waitForSelector('iframe', { timeout: 10000 });
      const iframeSrc = await page.$eval('iframe', (el) => el.src);
      if (iframeSrc) {
        streamUrl = iframeSrc;
        console.log('✅ Found iframe source:', streamUrl);
      }
    } catch (e) {
      console.log('No iframe found, trying other methods...');
    }

    // Method 2: Look for video elements
    if (!streamUrl) {
      try {
        await page.waitForSelector('video', { timeout: 10000 });
        const videoSrc = await page.$eval('video', (el) => el.src);
        if (videoSrc) {
          streamUrl = videoSrc;
          console.log('✅ Found video source:', streamUrl);
        }
      } catch (e) {
        console.log('No video element found...');
      }
    }

    // Method 3: Look for video source elements
    if (!streamUrl) {
      try {
        await page.waitForSelector('video source', { timeout: 10000 });
        const sourceSrc = await page.$eval('video source', (el) => el.src);
        if (sourceSrc) {
          streamUrl = sourceSrc;
          console.log('✅ Found video source element:', sourceSrc);
        }
      } catch (e) {
        console.log('No video source element found...');
      }
    }

    // Method 4: Extract from page content
    if (!streamUrl) {
      console.log('🔍 Searching page content for video URLs...');
      const pageContent = await page.content();
      
      // Look for common video URL patterns
      const urlPatterns = [
        /"(https?:\/\/[^"]*\.m3u8[^"]*)"/g,
        /"(https?:\/\/[^"]*embed[^"]*)"/g,
        /"(https?:\/\/[^"]*player[^"]*)"/g,
        /src\s*:\s*["']([^"']*embed[^"']*)["']/g,
        /url\s*:\s*["']([^"']*\.m3u8[^"']*)["']/g
      ];
      
      for (const pattern of urlPatterns) {
        const matches = pageContent.match(pattern);
        if (matches && matches.length > 0) {
          console.log(`Found ${matches.length} matches with pattern:`, pattern);
          for (const match of matches) {
            const url = match.replace(/["']/g, '').replace(/src\s*:\s*/, '').replace(/url\s*:\s*/, '');
            if (url && (url.includes('embed') || url.includes('player') || url.includes('.m3u8'))) {
              streamUrl = url;
              console.log('✅ Found video URL in page content:', streamUrl);
              break;
            }
          }
          if (streamUrl) break;
        }
      }
    }

    await browser.close();

    if (streamUrl) {
      console.log('🎉 Hybrid scraper test successful!');
      console.log('Final stream URL:', streamUrl);
    } else {
      console.log('❌ Could not find video stream URL');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testHybridScraper();
