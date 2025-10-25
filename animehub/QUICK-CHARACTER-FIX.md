# 🎭 Quick Character Import Fix

## 🚨 **Issue: Characters Not Pushing to Database**

### **Step 1: Check Database Setup (MOST IMPORTANT!)**

**Run this SQL in your Supabase dashboard:**

```sql
-- Check if anime_characters table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'anime_characters';
```

**If table doesn't exist, run:**
```sql
-- Run the anime-relations-setup.sql file content
-- OR execute the file directly in Supabase
```

### **Step 2: Quick Database Setup**

Copy and paste this into Supabase SQL Editor:

```sql
-- Create anime_characters table
CREATE TABLE IF NOT EXISTS anime_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_japanese VARCHAR(255),
  name_romaji VARCHAR(255),
  image_url TEXT,
  role VARCHAR(50) CHECK (role IN ('main', 'supporting', 'antagonist', 'background')),
  description TEXT,
  voice_actor VARCHAR(255),
  voice_actor_japanese VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_anime_characters_anime_id ON anime_characters(anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_characters_role ON anime_characters(role);
```

### **Step 3: Test Import Process**

1. **Go to Admin Panel** → **Anime Management** → **Debug Tab**
2. **Click "🧪 Test AniList API"** - Should show characters found
3. **Click "🔍 Check Characters Table"** - Should show table exists
4. **Import anime from AniList** (not Jikan)
5. **Check console logs** for character import messages

### **Step 4: Debug Console Logs**

During import, you should see:
```
🎬 Starting import for anime: [Title]
📊 AniList data structure: { hasCharacters: true, charactersCount: X }
🎭 Importing characters for anime [ID]
Found X characters to import
Character role distribution: { MAIN: X, SUPPORTING: X }
✅ Imported character: [Name] ([role])
👥 Characters: X imported, 0 errors
```

### **Step 5: Check Database After Import**

```sql
-- Check if characters were imported
SELECT 
  a.title,
  COUNT(ac.id) as character_count
FROM anime a
LEFT JOIN anime_characters ac ON a.id = ac.anime_id
GROUP BY a.id, a.title
ORDER BY a.created_at DESC
LIMIT 10;
```

## 🚨 **Common Issues & Solutions:**

### **Issue 1: Table Doesn't Exist**
**Solution**: Run the SQL setup above

### **Issue 2: Using Jikan Instead of AniList**
**Solution**: Use "AniList Search" tab, not "Jikan Search"

### **Issue 3: No Characters in AniList Response**
**Solution**: Check if AniList API is working with debug button

### **Issue 4: Database Permissions**
**Solution**: Check RLS policies in Supabase

### **Issue 5: Import Process Not Running**
**Solution**: Check console logs during import

## 🎯 **Quick Test:**

1. **Run database setup SQL** (Step 2)
2. **Import "Attack on Titan"** from AniList
3. **Check console logs** for character import
4. **Visit anime detail page** - characters should appear!

## 🔧 **If Still Not Working:**

1. **Check Supabase logs** for errors
2. **Verify RLS policies** allow inserts
3. **Check network requests** in browser DevTools
4. **Test AniList API** with debug button

---

**Run database setup first, then try importing again!** 🎭✨
