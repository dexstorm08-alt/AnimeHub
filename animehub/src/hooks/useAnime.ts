import { useState, useEffect, useMemo, useCallback } from 'react'
import { AnimeService } from '../services/animeService'
import type { Tables } from '../lib/supabase'

type Anime = Tables<'anime'>

interface UseAnimeOptions {
  page?: number
  limit?: number
  genre?: string
  year?: number
  status?: string
  search?: string
}

export function useAnime(options: UseAnimeOptions = {}) {
  const [anime, setAnime] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  // Memoize options to prevent unnecessary re-renders
  const memoizedOptions = useMemo(() => ({
    page: options.page || 1,
    limit: options.limit || 20,
    genre: options.genre,
    year: options.year,
    status: options.status,
    search: options.search
  }), [options.page, options.limit, options.genre, options.year, options.status, options.search])

  // Memoize the fetch function
  const fetchAnime = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await AnimeService.getAnimeList(
        memoizedOptions.page,
        memoizedOptions.limit,
        {
          genre: memoizedOptions.genre,
          year: memoizedOptions.year,
          status: memoizedOptions.status,
          search: memoizedOptions.search
        }
      )
      
      setAnime(result.data)
      setTotalPages(result.totalPages)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch anime')
    } finally {
      setLoading(false)
    }
  }, [memoizedOptions])

  useEffect(() => {
    fetchAnime()
  }, [fetchAnime])

  return { anime, loading, error, totalPages, total }
}

export function useFeaturedAnime() {
  const [anime, setAnime] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFeaturedAnime = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await AnimeService.getFeaturedAnime(5)
        setAnime(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch featured anime')
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedAnime()
  }, [])

  return { anime, loading, error }
}

export function useTrendingAnime() {
  const [anime, setAnime] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrendingAnime = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await AnimeService.getTrendingAnime(10)
        setAnime(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch trending anime')
      } finally {
        setLoading(false)
      }
    }

    fetchTrendingAnime()
  }, [])

  return { anime, loading, error }
}

export function usePopularAnime() {
  const [anime, setAnime] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPopularAnime = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await AnimeService.getPopularAnime(12)
        setAnime(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch popular anime')
      } finally {
        setLoading(false)
      }
    }

    fetchPopularAnime()
  }, [])

  return { anime, loading, error }
}

export function useAnimeById(id: string, userId?: string) {
  const [anime, setAnime] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchAnime = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await AnimeService.getAnimeById(id, userId)
        setAnime(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch anime')
      } finally {
        setLoading(false)
      }
    }

    fetchAnime()
  }, [id, userId])

  return { anime, loading, error }
}

export function useSearchAnime(query: string, filters?: {
  genres?: string[]
  year?: string
  status?: string
  sortBy?: string
}) {
  const [anime, setAnime] = useState<Anime[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query || query.length < 2) {
      setAnime([])
      return
    }

    const searchAnime = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await AnimeService.searchAnime(query, 50, filters)
        setAnime(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search anime')
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchAnime, 300) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [query, filters?.genres, filters?.year, filters?.status, filters?.sortBy])

  return { anime, loading, error }
}

export function useGenres() {
  const [genres, setGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await AnimeService.getGenres()
        setGenres(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch genres')
      } finally {
        setLoading(false)
      }
    }

    fetchGenres()
  }, [])

  return { genres, loading, error }
}

export function useSimilarAnime(animeId: string, genres: string[], limit: number = 6) {
  const [anime, setAnime] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize the genres array to prevent infinite loops
  const memoizedGenres = useMemo(() => genres, [genres.join(',')])

  useEffect(() => {
    if (!animeId || !memoizedGenres || memoizedGenres.length === 0) {
      setAnime([])
      setLoading(false)
      return
    }

    const fetchSimilarAnime = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await AnimeService.getSimilarAnime(animeId, memoizedGenres, limit)
        setAnime(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch similar anime')
      } finally {
        setLoading(false)
      }
    }

    fetchSimilarAnime()
  }, [animeId, memoizedGenres, limit])

  return { anime, loading, error }
}