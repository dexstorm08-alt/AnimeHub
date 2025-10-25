# 🎌 AnimeHub Backend Setup Guide

## 🚀 Quick Start (Recommended)

### Step 1: Set up Supabase

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up and create a new project
   - Note down your project URL and anon key

2. **Set up Database Schema**
   ```bash
   # Copy the SQL from supabase-setup.md and run it in your Supabase SQL editor
   ```

3. **Configure Authentication**
   - Go to Authentication > Settings in Supabase dashboard
   - Enable email/password authentication
   - Configure OAuth providers (Google, GitHub) if needed
   - Set up redirect URLs

4. **Set up Storage**
   - Go to Storage in Supabase dashboard
   - Create buckets: `anime-posters`, `anime-banners`, `anime-thumbnails`, `anime-videos`
   - Configure RLS policies for file access

### Step 2: Configure Environment Variables

1. **Copy environment file**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your Supabase credentials**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start Development

```bash
npm run dev
```

## 🎯 Alternative Backend Options

### Option A: Express.js + PostgreSQL (Traditional)

```bash
# Create backend directory
mkdir animehub-backend
cd animehub-backend

# Initialize project
npm init -y
npm install express cors helmet morgan dotenv
npm install -D @types/node @types/express typescript ts-node nodemon

# Install database
npm install pg @types/pg
# or
npm install mysql2
# or
npm install mongodb mongoose
```

### Option B: FastAPI + PostgreSQL (Python)

```bash
# Create backend directory
mkdir animehub-backend
cd animehub-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary
pip install python-multipart python-jose[cryptography] passlib[bcrypt]
```

### Option C: NestJS + TypeORM (Enterprise)

```bash
# Create backend directory
mkdir animehub-backend
cd animehub-backend

# Initialize NestJS project
npx @nestjs/cli new . --package-manager npm
npm install @nestjs/typeorm typeorm pg @nestjs/jwt @nestjs/passport
npm install -D @types/pg @types/passport-jwt
```

## 📊 Database Comparison

| Database | Pros | Cons | Best For |
|----------|------|------|----------|
| **PostgreSQL** | ACID compliance, JSON support, Full-text search | Complex setup | Production apps |
| **MongoDB** | Flexible schema, Easy scaling | No joins, Memory usage | Rapid prototyping |
| **MySQL** | Mature, Fast reads | Limited JSON, Complex JSON queries | Traditional web apps |
| **Supabase** | Real-time, Auth built-in, Easy setup | Vendor lock-in, Limited customization | MVP/Startups |

## 🔐 Authentication Options

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| **Supabase Auth** | Built-in, OAuth support | Vendor lock-in | Quick setup |
| **JWT + bcrypt** | Full control, Stateless | More setup | Custom requirements |
| **Firebase Auth** | Google integration | Vendor lock-in | Google ecosystem |
| **Auth0** | Enterprise features | Cost | Enterprise apps |

## 🎬 Video Streaming Solutions

### 1. **Simple File Serving** (Development)
```typescript
// Serve video files directly
app.use('/videos', express.static('uploads/videos'))
```

### 2. **Progressive Download** (Small scale)
```typescript
// Stream video with range requests
app.get('/stream/:videoId', (req, res) => {
  const videoPath = `videos/${req.params.videoId}.mp4`
  const stat = fs.statSync(videoPath)
  const fileSize = stat.size
  const range = req.headers.range

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    const chunksize = (end - start) + 1
    const file = fs.createReadStream(videoPath, { start, end })
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    }
    res.writeHead(206, head)
    file.pipe(res)
  }
})
```

### 3. **CDN Integration** (Production)
- **Cloudflare Stream** - Built for video streaming
- **AWS CloudFront + S3** - Scalable, cost-effective
- **Bunny CDN** - Affordable video streaming
- **Vimeo API** - Professional video hosting

### 4. **HLS/DASH Streaming** (Advanced)
```typescript
// Use ffmpeg to create adaptive bitrate streams
npm install fluent-ffmpeg
```

## 🔧 Recommended Tech Stack

### For Beginners (Start Here)
```
Frontend: React + TypeScript + Tailwind CSS
Backend: Supabase (PostgreSQL + Auth + Storage)
Deployment: Vercel/Netlify
```

### For Intermediate
```
Frontend: React + TypeScript + Tailwind CSS
Backend: Node.js + Express + PostgreSQL
Database: Supabase or Railway
Auth: JWT + bcrypt
Storage: AWS S3 or Cloudinary
Deployment: Railway/Render
```

### For Advanced/Production
```
Frontend: Next.js + TypeScript + Tailwind CSS
Backend: NestJS + TypeORM + PostgreSQL
Database: AWS RDS or DigitalOcean
Auth: JWT + Redis sessions
Storage: AWS S3 + CloudFront
CDN: Cloudflare
Deployment: AWS/GCP + Docker
Monitoring: Sentry + DataDog
```

## 📈 Scaling Considerations

### Database
- **Read Replicas** for heavy read operations
- **Connection Pooling** (PgBouncer)
- **Caching** (Redis) for frequently accessed data
- **Search** (Elasticsearch) for anime discovery

### Video Streaming
- **CDN** for global distribution
- **Adaptive Bitrate** (HLS/DASH)
- **Video Compression** (H.264/H.265)
- **Thumbnail Generation** (FFmpeg)

### Performance
- **API Rate Limiting** (Redis + Bull)
- **Background Jobs** (Queue system)
- **Caching Strategy** (Redis/Memcached)
- **Database Indexing**

## 🚀 Next Steps

1. **Start with Supabase** - Get your MVP running quickly
2. **Add basic video streaming** - File serving or CDN
3. **Implement user features** - Favorites, watchlist, progress
4. **Add admin panel** - Content management
5. **Scale gradually** - Move to dedicated backend when needed

## 💡 Pro Tips

- **Start simple** - Don't over-engineer initially
- **Use existing services** - Supabase, Cloudinary, etc.
- **Focus on UX** - Backend is just the foundation
- **Plan for growth** - Design with scaling in mind
- **Security first** - Implement proper auth and validation
- **Monitor everything** - Use analytics and error tracking
