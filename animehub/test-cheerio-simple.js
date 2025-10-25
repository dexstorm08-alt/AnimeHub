import * as cheerio from 'cheerio';
import axios from 'axios';

async function testCheerioScraper() {
  console.log('🧪 Testing Cheerio HiAnime Scraper...');
  
  const BASE_URL = 'https://hianime.do';
  const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const animeTitle = 'One Piece';
  
  try {
    // Step 1: Search anime
    const searchUrl = `${BASE_URL}/search?keyword=${encodeURIComponent(animeTitle)}`;
    console.log(`Search URL: ${searchUrl}`);
    
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

    console.log('✅ Search request successful');
    console.log('Response status:', searchResponse.status);
    console.log('Response headers:', Object.keys(searchResponse.headers));

    const $ = cheerio.load(searchResponse.data);
    
    console.log('Page title:', $('title').text());
    console.log('Page URL:', searchResponse.request.res.responseUrl);
    
    // Try multiple selectors for anime links
    const selectors = [
      '.film_list-wrap .flw-item a[href*="/watch/"]',
      '.film_list .flw-item a[href*="/watch/"]',
      '.anime-item a[href*="/watch/"]',
      'a[href*="/watch/"]'
    ];

    let animeLink = '';
    let searchSuccess = false;

    for (const selector of selectors) {
      const link = $(selector).first();
      if (link.length > 0) {
        animeLink = link.attr('href') || '';
        if (animeLink) {
          // Make sure it's a full URL
          if (!animeLink.startsWith('http')) {
            animeLink = BASE_URL + animeLink;
          }
          console.log(`✅ Found anime link with selector ${selector}:`, animeLink);
          searchSuccess = true;
          break;
        }
      }
    }

    if (!searchSuccess) {
      // Debug: Log page content to understand structure
      console.log('❌ No anime links found');
      console.log('Available links:', $('a[href*="/watch/"]').map((i, el) => $(el).attr('href')).get().slice(0, 5));
      
      // Check if there are any links at all
      const allLinks = $('a').map((i, el) => $(el).attr('href')).get().slice(0, 10);
      console.log('All links on page:', allLinks);
      
      // Check for common anime site patterns
      const animePatterns = ['/watch/', '/anime/', '/series/'];
      for (const pattern of animePatterns) {
        const patternLinks = $('a[href*="' + pattern + '"]').map((i, el) => $(el).attr('href')).get().slice(0, 3);
        if (patternLinks.length > 0) {
          console.log(`Links with pattern "${pattern}":`, patternLinks);
        }
      }
      
      return;
    }

    // Step 2: Get episode ID
    const animeId = animeLink.match(/watch\/[^?]+-(\d+)/)?.[1];
    if (!animeId) {
      console.log('❌ Anime ID not found in URL');
      return;
    }

    console.log('✅ Anime ID found:', animeId);

    // Step 3: Get episode servers
    const epApiUrl = `${BASE_URL}/ajax/v2/episode/servers?episodeId=${animeId}`;
    console.log(`Episode API URL: ${epApiUrl}`);
    
    const epResponse = await axios.get(epApiUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': animeLink,
      },
      timeout: 10000
    });

    console.log('✅ Episode API request successful');
    const epData = epResponse.data;
    
    // Extract server link ID - try both old and new formats
    let serverLink = epData.html?.match(/data-link-id="(\d+)"/)?.[1];
    if (!serverLink) {
      serverLink = epData.html?.match(/data-id="(\d+)"/)?.[1];
    }
    if (!serverLink) {
      console.log('❌ Server link not found');
      console.log('Episode data:', epData);
      return;
    }

    console.log('✅ Server link found:', serverLink);

    // Step 4: Try different approaches to get stream (inspired by Anipaca)
    let iframeSrc = '';
    
    // Try the original API first
    try {
      const streamApiUrl = `${BASE_URL}/ajax/server/${serverLink}`;
      console.log(`Stream API URL: ${streamApiUrl}`);
      
      const streamResponse = await axios.get(streamApiUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': animeLink,
        },
        timeout: 10000
      });

      const streamData = streamResponse.data;
      iframeSrc = streamData.url;
      console.log('✅ Iframe URL from API:', iframeSrc);
    } catch (apiError) {
      console.log('API approach failed, trying alternative endpoints...');
      
      // Try alternative API endpoints (inspired by Anipaca's approach)
      const alternativeEndpoints = [
        `${BASE_URL}/ajax/v2/episode/sources?episodeId=${animeId}`,
        `${BASE_URL}/ajax/episode/servers?episodeId=${animeId}`,
        `${BASE_URL}/ajax/v2/episode/servers?episodeId=${animeId}&server=${serverLink}`
      ];
      
      for (const endpoint of alternativeEndpoints) {
        try {
          console.log(`Trying alternative endpoint: ${endpoint}`);
          const altResponse = await axios.get(endpoint, {
            headers: {
              'User-Agent': USER_AGENT,
              'Referer': animeLink,
            },
            timeout: 10000
          });
          
          const altData = altResponse.data;
          if (altData.url || altData.link) {
            iframeSrc = altData.url || altData.link;
            console.log('✅ Found stream URL from alternative endpoint:', iframeSrc);
            break;
          }
        } catch (altError) {
          console.log(`Alternative endpoint ${endpoint} failed`);
        }
      }
      
      // If still no success, try direct page approach
      if (!iframeSrc) {
        try {
          console.log('Trying direct page approach...');
          const animePageResponse = await axios.get(animeLink, {
            headers: {
              'User-Agent': USER_AGENT,
              'Referer': searchUrl,
            },
            timeout: 10000
          });

          const animePage$ = cheerio.load(animePageResponse.data);
          
          // Debug: Log page structure
          console.log('Page title:', animePage$('title').text());
          console.log('Page URL:', animePageResponse.request.res.responseUrl);
          
          // Look for various video/iframe patterns
          const videoSelectors = [
            'iframe[src*="embed"]',
            'iframe[src*="player"]',
            'iframe[src*="video"]',
            'video source',
            'video[src]',
            '.player iframe',
            '.video-player iframe',
            '#player iframe',
            '[data-src*="embed"]',
            '[data-src*="player"]'
          ];
          
          for (const selector of videoSelectors) {
            const element = animePage$(selector).first();
            if (element.length > 0) {
              const src = element.attr('src') || element.attr('data-src') || '';
              if (src) {
                iframeSrc = src;
                console.log(`✅ Found video source with selector "${selector}":`, iframeSrc);
                break;
              }
            }
          }
          
          // If still no luck, look for JavaScript variables or data attributes
          if (!iframeSrc) {
            const pageContent = animePageResponse.data;
            
            // Look for common video URL patterns in the page content
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
                for (const match of matches) {
                  const url = match.replace(/["']/g, '').replace(/src\s*:\s*/, '').replace(/url\s*:\s*/, '');
                  if (url && (url.includes('embed') || url.includes('player') || url.includes('.m3u8'))) {
                    iframeSrc = url;
                    console.log('✅ Found video URL in page content:', iframeSrc);
                    break;
                  }
                }
                if (iframeSrc) break;
              }
            }
          }
          
        } catch (pageError) {
          console.log('Direct page approach also failed:', pageError.message);
        }
      }
    }
    
    if (iframeSrc) {
      console.log('🎉 Stream extraction successful!');
      console.log('Final stream URL:', iframeSrc);
    } else {
      console.log('❌ Could not find stream URL from any method');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testCheerioScraper();
