import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { HybridHiAnimeScraperService } from './src/services/hybridHiAnimeScraperService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3002',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'HiAnime Scraper API'
  });
});

// Single episode scraping endpoint
app.post('/api/scrape-episode', async (req, res) => {
  try {
    const { animeTitle, animeId, episodeNumber = 1, options = {} } = req.body;

    if (!animeTitle || !animeId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: animeTitle and animeId'
      });
    }

    console.log(`🎬 API: Scraping episode ${episodeNumber} for "${animeTitle}" (ID: ${animeId})`);

    const result = await HybridHiAnimeScraperService.scrapeAndSaveEpisode(
      animeTitle,
      animeId,
      episodeNumber,
      {
        headless: true,
        timeout: 45000, // Longer timeout for backend
        retries: 3,
        ...options
      }
    );

    if (result.success) {
      res.json({
        success: true,
        streamUrl: result.streamUrl,
        episodeData: result.episodeData,
        message: `Episode ${episodeNumber} scraped and saved successfully!`
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Scraping failed'
      });
    }

  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Batch episode scraping endpoint
app.post('/api/scrape-batch', async (req, res) => {
  try {
    const { animeTitle, animeId, episodeNumbers, options = {} } = req.body;

    if (!animeTitle || !animeId || !episodeNumbers || !Array.isArray(episodeNumbers)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: animeTitle, animeId, and episodeNumbers array'
      });
    }

    console.log(`🎬 API: Batch scraping ${episodeNumbers.length} episodes for "${animeTitle}" (ID: ${animeId})`);

    const result = await HybridHiAnimeScraperService.batchScrapeEpisodes(
      animeTitle,
      animeId,
      episodeNumbers,
      {
        headless: true,
        timeout: 45000,
        retries: 2,
        delayBetweenEpisodes: 8000, // Longer delay for batch
        ...options
      }
    );

    res.json(result);

  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Test scraper endpoint
app.post('/api/test-scraper', async (req, res) => {
  try {
    console.log('🧪 API: Testing scraper...');
    
    await HybridHiAnimeScraperService.testScraper();
    
    res.json({
      success: true,
      message: 'Scraper test completed - check server logs for details'
    });

  } catch (error) {
    console.error('❌ Test Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Test failed'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HiAnime Scraper API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🎬 Scraper endpoints:`);
  console.log(`   POST /api/scrape-episode`);
  console.log(`   POST /api/scrape-batch`);
  console.log(`   POST /api/test-scraper`);
});

export default app;
