import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://9anime.org.lv';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testDifferentSearches() {
  const searchTerms = [
    "My Status as an Assassin Obviously Exceeds the Hero's",
    "My Status as an Assassin",
    "Assassin Obviously Exceeds",
    "Assassin Hero",
    "Status Assassin Hero"
  ];
  
  for (const searchTerm of searchTerms) {
    try {
      console.log(`\n🔍 Testing search for: "${searchTerm}"`);
      
      const searchUrl = `${BASE_URL}/search?keyword=${encodeURIComponent(searchTerm)}`;
      
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
      
      // Look for any anime links
      const animeLinks = $('a[href*="/category/"], a[href*="/anime/"]');
      console.log(`Found ${animeLinks.length} anime links`);
      
      // Show first 5 results
      for (let i = 0; i < Math.min(animeLinks.length, 5); i++) {
        const link = $(animeLinks[i]);
        const linkText = link.text().trim();
        const href = link.attr('href') || '';
        console.log(`  ${i + 1}. "${linkText}" -> ${href}`);
      }
      
    } catch (error) {
      console.error(`Error searching for "${searchTerm}":`, error.message);
    }
  }
}

testDifferentSearches();
