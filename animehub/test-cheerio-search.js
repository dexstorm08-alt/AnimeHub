import * as cheerio from 'cheerio';
import axios from 'axios';

async function testCheerioSearch() {
  console.log('🧪 Testing Cheerio Search Only...');
  
  const BASE_URL = 'https://hianime.do';
  const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const animeTitle = 'One Piece';
  
  try {
    // Step 1: Fast search with Cheerio
    console.log('🔍 Searching with Cheerio...');
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

    console.log('✅ Search request successful');
    console.log('Response status:', searchResponse.status);

    const $ = cheerio.load(searchResponse.data);
    
    // Find anime link
    const animeLink = $('.film_list-wrap .flw-item a[href*="/watch/"]').first().attr('href');
    if (!animeLink) {
      console.log('❌ No anime links found with primary selector');
      
      // Try alternative selectors
      const altSelectors = [
        '.film_list .flw-item a[href*="/watch/"]',
        '.anime-item a[href*="/watch/"]',
        'a[href*="/watch/"]'
      ];
      
      for (const selector of altSelectors) {
        const link = $(selector).first().attr('href');
        if (link) {
          console.log(`✅ Found anime link with selector "${selector}":`, link);
          break;
        }
      }
      
      return;
    }
    
    const fullAnimeLink = animeLink.startsWith('http') ? animeLink : BASE_URL + animeLink;
    const animeId = animeLink.match(/watch\/[^?]+-(\d+)/)?.[1];
    
    if (!animeId) {
      console.log('❌ Anime ID not found in URL:', animeLink);
      return;
    }
    
    console.log('✅ Cheerio search successful!');
    console.log('Anime Link:', fullAnimeLink);
    console.log('Anime ID:', animeId);
    
    // Test episode API call
    console.log('🔍 Testing episode API call...');
    const epApiUrl = `${BASE_URL}/ajax/v2/episode/servers?episodeId=${animeId}`;
    console.log('Episode API URL:', epApiUrl);
    
    try {
      const epResponse = await axios.get(epApiUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': fullAnimeLink,
        },
        timeout: 10000
      });
      
      console.log('✅ Episode API call successful');
      const epData = epResponse.data;
      
      // Extract server link ID
      let serverLink = epData.html?.match(/data-link-id="(\d+)"/)?.[1];
      if (!serverLink) {
        serverLink = epData.html?.match(/data-id="(\d+)"/)?.[1];
      }
      
      if (serverLink) {
        console.log('✅ Server link found:', serverLink);
        console.log('🎉 Cheerio search test PASSED! Ready for Puppeteer video extraction.');
      } else {
        console.log('❌ Server link not found in episode data');
        console.log('Episode data sample:', JSON.stringify(epData, null, 2).substring(0, 500));
      }
      
    } catch (epError) {
      console.log('❌ Episode API call failed:', epError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testCheerioSearch();
