import { useState, useEffect } from 'react';
import { LargeAnimeScraperService } from '../../services/largeAnimeScraperService';
import type { LargeScrapeProgress, ChunkScrapeResult } from '../../services/largeAnimeScraperService';

interface LargeAnimeScraperProps {
  animeId: string;
  animeTitle: string;
  totalEpisodes: number;
  onScrapingComplete?: () => void;
}

export default function LargeAnimeScraper({
  animeId,
  animeTitle,
  totalEpisodes,
  onScrapingComplete
}: LargeAnimeScraperProps) {
  const [isScraping, setIsScraping] = useState(false);
  const [progress, setProgress] = useState<LargeScrapeProgress | null>(null);
  const [chunkSize, setChunkSize] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recentChunkResults, setRecentChunkResults] = useState<ChunkScrapeResult[]>([]);

  // Calculate estimated time
  const estimatedTime = LargeAnimeScraperService.calculateEstimatedTime(totalEpisodes, chunkSize);

  // Check for existing progress on mount
  useEffect(() => {
    checkExistingProgress();
  }, [animeId]);

  const checkExistingProgress = async () => {
    try {
      const result = await LargeAnimeScraperService.getScrapingProgress(animeId);
      if (result.success && result.progress) {
        setProgress(result.progress);
        if (result.progress.status === 'in_progress') {
          setIsScraping(true);
        }
      }
    } catch (error) {
      console.error('Error checking existing progress:', error);
    }
  };

  const startScraping = async () => {
    try {
      setIsScraping(true);
      setError(null);
      setSuccess(null);
      setRecentChunkResults([]);

      const result = await LargeAnimeScraperService.scrapeAllChunks(
        animeId,
        animeTitle,
        totalEpisodes,
        chunkSize,
        (progress) => {
          setProgress(progress);
        },
        (_chunkNumber, chunkResult) => {
          setRecentChunkResults(prev => [chunkResult, ...prev.slice(0, 4)]); // Keep last 5 results
        }
      );

      if (result.success) {
        setSuccess(`Scraping completed! ${result.completedChunks}/${result.totalChunks} chunks processed`);
        if (onScrapingComplete) {
          onScrapingComplete();
        }
      } else {
        setError(result.error || 'Scraping failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsScraping(false);
    }
  };

  const pauseScraping = async () => {
    // TODO: Implement pause functionality
    setIsScraping(false);
    setSuccess('Scraping paused');
  };

  const resumeScraping = async () => {
    if (progress) {
      // Resume from current chunk
      await startScraping();
    }
  };

  const resetScraping = async () => {
    // TODO: Implement reset functionality
    setProgress(null);
    setRecentChunkResults([]);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">
          🎬 Large Anime Scraper
        </h3>
        <div className="text-sm text-gray-500">
          {totalEpisodes} episodes
        </div>
      </div>

      {/* Anime Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-2">{animeTitle}</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Episodes:</span>
            <div className="font-semibold">{totalEpisodes}</div>
          </div>
          <div>
            <span className="text-gray-600">Chunk Size:</span>
            <div className="font-semibold">{chunkSize}</div>
          </div>
          <div>
            <span className="text-gray-600">Total Chunks:</span>
            <div className="font-semibold">{estimatedTime.totalChunks}</div>
          </div>
          <div>
            <span className="text-gray-600">Est. Time:</span>
            <div className="font-semibold">
              {estimatedTime.estimatedDays > 1 
                ? `${estimatedTime.estimatedDays} days`
                : `${estimatedTime.estimatedHours} hours`
              }
            </div>
          </div>
        </div>
      </div>

      {/* Chunk Size Configuration */}
      {!isScraping && !progress && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chunk Size (episodes per batch)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="10"
              max="100"
              value={chunkSize}
              onChange={(e) => setChunkSize(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-semibold text-gray-600 min-w-[3rem]">
              {chunkSize}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Smaller chunks = more control, larger chunks = faster overall
          </div>
        </div>
      )}

      {/* Progress Display */}
      {progress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">
              {progress.completedEpisodes}/{progress.totalEpisodes} episodes
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress.progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>{progress.progressPercentage}% complete</span>
            <span>ETA: {progress.estimatedTimeRemaining}</span>
          </div>
          
          {/* Detailed Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
            <div className="text-center">
              <div className="text-green-600 font-semibold">{progress.completedEpisodes}</div>
              <div className="text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-red-600 font-semibold">{progress.failedEpisodes}</div>
              <div className="text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 font-semibold">{progress.currentChunk}/{progress.totalChunks}</div>
              <div className="text-gray-600">Chunks</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Chunk Results */}
      {recentChunkResults.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Chunk Results</h4>
          <div className="space-y-2">
            {recentChunkResults.map((result, index) => (
              <div key={index} className="bg-gray-50 rounded p-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {result.summary.successCount} success, {result.summary.errorCount} failed
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.summary.successRate >= 80 
                      ? 'bg-green-100 text-green-800'
                      : result.summary.successRate >= 50
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.summary.successRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {!isScraping && !progress && (
          <button
            onClick={startScraping}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            🚀 Start Scraping
          </button>
        )}

        {isScraping && (
          <button
            onClick={pauseScraping}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            ⏸️ Pause
          </button>
        )}

        {progress && !isScraping && progress.status !== 'completed' && (
          <button
            onClick={resumeScraping}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            ▶️ Resume
          </button>
        )}

        {(progress || recentChunkResults.length > 0) && (
          <button
            onClick={resetScraping}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            🔄 Reset
          </button>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 mr-2">❌</div>
            <div className="text-red-800">{error}</div>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 mr-2">✅</div>
            <div className="text-green-800">{success}</div>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-yellow-600 mr-2 mt-0.5">⚠️</div>
          <div className="text-yellow-800 text-sm">
            <strong>Large scraping warning:</strong> This will take a significant amount of time. 
            For One Piece (1146 episodes), expect 6-12 hours depending on chunk size and delays. 
            The process can be paused and resumed. Make sure your server stays running.
          </div>
        </div>
      </div>
    </div>
  );
}
