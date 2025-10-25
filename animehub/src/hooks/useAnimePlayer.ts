import { useCallback } from 'react';
import { VideoService, VideoSource } from '../services/videoService';
import { AnimeService } from '../services/animeService';
import { supabase } from '../lib/supabase';

interface AnimeEpisode {
  number: number;
  sources: VideoSource[];
  title: string;
}

interface WatchProgress {
  animeId: string;
  episodeNumber: number;
  timestamp: number;
}

export const useAnimePlayer = () => {

  const getEpisodeSources = useCallback(async (animeId: string, episodeNumber: number): Promise<AnimeEpisode> => {
    try {
      // Get episode data from database
      const { data: episode, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('anime_id', animeId)
        .eq('episode_number', episodeNumber)
        .single();

      if (error || !episode) {
        throw new Error('Episode not found');
      }

      // Generate video sources based on the video URL
      const videoUrl = episode.video_url;
      if (!videoUrl) {
        throw new Error('No video URL available for this episode');
      }

      const sourceType = VideoService.detectVideoSource(videoUrl);
      let sources: VideoSource[] = [];

      if (sourceType === 'youtube') {
        // Generate multiple quality options for YouTube
        sources = VideoService.generateYouTubeQualities(videoUrl);
      } else {
        // For direct sources, create a single source entry
        sources = [{
          quality: '720p',
          url: videoUrl,
          provider: 'Direct',
          type: sourceType,
        }];
      }

      return {
        number: episodeNumber,
        sources,
        title: episode.title || `Episode ${episodeNumber}`
      };
    } catch (error) {
      console.error('Error fetching episode sources:', error);
      throw new Error('Failed to fetch episode sources');
    }
  }, []);

  const updateWatchProgress = useCallback(async (animeId: string, episodeNumber: number, timestamp: number): Promise<void> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Always save to localStorage as backup
      const key = `watch_progress_${animeId}_${episodeNumber}`;
      localStorage.setItem(key, timestamp.toString());
      
      if (!user) {
        return; // For non-authenticated users, only use localStorage
      }

      // Get episode ID
      const { data: episode, error: episodeError } = await supabase
        .from('episodes')
        .select('id')
        .eq('anime_id', animeId)
        .eq('episode_number', episodeNumber)
        .single();

      if (episodeError || !episode) {
        console.warn('Episode not found for progress update:', episodeError);
        return; // localStorage backup is already saved
      }

      // Update or insert watch progress
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          episode_id: episode.id,
          progress_seconds: timestamp,
          is_completed: false,
          last_watched: new Date().toISOString()
        });

      if (error) {
        console.warn('Error updating watch progress in database:', error);
        // Don't throw error - localStorage backup is already saved
      }
    } catch (error) {
      console.error('Error updating watch progress:', error);
      // Don't throw error for progress updates - they're not critical
    }
  }, []);

  const getWatchProgress = useCallback(async (animeId: string, episodeNumber: number): Promise<number> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Check localStorage for non-authenticated users
        const key = `watch_progress_${animeId}_${episodeNumber}`;
        const saved = localStorage.getItem(key);
        return saved ? parseInt(saved) : 0;
      }

      // Get episode ID
      const { data: episode, error: episodeError } = await supabase
        .from('episodes')
        .select('id')
        .eq('anime_id', animeId)
        .eq('episode_number', episodeNumber)
        .single();

      if (episodeError || !episode) {
        console.warn('Episode not found, using localStorage fallback:', episodeError);
        const key = `watch_progress_${animeId}_${episodeNumber}`;
        const saved = localStorage.getItem(key);
        return saved ? parseInt(saved) : 0;
      }

      // Get watch progress from database with better error handling
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('progress_seconds')
        .eq('user_id', user.id)
        .eq('episode_id', episode.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

      if (progressError) {
        console.warn('Error fetching watch progress from database, using localStorage fallback:', progressError);
        const key = `watch_progress_${animeId}_${episodeNumber}`;
        const saved = localStorage.getItem(key);
        return saved ? parseInt(saved) : 0;
      }

      return progress?.progress_seconds || 0;
    } catch (error) {
      console.error('Unexpected error fetching watch progress:', error);
      // Fallback to localStorage
      const key = `watch_progress_${animeId}_${episodeNumber}`;
      const saved = localStorage.getItem(key);
      return saved ? parseInt(saved) : 0;
    }
  }, []);

  return {
    getEpisodeSources,
    updateWatchProgress,
    getWatchProgress
  };
};

export default useAnimePlayer;