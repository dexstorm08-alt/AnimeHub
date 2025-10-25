# 🎭 Character Data Debug Guide

## 🔍 **Issue: No Characters Being Fetched**

### **Step 1: Check Database Setup**

Run these SQL queries in your Supabase dashboard:

```sql
-- 1. Check if anime_characters table exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'anime_characters' 
ORDER BY ordinal_position;

-- 2. Check if there are any characters in the database
SELECT COUNT(*) as total_characters FROM anime_characters;

-- 3. Check if there are any anime in the database
SELECT COUNT(*) as total_anime FROM anime;

-- 4. Sample character data (if any exists)
SELECT 
  ac.name,
  ac.name_japanese,
  ac.name_romaji,
  ac.role,
  a.title as anime_title
FROM anime_characters ac
JOIN anime a ON ac.anime_id = a.id
LIMIT 5;
```

### **Step 2: Test Database Setup**

If the `anime_characters` table doesn't exist, run:

```sql
-- Run the anime-relations-setup.sql file
-- This creates the anime_characters table with correct schema
```

### **Step 3: Test AniList API**

Go to **Admin Panel** → **Anime Management** → **Debug Tab** and click:

1. **"🧪 Test AniList API"** - Tests if AniList is returning character data
2. **"🔍 Check Characters Table"** - Tests if database table exists
3. **"👥 Check Sample Characters"** - Shows characters for existing anime

### **Step 4: Test Import Process**

1. **Import Anime from AniList**:
   - Go to Admin Panel → Anime Management
   - Use **AniList Search** (not Jikan)
   - Search for "Attack on Titan" or any popular anime
   - Click Import

2. **Check Console Logs**:
   - Open browser DevTools (F12)
   - Look for these logs:
   ```
   🎬 Starting import for anime: [Title]
   📊 AniList data structure: { hasCharacters: true, charactersCount: X }
   🎭 Importing characters for anime [ID]
   Found X characters to import
   Processing character: [Name] Role: [role]
   ✅ Imported character: [Name] ([role])
   ```

### **Step 5: Check Import Results**

After importing, check:

1. **Database**: Run the SQL queries from Step 1
2. **Anime Detail Page**: Visit any anime page to see if characters appear
3. **Debug Tools**: Use admin panel debug buttons

## 🚨 **Common Issues & Solutions**

### **Issue 1: Table Doesn't Exist**
**Solution**: Run `anime-relations-setup.sql` in Supabase

### **Issue 2: AniList API Not Working**
**Solution**: Check network connection, AniList might be down

### **Issue 3: Import Process Not Running**
**Solution**: Make sure you're using **AniList Search**, not Jikan

### **Issue 4: Characters Not Displaying**
**Solution**: Check if characters were imported to database

### **Issue 5: Database Schema Mismatch**
**Solution**: The import function now matches the database schema

## 🎯 **Expected Flow**

1. **Database Setup** → Tables created ✅
2. **AniList Search** → Character data fetched ✅
3. **Import Process** → Characters saved to database ✅
4. **Anime Detail Page** → Characters displayed ✅

## 🔧 **Debug Commands**

### **Check Table Structure**:
```sql
\d anime_characters
```

### **Check Recent Imports**:
```sql
SELECT 
  a.title,
  COUNT(ac.id) as character_count
FROM anime a
LEFT JOIN anime_characters ac ON a.id = ac.anime_id
GROUP BY a.id, a.title
ORDER BY a.created_at DESC
LIMIT 10;
```

### **Check Import Errors**:
```sql
SELECT * FROM anime_characters 
WHERE name IS NULL OR role IS NULL;
```

## 🚀 **Quick Test**

1. Run database setup SQL
2. Import "Attack on Titan" from AniList
3. Check console logs for character import
4. Visit anime detail page
5. Characters should appear!

---

**If still no characters, check the console logs and database queries above!** 🎭✨
