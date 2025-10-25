import axios from 'axios';

async function testEpisodeUrls() {
  console.log('🧪 Testing Episode URL Construction...\n');
  
  // Test Episode 1
  console.log('📺 Testing Episode 1:');
  try {
    const response1 = await axios.post('http://localhost:3001/api/test-scraper', {
      animeTitle: 'Attack on Titan',
      episodeNumber: 1
    });
    console.log('✅ Episode 1 Status:', response1.status);
    console.log('📺 Episode 1 URL:', response1.data.details?.episodeData?.animeLink || 'Not found');
    console.log('🎬 Episode 1 Stream:', response1.data.details?.streamUrl || 'Not found');
  } catch (error) {
    console.log('❌ Episode 1 Error:', error.message);
  }
  
  console.log('\n📺 Testing Episode 2:');
  try {
    const response2 = await axios.post('http://localhost:3001/api/test-scraper', {
      animeTitle: 'Attack on Titan',
      episodeNumber: 2
    });
    console.log('✅ Episode 2 Status:', response2.status);
    console.log('📺 Episode 2 URL:', response2.data.details?.episodeData?.animeLink || 'Not found');
    console.log('🎬 Episode 2 Stream:', response2.data.details?.streamUrl || 'Not found');
  } catch (error) {
    console.log('❌ Episode 2 Error:', error.message);
  }
  
  console.log('\n🎬 Testing Episode 3:');
  try {
    const response3 = await axios.post('http://localhost:3001/api/test-scraper', {
      animeTitle: 'Attack on Titan',
      episodeNumber: 3
    });
    console.log('✅ Episode 3 Status:', response3.status);
    console.log('📺 Episode 3 URL:', response3.data.details?.episodeData?.animeLink || 'Not found');
    console.log('🎬 Episode 3 Stream:', response3.data.details?.streamUrl || 'Not found');
  } catch (error) {
    console.log('❌ Episode 3 Error:', error.message);
  }
}

testEpisodeUrls().catch(console.error);
