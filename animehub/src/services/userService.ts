import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/supabase'

export class UserService {
  // Get current user profile
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      // If profile doesn't exist, create one
      if (profileError.code === 'PGRST116') {
        return await this.createUserProfile(user)
      }
      throw new Error(`Failed to fetch user profile: ${profileError.message}`)
    }

    return profile
  }

  // Create user profile after signup
  static async createUserProfile(authUser: any): Promise<Tables<'users'>> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email,
        username: authUser.user_metadata?.username || authUser.email?.split('@')[0],
        avatar_url: authUser.user_metadata?.avatar_url || null,
        subscription_type: 'free'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create user profile: ${error.message}`)
    }

    return data
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`)
    }

    return data
  }

  // Get user's watch progress
  static async getUserProgress(userId: string, animeId?: string) {
    let query = supabase
      .from('user_progress')
      .select(`
        *,
        episode:episode_id (
          id,
          episode_number,
          title,
          anime_id,
          duration,
          anime:anime_id (
            id,
            title,
            poster_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('last_watched', { ascending: false })

    if (animeId) {
      query = query.eq('episode.anime_id', animeId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch user progress: ${error.message}`)
    }

    return data || []
  }

  // Get continue watching list (recently watched episodes with progress)
  static async getContinueWatching(userId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select(`
          *,
          episode:episode_id (
            id,
            episode_number,
            title,
            anime_id,
            duration,
            thumbnail_url,
            anime:anime_id (
              id,
              title,
              poster_url,
              rating,
              year,
              genres,
              status,
              total_episodes
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('last_watched', { ascending: false })
        .limit(limit)

      if (error) {
        console.warn('Continue watching fetch error:', error.message)
        return []
      }

      return data?.filter(item => item.episode?.anime) || []
    } catch (err) {
      console.warn('Continue watching fetch failed:', err)
      return []
    }
  }

  // Update watch progress
  static async updateWatchProgress(userId: string, episodeId: string, progressSeconds: number) {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        episode_id: episodeId,
        progress_seconds: progressSeconds,
        is_completed: false,
        last_watched: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update watch progress: ${error.message}`)
    }

    return data
  }

  // Mark episode as completed
  static async markEpisodeCompleted(userId: string, episodeId: string) {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        episode_id: episodeId,
        is_completed: true,
        last_watched: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to mark episode as completed: ${error.message}`)
    }

    return data
  }

  // Get user's favorites
  static async getUserFavorites(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          anime:anime_id (
            id,
            title,
            poster_url,
            rating,
            year,
            genres,
            status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Favorites fetch error:', error.message)
        return []
      }

      return data?.map(fav => fav.anime).filter(Boolean) || []
    } catch (err) {
      console.warn('Favorites fetch failed:', err)
      return []
    }
  }

  // Add to favorites
  static async addToFavorites(userId: string, animeId: string) {
    const { data, error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: userId,
        anime_id: animeId
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add to favorites: ${error.message}`)
    }

    return data
  }

  // Remove from favorites
  static async removeFromFavorites(userId: string, animeId: string) {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('anime_id', animeId)

    if (error) {
      throw new Error(`Failed to remove from favorites: ${error.message}`)
    }

    return true
  }

  // Get user's watchlist
  static async getUserWatchlist(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select(`
          *,
          anime:anime_id (
            id,
            title,
            poster_url,
            rating,
            year,
            genres,
            status,
            total_episodes
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Watchlist fetch error:', error.message)
        return []
      }

      return data?.map(item => item.anime).filter(Boolean) || []
    } catch (err) {
      console.warn('Watchlist fetch failed:', err)
      return []
    }
  }

  // Add to watchlist
  static async addToWatchlist(userId: string, animeId: string) {
    const { data, error } = await supabase
      .from('user_watchlist')
      .insert({
        user_id: userId,
        anime_id: animeId
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add to watchlist: ${error.message}`)
    }

    return data
  }

  // Remove from watchlist
  static async removeFromWatchlist(userId: string, animeId: string) {
    const { error } = await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('anime_id', animeId)

    if (error) {
      throw new Error(`Failed to remove from watchlist: ${error.message}`)
    }

    return true
  }

  // Check if anime is in favorites
  static async isInFavorites(userId: string, animeId: string) {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('anime_id', animeId)
        .maybeSingle()

      if (error) {
        console.warn('Check favorites error:', error.message)
        return false
      }

      return !!data
    } catch (err) {
      console.warn('Check favorites failed:', err)
      return false
    }
  }

  // Check if anime is in watchlist
  static async isInWatchlist(userId: string, animeId: string) {
    try {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('id')
        .eq('user_id', userId)
        .eq('anime_id', animeId)
        .maybeSingle()

      if (error) {
        console.warn('Check watchlist error:', error.message)
        return false
      }

      return !!data
    } catch (err) {
      console.warn('Check watchlist failed:', err)
      return false
    }
  }

  // Get user's reviews
  static async getUserReviews(userId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        anime:anime_id (
          id,
          title,
          poster_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch user reviews: ${error.message}`)
    }

    return data || []
  }

  // Add review
  static async addReview(userId: string, animeId: string, rating: number, reviewText?: string) {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: userId,
        anime_id: animeId,
        rating,
        review_text: reviewText || null
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add review: ${error.message}`)
    }

    return data
  }

  // Update review
  static async updateReview(userId: string, animeId: string, rating: number, reviewText?: string) {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        rating,
        review_text: reviewText || null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('anime_id', animeId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update review: ${error.message}`)
    }

    return data
  }

  // Delete review
  static async deleteReview(userId: string, animeId: string) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('user_id', userId)
      .eq('anime_id', animeId)

    if (error) {
      throw new Error(`Failed to delete review: ${error.message}`)
    }

    return true
  }

  // Get user stats
  static async getUserStats(userId: string) {
    try {
      const [progressResult, favoritesResult, watchlistResult, reviewsResult] = await Promise.all([
        supabase
          .from('user_progress')
          .select('is_completed')
          .eq('user_id', userId),
        
        supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', userId),
        
        supabase
          .from('user_watchlist')
          .select('id')
          .eq('user_id', userId),
        
        supabase
          .from('reviews')
          .select('id')
          .eq('user_id', userId)
      ])

      const completedEpisodes = progressResult.data?.filter(p => p.is_completed).length || 0
      const totalFavorites = favoritesResult.data?.length || 0
      const totalWatchlist = watchlistResult.data?.length || 0
      const totalReviews = reviewsResult.data?.length || 0

      return {
        completedEpisodes,
        totalFavorites,
        totalWatchlist,
        totalReviews,
        totalEpisodesWatched: progressResult.data?.length || 0
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
      return {
        completedEpisodes: 0,
        totalFavorites: 0,
        totalWatchlist: 0,
        totalReviews: 0,
        totalEpisodesWatched: 0
      }
    }
  }

  // Get recent activity
  static async getRecentActivity(userId: string) {
    try {
      const [progressResult, favoritesResult, watchlistResult, reviewsResult] = await Promise.all([
        supabase
          .from('user_progress')
          .select(`
            last_watched,
            is_completed,
            episode:episode_id (
              anime:anime_id (
                id,
                title,
                poster_url
              )
            )
          `)
          .eq('user_id', userId)
          .order('last_watched', { ascending: false })
          .limit(5),
        
        supabase
          .from('user_favorites')
          .select(`
            created_at,
            anime:anime_id (
              id,
              title,
              poster_url
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
        
        supabase
          .from('user_watchlist')
          .select(`
            created_at,
            anime:anime_id (
              id,
              title,
              poster_url
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
        
        supabase
          .from('reviews')
          .select(`
            created_at,
            rating,
            anime:anime_id (
              id,
              title,
              poster_url
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      const activities: any[] = []

      // Add progress activities
      progressResult.data?.forEach((item: any) => {
        if (item.episode?.anime) {
          activities.push({
            type: item.is_completed ? 'completed' : 'watched',
            anime: item.episode.anime,
            time: new Date(item.last_watched).toLocaleDateString(),
            timestamp: item.last_watched
          })
        }
      })

      // Add favorites activities
      favoritesResult.data?.forEach((item: any) => {
        if (item.anime) {
          activities.push({
            type: 'favorited',
            anime: item.anime,
            time: new Date(item.created_at).toLocaleDateString(),
            timestamp: item.created_at
          })
        }
      })

      // Add watchlist activities
      watchlistResult.data?.forEach((item: any) => {
        if (item.anime) {
          activities.push({
            type: 'added',
            anime: item.anime,
            time: new Date(item.created_at).toLocaleDateString(),
            timestamp: item.created_at
          })
        }
      })

      // Add review activities
      reviewsResult.data?.forEach(review => {
        if (review.anime) {
          activities.push({
            type: 'rated',
            anime: review.anime,
            rating: review.rating,
            time: new Date(review.created_at).toLocaleDateString(),
            timestamp: review.created_at
          })
        }
      })

      // Sort by timestamp and return top 10
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
    } catch (error) {
      console.error('Failed to fetch recent activity:', error)
      return []
    }
  }

  // Get achievements
  static async getAchievements(userId: string) {
    try {
      const stats = await this.getUserStats(userId)
      
      const achievements = [
        { 
          icon: 'ri-trophy-line', 
          title: 'First Watch', 
          description: 'Watched your first anime', 
          earned: stats.completedEpisodes > 0 
        },
        { 
          icon: 'ri-time-line', 
          title: 'Marathon Runner', 
          description: 'Completed 10 episodes', 
          earned: stats.completedEpisodes >= 10 
        },
        { 
          icon: 'ri-heart-line', 
          title: 'Anime Lover', 
          description: 'Added 5 favorites', 
          earned: stats.totalFavorites >= 5 
        },
        { 
          icon: 'ri-bookmark-line', 
          title: 'Watchlist Master', 
          description: 'Added 10 to watchlist', 
          earned: stats.totalWatchlist >= 10 
        },
        { 
          icon: 'ri-star-line', 
          title: 'Critic', 
          description: 'Wrote 3 reviews', 
          earned: stats.totalReviews >= 3 
        },
        { 
          icon: 'ri-medal-line', 
          title: 'Dedicated Watcher', 
          description: 'Completed 50 episodes', 
          earned: stats.completedEpisodes >= 50 
        }
      ]

      return achievements
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
      return []
    }
  }
}