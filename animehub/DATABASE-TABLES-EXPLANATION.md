# 🗄️ Database Tables Explanation

## 📊 Two Different Scheduled Import Systems

Aapke database mein **2 different scheduled import systems** hain:

### 1. 🎬 Anime Data Import (Existing)
**Table:** `scheduled_imports`
**File:** `scheduled-import-setup.sql`
**Purpose:** Anime metadata import from Jikan/AniList APIs

**Features:**
- Anime titles, descriptions, ratings import
- Trending, seasonal, search-based imports
- Jikan API aur AniList API se data
- Anime metadata scraping

**Example Usage:**
```sql
-- Daily trending anime import
INSERT INTO scheduled_imports (name, enabled, source, type, limit_count, frequency) 
VALUES ('Daily Trending Anime', true, 'jikan', 'trending', 10, 'daily');
```

### 2. 🎥 Episode Scraping (New)
**Table:** `episode_scraping_schedules`
**File:** `scheduled-imports-setup.sql`
**Purpose:** Episode video URLs scraping from GogoAnime/Aniwatch

**Features:**
- Episode video URLs scraping
- GogoAnime, Aniwatch, AnimePahe sources
- Bulk episode processing
- Video streaming links

**Example Usage:**
```sql
-- Daily episode scraping
INSERT INTO episode_scraping_schedules (name, enabled, interval_hours, anime_limit, batch_size) 
VALUES ('Daily Episode Import', true, 24, 50, 10);
```

## 🔄 How They Work Together

1. **Step 1:** Anime data import (existing system)
   - Import anime titles, descriptions, ratings
   - Store in `anime` table

2. **Step 2:** Episode scraping (new system)
   - Scrape episodes for imported anime
   - Store video URLs in `episodes` table

## 🚀 Usage Commands

### Anime Data Import (Existing)
```bash
# Use existing anime importer
# Admin Panel → Import Anime
```

### Episode Scraping (New)
```bash
# Scrape episodes for existing anime
npm run scrape-episodes

# Run scheduled episode scraping
npm run scheduled-import
```

## 📋 Database Schema Comparison

| Feature | Anime Import | Episode Scraping |
|---------|-------------|------------------|
| Table | `scheduled_imports` | `episode_scraping_schedules` |
| Source | Jikan/AniList | GogoAnime/Aniwatch |
| Data | Anime metadata | Episode video URLs |
| Frequency | daily/weekly/monthly | Custom hours |
| Limit | 10-100 anime | 1-200 anime |
| Batch Size | N/A | 1-20 |

## ✅ No Data Loss

**Important:** Existing `scheduled_imports` table **NOT REMOVED** - it's still there for anime data import. New `episode_scraping_schedules` table is **ADDITIONAL** for episode scraping.

## 🎯 Next Steps

1. **Run the new SQL setup:**
   ```sql
   -- Copy content from scheduled-imports-setup.sql
   -- Run in Supabase SQL Editor
   ```

2. **Test episode scraping:**
   ```bash
   npm run scrape-episodes -- --limit 5
   ```

3. **Set up scheduled imports:**
   - Admin Panel → Scheduled Imports
   - Create configuration
   - Set up cron job

## 🔧 Troubleshooting

If you see table conflicts:
- Check which table exists: `scheduled_imports` vs `episode_scraping_schedules`
- Both tables can coexist - they serve different purposes
- Use appropriate service for each task

---

**Summary:** Dono systems alag-alag kaam karte hain. Existing anime import system intact hai, new episode scraping system add kiya gaya hai. No data loss! 🎉

