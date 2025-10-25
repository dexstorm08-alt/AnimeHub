import { CheerioHiAnimeScraperService } from './src/services/cheerioHiAnimeScraperService.js';

async function testCheerioScraper() {
  console.log('🧪 Testing Cheerio-based HiAnime Scraper...');
  
  try {
    await CheerioHiAnimeScraperService.testScraper();
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCheerioScraper();
