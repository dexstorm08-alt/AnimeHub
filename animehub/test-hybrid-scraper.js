import { HybridHiAnimeScraperService } from './src/services/hybridHiAnimeScraperService.js';

async function testHybridScraper() {
  console.log('🧪 Testing Hybrid HiAnime Scraper...');
  
  try {
    await HybridHiAnimeScraperService.testScraper();
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testHybridScraper();
