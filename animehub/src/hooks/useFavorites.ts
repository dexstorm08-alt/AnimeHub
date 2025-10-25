import { useState, useEffect, useCallback } from 'react';
import { UserService } from '../services/userService';
import { useAuthContext } from '../contexts/AuthContext';

export function useFavorites() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  const fetchFavorites = useCallback(async () => {
    if (!user?.id) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await UserService.getUserFavorites(user.id);
      setFavorites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites');
      console.error('Favorites fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addToFavorites = useCallback(async (animeId: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      await UserService.addToFavorites(user.id, animeId);
      await fetchFavorites(); // Refresh the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add to favorites');
    }
  }, [user?.id, fetchFavorites]);

  const removeFromFavorites = useCallback(async (animeId: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      await UserService.removeFromFavorites(user.id, animeId);
      await fetchFavorites(); // Refresh the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to remove from favorites');
    }
  }, [user?.id, fetchFavorites]);

  const isInFavorites = useCallback(async (animeId: string) => {
    if (!user?.id) return false;
    
    try {
      return await UserService.isInFavorites(user.id, animeId);
    } catch (err) {
      console.error('Check favorites error:', err);
      return false;
    }
  }, [user?.id]);

  return {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    isInFavorites,
    refetch: fetchFavorites
  };
}
