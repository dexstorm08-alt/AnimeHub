import axios from 'axios';

async function testEpisodeUrlsWithLogs() {
  console.log('🧪 Testing Episode URL Construction with Detailed Logs...\n');
  
  // Test Episode 2 specifically to see the logs
  console.log('📺 Testing Episode 2 (should show fallback behavior):');
  try {
    const response2 = await axios.post('http://localhost:3001/api/test-scraper', {
      animeTitle: 'Attack on Titan',
      episodeNumber: 2
    });
    console.log('✅ Episode 2 Status:', response2.status);
    console.log('📺 Episode 2 URL:', response2.data.details?.episodeData?.animeLink || 'Not found');
    console.log('🎬 Episode 2 Stream URL:', response2.data.details?.streamUrl || 'Not found');
  } catch (error) {
    console.log('❌ Episode 2 Error:', error.message);
  }
  
  console.log('\n📺 Testing Episode 1 (should work directly):');
  try {
    const response1 = await axios.post('http://localhost:3001/api/test-scraper', {
      animeTitle: 'Attack on Titan',
      episodeNumber: 1
    });
    console.log('✅ Episode 1 Status:', response1.status);
    console.log('📺 Episode 1 URL:', response1.data.details?.episodeData?.animeLink || 'Not found');
    console.log('🎬 Episode 1 Stream URL:', response1.data.details?.streamUrl || 'Not found');
  } catch (error) {
    console.log('❌ Episode 1 Error:', error.message);
  }
}

testEpisodeUrlsWithLogs().catch(console.error);
