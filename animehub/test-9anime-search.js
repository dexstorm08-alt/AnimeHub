import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://9anime.org.lv';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function test9animeSearch() {
  try {
    console.log('🔍 Testing 9anime search...');
    
    const searchUrl = `${BASE_URL}/search?keyword=${encodeURIComponent('One Piece')}`;
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

    console.log('Response status:', searchResponse.status);
    console.log('Response headers:', Object.keys(searchResponse.headers));
    
    const $ = cheerio.load(searchResponse.data);
    
    // Check what selectors exist
    console.log('Page title:', $('title').text());
    console.log('Total links found:', $('a').length);
    
    // Try different selectors
    const selectors = [
      '.film_list-wrap .flw-item a[href*="/watch/"]',
      '.film_list .flw-item a[href*="/watch/"]',
      '.anime-item a[href*="/watch/"]',
      '.item a[href*="/watch/"]',
      'a[href*="/watch/"]',
      'a[href*="/anime/"]',
      'a[href*="/v/"]'
    ];

    for (const selector of selectors) {
      const links = $(selector);
      console.log(`Selector "${selector}": ${links.length} links found`);
      if (links.length > 0) {
        const firstLink = links.first();
        console.log('First link href:', firstLink.attr('href'));
        console.log('First link text:', firstLink.text().trim());
      }
    }
    
    // Check if there are any links at all
    const allLinks = $('a[href]');
    console.log('All links with href:', allLinks.length);
    
    // Show first 10 links
    allLinks.slice(0, 10).each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      console.log(`Link ${i + 1}: ${href} - "${text}"`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data.substring(0, 500));
    }
  }
}

test9animeSearch();
