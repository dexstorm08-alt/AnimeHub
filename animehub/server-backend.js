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
  origin: true, // Allow all origins in development
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Scraper service
class NineAnimeScraperService {
  static BASE_URL = 'https://9anime.org.lv';
  static USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  static async scrapeAnimeEpisode(animeTitle, episodeNumber = 1, options = {}) {
    const { timeout = 45000, retries = 3 } = options;

    console.log(`🎬 Scraping 9anime.org.lv for "${animeTitle}", Episode ${episodeNumber}...`);

    let lastError = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
            // Step 1: Use Cheerio for fast search
            const searchResult = await this.searchAnimeWithCheerio(animeTitle, episodeNumber);
        
        if (!searchResult.success) {
          throw new Error(searchResult.error || 'Search failed');
        }

        const { animeLink, animeId } = searchResult;
        console.log(`🔍 DEBUG: animeLink = ${animeLink}, episodeNumber = ${episodeNumber}`);

        // Step 2: Use Puppeteer for dynamic video extraction
        const videoResult = await this.extractVideoWithPuppeteer(animeLink, animeId, episodeNumber, {
          timeout
        });

        if (!videoResult.success) {
          throw new Error(videoResult.error || 'Video extraction failed');
        }

        // Step 3: Check for anti-embedding protection
        const embeddingCheck = await this.checkEmbeddingProtection(videoResult.streamUrl);

        const finalEpisodeData = {
          animeTitle,
          animeId,
          animeLink,
          ...videoResult.episodeData,
          episodeNumber  // Put this after the spread to ensure it's not overwritten
        };
        
        console.log(`🔍 DEBUG: Final episodeData = ${JSON.stringify(finalEpisodeData)}`);

        return {
          success: true,
          streamUrl: videoResult.streamUrl,
          embeddingProtected: embeddingCheck.protected,
          embeddingReason: embeddingCheck.reason,
          episodeData: finalEpisodeData
        };

      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed:`, error.message);

        if (attempt < retries) {
          console.log(`⏳ Retrying in 2 seconds... (${attempt}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error occurred'
    };
  }

  // New method to scrape all available episodes
  static async scrapeAllEpisodes(animeTitle, options = {}) {
    const { maxEpisodes = 50, timeout = 45000, retries = 2 } = options;

    console.log(`🎬 Scraping all episodes for "${animeTitle}" (max ${maxEpisodes})...`);

    try {
          // Step 1: Find the anime and get episode list (use episode 1 for initial search)
          const searchResult = await this.searchAnimeWithCheerio(animeTitle, 1);
      
      if (!searchResult.success) {
        return { success: false, error: searchResult.error || 'Search failed' };
      }

      const { animeLink, animeId } = searchResult;

      // Step 2: Get available episodes from the anime page
      const episodesResult = await this.getAvailableEpisodes(animeLink, animeId, maxEpisodes);
      
      if (!episodesResult.success) {
        return { success: false, error: episodesResult.error || 'Failed to get episodes' };
      }

      const { episodes, totalEpisodes } = episodesResult;
      console.log(`📺 Found ${totalEpisodes} total episodes, checking first ${episodes.length}...`);

      // Step 3: Scrape each episode
      const scrapedEpisodes = [];
      const failedEpisodes = [];

      for (const episode of episodes) {
        try {
          console.log(`🎬 Scraping Episode ${episode.number}: "${episode.title}"`);
          
          const episodeResult = await this.scrapeAnimeEpisode(animeTitle, episode.number, {
            timeout: timeout / episodes.length, // Distribute timeout across episodes
            retries
          });

          if (episodeResult.success) {
            scrapedEpisodes.push({
              ...episode,
              streamUrl: episodeResult.streamUrl,
              embeddingProtected: episodeResult.embeddingProtected,
              embeddingReason: episodeResult.embeddingReason,
              scrapedAt: new Date().toISOString()
            });
            console.log(`✅ Episode ${episode.number} scraped successfully`);
          } else {
            failedEpisodes.push({
              ...episode,
              error: episodeResult.error
            });
            console.log(`❌ Episode ${episode.number} failed: ${episodeResult.error}`);
          }

          // Small delay between episodes to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          failedEpisodes.push({
            ...episode,
            error: error.message
          });
          console.log(`❌ Episode ${episode.number} error: ${error.message}`);
        }
      }

      return {
        success: true,
        animeTitle,
        animeId,
        totalEpisodes,
        scrapedEpisodes,
        failedEpisodes,
        summary: {
          total: episodes.length,
          successful: scrapedEpisodes.length,
          failed: failedEpisodes.length,
          embeddingProtected: scrapedEpisodes.filter(ep => ep.embeddingProtected).length
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get available episodes from anime page
  static async getAvailableEpisodes(animeLink, animeId, maxEpisodes = 50) {
    try {
      console.log('📺 Getting available episodes...');
      
      const response = await axios.get(animeLink, {
        headers: { 'User-Agent': this.USER_AGENT },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      
      // Extract anime slug from the URL for filtering
      const animeSlug = animeLink.match(/\/([^\/]+)-episode-\d+/)?.[1] || 
                       animeLink.match(/anime\/([^\/]+)/)?.[1] ||
                       animeId;
      
      console.log(`🔍 Looking for episodes with anime slug: ${animeSlug}`);
      
      // Look for episode lists in specific containers ONLY (not all links)
      const episodes = [];
      
      // Method 1: Look for episode lists in specific containers ONLY
      const episodeContainers = $('.episode-list, .episodes, .episode-item, [class*="episode"]');
      
      episodeContainers.each((i, container) => {
        const episodeItems = $(container).find('a, .episode, [class*="episode"]');
        
        episodeItems.each((j, item) => {
          const text = $(item).text().trim();
          const href = $(item).attr('href');
          
          if (text && href) {
            // Check if this link belongs to the same anime
            const isSameAnime = href.includes(animeSlug) || 
                               href.includes(animeId) ||
                               href.includes(animeLink.split('/').pop()?.split('-episode')[0]);
            
            if (isSameAnime) {
              // Extract episode number from URL or text
              const episodeMatch = href.match(/-episode-(\d+)/) || 
                                  href.match(/\/episode\/(\d+)/) ||
                                  href.match(/\/watch\/.*?(\d+)/) ||
                                  text.match(/episode\s*(\d+)/i) ||
                                  text.match(/ep\s*(\d+)/i);
              
              if (episodeMatch) {
                const episodeNumber = parseInt(episodeMatch[1]);
                if (episodeNumber && episodeNumber <= maxEpisodes) {
                  episodes.push({
                    number: episodeNumber,
                    title: text,
                    url: href.startsWith('http') ? href : this.BASE_URL + href
                  });
                }
              } else if (text.match(/\d+/)) {
                // Fallback: extract number from text
                const episodeNumber = parseInt(text.match(/\d+/)[0]);
                if (episodeNumber && episodeNumber <= maxEpisodes) {
                  episodes.push({
                    number: episodeNumber,
                    title: text,
                    url: href.startsWith('http') ? href : this.BASE_URL + href
                  });
                }
              }
            }
          }
        });
      });

      // Remove duplicates and sort by episode number
      const uniqueEpisodes = episodes.filter((ep, index, self) => 
        index === self.findIndex(e => e.number === ep.number)
      ).sort((a, b) => a.number - b.number);

      // If no episodes found, try to construct episode URLs based on the anime pattern
      if (uniqueEpisodes.length === 0) {
        console.log('⚠️ No episodes found, constructing episode URLs...');
        
        // For One Piece Film Red (movie), there should only be 1 episode
        if (animeSlug.includes('one-piece-film-red') || animeSlug.includes('film')) {
          uniqueEpisodes.push({
            number: 1,
            title: 'Movie',
            url: animeLink // Use the original link as it's already episode 1
          });
        } else {
          // For regular anime, try to construct episode URLs
          for (let i = 1; i <= Math.min(12, maxEpisodes); i++) {
            const episodeUrl = animeLink.replace('-episode-1', `-episode-${i}`);
            uniqueEpisodes.push({
              number: i,
              title: `Episode ${i}`,
              url: episodeUrl
            });
          }
        }
      }

      // If no episodes found, try to construct episode URLs based on the anime pattern
      if (uniqueEpisodes.length === 0) {
        console.log('⚠️ No episodes found, constructing episode URLs...');
        
        // For One Piece Film Red (movie), there should only be 1 episode
        if (animeSlug.includes('one-piece-film-red') || animeSlug.includes('film')) {
          uniqueEpisodes.push({
            number: 1,
            title: 'Movie',
            url: animeLink // Use the original link as it's already episode 1
          });
        } else {
          // For regular anime, try to construct episode URLs
          for (let i = 1; i <= Math.min(12, maxEpisodes); i++) {
            const episodeUrl = animeLink.replace('-episode-1', `-episode-${i}`);
            uniqueEpisodes.push({
              number: i,
              title: `Episode ${i}`,
              url: episodeUrl
            });
          }
        }
      }

      // Additional filtering: Remove episodes that don't belong to this anime
      const filteredEpisodes = uniqueEpisodes.filter(episode => {
        // For movies, only allow episode 1
        if (animeSlug.includes('one-piece-film-red') || animeSlug.includes('film')) {
          return episode.number === 1;
        }
        
        // For regular anime, check if the episode URL actually exists
        return true; // We'll let the scraper handle this
      });

      console.log(`✅ Found ${filteredEpisodes.length} episodes for ${animeSlug}`);
      console.log('Episodes:', filteredEpisodes.map(ep => `Ep ${ep.number}: ${ep.title}`));
      
      return {
        success: true,
        episodes: filteredEpisodes,
        totalEpisodes: filteredEpisodes.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if video source has anti-embedding protection
  static async checkEmbeddingProtection(videoUrl) {
    try {
      console.log('🔍 Checking for anti-embedding protection...');
      
      const response = await axios.get(videoUrl, {
        headers: { 'User-Agent': this.USER_AGENT },
        timeout: 10000,
        validateStatus: (status) => status < 500
      });

      const html = response.data;
      
      // Check for common anti-embedding patterns
      const antiEmbeddingPatterns = [
        /if\s*\(\s*window\s*==\s*window\.top\s*\)/i,
        /window\.location\.replace/i,
        /window\.top\.location/i,
        /parent\.location/i,
        /top\.location/i,
        /frameElement/i,
        /anti-embed/i,
        /embedding.*block/i,
        /no.*embed/i
      ];

      const protectionReasons = [];
      
      for (const pattern of antiEmbeddingPatterns) {
        if (pattern.test(html)) {
          protectionReasons.push(pattern.toString());
        }
      }

      // Check for Cloudflare protection (but be lenient with megaplay.buzz)
      if (html.includes('cloudflare') || html.includes('challenge-platform')) {
        if (videoUrl.includes('megaplay.buzz')) {
          console.log('🎯 Megaplay.buzz detected - Cloudflare protection is usually embeddable');
          // Don't add to protection reasons for megaplay.buzz
        } else {
          protectionReasons.push('Cloudflare protection detected');
        }
      }

      // Check for dynamic iframe loading
      if (html.includes('data-src') && !html.includes('src=')) {
        protectionReasons.push('Dynamic iframe loading detected');
      }

      // Special case: megaplay.buzz is generally embeddable even with some protection
      const isProtected = protectionReasons.length > 0 && !videoUrl.includes('megaplay.buzz');
      
      console.log(`${isProtected ? '⚠️' : '✅'} Embedding protection: ${isProtected ? 'DETECTED' : 'NONE'}`);
      if (isProtected) {
        console.log('Reasons:', protectionReasons);
      }

      return {
        protected: isProtected,
        reason: isProtected ? protectionReasons.join(', ') : null
      };

    } catch (error) {
      console.log('⚠️ Could not check embedding protection:', error.message);
      return {
        protected: true, // Assume protected if we can't check
        reason: `Check failed: ${error.message}`
      };
    }
  }

  static async searchAnimeWithCheerio(animeTitle, episodeNumber = 1) {
    try {
      // Try direct URL construction FIRST for better accuracy
      const titleSlug = animeTitle.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .trim();
      
      const directUrl = `https://9anime.org.lv/${titleSlug}-episode-${episodeNumber}/`;
      console.log(`🔗 Testing direct URL construction first: ${directUrl}`);
      console.log(`📝 Episode number requested: ${episodeNumber}`);
      
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
        } else {
          console.log(`❌ Direct URL returned status ${testResponse.status}: ${directUrl}`);
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
            
            // If we found an episode URL but it's not the right episode, construct the correct one
            if (animeLink.includes('-episode-') && episodeNumber !== 1) {
              const episodeMatch = animeLink.match(/-episode-(\d+)/);
              if (episodeMatch) {
                const foundEpisode = parseInt(episodeMatch[1]);
                if (foundEpisode !== episodeNumber) {
                  animeLink = animeLink.replace(`-episode-${foundEpisode}`, `-episode-${episodeNumber}`);
                  console.log(`🔄 Constructed correct episode URL: ${animeLink}`);
                }
              }
            } else if (!animeLink.includes('-episode-') && episodeNumber !== 1) {
              // If we found an anime page URL (not episode URL), construct the episode URL
              if (animeLink.includes('/anime/') || animeLink.includes('/category/')) {
                // Extract the anime slug from the URL
                const slugMatch = animeLink.match(/\/([^\/]+)\/?$/);
                if (slugMatch) {
                  const animeSlug = slugMatch[1];
                  animeLink = `${this.BASE_URL}/${animeSlug}-episode-${episodeNumber}/`;
                  console.log(`🔄 Constructed episode URL from anime page: ${animeLink}`);
                }
              }
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
                        
                        // Priority 1: Look for megaplay.buzz (PREFERRED - Best embedding support)
                        const megaplayMatch = gogoHtml.match(/<iframe[^>]+src=["']([^"']*megaplay[^"']*)["'][^>]*>/i);
                        if (megaplayMatch && megaplayMatch[1]) {
                          streamUrl = megaplayMatch[1];
                          console.log('🎯 Found MEGAPLAY source (PREFERRED):', streamUrl);
                        } else {
                          // Priority 2: Look for other video sources
                          const otherVideoMatch = gogoHtml.match(/<iframe[^>]+src=["']([^"']*(?:stream|video|player)[^"']*)["'][^>]*>/i);
                          if (otherVideoMatch && otherVideoMatch[1]) {
                            streamUrl = otherVideoMatch[1];
                            console.log('✅ Found other video source:', streamUrl);
                          }
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

    const result = await NineAnimeScraperService.scrapeAndSaveEpisode(
      animeTitle,
      animeId,
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
    
    const { animeTitle = 'One Piece', episodeNumber = 1 } = req.body;
    console.log(`🎬 Testing with anime: "${animeTitle}", Episode ${episodeNumber}`);
    
    const result = await NineAnimeScraperService.scrapeAnimeEpisode(animeTitle, episodeNumber, {
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

// Scrape all episodes endpoint
app.post('/api/scrape-all-episodes', async (req, res) => {
  try {
    console.log('🎬 API: Scraping all episodes...');
    
    const { animeTitle, animeId, maxEpisodes = 20 } = req.body;
    
    if (!animeTitle) {
      return res.status(400).json({
        success: false,
        error: 'Anime title is required'
      });
    }
    
    if (!animeId) {
      return res.status(400).json({
        success: false,
        error: 'Anime ID is required'
      });
    }
    
    console.log(`🎬 Scraping all episodes for: "${animeTitle}" (max ${maxEpisodes})`);
    
    const result = await NineAnimeScraperService.scrapeAllEpisodes(animeTitle, {
      animeId,
      maxEpisodes,
      timeout: 60000, // 1 minute total
      retries: 2
    });
    
    res.json({
      success: result.success,
      message: result.success ? 'All episodes scraped successfully!' : 'Failed to scrape episodes',
      data: result
    });

  } catch (error) {
    console.error('❌ Scrape all episodes error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Batch scrape episodes endpoint
app.post('/api/batch-scrape-episodes', async (req, res) => {
  try {
    console.log('🎬 API: Batch scraping episodes...');
    
    const { animeTitle, animeId, episodeNumbers, options = {} } = req.body;
    
    if (!animeTitle || !animeId || !episodeNumbers) {
      return res.status(400).json({
        success: false,
        error: 'Anime title, ID, and episode numbers are required'
      });
    }

    console.log(`🎬 Batch scraping ${episodeNumbers.length} episodes for: "${animeTitle}"`);
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Scrape each episode
    for (const episodeNumber of episodeNumbers) {
      try {
        console.log(`📺 Scraping episode ${episodeNumber}...`);
        
        // Use the existing scrape episode logic
        const scrapeResult = await NineAnimeScraperService.scrapeAnimeEpisode(
          animeTitle,
          episodeNumber,
          {
            headless: options.headless !== false,
            timeout: options.timeout || 30000,
            retries: options.retries || 2
          }
        );

        if (scrapeResult.success && scrapeResult.streamUrl) {
          // Don't save to database - return for approval
          successCount++;
          results.push({
            episode: episodeNumber,
            status: 'success',
            url: scrapeResult.streamUrl,
            title: scrapeResult.episodeData?.title || `Episode ${episodeNumber}`,
            embeddingProtected: scrapeResult.embeddingProtected || false,
            embeddingReason: scrapeResult.embeddingReason || null,
            scrapedAt: new Date().toISOString()
          });

        } else {
          throw new Error(scrapeResult.error || 'Scraping failed');
        }

      } catch (error) {
        console.error(`❌ Episode ${episodeNumber} failed:`, error.message);
        errorCount++;
        results.push({
          episode: episodeNumber,
          status: 'failed',
          error: error.message
        });
      }

      // Add delay between episodes
      if (episodeNumber < episodeNumbers[episodeNumbers.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, options.delayBetweenEpisodes || 2000));
      }
    }

    const successRate = episodeNumbers.length > 0 ? (successCount / episodeNumbers.length) * 100 : 0;

    console.log(`✅ Batch scraping completed: ${successCount}/${episodeNumbers.length} episodes successful`);
    
    res.json({
      success: true,
      message: `Batch scraping completed: ${successCount}/${episodeNumbers.length} episodes successful`,
      results,
      summary: {
        totalEpisodes: episodeNumbers.length,
        successCount,
        errorCount,
        successRate: Math.round(successRate * 10) / 10
      }
    });

  } catch (error) {
    console.error('❌ Batch scrape error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get episodes for an anime
app.get('/api/anime/:animeId/episodes', async (req, res) => {
  try {
    const { animeId } = req.params;
    console.log('🔍 API: Getting episodes for anime ID:', animeId);
    
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('episode_number, title, video_url, created_at')
      .eq('anime_id', animeId)
      .order('episode_number');
    
    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    
    console.log('✅ Found episodes:', episodes?.length || 0);
    res.json({
      success: true,
      episodes: episodes || []
    });
    
  } catch (error) {
    console.error('❌ Error getting episodes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add scraped episode to database endpoint
app.post('/api/add-scraped-episode', async (req, res) => {
  try {
    console.log('💾 API: Adding scraped episode to database...');
    
    const { animeId, episodeData } = req.body;
    
    if (!animeId || !episodeData) {
      return res.status(400).json({
        success: false,
        error: 'Anime ID and episode data are required'
      });
    }
    
    // Check if episode already exists
    const { data: existingEpisode, error: checkError } = await supabase
      .from('episodes')
      .select('id')
      .eq('anime_id', animeId)
      .eq('episode_number', episodeData.number)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no record found

    let data, error;
    
    if (existingEpisode && !checkError) {
      // Episode exists, update it
      console.log(`📝 Updating existing episode ${episodeData.number} for anime ${animeId}`);
      const updateResult = await supabase
        .from('episodes')
        .update({
          title: episodeData.title,
          video_url: episodeData.streamUrl,
          description: `Scraped from 9anime.org.lv - ${episodeData.embeddingProtected ? 'May have embedding protection' : 'Embedding friendly'}`
        })
        .eq('anime_id', animeId)
        .eq('episode_number', episodeData.number)
        .select()
        .single();
      
      data = updateResult.data;
      error = updateResult.error;
    } else {
      // Episode doesn't exist, insert it
      console.log(`➕ Inserting new episode ${episodeData.number} for anime ${animeId}`);
      const insertResult = await supabase
        .from('episodes')
        .insert({
          anime_id: animeId,
          episode_number: episodeData.number,
          title: episodeData.title,
          video_url: episodeData.streamUrl,
          duration: null,
          thumbnail_url: null,
          description: `Scraped from 9anime.org.lv - ${episodeData.embeddingProtected ? 'May have embedding protection' : 'Embedding friendly'}`,
          is_premium: false
        })
        .select()
        .single();
      
      data = insertResult.data;
      error = insertResult.error;
    }
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`✅ Episode ${episodeData.number} ${existingEpisode ? 'updated' : 'added'} to database`);
    
    res.json({
      success: true,
      message: `Episode ${episodeData.number} ${existingEpisode ? 'updated' : 'added'} successfully!`,
      episode: data
    });

  } catch (error) {
    console.error('❌ Add episode error:', error);
    res.status(500).json({
      success: false,
      error: error.message
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
// Large Anime Scraping Endpoints

// Start large anime scraping job
app.post('/api/start-large-scrape', async (req, res) => {
  try {
    console.log('🎬 API: Starting large anime scraping job...');
    
    const { animeId, animeTitle, totalEpisodes, chunkSize = 50 } = req.body;
    
    if (!animeId || !animeTitle || !totalEpisodes) {
      return res.status(400).json({
        success: false,
        error: 'Anime ID, title, and total episodes are required'
      });
    }

    // Calculate chunks
    const totalChunks = Math.ceil(totalEpisodes / chunkSize);
    
    // Create or update scraping progress
    const { data: progressData, error: progressError } = await supabase
      .from('scraping_progress')
      .upsert({
        anime_id: animeId,
        anime_title: animeTitle,
        total_episodes: totalEpisodes,
        completed_episodes: 0,
        failed_episodes: 0,
        current_chunk: 1,
        total_chunks: totalChunks,
        chunk_size: chunkSize,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'anime_id'
      })
      .select()
      .single();

    if (progressError) {
      throw new Error(`Database error: ${progressError.message}`);
    }

    // Create episode log entries for all episodes
    const episodeLogs = [];
    for (let episode = 1; episode <= totalEpisodes; episode++) {
      const chunkNumber = Math.ceil(episode / chunkSize);
      episodeLogs.push({
        scraping_progress_id: progressData.id,
        episode_number: episode,
        chunk_number: chunkNumber,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    }

    const { error: logError } = await supabase
      .from('episode_scraping_log')
      .upsert(episodeLogs, {
        onConflict: 'scraping_progress_id,episode_number'
      });

    if (logError) {
      console.warn('Warning: Could not create episode logs:', logError.message);
    }

    console.log(`✅ Large scraping job started: ${animeTitle} (${totalEpisodes} episodes, ${totalChunks} chunks)`);
    
    res.json({
      success: true,
      message: `Large scraping job started for ${animeTitle}`,
      jobId: progressData.id,
      totalEpisodes,
      totalChunks,
      chunkSize
    });

  } catch (error) {
    console.error('❌ Start large scrape error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scraping progress
app.get('/api/scraping-progress/:animeId', async (req, res) => {
  try {
    const { animeId } = req.params;
    
    const { data: progress, error } = await supabase
      .from('scraping_progress')
      .select(`
        *,
        episode_scraping_log (
          episode_number,
          status,
          error_message,
          scraped_at
        )
      `)
      .eq('anime_id', animeId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Scraping progress not found'
      });
    }

    // Calculate progress percentage
    const progressPercentage = progress.total_episodes > 0 
      ? Math.round((progress.completed_episodes / progress.total_episodes) * 100)
      : 0;

    // Estimate time remaining
    const startedAt = new Date(progress.started_at);
    const now = new Date();
    const elapsedMs = now - startedAt;
    const episodesPerMs = progress.completed_episodes / elapsedMs;
    const remainingEpisodes = progress.total_episodes - progress.completed_episodes;
    const estimatedMsRemaining = episodesPerMs > 0 ? remainingEpisodes / episodesPerMs : 0;
    
    const estimatedTimeRemaining = estimatedMsRemaining > 0 
      ? formatDuration(estimatedMsRemaining)
      : 'Calculating...';

    res.json({
      success: true,
      progress: {
        ...progress,
        progressPercentage,
        estimatedTimeRemaining,
        episodesPerMs: episodesPerMs * 1000 // episodes per second
      }
    });

  } catch (error) {
    console.error('❌ Get progress error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Scrape a single chunk
app.post('/api/scrape-chunk', async (req, res) => {
  try {
    console.log('🎬 API: Scraping chunk...');
    
    const { animeId, animeTitle, chunkNumber, chunkSize = 50 } = req.body;
    
    if (!animeId || !animeTitle || chunkNumber === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Anime ID, title, and chunk number are required'
      });
    }

    // Calculate episode range for this chunk
    const startEpisode = (chunkNumber - 1) * chunkSize + 1;
    const endEpisode = Math.min(chunkNumber * chunkSize, req.body.totalEpisodes || 1000);
    const episodeNumbers = Array.from({ length: endEpisode - startEpisode + 1 }, (_, i) => startEpisode + i);

    console.log(`📺 Scraping chunk ${chunkNumber}: episodes ${startEpisode}-${endEpisode}`);

    // Get episodes to scrape from log
    const { data: episodesToScrape, error: logError } = await supabase
      .from('episode_scraping_log')
      .select('episode_number')
      .eq('scraping_progress_id', req.body.progressId)
      .eq('chunk_number', chunkNumber)
      .in('status', ['pending', 'failed']);

    if (logError) {
      throw new Error(`Database error: ${logError.message}`);
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Scrape each episode in the chunk
    for (const episodeLog of episodesToScrape) {
      const episodeNumber = episodeLog.episode_number;
      
      try {
        // Update status to scraping
        await supabase
          .from('episode_scraping_log')
          .update({ status: 'scraping' })
          .eq('scraping_progress_id', req.body.progressId)
          .eq('episode_number', episodeNumber);

        // Scrape the episode
        const scrapeResult = await HybridHiAnimeScraperService.scrapeAnimeEpisode(
          animeTitle,
          animeId,
          episodeNumber,
          {
            headless: true,
            timeout: 30000,
            retries: 2
          }
        );

        if (scrapeResult.success && scrapeResult.streamUrl) {
          // Save to database
          const { error: saveError } = await supabase
            .from('episodes')
            .upsert({
              anime_id: animeId,
              episode_number: episodeNumber,
              title: scrapeResult.episodeData?.title || `Episode ${episodeNumber}`,
              video_url: scrapeResult.streamUrl,
              description: `Scraped from HiAnime - Chunk ${chunkNumber}`,
              is_premium: false
            }, {
              onConflict: 'anime_id,episode_number'
            });

          if (saveError) {
            throw new Error(`Database save error: ${saveError.message}`);
          }

          // Update log to success
          await supabase
            .from('episode_scraping_log')
            .update({ 
              status: 'success',
              video_url: scrapeResult.streamUrl,
              scraped_at: new Date().toISOString()
            })
            .eq('scraping_progress_id', req.body.progressId)
            .eq('episode_number', episodeNumber);

          successCount++;
          results.push({ episode: episodeNumber, status: 'success', url: scrapeResult.streamUrl });

        } else {
          throw new Error(scrapeResult.error || 'Scraping failed');
        }

      } catch (error) {
        console.error(`❌ Episode ${episodeNumber} failed:`, error.message);
        
        // Update log to failed
        await supabase
          .from('episode_scraping_log')
          .update({ 
            status: 'failed',
            error_message: error.message
          })
          .eq('scraping_progress_id', req.body.progressId)
          .eq('episode_number', episodeNumber);

        errorCount++;
        results.push({ episode: episodeNumber, status: 'failed', error: error.message });
      }

      // Add delay between episodes to avoid being blocked
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Update overall progress
    const { error: updateError } = await supabase
      .from('scraping_progress')
      .update({
        completed_episodes: supabase.raw('completed_episodes + ?', [successCount]),
        failed_episodes: supabase.raw('failed_episodes + ?', [errorCount]),
        current_chunk: chunkNumber + 1,
        updated_at: new Date().toISOString()
      })
      .eq('anime_id', animeId);

    if (updateError) {
      console.warn('Warning: Could not update progress:', updateError.message);
    }

    console.log(`✅ Chunk ${chunkNumber} completed: ${successCount} success, ${errorCount} failed`);
    
    res.json({
      success: true,
      message: `Chunk ${chunkNumber} completed`,
      results,
      summary: {
        totalEpisodes: episodeNumbers.length,
        successCount,
        errorCount,
        successRate: episodeNumbers.length > 0 ? (successCount / episodeNumbers.length) * 100 : 0
      }
    });

  } catch (error) {
    console.error('❌ Scrape chunk error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to format duration
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

app.listen(PORT, () => {
  console.log(`🚀 9anime Scraper API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🎬 Scraper endpoints:`);
  console.log(`   POST /api/scrape-episode`);
  console.log(`   POST /api/test-scraper`);
  console.log(`   POST /api/scrape-all-episodes`);
  console.log(`   POST /api/batch-scrape-episodes`);
  console.log(`   POST /api/start-large-scrape`);
  console.log(`   POST /api/scrape-chunk`);
  console.log(`   GET  /api/scraping-progress/:animeId`);
});

export default app;
