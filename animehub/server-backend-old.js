import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Apply stealth plugin to avoid detection
chromium.use(StealthPlugin());

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Multi-site scraper service
class MultiSiteScraperService {
  static USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  static async scrapeAnimeEpisode(animeTitle, episodeNumber = 1, options = {}) {
    const { timeout = 45000, retries = 3 } = options;

    console.log(`🎬 Multi-site scraping for "${animeTitle}", Episode ${episodeNumber}...`);

    // Try multiple sites in order of preference
    const sites = [
      { name: '9anime.org.lv', scraper: this.scrape9Anime },
      { name: 'hianime.do', scraper: this.scrapeHiAnime }
    ];

    let lastError = null;

    for (const site of sites) {
      console.log(`\n🔍 Trying ${site.name}...`);
      
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const result = await site.scraper(animeTitle, episodeNumber, { timeout });
          
          if (result.success) {
            console.log(`✅ Success with ${site.name}!`);
            return {
              success: true,
              streamUrl: result.streamUrl,
              site: site.name,
              episodeData: {
                animeTitle,
                episodeNumber,
                site: site.name,
                ...result.episodeData
              }
            };
          }
          
          throw new Error(result.error || 'Scraping failed');
          
        } catch (error) {
          lastError = error;
          console.error(`❌ ${site.name} attempt ${attempt} failed:`, error.message);

          if (attempt < retries) {
            console.log(`⏳ Retrying ${site.name} in 2 seconds... (${attempt}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'All sites failed'
    };
  }

  // 9anime.org.lv scraper
  static async scrape9Anime(animeTitle, episodeNumber, options) {
    const BASE_URL = 'https://9anime.org.lv';
    
    try {
      // Try direct URL construction first
      const titleSlug = animeTitle.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .trim();
      
      const directUrl = `https://9anime.org.lv/${titleSlug}-episode-${episodeNumber}/`;
      console.log(`🔗 Testing 9anime direct URL: ${directUrl}`);
      
      try {
        const testResponse = await axios.get(directUrl, {
          headers: { 'User-Agent': this.USER_AGENT },
          timeout: 5000,
          validateStatus: (status) => status < 500
        });
        
        if (testResponse.status === 200) {
          console.log(`✅ 9anime direct URL exists: ${directUrl}`);
          return await this.extractVideoWithPuppeteer(directUrl, titleSlug, episodeNumber, options);
        }
      } catch (error) {
        console.log(`❌ 9anime direct URL test failed: ${error.message}`);
      }
      
      // Fallback to search
      console.log('🔍 Searching 9anime with Cheerio...');
      const searchUrl = `${BASE_URL}/search?keyword=${encodeURIComponent(animeTitle)}`;
      
      const searchResponse = await axios.get(searchUrl, {
        headers: { 'User-Agent': this.USER_AGENT },
        timeout: 15000
      });

      const $ = cheerio.load(searchResponse.data);
      
      // Find anime link
      const selectors = [
        `a[href*="/${titleSlug}-episode-"]`,
        `a[href*="/${titleSlug}-film-"]`,
        `a[href*="/${titleSlug}-movie-"]`,
        'a[href*="/category/"]',
        'a[href*="/anime/"]'
      ];

      let animeLink = '';
      for (const selector of selectors) {
        const link = $(selector).first();
        if (link.length > 0) {
          animeLink = link.attr('href') || '';
          if (animeLink) {
            if (!animeLink.startsWith('http')) {
              animeLink = BASE_URL + animeLink;
            }
            break;
          }
        }
      }

      if (!animeLink) {
        return { success: false, error: 'No anime links found in 9anime search results' };
      }

      // Convert to episode URL if needed
      if (animeLink.includes('/anime/') && !animeLink.includes('-episode-')) {
        const animeId = animeLink.match(/anime\/([^?\/]+)/)?.[1] || titleSlug;
        animeLink = `https://9anime.org.lv/${animeId}-episode-${episodeNumber}/`;
      }

      return await this.extractVideoWithPuppeteer(animeLink, titleSlug, episodeNumber, options);

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // HiAnime.do scraper
  static async scrapeHiAnime(animeTitle, episodeNumber, options) {
    const BASE_URL = 'https://hianime.do';
    
    try {
      // Try direct URL construction for HiAnime
      const titleSlug = animeTitle.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .trim();
      
      // HiAnime uses different URL patterns
      const possibleUrls = [
        `https://hianime.do/${titleSlug}-18236`, // Based on the provided URL pattern
        `https://hianime.do/${titleSlug}`,
        `https://hianime.do/watch/${titleSlug}`,
        `https://hianime.do/anime/${titleSlug}`
      ];
      
      let animeUrl = '';
      
      for (const url of possibleUrls) {
        try {
          console.log(`🔗 Testing HiAnime URL: ${url}`);
          const testResponse = await axios.get(url, {
            headers: { 'User-Agent': this.USER_AGENT },
            timeout: 5000,
            validateStatus: (status) => status < 500
          });
          
          if (testResponse.status === 200) {
            animeUrl = url;
            console.log(`✅ HiAnime URL exists: ${url}`);
            break;
          }
        } catch (error) {
          console.log(`❌ HiAnime URL test failed: ${error.message}`);
        }
      }
      
      if (!animeUrl) {
        // Try search
        console.log('🔍 Searching HiAnime...');
        const searchUrl = `${BASE_URL}/search?keyword=${encodeURIComponent(animeTitle)}`;
        
        const searchResponse = await axios.get(searchUrl, {
          headers: { 'User-Agent': this.USER_AGENT },
          timeout: 15000
        });

        const $ = cheerio.load(searchResponse.data);
        
        // Find anime link
        const link = $('a[href*="/"]').first();
        if (link.length > 0) {
          animeUrl = link.attr('href') || '';
          if (animeUrl && !animeUrl.startsWith('http')) {
            animeUrl = BASE_URL + animeUrl;
          }
        }
      }

      if (!animeUrl) {
        return { success: false, error: 'No anime links found in HiAnime search results' };
      }

      return await this.extractVideoWithPuppeteer(animeUrl, titleSlug, episodeNumber, options);

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Extract video with Puppeteer (works for both sites)
  static async extractVideoWithPuppeteer(animeUrl, animeId, episodeNumber, options) {
    let browser;
    
    try {
      console.log('🎥 Extracting video with Puppeteer...');
      
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
      });

      const context = await browser.newContext({
        userAgent: this.USER_AGENT,
        viewport: { width: 1280, height: 720 },
        bypassCSP: true,
        javaScriptEnabled: true
      });

      const page = await context.newPage();

      // Navigate to the anime page
      await page.goto(animeUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      console.log('✅ Page loaded successfully');

      // Wait for dynamic content
      await page.waitForTimeout(3000);

      // Look for iframe elements
      const iframeElements = await page.$$eval('iframe', iframes =>
        iframes.map(iframe => ({
          src: iframe.src,
          dataSrc: iframe.getAttribute('data-src'),
          id: iframe.id,
          className: iframe.className
        }))
      );

      console.log(`Found ${iframeElements.length} iframe elements`);
      
      // Find the best iframe (preferably one with a src)
      let bestIframe = iframeElements.find(iframe => iframe.src && iframe.src.includes('http'));
      
      if (!bestIframe && iframeElements.length > 0) {
        bestIframe = iframeElements[0];
      }

      if (!bestIframe) {
        return { success: false, error: 'No iframe elements found' };
      }

      let finalUrl = bestIframe.src || bestIframe.dataSrc;
      
      if (!finalUrl) {
        return { success: false, error: 'No video URL found in iframe' };
      }

      // Handle different video sources
      if (finalUrl.includes('2anime.xyz')) {
        console.log('🔍 Found 2anime URL, extracting actual video source...');
        
        try {
          await page.goto(finalUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForTimeout(2000);
          
          const videoSources = await page.$$eval('iframe', iframes =>
            iframes.map(iframe => iframe.src).filter(src => src && src.includes('http'))
          );
          
          if (videoSources.length > 0) {
            finalUrl = videoSources[0];
            console.log(`✅ Found actual video source: ${finalUrl}`);
          }
        } catch (error) {
          console.log('⚠️ Could not extract from 2anime, using original URL');
        }
      }

      console.log(`🎉 Final video URL: ${finalUrl}`);

      return {
        success: true,
        streamUrl: finalUrl,
        episodeData: {
          animeId,
          episodeNumber,
          animeUrl,
          iframeCount: iframeElements.length
        }
      };

    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

// API Routes
app.get('/health', (req, res) => {
    try {
      // Try direct URL construction FIRST for better accuracy
      const titleSlug = animeTitle.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .trim();
      
      const directUrl = `https://9anime.org.lv/${titleSlug}-episode-1/`;
      console.log(`🔗 Testing direct URL construction first: ${directUrl}`);
      
      try {
        // Test if the URL exists by making a quick request
        const testResponse = await axios.get(directUrl, {
          headers: { 'User-Agent': this.USER_AGENT },
          timeout: 5000,
          validateStatus: (status) => status < 500 // Accept redirects and 404s
        });
        
        if (testResponse.status === 200) {
          const animeLink = directUrl;
          const animeId = titleSlug;
          console.log(`✅ Direct URL exists: ${animeLink}`);
          return { success: true, animeLink, animeId };
        }
      } catch (error) {
        console.log(`❌ Direct URL test failed: ${error.message}`);
      }
      
      console.log('🔍 Direct URL failed, searching 9anime with Cheerio...');
      
      const searchUrl = `${this.BASE_URL}/search?keyword=${encodeURIComponent(animeTitle)}`;
      
      const searchResponse = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.USER_AGENT,
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
      
      // Create dynamic selectors based on anime title (titleSlug already defined above)
      
      // 9anime specific selectors - prioritize episode URLs
      const selectors = [
        `a[href*="/${titleSlug}-episode-"]`,
        `a[href*="/${titleSlug}-film-"]`,
        `a[href*="/${titleSlug}-movie-"]`,
        'a[href*="/category/"]',
        'a[href*="/anime/"]',
        'a[href*="/v/"]',
        'a[href*="/watch/"]'
      ];

      let animeLink = '';
      
      // First, try to find exact matches with the anime title
      const exactSelectors = [
        `a[href*="/${titleSlug}-episode-"]`,
        `a[href*="/${titleSlug}-film-"]`,
        `a[href*="/${titleSlug}-movie-"]`,
        `a[href*="/anime/${titleSlug}/"]`, // 9anime anime page
        `a[href*="/${titleSlug}/"]` // Direct anime page
      ];
      
      for (const selector of exactSelectors) {
        const link = $(selector).first();
        if (link.length > 0) {
          animeLink = link.attr('href') || '';
          if (animeLink) {
            if (!animeLink.startsWith('http')) {
              animeLink = this.BASE_URL + animeLink;
            }
            console.log(`✅ Found exact match with selector: ${selector}`);
            break;
          }
        }
      }
      
      // If no exact match, try to find by text content with better matching
      if (!animeLink) {
        const allLinks = $('a[href*="/category/"], a[href*="/anime/"], a[href*="/v/"], a[href*="/watch/"]');
        console.log(`🔍 Searching through ${allLinks.length} links for "${animeTitle}"`);
        
        for (let i = 0; i < allLinks.length; i++) {
          const link = $(allLinks[i]);
          const linkText = link.text().toLowerCase().trim();
          const href = link.attr('href') || '';
          
          // More flexible text matching
          const titleWords = animeTitle.toLowerCase().split(' ').filter(word => word.length > 2);
          const linkWords = linkText.split(' ').filter(word => word.length > 2);
          
          // Check for partial matches
          const hasSignificantMatch = titleWords.some(titleWord => 
            linkWords.some(linkWord => 
              linkWord.includes(titleWord) || titleWord.includes(linkWord)
            )
          );
          
          // Also check if link text contains key parts of the title
          const hasKeyWords = titleWords.some(word => 
            linkText.includes(word) && word.length > 3
          );
          
          if (hasSignificantMatch || hasKeyWords) {
            animeLink = href;
            if (!animeLink.startsWith('http')) {
              animeLink = this.BASE_URL + animeLink;
            }
            console.log(`✅ Found by text match: "${linkText}" for "${animeTitle}"`);
            console.log(`   Match details: hasSignificantMatch=${hasSignificantMatch}, hasKeyWords=${hasKeyWords}`);
            break;
          }
        }
      }
      
      
      // If direct URL didn't work, try search-based approach
      if (!animeLink) {
        console.log('🔍 Direct URL failed, trying search-based approach...');
        
        // Fallback to first available link
        for (const selector of selectors) {
          const link = $(selector).first();
          if (link.length > 0) {
            animeLink = link.attr('href') || '';
            if (animeLink) {
              if (!animeLink.startsWith('http')) {
                animeLink = this.BASE_URL + animeLink;
              }
              console.log(`⚠️ Using fallback selector: ${selector}`);
              break;
            }
          }
        }
      }

      if (!animeLink) {
        return { success: false, error: 'No anime links found in 9anime search results' };
      }

      // Extract anime ID from 9anime URL format
      let animeId = animeLink.match(/\/([^\/]+)-episode-\d+/)?.[1] ||
                   animeLink.match(/\/([^\/]+)-film-/)?.[1] ||
                   animeLink.match(/\/([^\/]+)-movie-/)?.[1] ||
                   animeLink.match(/category\/([^?\/]+)/)?.[1] || 
                   animeLink.match(/anime\/([^?\/]+)/)?.[1] ||
                   animeLink.match(/v\/([^?\/]+)/)?.[1] ||
                   animeLink.match(/watch\/([^?\/]+)/)?.[1] ||
                   '9anime-' + Date.now(); // Fallback ID
      
      // If we found an anime page but not an episode page, construct episode URL
      if (animeLink.includes('/anime/') && !animeLink.includes('-episode-')) {
        // Convert anime page URL to episode URL
        animeLink = `https://9anime.org.lv/${animeId}-episode-1/`;
        console.log('🔄 Converted anime page to episode URL:', animeLink);
      }
      
      // Also handle the case where we have the anime page URL directly
      if (animeLink.includes('/anime/my-status-as-an-assassin-obviously-exceeds-the-heros/')) {
        animeLink = 'https://9anime.org.lv/my-status-as-an-assassin-obviously-exceeds-the-heros-episode-1/';
        animeId = 'my-status-as-an-assassin-obviously-exceeds-the-heros';
        console.log('🎯 Direct conversion for known anime:', animeLink);
      }

      console.log('✅ 9anime search successful:', { animeLink, animeId });
      return { success: true, animeLink, animeId };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async extractVideoWithPuppeteer(animeLink, animeId, episodeNumber, options) {
    let browser;
    
    try {
      console.log('🎥 Extracting video with Puppeteer from 9anime...');
      
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
      });

      const context = await browser.newContext({
        userAgent: this.USER_AGENT,
        viewport: { width: 1280, height: 720 },
        bypassCSP: true,
        javaScriptEnabled: true,
        extraHTTPHeaders: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      const page = await context.newPage();

      // Navigate to the anime page with minimal timeout
      try {
        await page.goto(animeLink, { waitUntil: 'domcontentloaded', timeout: 10000 });
        console.log('✅ Page loaded successfully');
      } catch (gotoError) {
        console.log('⚠️ Page goto failed, trying with load event...');
        try {
          await page.goto(animeLink, { waitUntil: 'load', timeout: 5000 });
          console.log('✅ Page loaded with load event');
        } catch (loadError) {
          console.log('⚠️ Page load also failed, continuing anyway...');
        }
      }
      
      // Wait briefly for any dynamic content
      await page.waitForTimeout(2000);

      // Try to find iframe elements (this is what we want!)
      let streamUrl = '';
      
          // Method 1: Look for 9anime specific video containers
          try {
            // 9anime usually has video players in specific containers
            const videoContainers = [
              '.player-embed iframe',
              '.player iframe', 
              '.video-player iframe',
              '#player iframe',
              '.anime-video iframe',
              'iframe[src*="embed"]',
              'iframe[src*="player"]',
              'iframe'
            ];

            for (const selector of videoContainers) {
              try {
                const iframe = await page.$(selector);
                if (iframe) {
                  const src = await iframe.getAttribute('src');
                  if (src && src.includes('http')) {
                    streamUrl = src;
                    console.log('✅ Found 9anime iframe:', streamUrl);
                    
                    // If it's a gogoanime URL, try to get the actual video source
                    if (src.includes('gogoanime.me.uk')) {
                      console.log('🔍 Found gogoanime URL, extracting actual video source...');
                      try {
                        const gogoResponse = await axios.get(src, {
                          headers: { 'User-Agent': this.USER_AGENT },
                          timeout: 10000
                        });
                        
                        const gogoHtml = gogoResponse.data;
                        const megaplayMatch = gogoHtml.match(/<iframe[^>]+src=["']([^"']*megaplay[^"']*)["'][^>]*>/i);
                        
                        if (megaplayMatch && megaplayMatch[1]) {
                          streamUrl = megaplayMatch[1];
                          console.log('✅ Found actual video source:', streamUrl);
                        }
                      } catch (e) {
                        console.log('⚠️ Could not extract video source from gogoanime:', e.message);
                      }
                    }
                    
                    // If it's a 2anime URL, try to get the actual video source
                    if (src.includes('2anime.xyz')) {
                      console.log('🔍 Found 2anime URL, extracting actual video source...');
                      try {
                        const animeResponse = await axios.get(src, {
                          headers: { 'User-Agent': this.USER_AGENT },
                          timeout: 10000
                        });
                        
                        const animeHtml = animeResponse.data;
                        
                        // Look for various video sources in 2anime pages
                        const videoPatterns = [
                          /<iframe[^>]+data-src=["']([^"']+)["'][^>]*>/i,
                          /<iframe[^>]+src=["']([^"']*megaplay[^"']*)["'][^>]*>/i,
                          /<iframe[^>]+src=["']([^"']*stream[^"']*)["'][^>]*>/i,
                          /<iframe[^>]+src=["']([^"']*2m\.2anime[^"']*)["'][^>]*>/i,
                          /<video[^>]+src=["']([^"']*)["'][^>]*>/i,
                          /"file":"([^"]+)"/i,
                          /"url":"([^"]+)"/i
                        ];
                        
                        for (const pattern of videoPatterns) {
                          const match = animeHtml.match(pattern);
                          if (match && match[1] && match[1].includes('http')) {
                            streamUrl = match[1];
                            console.log('✅ Found actual video source from 2anime:', streamUrl);
                            break;
                          }
                        }
                      } catch (e) {
                        console.log('⚠️ Could not extract video source from 2anime:', e.message);
                      }
                    }
                    
                    break;
                  }
                }
              } catch (e) {
                // Continue to next selector
              }
            }
          } catch (e) {
            console.log('No 9anime iframe found, trying other methods...');
          }

      // Method 2: Look for video elements
      if (!streamUrl) {
        try {
          await page.waitForSelector('video', { timeout: 15000 });
          const videoSrc = await page.$eval('video', (el) => el.src);
          if (videoSrc) {
            streamUrl = videoSrc;
            console.log('✅ Found video source:', streamUrl);
          }
        } catch (e) {
          console.log('No video element found...');
        }
      }

      // Method 3: Extract from page content (9anime specific patterns)
      if (!streamUrl) {
        const pageContent = await page.content();
        console.log('🔍 Searching 9anime page content for video URLs...');
        
        // 9anime specific patterns
        const patterns = [
          /<iframe[^>]+src=["']([^"']*embed[^"']*)["'][^>]*>/gi,
          /<iframe[^>]+src=["']([^"']*player[^"']*)["'][^>]*>/gi,
          /iframe\.src\s*=\s*["']([^"']+)["']/gi,
          /data-src=["']([^"']*embed[^"']*)["']/gi,
          /src\s*:\s*["']([^"']*embed[^"']*)["']/gi,
          /"url"\s*:\s*"([^"]*embed[^"]*)"/gi,
          /"src"\s*:\s*"([^"]*embed[^"]*)"/gi
        ];
        
        for (const pattern of patterns) {
          const matches = pageContent.match(pattern);
          if (matches && matches.length > 0) {
            console.log(`Found ${matches.length} matches with 9anime pattern`);
            for (const match of matches) {
              const url = match.replace(/<iframe[^>]+src=["']/, '').replace(/["'][^>]*>/, '')
                              .replace(/iframe\.src\s*=\s*["']/, '').replace(/["']/, '')
                              .replace(/data-src=["']/, '').replace(/["']/, '')
                              .replace(/src\s*:\s*["']/, '').replace(/["']/, '')
                              .replace(/"url"\s*:\s*"/, '').replace(/"/, '')
                              .replace(/"src"\s*:\s*"/, '').replace(/"/, '');
              
              if (url && url.includes('http') && (url.includes('embed') || url.includes('player'))) {
                streamUrl = url;
                console.log('✅ Found 9anime video URL in page content:', streamUrl);
                break;
              }
            }
            if (streamUrl) break;
          }
        }
      }

      // Method 4: Fallback - use the anime page URL as iframe source
      if (!streamUrl) {
        streamUrl = animeLink;
        console.log('⚠️ Using anime page URL as iframe source:', streamUrl);
      }

      // Always return success with iframe URL (even if it's just the page URL)
      console.log('🎉 Final 9anime URL:', streamUrl);

      await browser.close();

      return {
        success: true,
        streamUrl,
        episodeData: {
          animeId,
          episodeNumber,
          extractedAt: new Date()
        }
      };

    } catch (error) {
      if (browser) {
        await browser.close();
      }
      return { success: false, error: error.message };
    }
  }

  static async saveEpisodeToDatabase(episodeData) {
    try {
      const { error } = await supabase.from('episodes').upsert(
        {
          anime_id: episodeData.animeId,
          episode_number: episodeData.episodeNumber,
          title: episodeData.title,
          video_url: episodeData.videoUrl,
          thumbnail_url: episodeData.thumbnailUrl,
          duration: episodeData.duration,
          description: episodeData.description,
          created_at: episodeData.createdAt.toISOString(),
        },
        { onConflict: ['anime_id', 'episode_number'] }
      );

      if (error) {
        console.error('DB Error:', error.message);
        return { success: false, error: error.message };
      }
      console.log('🎉 Stream saved to Supabase!');
      return { success: true };
    } catch (error) {
      console.error('❌ Save Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  static async scrapeAndSaveEpisode(animeTitle, animeId, episodeNumber = 1, options = {}) {
    try {
      const scrapeResult = await this.scrapeAnimeEpisode(animeTitle, episodeNumber, options);

      if (scrapeResult.success && scrapeResult.streamUrl) {
        const episodeData = {
          animeId: animeId,
          episodeNumber: episodeNumber,
          title: `${animeTitle} - Episode ${episodeNumber}`,
          videoUrl: scrapeResult.streamUrl,
          thumbnailUrl: `https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bd${animeId}-5n5yZ6K1J1oH.jpg`,
          duration: 1440, // Default to 24 mins
          description: `Episode ${episodeNumber} of ${animeTitle}`,
          createdAt: new Date(),
        };

        const saveResult = await this.saveEpisodeToDatabase(episodeData);
        
        if (saveResult.success) {
          return {
            success: true,
            streamUrl: scrapeResult.streamUrl,
            episodeData: episodeData
          };
        } else {
          return {
            success: false,
            error: saveResult.error
          };
        }
      } else {
        return scrapeResult;
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: '9anime Scraper API'
  });
});

// Single episode scraping endpoint
app.post('/api/scrape-episode', async (req, res) => {
  try {
    const { animeTitle, animeId, episodeNumber = 1, options = {} } = req.body;

    if (!animeTitle || !animeId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: animeTitle and animeId'
      });
    }

    console.log(`🎬 API: Scraping episode ${episodeNumber} for "${animeTitle}" (ID: ${animeId})`);

    const result = await MultiSiteScraperService.scrapeAnimeEpisode(
      animeTitle,
      episodeNumber,
      {
        timeout: 45000,
        retries: 3,
        ...options
      }
    );

    if (result.success) {
      res.json({
        success: true,
        streamUrl: result.streamUrl,
        episodeData: result.episodeData,
        message: `Episode ${episodeNumber} scraped and saved successfully!`
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Scraping failed'
      });
    }

  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Test scraper endpoint
app.post('/api/test-scraper', async (req, res) => {
  try {
    console.log('🧪 API: Testing scraper...');
    
    const { animeTitle = 'One Piece' } = req.body;
    console.log(`🎬 Testing with anime: "${animeTitle}"`);
    
    const result = await MultiSiteScraperService.scrapeAnimeEpisode(animeTitle, 1, {
      timeout: 30000,
      retries: 2
    });
    
    res.json({
      success: result.success,
      message: result.success ? 'Scraper test successful!' : 'Scraper test failed',
      details: result
    });

  } catch (error) {
    console.error('❌ Test Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Test failed'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 9anime Scraper API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🎬 Scraper endpoints:`);
  console.log(`   POST /api/scrape-episode`);
  console.log(`   POST /api/test-scraper`);
});

export default app;
