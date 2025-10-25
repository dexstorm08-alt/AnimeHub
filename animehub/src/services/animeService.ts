import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/supabase'

type Anime = Tables<'anime'>
type Episode = Tables<'episodes'>

export interface AnimeWithEpisodes extends Anime {
  episodes?: Episode[]
  user_progress?: any[]
  is_favorited?: boolean
  is_in_watchlist?: boolean
}

// Cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Cache utility functions
const getCacheKey = (method: string, params: any) => 
  `${method}_${JSON.stringify(params)}`

const getCachedData = (key: string) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() })
}

const clearCache = () => {
  cache.clear()
}

export class AnimeService {
  static async getAnimeList(page: number = 1, limit: number = 20, filters?: {
    genre?: string
    year?: number
    status?: string
    search?: string
  }) {
    try {
      // Use the optimized search function for better performance
      if (filters?.search || filters?.genre || filters?.year || filters?.status) {
        const { data, error } = await supabase.rpc('search_anime_optimized', {
          search_term: filters?.search || '',
          genre_filter: filters?.genre || null,
          year_filter: filters?.year || null,
          status_filter: filters?.status || null,
          type_filter: null,
          rating_min: null,
          limit_count: limit,
          offset_count: (page - 1) * limit
        })

        if (error) {
          console.error('Optimized search failed, falling back to regular query:', error)
          // Fallback to regular query
          return this.getAnimeListFallback(page, limit, filters)
        }

        // Get total count for pagination
        const { count } = await supabase
          .from('anime')
          .select('*', { count: 'exact', head: true })
          .modify((query) => {
            if (filters?.genre) query.contains('genres', [filters.genre])
            if (filters?.year) query.eq('year', filters.year)
            if (filters?.status) query.eq('status', filters.status)
            if (filters?.search) {
              query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
            }
          })

        return {
          data: data || [],
          total: count || 0,
          page,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }

      // For simple queries without filters, use regular query with count
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error, count } = await supabase
        .from('anime')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
        throw error
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      }
    } catch (error) {
      console.error('Anime list fetch error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to fetch anime list: ${errorMessage}`)
    }
  }

  // Fallback method for when optimized search fails
  private static async getAnimeListFallback(page: number, limit: number, filters?: {
    genre?: string
    year?: number
    status?: string
    search?: string
  }) {
    let query = supabase
      .from('anime')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.genre) {
      query = query.contains('genres', [filters.genre])
    }
    if (filters?.year) {
      query = query.eq('year', filters.year)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query.range(from, to)

    if (error) {
      throw error
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  static async getFeaturedAnime(limit: number = 5) {
    try {
      const cacheKey = getCacheKey('featured_anime', { limit })
      const cached = getCachedData(cacheKey)
      
      if (cached) {
        return cached
      }

      // Use materialized view for better performance
      const { data, error } = await supabase
        .from('popular_anime')
        .select('*')
        .limit(limit)

      if (error) {
        // Fallback to regular query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('anime')
          .select('*')
          .gte('rating', 8.0)
          .order('rating', { ascending: false })
          .limit(limit)

        if (fallbackError) {
          console.error('Featured anime fetch error:', fallbackError)
          throw new Error(`Failed to fetch featured anime: ${fallbackError.message}`)
        }

        const result = fallbackData || []
        setCachedData(cacheKey, result)
        return result
      }

      const result = data || []
      setCachedData(cacheKey, result)
      return result
    } catch (error) {
      console.error('Featured anime service error:', error)
      return []
    }
  }

  static async getTrendingAnime(limit: number = 10) {
    try {
      // Get anime that are both highly rated AND recently added
      // This creates a "trending" effect by combining quality and freshness
      const { data, error } = await supabase
        .from('anime')
        .select('*')
        .gte('rating', 7.0)  // Good rating threshold
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())  // Added in last 30 days
        .order('rating', { ascending: false })  // Order by highest rating first
        .limit(limit)

      if (error) {
        console.error('Trending anime fetch error:', error)
        throw new Error(`Failed to fetch trending anime: ${error.message}`)
      }

      // If we don't have enough recent anime, fallback to just high-rated anime
      if (!data || data.length < limit) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('anime')
          .select('*')
          .gte('rating', 7.5)
          .order('rating', { ascending: false })
          .limit(limit)

        if (fallbackError) {
          console.error('Trending anime fallback error:', fallbackError)
          return data || []
        }

        return fallbackData || []
      }

      return data || []
    } catch (error) {
      console.error('Trending anime service error:', error)
      return []
    }
  }

  static async getPopularAnime(limit: number = 12) {
    try {
      const { data, error } = await supabase
        .from('anime')
        .select('*')
        .gte('rating', 7.0)  // Lower threshold for more variety
        .order('rating', { ascending: false })  // Order by highest rating
        .limit(limit)

      if (error) {
        console.error('Popular anime fetch error:', error)
        throw new Error(`Failed to fetch popular anime: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Popular anime service error:', error)
      return []
    }
  }

  static async getAnimeById(animeId: string, userId?: string): Promise<AnimeWithEpisodes | null> {
    try {
      // Use a single query with joins for better performance
      const { data: animeWithEpisodes, error: animeError } = await supabase
        .from('anime')
        .select(`
          *,
          episodes (*)
        `)
        .eq('id', animeId)
        .single()

      if (animeError || !animeWithEpisodes) {
        console.error('Anime fetch error:', animeError)
        return null
      }

      // Sort episodes by episode number
      const sortedEpisodes = animeWithEpisodes.episodes?.sort((a: any, b: any) => 
        a.episode_number - b.episode_number
      ) || []

      const result: AnimeWithEpisodes = {
        ...animeWithEpisodes,
        episodes: sortedEpisodes
      }

      // Fetch user-specific data in parallel if userId is provided
      if (userId) {
        try {
          const episodeIds = sortedEpisodes.map((e: any) => e.id)
          
          const [progressResult, favoritesResult, watchlistResult] = await Promise.all([
            episodeIds.length > 0 ? supabase
              .from('user_progress')
              .select('*')
              .eq('user_id', userId)
              .in('episode_id', episodeIds) : Promise.resolve({ data: [] }),
            
            supabase
              .from('user_favorites')
              .select('id')
              .eq('user_id', userId)
              .eq('anime_id', animeId)
              .maybeSingle(),
            
            supabase
              .from('user_watchlist')
              .select('id')
              .eq('user_id', userId)
              .eq('anime_id', animeId)
              .maybeSingle()
          ])

          result.user_progress = progressResult.data || []
          result.is_favorited = !!favoritesResult.data
          result.is_in_watchlist = !!watchlistResult.data
        } catch (userError) {
          console.warn('User data fetch error (non-critical):', userError)
          // Don't fail the entire request if user data fails
          result.user_progress = []
          result.is_favorited = false
          result.is_in_watchlist = false
        }
      }

      return result
    } catch (error) {
      console.error('getAnimeById service error:', error)
      return null
    }
  }

  static async createAnime(animeData: Partial<Anime>) {
    const { data, error } = await supabase
      .from('anime')
      .insert(animeData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create anime: ${error.message}`)
    }

    return data
  }

  static async updateAnime(animeId: string, updates: Partial<Anime>) {
    const { data, error } = await supabase
      .from('anime')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', animeId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update anime: ${error.message}`)
    }

    return data
  }

  static async deleteAnime(animeId: string) {
    const { error } = await supabase
      .from('anime')
      .delete()
      .eq('id', animeId)

    if (error) {
      throw new Error(`Failed to delete anime: ${error.message}`)
    }

    return true
  }

  static async getGenres(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('anime')
        .select('genres')

      if (error) {
        console.error('Genres fetch error:', error)
        throw new Error(`Failed to fetch genres: ${error.message}`)
      }

      const allGenres = data?.flatMap(anime => anime.genres || []) || []
      const uniqueGenres = [...new Set(allGenres)].sort()
      
      return uniqueGenres
    } catch (error) {
      console.error('Genres service error:', error)
      return []
    }
  }

  static async searchAnime(query: string, limit: number = 20, filters?: {
    genres?: string[]
    year?: string
    status?: string
    sortBy?: string
  }) {
    try {
      let searchQuery = supabase
        .from('anime')
        .select('*')

      // Apply search query
      if (query && query.trim()) {
        searchQuery = searchQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,title_japanese.ilike.%${query}%`)
      }

      // Apply filters
      if (filters?.genres && filters.genres.length > 0) {
        searchQuery = searchQuery.contains('genres', filters.genres)
      }
      
      if (filters?.year) {
        searchQuery = searchQuery.eq('release_year', parseInt(filters.year))
      }
      
      if (filters?.status) {
        searchQuery = searchQuery.eq('status', filters.status)
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'rating':
          searchQuery = searchQuery.order('rating', { ascending: false })
          break
        case 'year':
          searchQuery = searchQuery.order('release_year', { ascending: false })
          break
        case 'title':
          searchQuery = searchQuery.order('title', { ascending: true })
          break
        case 'relevance':
        default:
          searchQuery = searchQuery.order('rating', { ascending: false })
          break
      }

      const { data, error } = await searchQuery.limit(limit)

      if (error) {
        console.error('Search anime error:', error)
        throw new Error(`Failed to search anime: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Search anime service error:', error)
      return []
    }
  }

  static async getSimilarAnime(animeId: string, genres: string[], limit: number = 6): Promise<any[]> {
    try {
      if (!genres || genres.length === 0) {
        return []
      }

      const { data, error } = await supabase
        .from('anime')
        .select('*')
        .neq('id', animeId) // Exclude the current anime
        .overlaps('genres', genres) // Find anime with overlapping genres
        .order('rating', { ascending: false }) // Sort by rating
        .limit(limit)

      if (error) {
        console.error('Get similar anime error:', error)
        throw new Error(`Failed to get similar anime: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Get similar anime service error:', error)
      return []
    }
  }
}