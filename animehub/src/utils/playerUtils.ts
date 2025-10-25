/**
 * Utility functions for player navigation and progress handling
 */

/**
 * Generate a player URL with progress parameter for continue watching
 */
export function generatePlayerUrl(
  animeId: string, 
  episodeNumber: number, 
  progressSeconds?: number
): string {
  const baseUrl = `/player/${animeId}/${episodeNumber}`;
  
  if (progressSeconds && progressSeconds > 0) {
    return `${baseUrl}?progress=${Math.floor(progressSeconds)}&continue=true`;
  }
  
  return baseUrl;
}

/**
 * Format time duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Format progress percentage
 */
export function formatProgress(current: number, total: number): string {
  if (total === 0) return '0%';
  const percentage = Math.round((current / total) * 100);
  return `${percentage}%`;
}
