import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://9anime.org.lv';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testSearch() {
  try {
    const animeTitle = "My Status as an Assassin Obviously Exceeds the Hero's";
    
    console.log('🔍 Testing search for:', animeTitle);
    
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
    
    console.log('Page title:', $('title').text());
    
    // Create title slug
    const titleSlug = animeTitle.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    console.log('Title slug:', titleSlug);
    
    // Look for exact matches
    const exactSelectors = [
      `a[href*="/${titleSlug}-episode-"]`,
      `a[href*="/${titleSlug}-film-"]`,
      `a[href*="/${titleSlug}-movie-"]`
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
    
    // Look for text matches
    const allLinks = $('a[href*="/category/"], a[href*="/anime/"], a[href*="/v/"], a[href*="/watch/"]');
    console.log('Total anime links found:', allLinks.length);
    
    let foundMatch = false;
    for (let i = 0; i < Math.min(allLinks.length, 20); i++) {
      const link = $(allLinks[i]);
      const linkText = link.text().toLowerCase().trim();
      const href = link.attr('href') || '';
      
      console.log(`Link ${i + 1}: "${linkText}" -> ${href}`);
      
      if (linkText.includes(animeTitle.toLowerCase()) || 
          linkText.includes(titleSlug.replace(/-/g, ' '))) {
        console.log(`✅ FOUND MATCH: "${linkText}" for "${animeTitle}"`);
        foundMatch = true;
        break;
      }
    }
    
    if (!foundMatch) {
      console.log('❌ No match found for:', animeTitle);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSearch();
