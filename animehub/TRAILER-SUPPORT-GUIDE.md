# 🎬 Trailer URL Support Guide

## 🎯 **Trailer Support Implementation**

### **✅ Already Implemented Features:**

1. **Jikan API (MyAnimeList)**
   - ✅ Trailer URL extraction from YouTube IDs
   - ✅ Automatic YouTube URL formatting
   - ✅ Support for Jikan's trailer structure

2. **AniList API**
   - ✅ Trailer URL extraction with site detection
   - ✅ Multi-platform support (YouTube, Dailymotion, Vimeo)
   - ✅ Trailer thumbnail support
   - ✅ Flexible trailer site handling

## 🔧 **Technical Implementation:**

### **1. GraphQL Query Enhancement**
```graphql
trailer {
  id
  site
  thumbnail
}
```

### **2. URL Formatting Function**
```typescript
private static formatTrailerUrl(id: string, site?: string): string {
  switch (site?.toLowerCase()) {
    case 'youtube':
      return `https://www.youtube.com/watch?v=${id}`
    case 'dailymotion':
      return `https://www.dailymotion.com/video/${id}`
    case 'vimeo':
      return `https://vimeo.com/${id}`
    default:
      return `https://www.youtube.com/watch?v=${id}`
  }
}
```

### **3. Database Mapping**
```typescript
// Jikan mapping
trailer_url: jikanAnime.trailer?.youtube_id ? 
  `https://www.youtube.com/watch?v=${jikanAnime.trailer.youtube_id}` : null

// AniList mapping  
trailer_url: aniListAnime.trailer?.id ? 
  this.formatTrailerUrl(aniListAnime.trailer.id, aniListAnime.trailer.site) : null
```

## 📊 **Supported Platforms:**

### **1. YouTube**
- **Format**: `https://www.youtube.com/watch?v={id}`
- **Support**: Both Jikan and AniList
- **Usage**: Most common trailer platform

### **2. Dailymotion**
- **Format**: `https://www.dailymotion.com/video/{id}`
- **Support**: AniList only
- **Usage**: Alternative video platform

### **3. Vimeo**
- **Format**: `https://vimeo.com/{id}`
- **Support**: AniList only
- **Usage**: High-quality video platform

## 🎯 **API Data Sources:**

### **Jikan API (MyAnimeList)**
```json
{
  "trailer": {
    "youtube_id": "abc123",
    "url": "https://www.youtube.com/watch?v=abc123"
  }
}
```

### **AniList API**
```json
{
  "trailer": {
    "id": "abc123",
    "site": "youtube",
    "thumbnail": "https://img.youtube.com/vi/abc123/maxresdefault.jpg"
  }
}
```

## 🚀 **Usage Examples:**

### **1. Import with Trailer**
```typescript
// When importing anime, trailer URLs are automatically extracted
const anime = await AnimeImporterService.searchAniListAnime("Attack on Titan", 1)
// Result will include trailer_url field
```

### **2. Display Trailer in UI**
```typescript
// In your anime display component
{anime.trailer_url && (
  <a 
    href={anime.trailer_url} 
    target="_blank" 
    rel="noopener noreferrer"
    className="trailer-button"
  >
    🎬 Watch Trailer
  </a>
)}
```

### **3. Embed Trailer**
```typescript
// For YouTube trailers, you can extract video ID for embedding
const getYouTubeEmbedUrl = (url: string) => {
  const videoId = url.split('v=')[1]?.split('&')[0]
  return `https://www.youtube.com/embed/${videoId}`
}
```

## 🎨 **UI Integration Ideas:**

### **1. Trailer Button**
```jsx
{anime.trailer_url && (
  <Button 
    onClick={() => window.open(anime.trailer_url, '_blank')}
    className="trailer-btn"
  >
    🎬 Watch Trailer
  </Button>
)}
```

### **2. Trailer Modal**
```jsx
const [showTrailer, setShowTrailer] = useState(false)

{anime.trailer_url && (
  <Modal show={showTrailer} onClose={() => setShowTrailer(false)}>
    <iframe 
      src={getYouTubeEmbedUrl(anime.trailer_url)}
      width="100%" 
      height="400"
      allowFullScreen
    />
  </Modal>
)}
```

### **3. Trailer Thumbnail**
```jsx
{anime.trailer_url && (
  <div className="trailer-thumbnail" onClick={() => setShowTrailer(true)}>
    <img src={anime.trailer_thumbnail} alt="Trailer" />
    <div className="play-button">▶️</div>
  </div>
)}
```

## 📈 **Database Schema:**

### **Anime Table**
```sql
CREATE TABLE anime (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  trailer_url TEXT,  -- Stores the formatted trailer URL
  -- ... other fields
);
```

## 🔍 **Testing Trailer Support:**

### **1. Test Jikan Trailer**
```typescript
// Search for anime with known trailers
const results = await AnimeImporterService.searchJikanAnime("Demon Slayer", 5)
console.log(results[0].trailer_url) // Should show YouTube URL
```

### **2. Test AniList Trailer**
```typescript
// Search for anime with known trailers
const results = await AnimeImporterService.searchAniListAnime("Attack on Titan", 5)
console.log(results[0].trailer_url) // Should show formatted URL
```

### **3. Test Different Sites**
```typescript
// Test various trailer sites
const testUrls = [
  "https://www.youtube.com/watch?v=abc123",
  "https://www.dailymotion.com/video/abc123",
  "https://vimeo.com/abc123"
]
```

## 💡 **Pro Tips:**

### **1. Trailer Availability**
- **Jikan**: Limited trailer support (mainly YouTube)
- **AniList**: Better trailer coverage with multiple sites
- **Fallback**: Use AniList for better trailer data

### **2. URL Validation**
```typescript
const isValidTrailerUrl = (url: string) => {
  const patterns = [
    /youtube\.com\/watch\?v=/,
    /dailymotion\.com\/video\//,
    /vimeo\.com\//
  ]
  return patterns.some(pattern => pattern.test(url))
}
```

### **3. Trailer Thumbnails**
```typescript
// Extract thumbnail from YouTube URLs
const getYouTubeThumbnail = (url: string) => {
  const videoId = url.split('v=')[1]?.split('&')[0]
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}
```

---

**Trailer support is now fully implemented! 🎬✨**

Your anime import system will automatically extract and format trailer URLs from both Jikan and AniList APIs, supporting multiple video platforms and providing a seamless experience for users to watch anime trailers.
