import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/supabase'

type Anime = Tables<'anime'>

// External API Types
interface JikanAnime {
  mal_id: number
  title: string
  title_japanese?: string
  title_synonyms?: string[]
  images?: {
    jpg?: {
      image_url?: string
      small_image_url?: string
      large_image_url?: string
    }
    webp?: {
      image_url?: string
      small_image_url?: string
      large_image_url?: string
    }
  }
  trailer?: {
    youtube_id?: string
    url?: string
    embed_url?: string
  }
  type?: string
  source?: string
  episodes?: number
  status?: string
  airing?: boolean
  aired?: {
    from?: string
    to?: string
    prop?: {
      from?: { year?: number; month?: number; day?: number }
      to?: { year?: number; month?: number; day?: number }
    }
  }
  duration?: string
  rating?: string
  score?: number
  scored_by?: number
  rank?: number
  popularity?: number
  members?: number
  favorites?: number
  synopsis?: string
  background?: string
  season?: string
  year?: number
  broadcast?: {
    day?: string
    time?: string
    timezone?: string
    string?: string
  }
  producers?: Array<{ mal_id: number; type: string; name: string; url: string }>
  licensors?: Array<{ mal_id: number; type: string; name: string; url: string }>
  studios?: Array<{ mal_id: number; type: string; name: string; url: string }>
  genres?: Array<{ mal_id: number; type: string; name: string; url: string }>
  explicit_genres?: Array<{ mal_id: number; type: string; name: string; url: string }>
  themes?: Array<{ mal_id: number; type: string; name: string; url: string }>
  demographics?: Array<{ mal_id: number; type: string; name: string; url: string }>
}

interface AniListAnime {
  id: number
  title: {
    romaji?: string
    english?: string
    native?: string
    userPreferred?: string
  }
  description?: string
  format?: string
  status?: string
  startDate?: {
    year?: number
    month?: number
    day?: number
  }
  endDate?: {
    year?: number
    month?: number
    day?: number
  }
  season?: string
  seasonYear?: number
  seasonInt?: number
  episodes?: number
  duration?: number
  source?: string
  trailer?: {
    id?: string
    site?: string
    thumbnail?: string
  }
  coverImage?: {
    extraLarge?: string
    large?: string
    medium?: string
    color?: string
  }
  bannerImage?: string
  genres?: string[]
  synonyms?: string[]
  averageScore?: number
  meanScore?: number
  popularity?: number
  trending?: number
  favourites?: number
  studios?: {
    nodes: Array<{
      id: number
      name: string
    }>
  }
  externalLinks?: Array<{
    id: number
    url: string
    site: string
    type?: string
    language?: string
  }>
}

interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
  duplicates: string[]
}

export class AnimeImporterService {
  private static readonly JIKAN_BASE_URL = 'https://api.jikan.moe/v4'
  private static readonly ANILIST_BASE_URL = 'https://graphql.anilist.co'
  
  // Search anime from Jikan API
  static async searchJikanAnime(query: string, limit: number = 20): Promise<JikanAnime[]> {
    try {
      // Jikan API has a maximum limit of 25 for search requests
      const safeLimit = Math.min(limit, 25)
      const response = await fetch(`${this.JIKAN_BASE_URL}/anime?q=${encodeURIComponent(query)}&limit=${safeLimit}`)
      
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(`Jikan API error: Invalid request parameters. Please check your search query and try again.`)
        }
        throw new Error(`Jikan API error: ${response.status}`)
      }
      
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error searching Jikan anime:', error)
      throw new Error(`Failed to search anime: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Search anime from AniList API
  static async searchAniListAnime(query: string, limit: number = 20): Promise<AniListAnime[]> {
    try {
      const graphqlQuery = `
        query ($search: String, $perPage: Int) {
          Page(perPage: $perPage) {
            media(search: $search, type: ANIME) {
              id
              title {
                romaji
                english
                native
                userPreferred
              }
              description
              format
              status
              startDate {
                year
                month
                day
              }
              endDate {
                year
                month
                day
              }
              season
              seasonYear
              seasonInt
              episodes
              duration
              source
              trailer {
                id
                site
                thumbnail
              }
              coverImage {
                extraLarge
                large
                medium
                color
              }
              bannerImage
              trailer {
                id
                site
                thumbnail
              }
              genres
              synonyms
              averageScore
              meanScore
              popularity
              trending
              favourites
              studios {
                nodes {
                  id
                  name
                }
              }
              relations {
                edges {
                  id
                  relationType
                  node {
                    id
                    idMal
                    title {
                      romaji
                      english
                      native
                    }
                    format
                    status
                    episodes
                    startDate {
                      year
                    }
                    coverImage {
                      large
                      medium
                    }
                  }
                }
              }
              characters(sort: [ROLE, RELEVANCE], perPage: 20) {
                edges {
                  id
                  role
                  node {
                    id
                    name {
                      full
                      native
                      alternative
                    }
                    image {
                      large
                      medium
                    }
                    description
                  }
                }
              }
              externalLinks {
                id
                url
                site
                type
                language
              }
            }
          }
        }
      `

      const response = await fetch(this.ANILIST_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: {
            search: query,
            perPage: limit
          }
        })
      })

      if (!response.ok) {
        throw new Error(`AniList API error: ${response.status}`)
      }

      const data = await response.json()
      return data.data?.Page?.media || []
    } catch (error) {
      console.error('Error searching AniList anime:', error)
      throw new Error(`Failed to search anime: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Convert Jikan anime data to our database format
  static mapJikanToDatabase(jikanAnime: JikanAnime): Partial<Anime> {
    const duration = jikanAnime.duration ? this.parseDuration(jikanAnime.duration) : null
    
    // Debug trailer data
    console.log('🎬 Jikan trailer debug:', {
      title: jikanAnime.title,
      trailer: jikanAnime.trailer,
      hasEmbedUrl: !!jikanAnime.trailer?.embed_url,
      hasYoutubeId: !!jikanAnime.trailer?.youtube_id,
      embedUrl: jikanAnime.trailer?.embed_url,
      youtubeId: jikanAnime.trailer?.youtube_id
    })
    
    return {
      title: jikanAnime.title,
      title_japanese: jikanAnime.title_japanese || null,
      description: jikanAnime.synopsis || null,
      poster_url: jikanAnime.images?.jpg?.large_image_url || jikanAnime.images?.webp?.large_image_url || null,
      banner_url: null, // Jikan doesn't provide banner images
      trailer_url: jikanAnime.trailer?.embed_url || (jikanAnime.trailer?.youtube_id ? `https://www.youtube.com/embed/${jikanAnime.trailer.youtube_id}` : null),
      rating: jikanAnime.score || null,
      year: jikanAnime.year || jikanAnime.aired?.prop?.from?.year || null,
      status: this.mapJikanStatus(jikanAnime.status),
      type: this.mapJikanType(jikanAnime.type),
      genres: jikanAnime.genres?.map(g => g.name) || [],
      studios: jikanAnime.studios?.map(s => s.name) || [],
      total_episodes: jikanAnime.episodes || null,
      duration: duration,
      age_rating: this.mapJikanRating(jikanAnime.rating)
    }
  }

  // Convert AniList anime data to our database format
  static mapAniListToDatabase(aniListAnime: AniListAnime): Partial<Anime> {
    const title = aniListAnime.title?.english || aniListAnime.title?.romaji || aniListAnime.title?.native || ''
    const year = aniListAnime.startDate?.year || aniListAnime.seasonYear || null
    
    // Debug trailer data
    console.log('🎬 AniList trailer debug:', {
      title: title,
      trailer: aniListAnime.trailer,
      hasTrailer: !!aniListAnime.trailer?.id,
      trailerId: aniListAnime.trailer?.id,
      trailerSite: aniListAnime.trailer?.site
    })
    
    const trailerUrl = aniListAnime.trailer?.id ? this.formatTrailerUrl(aniListAnime.trailer.id, aniListAnime.trailer.site) : null
    
    return {
      title: title,
      title_japanese: aniListAnime.title?.native || null,
      description: aniListAnime.description ? this.stripHtmlTags(aniListAnime.description) : null,
      poster_url: aniListAnime.coverImage?.large || aniListAnime.coverImage?.medium || null,
      banner_url: aniListAnime.bannerImage || null,
      trailer_url: trailerUrl,
      rating: aniListAnime.averageScore ? aniListAnime.averageScore / 10 : null, // AniList uses 0-100 scale
      year: year,
      status: this.mapAniListStatus(aniListAnime.status),
      type: this.mapAniListType(aniListAnime.format),
      genres: aniListAnime.genres || [],
      studios: aniListAnime.studios?.nodes?.map(s => s.name) || [],
      total_episodes: aniListAnime.episodes || null,
      duration: aniListAnime.duration || null,
      age_rating: null // AniList doesn't provide age rating in this query
    }
  }

  // Import anime from external API
  static async importAnime(animeData: Partial<Anime>): Promise<Anime | null> {
    try {
      // Check for duplicates by title (use maybeSingle to handle no results gracefully)
      const { data: existingAnime, error: duplicateError } = await supabase
        .from('anime')
        .select('id, title')
        .ilike('title', animeData.title || '')
        .maybeSingle()

      // If there's an error checking for duplicates, log it but continue
      if (duplicateError) {
        console.warn('Error checking for duplicates:', duplicateError.message)
      }

      if (existingAnime) {
        console.log(`Anime "${animeData.title}" already exists, skipping import`)
        return existingAnime as Anime
      }

      // Insert new anime
      const { data, error } = await supabase
        .from('anime')
        .insert({
          ...animeData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error importing anime:', error)
        throw new Error(`Failed to import anime: ${error.message}`)
      }

      console.log(`Successfully imported anime: ${animeData.title}`)
      return data
    } catch (error) {
      console.error('Import anime error:', error)
      throw error
    }
  }

  // Bulk import anime from search results
  static async bulkImportAnime(
    searchQuery: string, 
    source: 'jikan' | 'anilist' = 'jikan',
    limit: number = 10
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: [],
      duplicates: []
    }

    try {
      let searchResults: any[] = []
      
      if (source === 'jikan') {
        searchResults = await this.searchJikanAnime(searchQuery, limit)
      } else {
        searchResults = await this.searchAniListAnime(searchQuery, limit)
      }

      // Optimize with batch processing
      const batchSize = 3 // Smaller batches for better performance
      for (let i = 0; i < searchResults.length; i += batchSize) {
        const batch = searchResults.slice(i, i + batchSize)
        
        // Process batch in parallel for better performance
        const batchPromises = batch.map(async (anime) => {
          try {
            const mappedData = source === 'jikan' 
              ? this.mapJikanToDatabase(anime)
              : this.mapAniListToDatabase(anime)

            // Enhance trailer data by checking both sources
            await this.enhanceTrailerData(mappedData)

            // Quick duplicate check (optimized - only check ID)
            const { data: existingAnime } = await supabase
              .from('anime')
              .select('id')
              .ilike('title', mappedData.title || '')
              .maybeSingle()

            if (existingAnime) {
              return { type: 'duplicate', title: mappedData.title || 'Unknown' }
            }

            // Import the anime
            const importedAnime = await this.importAnime(mappedData)
            if (importedAnime) {
              return { type: 'success', title: mappedData.title }
            } else {
              return { type: 'duplicate', title: mappedData.title || 'Unknown' }
            }
          } catch (error) {
            return { type: 'error', title: anime.title || 'Unknown', error: error instanceof Error ? error.message : 'Unknown error' }
          }
        })

        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises)
        
        // Process results
        batchResults.forEach(batchResult => {
          switch (batchResult.type) {
            case 'success':
              result.imported++
              break
            case 'duplicate':
              result.skipped++
              result.duplicates.push(batchResult.title)
              break
            case 'error':
              result.errors.push(`${batchResult.title}: ${batchResult.error}`)
              break
          }
        })

        // Small delay between batches to prevent overwhelming the API
        if (i + batchSize < searchResults.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      return result
    } catch (error) {
      result.success = false
      result.errors.push(`Bulk import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }

  // Helper methods for data mapping
  private static mapJikanStatus(status?: string): 'ongoing' | 'completed' | 'upcoming' | null {
    if (!status) return null
    
    switch (status.toLowerCase()) {
      case 'currently airing':
      case 'airing':
        return 'ongoing'
      case 'finished airing':
      case 'finished':
        return 'completed'
      case 'not yet aired':
      case 'upcoming':
        return 'upcoming'
      default:
        return null
    }
  }

  private static mapJikanType(type?: string): 'tv' | 'movie' | 'ova' | 'special' | null {
    if (!type) return null
    
    switch (type.toLowerCase()) {
      case 'tv':
        return 'tv'
      case 'movie':
        return 'movie'
      case 'ova':
        return 'ova'
      case 'special':
        return 'special'
      default:
        return 'tv' // Default to TV
    }
  }

  private static mapJikanRating(rating?: string): string | null {
    if (!rating) return null
    
    switch (rating.toLowerCase()) {
      case 'g - all ages':
        return 'G'
      case 'pg - children':
        return 'PG'
      case 'pg-13 - teens 13 or older':
        return 'PG-13'
      case 'r - 17+ (violence & profanity)':
      case 'r+ - mild nudity':
        return 'R'
      case 'rx - hentai':
        return '18+'
      default:
        return null
    }
  }

  private static mapAniListStatus(status?: string): 'ongoing' | 'completed' | 'upcoming' | null {
    if (!status) return null
    
    switch (status.toLowerCase()) {
      case 'releasing':
        return 'ongoing'
      case 'finished':
        return 'completed'
      case 'not yet released':
        return 'upcoming'
      default:
        return null
    }
  }

  private static mapAniListType(format?: string): 'tv' | 'movie' | 'ova' | 'special' | null {
    if (!format) return null
    
    switch (format.toLowerCase()) {
      case 'tv':
        return 'tv'
      case 'movie':
        return 'movie'
      case 'ova':
        return 'ova'
      case 'special':
        return 'special'
      default:
        return 'tv' // Default to TV
    }
  }

  private static parseDuration(duration: string): number | null {
    // Parse duration like "24 min per ep" or "1 hr 30 min"
    const match = duration.match(/(\d+)\s*min/)
    return match ? parseInt(match[1]) : null
  }

  private static stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
  }

  // Helper function to format trailer URLs for embedding
  private static formatTrailerUrl(id: string, site?: string): string {
    switch (site?.toLowerCase()) {
      case 'youtube':
        return `https://www.youtube.com/embed/${id}`
      case 'dailymotion':
        return `https://www.dailymotion.com/embed/video/${id}`
      case 'vimeo':
        return `https://player.vimeo.com/video/${id}`
      default:
        // Default to YouTube embed if site is not specified
        return `https://www.youtube.com/embed/${id}`
    }
  }

  // Helper function to get watch URL (for external links)
  private static formatTrailerWatchUrl(id: string, site?: string): string {
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

  // Test function to debug trailer data
  static async testTrailerData(query: string = "Attack on Titan"): Promise<void> {
    try {
      console.log('🔍 Testing trailer data for:', query)
      
      // Test Jikan
      console.log('📡 Testing Jikan API...')
      const jikanResults = await this.searchJikanAnime(query, 1)
      if (jikanResults.length > 0) {
        const jikanAnime = jikanResults[0]
        console.log('🎬 Jikan trailer data:', {
          title: jikanAnime.title,
          trailer: jikanAnime.trailer,
          mappedTrailerUrl: jikanAnime.trailer?.embed_url || (jikanAnime.trailer?.youtube_id ? `https://www.youtube.com/embed/${jikanAnime.trailer.youtube_id}` : null)
        })
      }
      
      // Test AniList
      console.log('📡 Testing AniList API...')
      const anilistResults = await this.searchAniListAnime(query, 1)
      if (anilistResults.length > 0) {
        const anilistAnime = anilistResults[0]
        console.log('🎬 AniList trailer data:', {
          title: anilistAnime.title?.english || anilistAnime.title?.romaji,
          trailer: anilistAnime.trailer,
          mappedTrailerUrl: anilistAnime.trailer?.id ? this.formatTrailerUrl(anilistAnime.trailer.id, anilistAnime.trailer.site) : null
        })
      }
    } catch (error) {
      console.error('❌ Error testing trailer data:', error)
    }
  }

  // Get trending anime from Jikan
  static async getTrendingJikanAnime(limit: number = 10): Promise<JikanAnime[]> {
    try {
      const response = await fetch(`${this.JIKAN_BASE_URL}/top/anime?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`Jikan API error: ${response.status}`)
      }
      
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error fetching trending anime:', error)
      throw new Error(`Failed to fetch trending anime: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get seasonal anime from Jikan
  static async getSeasonalJikanAnime(year: number, season: string, limit: number = 20): Promise<JikanAnime[]> {
    try {
      const response = await fetch(`${this.JIKAN_BASE_URL}/seasons/${year}/${season}?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`Jikan API error: ${response.status}`)
      }
      
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error fetching seasonal anime:', error)
      throw new Error(`Failed to fetch seasonal anime: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get trending anime from AniList
  static async getTrendingAniListAnime(limit: number = 10): Promise<AniListAnime[]> {
    try {
      const query = `
        query GetTrendingAnime($perPage: Int) {
          Page(perPage: $perPage) {
            media(sort: TRENDING_DESC, type: ANIME, status_in: [RELEASING, FINISHED]) {
              id
              idMal
              title {
                romaji
                english
                native
              }
              description
              format
              status
              episodes
              duration
              genres
              tags {
                name
                rank
              }
              averageScore
              meanScore
              popularity
              trending
              favourites
              startDate {
                year
                month
                day
              }
              endDate {
                year
                month
                day
              }
              coverImage {
                large
                medium
              }
              bannerImage
              trailer {
                id
                site
                thumbnail
              }
              studios {
                nodes {
                  id
                  name
                }
              }
              relations {
                edges {
                  id
                  relationType
                  node {
                    id
                    idMal
                    title {
                      romaji
                      english
                    }
                    format
                    status
                    episodes
                    startDate {
                      year
                    }
                    coverImage {
                      large
                    }
                  }
                }
              }
              characters(sort: [ROLE, RELEVANCE], perPage: 20) {
                edges {
                  id
                  role
                  node {
                    id
                    name {
                      full
                      native
                      alternative
                    }
                    image {
                      large
                      medium
                    }
                    description
                  }
                }
              }
            }
          }
        }
      `

      const response = await fetch(this.ANILIST_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { perPage: limit }
        })
      })

      if (!response.ok) {
        throw new Error(`AniList API error: ${response.status}`)
      }

      const data = await response.json()
      return data.data?.Page?.media || []
    } catch (error) {
      console.error('Error fetching trending anime from AniList:', error)
      throw new Error(`Failed to fetch trending anime: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get seasonal anime from AniList
  static async getSeasonalAniListAnime(year: number, season: string, limit: number = 20): Promise<AniListAnime[]> {
    try {
      const seasonMap: { [key: string]: number } = {
        'winter': 1,
        'spring': 2,
        'summer': 3,
        'fall': 4
      }

      const seasonNumber = seasonMap[season.toLowerCase()] || 1

      const query = `
        query GetSeasonalAnime($year: Int, $season: MediaSeason, $perPage: Int) {
          Page(perPage: $perPage) {
            media(season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC) {
              id
              idMal
              title {
                romaji
                english
                native
              }
              description
              format
              status
              episodes
              duration
              genres
              tags {
                name
                rank
              }
              averageScore
              meanScore
              popularity
              trending
              favourites
              startDate {
                year
                month
                day
              }
              endDate {
                year
                month
                day
              }
              coverImage {
                large
                medium
              }
              bannerImage
              trailer {
                id
                site
                thumbnail
              }
              studios {
                nodes {
                  id
                  name
                }
              }
              relations {
                edges {
                  id
                  relationType
                  node {
                    id
                    idMal
                    title {
                      romaji
                      english
                    }
                    format
                    status
                    episodes
                    startDate {
                      year
                    }
                    coverImage {
                      large
                    }
                  }
                }
              }
              characters(sort: [ROLE, RELEVANCE], perPage: 20) {
                edges {
                  id
                  role
                  node {
                    id
                    name {
                      full
                      native
                      alternative
                    }
                    image {
                      large
                      medium
                    }
                    description
                  }
                }
              }
            }
          }
        }
      `

      const response = await fetch(this.ANILIST_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { 
            year,
            season: season.toUpperCase(),
            perPage: limit 
          }
        })
      })

      if (!response.ok) {
        throw new Error(`AniList API error: ${response.status}`)
      }

      const data = await response.json()
      return data.data?.Page?.media || []
    } catch (error) {
      console.error('Error fetching seasonal anime from AniList:', error)
      throw new Error(`Failed to fetch seasonal anime: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Import anime relations from AniList data
  static async importAnimeRelations(animeId: string, anilistData: any): Promise<{ success: number, errors: number }> {
    try {
      if (!anilistData.relations?.edges || anilistData.relations.edges.length === 0) {
        console.log(`No relations found for anime ${animeId}`)
        return { success: 0, errors: 0 }
      }

      let successCount = 0
      let errorCount = 0

      for (const relation of anilistData.relations.edges) {
        try {
          const relatedTitle = relation.node.title?.romaji || relation.node.title?.english || relation.node.title?.native
          
          // Skip obviously wrong relations (basic validation)
          if (!relatedTitle || !relation.relationType) {
            console.log(`⚠️ Skipping invalid relation: ${relatedTitle} (${relation.relationType})`)
            continue
          }
          
          // Skip relations that are too different (basic genre/title similarity check)
          const currentAnimeTitle = anilistData.title?.romaji || anilistData.title?.english || anilistData.title?.native || ''
          if (currentAnimeTitle && relatedTitle) {
            // Skip if titles are completely different (no common words)
            const currentWords = currentAnimeTitle.toLowerCase().split(/\s+/)
            const relatedWords = relatedTitle.toLowerCase().split(/\s+/)
            const hasCommonWords = currentWords.some(word => 
              word.length > 2 && relatedWords.some(rWord => rWord.includes(word) || word.includes(rWord))
            )
            
            // For SEQUEL/PREQUEL relations, require some similarity
            if (['SEQUEL', 'PREQUEL'].includes(relation.relationType) && !hasCommonWords) {
              console.log(`⚠️ Skipping unlikely ${relation.relationType}: ${currentAnimeTitle} -> ${relatedTitle}`)
              continue
            }
          }

          const relationData = {
            anime_id: animeId,
            related_anime_id: relation.node.idMal?.toString() || relation.node.id?.toString(),
            relation_type: relation.relationType,
            anilist_id: relation.node.id,
            mal_id: relation.node.idMal,
            title: relatedTitle,
            format: relation.node.format,
            status: relation.node.status,
            episodes: relation.node.episodes,
            year: relation.node.startDate?.year,
            poster_url: relation.node.coverImage?.large || relation.node.coverImage?.medium
          }

          const { error } = await supabase
            .from('anime_relations')
            .upsert(relationData, { 
              onConflict: 'anime_id,related_anime_id,relation_type',
              ignoreDuplicates: true 
            })

          if (error) {
            console.error(`Error importing relation for anime ${animeId}:`, error)
            errorCount++
          } else {
            successCount++
            console.log(`✅ Imported relation: ${relationData.title} (${relationData.relation_type})`)
          }
        } catch (error) {
          console.error(`Error processing relation for anime ${animeId}:`, error)
          errorCount++
        }
      }

      return { success: successCount, errors: errorCount }
    } catch (error) {
      console.error('Error importing anime relations:', error)
      return { success: 0, errors: 1 }
    }
  }

  // Import anime characters from AniList data
  static async importAnimeCharacters(animeId: string, anilistData: any): Promise<{ success: number, errors: number }> {
    try {
      console.log(`🎭 Importing characters for anime ${animeId}`)
      console.log('Characters data:', anilistData.characters)
      
      if (!anilistData.characters?.edges || anilistData.characters.edges.length === 0) {
        console.log(`No characters found for anime ${animeId}`)
        return { success: 0, errors: 0 }
      }

      console.log(`Found ${anilistData.characters.edges.length} characters to import`)
      
      // Log character roles for debugging
      const roleCounts = anilistData.characters.edges.reduce((acc: any, char: any) => {
        acc[char.role] = (acc[char.role] || 0) + 1
        return acc
      }, {})
      console.log('Character role distribution:', roleCounts)

      let successCount = 0
      let errorCount = 0

      // Only import main characters (MAIN role)
      const mainCharacters = anilistData.characters.edges.filter((char: any) => char.role === 'MAIN')
      console.log(`Filtering to ${mainCharacters.length} main characters only`)
      
      for (const character of mainCharacters) {
        try {
          console.log('Processing character:', character.node.name?.full, 'Role:', character.role)
          
          const characterData = {
            anime_id: animeId,
            name: character.node.name?.full || character.node.name?.native,
            name_japanese: character.node.name?.native,
            name_romaji: character.node.name?.alternative,
            role: character.role?.toLowerCase() || 'supporting', // Convert to lowercase to match schema
            image_url: character.node.image?.large || character.node.image?.medium,
            description: character.node.description
          }
          
          console.log('Character data to insert:', characterData)

          const { error } = await supabase
            .from('anime_characters')
            .upsert(characterData, { 
              onConflict: 'anime_id,name',
              ignoreDuplicates: true 
            })

          if (error) {
            console.error(`Error importing character for anime ${animeId}:`, error)
            errorCount++
          } else {
            successCount++
            console.log(`✅ Imported character: ${characterData.name} (${characterData.role})`)
          }
        } catch (error) {
          console.error(`Error processing character for anime ${animeId}:`, error)
          errorCount++
        }
      }

      return { success: successCount, errors: errorCount }
    } catch (error) {
      console.error('Error importing anime characters:', error)
      return { success: 0, errors: 1 }
    }
  }

  // Import anime studios from AniList data
  static async importAnimeStudios(animeId: string, anilistData: any): Promise<{ success: number, errors: number }> {
    try {
      if (!anilistData.studios?.nodes || anilistData.studios.nodes.length === 0) {
        console.log(`No studios found for anime ${animeId}`)
        return { success: 0, errors: 0 }
      }

      let successCount = 0
      let errorCount = 0

      // Only import first 2 main studios
      const mainStudios = anilistData.studios.nodes.slice(0, 2)
      for (const studio of mainStudios) {
        try {
          // First, upsert the studio
          const studioData = {
            anilist_id: studio.id,
            name: studio.name
          }

          const { data: studioResult, error: studioError } = await supabase
            .from('anime_studios')
            .upsert(studioData, { 
              onConflict: 'anilist_id'
            })
            .select('id')
            .single()

          if (studioError) {
            console.error(`Error importing studio:`, studioError)
            errorCount++
            continue
          }

          // Get the studio UUID from the database
          const studioUuid = studioResult?.id
          if (!studioUuid) {
            console.error(`Failed to get studio UUID for studio: ${studio.name}`)
            errorCount++
            continue
          }

          // Then, create the relation
          const relationData = {
            anime_id: animeId,
            studio_id: studioUuid,
            role: 'animation' // Default role for animation studios
          }

          const { error: relationError } = await supabase
            .from('anime_studio_relations')
            .upsert(relationData, { 
              onConflict: 'anime_id,studio_id,role',
              ignoreDuplicates: true 
            })

          if (relationError) {
            console.error(`Error creating studio relation for anime ${animeId}:`, relationError)
            errorCount++
          } else {
            successCount++
            console.log(`✅ Imported studio: ${studioData.name}`)
          }
        } catch (error) {
          console.error(`Error processing studio for anime ${animeId}:`, error)
          errorCount++
        }
      }

      return { success: successCount, errors: errorCount }
    } catch (error) {
      console.error('Error importing anime studios:', error)
      return { success: 0, errors: 1 }
    }
  }

  // Update existing anime with better trailer data from both sources
  static async updateAnimeTrailers(): Promise<{ updated: number, errors: number }> {
    try {
      console.log('🔄 Starting trailer update process...')
      
      // Get all anime without trailer URLs
      const { data: animeWithoutTrailers, error: fetchError } = await supabase
        .from('anime')
        .select('id, title, trailer_url')
        .or('trailer_url.is.null,trailer_url.eq.')
        .limit(50) // Process in batches
      
      if (fetchError) {
        console.error('Error fetching anime:', fetchError)
        return { updated: 0, errors: 1 }
      }

      if (!animeWithoutTrailers || animeWithoutTrailers.length === 0) {
        console.log('✅ All anime already have trailer URLs')
        return { updated: 0, errors: 0 }
      }

      console.log(`🔍 Found ${animeWithoutTrailers.length} anime without trailers`)
      
      let updated = 0
      let errors = 0

      // Process each anime
      for (const anime of animeWithoutTrailers) {
        try {
          console.log(`🔍 Searching trailer for: ${anime.title}`)
          
          // Create anime data object for enhancement
          const animeData: Partial<Anime> = {
            id: anime.id,
            title: anime.title,
            trailer_url: anime.trailer_url
          }

          // Enhance trailer data
          await this.enhanceTrailerData(animeData)

          // Update if we found a trailer
          if (animeData.trailer_url && animeData.trailer_url !== anime.trailer_url) {
            const { error: updateError } = await supabase
              .from('anime')
              .update({ trailer_url: animeData.trailer_url })
              .eq('id', anime.id)

            if (updateError) {
              console.error(`Error updating trailer for ${anime.title}:`, updateError)
              errors++
            } else {
              console.log(`✅ Updated trailer for: ${anime.title}`)
              updated++
            }
          } else {
            console.log(`❌ No trailer found for: ${anime.title}`)
          }

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000))
          
        } catch (error) {
          console.error(`Error processing ${anime.title}:`, error)
          errors++
        }
      }

      console.log(`🎬 Trailer update complete: ${updated} updated, ${errors} errors`)
      return { updated, errors }
      
    } catch (error) {
      console.error('Error in updateAnimeTrailers:', error)
      return { updated: 0, errors: 1 }
    }
  }

  // Enhanced import anime with relations
  // Enhance trailer data by checking both Jikan and AniList sources
  static async enhanceTrailerData(animeData: Partial<Anime>): Promise<void> {
    try {
      // If we already have a trailer URL, keep it
      if (animeData.trailer_url) {
        console.log('🎬 Trailer already exists:', animeData.trailer_url)
        return
      }

      console.log('🔍 Searching for trailer data for:', animeData.title)
      
      // Try to find trailer from Jikan
      try {
        const jikanResults = await this.searchJikanAnime(animeData.title!, 1)
        if (jikanResults.length > 0) {
          const jikanAnime = jikanResults[0]
          if (jikanAnime.trailer?.embed_url || jikanAnime.trailer?.youtube_id) {
            const jikanTrailerUrl = jikanAnime.trailer.embed_url || 
              (jikanAnime.trailer.youtube_id ? `https://www.youtube.com/embed/${jikanAnime.trailer.youtube_id}` : null)
            
            if (jikanTrailerUrl) {
              console.log('🎬 Found trailer from Jikan:', jikanTrailerUrl)
              animeData.trailer_url = jikanTrailerUrl
              return
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Jikan trailer search failed:', error)
      }

      // Try to find trailer from AniList
      try {
        const anilistResults = await this.searchAniListAnime(animeData.title!, 1)
        if (anilistResults.length > 0) {
          const anilistAnime = anilistResults[0]
          if (anilistAnime.trailer?.id) {
            const anilistTrailerUrl = this.formatTrailerUrl(anilistAnime.trailer.id, anilistAnime.trailer.site)
            console.log('🎬 Found trailer from AniList:', anilistTrailerUrl)
            animeData.trailer_url = anilistTrailerUrl
            return
          }
        }
      } catch (error) {
        console.log('⚠️ AniList trailer search failed:', error)
      }

      console.log('❌ No trailer found from any source')
    } catch (error) {
      console.error('Error enhancing trailer data:', error)
    }
  }

  static async importAnimeWithRelations(anilistData: any): Promise<{ success: boolean, animeId?: string, relations?: any, characters?: any, studios?: any }> {
    try {
      // First import the main anime data
      const animeData = this.mapAniListToDatabase(anilistData)
      
      // Enhance trailer data by checking both sources
      await this.enhanceTrailerData(animeData)
      
      const { data: insertedAnime, error: insertError } = await supabase
        .from('anime')
        .insert(animeData)
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting anime:', insertError)
        throw insertError
      }

      const animeId = insertedAnime.id
      console.log(`✅ Imported anime: ${animeData.title}`)

      // Import relations, characters, and studios in parallel
      const [relationsResult, charactersResult, studiosResult] = await Promise.all([
        this.importAnimeRelations(animeId, anilistData),
        this.importAnimeCharacters(animeId, anilistData),
        this.importAnimeStudios(animeId, anilistData)
      ])

      return {
        success: true,
        animeId,
        relations: relationsResult,
        characters: charactersResult,
        studios: studiosResult
      }
    } catch (error) {
      console.error('Error importing anime with relations:', error)
      return { success: false }
    }
  }

  // Import anime from AniList data (enhanced with relations)
  static async importAnimeFromAniList(anilistData: any): Promise<boolean> {
    try {
      console.log('🎬 Starting import for anime:', anilistData.title?.english || anilistData.title?.romaji)
      console.log('📊 AniList data structure:', {
        hasRelations: !!anilistData.relations?.edges,
        relationsCount: anilistData.relations?.edges?.length || 0,
        hasCharacters: !!anilistData.characters?.edges,
        charactersCount: anilistData.characters?.edges?.length || 0,
        hasStudios: !!anilistData.studios?.nodes,
        studiosCount: anilistData.studios?.nodes?.length || 0
      })
      
      const result = await this.importAnimeWithRelations(anilistData)
      
      if (result.success) {
        console.log(`✅ Imported anime with relations: ${anilistData.title?.english || anilistData.title?.romaji}`)
        if (result.relations) {
          console.log(`📊 Relations: ${result.relations.success} imported, ${result.relations.errors} errors`)
        }
        if (result.characters) {
          console.log(`👥 Characters: ${result.characters.success} imported, ${result.characters.errors} errors`)
        }
        if (result.studios) {
          console.log(`🏢 Studios: ${result.studios.success} imported, ${result.studios.errors} errors`)
        }
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error importing anime from AniList:', error)
      return false
    }
  }
}
