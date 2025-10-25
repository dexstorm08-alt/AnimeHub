# 🎌 Anime Data Importer System

A comprehensive system for automatically importing anime data from external APIs like Jikan (MyAnimeList) and AniList. This system eliminates the need for manual anime data entry and keeps your database updated with the latest anime releases.

## ✨ Features

### 🔍 **Multiple Data Sources**
- **Jikan API** (MyAnimeList) - Free, comprehensive anime database
- **AniList API** - Alternative source with rich metadata
- Easy switching between sources

### 📥 **Import Types**
- **Search Import** - Find anime by name/keywords
- **Trending Import** - Get currently popular anime
- **Seasonal Import** - Import anime from current season
- **Bulk Import** - Import multiple anime at once

### ⏰ **Scheduled Imports**
- **Automated Scheduling** - Daily, weekly, or monthly imports
- **Background Processing** - Runs automatically without user intervention
- **Smart Duplicate Detection** - Prevents importing duplicate anime
- **Import Logging** - Track all import activities and results

### 🎛️ **Admin Interface**
- **Visual Import Manager** - Easy-to-use interface for manual imports
- **Scheduled Import Manager** - Configure and monitor automated imports
- **Real-time Preview** - See anime data before importing
- **Bulk Operations** - Select and import multiple anime at once

## 🚀 Quick Start

### 1. Setup Database Tables

Run the SQL script to create necessary tables:

```sql
-- Copy and paste the contents of scheduled-import-setup.sql into your Supabase SQL Editor
```

### 2. Initialize the System

Add this to your main app initialization:

```typescript
import { initializeScheduledImports } from './utils/scheduledImportInit'

// Initialize after your app starts
initializeScheduledImports()
```

### 3. Access the Import Interface

1. Go to **Admin Panel** → **Anime Management**
2. Click **"Import Anime"** button
3. Search for anime and import them

### 4. Setup Scheduled Imports

1. Go to **Admin Panel** → **Settings** → **Scheduled Imports**
2. Create new import configurations
3. Enable them to start automatic imports

## 📋 Usage Guide

### Manual Import

1. **Search Anime**
   - Enter anime name or keywords
   - Choose data source (Jikan/AniList)
   - Click "Search"

2. **Preview Results**
   - Review anime details
   - Check poster images and descriptions
   - Toggle "Show Preview" for full details

3. **Import Options**
   - **Quick Import** - Import individual anime
   - **Bulk Import** - Select multiple anime and import together
   - **Trending Import** - Import currently popular anime
   - **Seasonal Import** - Import current season anime

### Scheduled Imports

1. **Create Configuration**
   - Name your import configuration
   - Choose source (Jikan/AniList)
   - Select import type (trending/seasonal/search)
   - Set frequency (daily/weekly/monthly)
   - Configure limits and options

2. **Monitor Imports**
   - View import logs and statistics
   - Check success rates and errors
   - Monitor import performance

3. **Manage Configurations**
   - Enable/disable configurations
   - Edit settings
   - Run imports manually
   - Delete unused configurations

## 🔧 Configuration Options

### Import Types

| Type | Description | Use Case |
|------|-------------|----------|
| `trending` | Popular anime from Jikan | Keep up with trending content |
| `seasonal` | Current season anime | Get latest seasonal releases |
| `search` | Custom search queries | Import specific anime types |

### Frequency Options

| Frequency | Description | Best For |
|-----------|-------------|----------|
| `daily` | Every 24 hours | Trending anime, new releases |
| `weekly` | Every 7 days | Seasonal updates |
| `monthly` | Every 30 days | Comprehensive updates |

### Data Sources

| Source | Pros | Cons |
|--------|------|------|
| **Jikan** | Free, comprehensive, reliable | Rate limited |
| **AniList** | Rich metadata, good API | Smaller database |

## 📊 Data Mapping

The system automatically maps external API data to your database schema:

### Jikan → Database
- `title` → `title`
- `title_japanese` → `title_japanese`
- `synopsis` → `description`
- `images.jpg.large_image_url` → `poster_url`
- `score` → `rating`
- `year` → `year`
- `status` → `status` (mapped to ongoing/completed/upcoming)
- `type` → `type` (mapped to tv/movie/ova/special)
- `genres[].name` → `genres[]`
- `studios[].name` → `studios[]`
- `episodes` → `total_episodes`
- `duration` → `duration` (parsed from string)
- `rating` → `age_rating` (mapped to G/PG/PG-13/R/18+)

### AniList → Database
- `title.english/romaji` → `title`
- `title.native` → `title_japanese`
- `description` → `description` (HTML stripped)
- `coverImage.large` → `poster_url`
- `bannerImage` → `banner_url`
- `averageScore/10` → `rating` (converted from 0-100 scale)
- `startDate.year` → `year`
- `status` → `status` (mapped)
- `format` → `type` (mapped)
- `genres[]` → `genres[]`
- `studios.nodes[].name` → `studios[]`
- `episodes` → `total_episodes`
- `duration` → `duration`

## 🛡️ Error Handling

### Duplicate Detection
- Checks for existing anime by title
- Skips duplicates automatically
- Reports skipped items in logs

### API Rate Limiting
- Respects API rate limits
- Implements delays between requests
- Handles rate limit errors gracefully

### Data Validation
- Validates required fields
- Handles missing or malformed data
- Provides detailed error messages

## 📈 Monitoring & Logs

### Import Statistics
- Total configurations
- Active configurations
- Total imports performed
- Success rate percentage

### Import Logs
- Detailed logs for each import
- Success/partial/failed status
- Imported/skipped counts
- Error messages and details
- Duration and performance metrics

### Real-time Monitoring
- Live status updates
- Progress indicators
- Error notifications
- Success confirmations

## 🔧 Advanced Configuration

### Custom Search Queries
- Use specific keywords for targeted imports
- Examples: "action anime", "romance", "studio ghibli"
- Combine multiple terms for precise results

### Import Limits
- Set maximum anime per import (1-100)
- Control API usage and processing time
- Balance between completeness and performance

### Auto-Approval
- Automatically approve imported anime
- Skip manual review process
- Useful for trusted sources and configurations

## 🚨 Troubleshooting

### Common Issues

1. **Import Fails**
   - Check API connectivity
   - Verify API rate limits
   - Review error logs for details

2. **No Results Found**
   - Try different search terms
   - Check if anime exists in source database
   - Verify API is responding

3. **Duplicate Imports**
   - System automatically detects duplicates
   - Check if anime already exists in database
   - Review import logs for skipped items

4. **Scheduled Imports Not Running**
   - Verify configuration is enabled
   - Check next run time
   - Ensure scheduler is initialized

### Debug Mode

Enable detailed logging by checking browser console for:
- API request/response details
- Data mapping information
- Error stack traces
- Performance metrics

## 🔮 Future Enhancements

- **More Data Sources** - Add Kitsu, AniDB, etc.
- **Smart Recommendations** - AI-powered anime suggestions
- **Batch Processing** - Handle larger import volumes
- **Custom Mappings** - User-defined field mappings
- **Webhook Integration** - Real-time notifications
- **Analytics Dashboard** - Advanced import analytics

## 📝 API Reference

### AnimeImporterService

```typescript
// Search anime
const results = await AnimeImporterService.searchJikanAnime('attack on titan', 20)

// Import single anime
const anime = await AnimeImporterService.importAnime(mappedData, 'jikan')

// Bulk import
const result = await AnimeImporterService.bulkImportAnime('action anime', 'jikan', 10)
```

### ScheduledImportService

```typescript
// Create scheduled import
const config = await ScheduledImportService.createScheduledImport({
  name: 'Daily Trending',
  source: 'jikan',
  type: 'trending',
  frequency: 'daily',
  limit_count: 10
})

// Run scheduled import
const log = await ScheduledImportService.runScheduledImport(configId)

// Get import logs
const logs = await ScheduledImportService.getImportLogs()
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy Importing! 🎌✨**

For support or questions, please open an issue in the repository.
