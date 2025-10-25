# 🎬 HiAnime.do Scraper Integration Guide

## 📋 Overview

This guide covers the complete integration of the HiAnime.do scraper into your AnimeHub project. The scraper can extract video streams from HiAnime.do and save them directly to your Supabase database.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install the required packages
npm install playwright-extra puppeteer-extra-plugin-stealth uuid

# Install Playwright browser
npm run install-playwright
```

### 2. Environment Setup

Make sure your `.env.local` file contains:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Test the Scraper

```bash
# Test the scraper with One Piece Film: Red
npm run scrape-hianime -- --test

# Or run interactive mode
npm run scrape-hianime
```

## 🛠️ Features

### ✅ What's Included

- **HiAnimeScraperService**: TypeScript service for scraping episodes
- **Standalone Script**: Command-line scraper for batch operations
- **Admin UI Component**: Web interface for manual scraping
- **Episode Management Page**: Complete admin interface for episodes
- **Database Integration**: Automatic saving to Supabase
- **Error Handling**: Robust retry logic and error reporting
- **Rate Limiting**: Built-in delays to avoid being blocked

### 🎯 Supported Operations

1. **Single Episode Scraping**: Scrape one episode at a time
2. **Batch Scraping**: Scrape multiple episodes in sequence
3. **Database Integration**: Automatic save/update to Supabase
4. **Admin Interface**: Web-based scraping controls
5. **Command Line**: Standalone script for automation

## 📁 File Structure

```
src/
├── services/
│   └── hianimeScraperService.ts    # Main scraper service
├── components/admin/
│   └── HiAnimeScraperComponent.tsx # Admin UI component
├── pages/admin/episodes/
│   └── page.tsx                    # Episode management page
scripts/
└── hianimeScraper.js              # Standalone scraper script
```

## 🔧 Usage Examples

### Command Line Usage

```bash
# Test scraper
npm run scrape-hianime -- --test

# Single episode
npm run scrape-hianime

# Batch episodes (1-5)
npm run scrape-hianime -- --batch --title "One Piece Film: Red" --anime-id "141902" --episodes 5

# Specific episodes
npm run scrape-hianime -- --batch --title "Attack on Titan" --anime-id "your-uuid" --episodes "1,3,5"
```

### Admin Interface Usage

1. Go to `/admin/episodes`
2. Click on "🎬 HiAnime Scraper" tab
3. Select anime from the list or enter manually
4. Choose single episode or batch scraping
5. Click "Scrape Episode" or "Batch Scrape"

### Programmatic Usage

```typescript
import { HiAnimeScraperService } from './services/hianimeScraperService';

// Single episode
const result = await HiAnimeScraperService.scrapeAndSaveEpisode(
  'One Piece Film: Red',
  '141902', // Anime UUID from database
  1, // Episode number
  {
    headless: true,
    timeout: 30000,
    retries: 3
  }
);

// Batch episodes
const batchResult = await HiAnimeScraperService.batchScrapeEpisodes(
  'Attack on Titan',
  'your-anime-uuid',
  [1, 2, 3, 4, 5], // Episode numbers
  {
    headless: true,
    timeout: 30000,
    retries: 2,
    delayBetweenEpisodes: 3000
  }
);
```

## 🗄️ Database Schema

The scraper works with your existing `episodes` table:

```sql
CREATE TABLE episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title VARCHAR(255),
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,  -- This is where the scraped URL goes
  duration INTEGER, -- seconds
  is_premium BOOLEAN DEFAULT FALSE,
  air_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(anime_id, episode_number)
);
```

## ⚙️ Configuration Options

### Scraper Options

```typescript
interface ScraperOptions {
  headless?: boolean;        // Run browser in headless mode (default: true)
  timeout?: number;          // Page load timeout in ms (default: 30000)
  retries?: number;          // Number of retry attempts (default: 3)
  delayBetweenEpisodes?: number; // Delay between batch episodes in ms (default: 3000)
}
```

### Browser Configuration

The scraper uses Playwright with stealth plugin to avoid detection:

- **User Agent**: Chrome 120 on Windows 10
- **Viewport**: 1280x720
- **Stealth Mode**: Enabled to avoid bot detection
- **CSP Bypass**: Enabled for better compatibility

## 🔍 How It Works

### Scraping Process

1. **Search**: Search for anime on HiAnime.do
2. **Find Anime**: Get the anime page URL
3. **Extract Episode ID**: Parse episode ID from URL
4. **Get Servers**: Fetch available streaming servers
5. **Get Stream URL**: Extract iframe or direct stream URL
6. **Extract M3U8**: Try to get .m3u8 stream from iframe
7. **Save to Database**: Store the stream URL in Supabase

### Error Handling

- **Retry Logic**: Automatic retries with exponential backoff
- **Timeout Handling**: Configurable timeouts for each step
- **Graceful Degradation**: Falls back to iframe if M3U8 not found
- **Database Validation**: Checks for existing episodes before saving

## 🚨 Important Notes

### Rate Limiting

- **Built-in Delays**: 3-second delay between batch episodes
- **Retry Delays**: 2-second delay between retry attempts
- **Respectful Scraping**: Don't overwhelm the target site

### Legal Considerations

- **Terms of Service**: Respect HiAnime.do's terms of service
- **Rate Limiting**: Use reasonable delays between requests
- **Personal Use**: Intended for personal/educational use only
- **No Redistribution**: Don't redistribute scraped content

### Technical Limitations

- **Site Changes**: Scraper may break if HiAnime.do changes structure
- **Anti-Bot Measures**: Site may implement additional protection
- **Network Issues**: Requires stable internet connection
- **Browser Dependencies**: Requires Playwright browser installation

## 🐛 Troubleshooting

### Common Issues

1. **Playwright Not Installed**
   ```bash
   npm run install-playwright
   ```

2. **Environment Variables Missing**
   - Check `.env.local` file
   - Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

3. **Scraping Fails**
   - Check internet connection
   - Verify anime title spelling
   - Try with `headless: false` to see browser

4. **Database Errors**
   - Verify Supabase credentials
   - Check anime ID exists in database
   - Ensure episodes table exists

### Debug Mode

Enable debug mode by setting `headless: false`:

```typescript
const result = await HiAnimeScraperService.scrapeAndSaveEpisode(
  'Anime Title',
  'anime-id',
  1,
  { headless: false } // Shows browser window
);
```

## 📊 Monitoring & Analytics

### Success Metrics

- **Success Rate**: Percentage of successful scrapes
- **Error Types**: Categorization of failure reasons
- **Performance**: Average scraping time per episode
- **Database Updates**: Episodes added/updated count

### Logging

The scraper provides detailed console output:

```
🎬 Scraping HiAnime.do for "One Piece Film: Red", Episode 1...
Anime Link: https://hianime.do/watch/one-piece-film-red-12345
Iframe URL: https://stream.hianime.do/embed/12345
Stream URL: https://stream.hianime.do/hls/12345.m3u8
💾 Saving episode to database...
✅ Episode saved successfully!
```

## 🔄 Integration with Existing Systems

### Video Player Integration

The scraped URLs work with your existing video player:

```typescript
// VideoService automatically detects HiAnime URLs
const videoType = VideoService.detectVideoSource(scrapedUrl);
// Returns 'iframe' or 'hls' based on URL type
```

### Admin System Integration

- **Episode Management**: View and manage scraped episodes
- **Bulk Operations**: Batch scrape multiple episodes
- **Error Reporting**: Track scraping failures
- **Analytics**: Monitor scraping performance

## 🚀 Future Enhancements

### Planned Features

1. **Multiple Sources**: Support for other anime sites
2. **Quality Selection**: Multiple quality options
3. **Scheduled Scraping**: Automated episode updates
4. **Proxy Support**: Rotating proxies for better reliability
5. **Caching**: Local caching of scraped data

### Contributing

To contribute to the scraper:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📞 Support

For issues or questions:

1. Check the troubleshooting section
2. Review console logs for error details
3. Test with known working anime titles
4. Verify environment setup

---

**Happy Scraping! 🎬✨**
