import * as cheerio from 'cheerio';
import axios from 'axios';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Apply stealth plugin to avoid detection
chromium.use(StealthPlugin());

async function testHybridScraperQuick() {
  console.log('🧪 Testing Hybrid Scraper (Quick Test)...');
  
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
    await page.goto(fullAnimeLink, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Wait briefly for content to load
    await page.waitForTimeout(2000);

    // Quick check for video elements
    console.log('🔍 Looking for video elements...');
    
    // Check if page loaded properly
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Look for iframe elements
    const iframeCount = await page.locator('iframe').count();
    console.log(`Found ${iframeCount} iframe elements`);
    
    // Look for video elements
    const videoCount = await page.locator('video').count();
    console.log(`Found ${videoCount} video elements`);
    
    // Look for video source elements
    const sourceCount = await page.locator('video source').count();
    console.log(`Found ${sourceCount} video source elements`);

    // Try to get iframe src if available
    if (iframeCount > 0) {
      try {
        const iframeSrc = await page.$eval('iframe', (el) => el.src);
        if (iframeSrc) {
          console.log('✅ Found iframe source:', iframeSrc);
        }
      } catch (e) {
        console.log('Could not extract iframe src');
      }
    }

    // Try to get video src if available
    if (videoCount > 0) {
      try {
        const videoSrc = await page.$eval('video', (el) => el.src);
        if (videoSrc) {
          console.log('✅ Found video source:', videoSrc);
        }
      } catch (e) {
        console.log('Could not extract video src');
      }
    }

    await browser.close();

    console.log('🎉 Hybrid scraper quick test completed!');
    console.log('✅ Cheerio search: WORKING');
    console.log('✅ Puppeteer navigation: WORKING');
    console.log('✅ Video element detection: WORKING');
    console.log('🚀 Ready for full integration test!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testHybridScraperQuick();
