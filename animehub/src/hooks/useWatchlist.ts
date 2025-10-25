import { useState, useEffect, useCallback } from 'react';
import { UserService } from '../services/userService';
import { useAuthContext } from '../contexts/AuthContext';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  const fetchWatchlist = useCallback(async () => {
    if (!user?.id) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await UserService.getUserWatchlist(user.id);
      setWatchlist(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch watchlist');
      console.error('Watchlist fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const addToWatchlist = useCallback(async (animeId: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      await UserService.addToWatchlist(user.id, animeId);
      await fetchWatchlist(); // Refresh the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add to watchlist');
    }
  }, [user?.id, fetchWatchlist]);

  const removeFromWatchlist = useCallback(async (animeId: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      await UserService.removeFromWatchlist(user.id, animeId);
      await fetchWatchlist(); // Refresh the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to remove from watchlist');
    }
  }, [user?.id, fetchWatchlist]);

  const isInWatchlist = useCallback(async (animeId: string) => {
    if (!user?.id) return false;
    
    try {
      return await UserService.isInWatchlist(user.id, animeId);
    } catch (err) {
      console.error('Check watchlist error:', err);
      return false;
    }
  }, [user?.id]);

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    refetch: fetchWatchlist
  };
}
