import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://9anime.org.lv';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testImprovedSearch() {
  try {
    const animeTitle = "My Status as an Assassin Obviously Exceeds the Hero's";
    
    console.log('🔍 Testing improved search for:', animeTitle);
    
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
    
    // Create title slug with improved logic
    const titleSlug = animeTitle.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/[^a-z0-9-]/g, '') // Remove any remaining special characters
      .trim();
    
    console.log('Title slug:', titleSlug);
    
    // Test exact selectors
    const exactSelectors = [
      `a[href*="/${titleSlug}-episode-"]`,
      `a[href*="/${titleSlug}-film-"]`,
      `a[href*="/${titleSlug}-movie-"]`,
      `a[href*="/${titleSlug}/"]`
    ];
    
    console.log('Exact selectors:', exactSelectors);
    
    for (const selector of exactSelectors) {
      const links = $(selector);
      console.log(`Selector "${selector}": ${links.length} links found`);
      if (links.length > 0) {
        const firstLink = links.first();
        console.log('First link href:', firstLink.attr('href'));
        console.log('First link text:', firstLink.text().trim());
      }
    }
    
    // Also check if we can find the direct URL
    const directUrl = `https://9anime.org.lv/${titleSlug}-episode-1/`;
    console.log('Expected direct URL:', directUrl);
    
    // Test if this URL exists by checking all links
    const allLinks = $('a[href]');
    let foundDirectLink = false;
    
    for (let i = 0; i < allLinks.length; i++) {
      const link = $(allLinks[i]);
      const href = link.attr('href') || '';
      
      if (href.includes(titleSlug) && href.includes('episode')) {
        console.log(`✅ Found matching link: ${href}`);
        foundDirectLink = true;
      }
    }
    
    if (!foundDirectLink) {
      console.log('❌ No direct episode link found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testImprovedSearch();
