
import { useState, useEffect, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/feature/Navbar';
import AnimeCard from '../../components/feature/AnimeCard';
import { LazyTrailerSection, LazyRelatedAnime, LazyAnimeCharacters } from '../../components/LazyComponents';
import Button from '../../components/base/Button';
import { SparkleLoadingSpinner } from '../../components/base/LoadingSpinner';
import { useAuthContext } from '../../contexts/AuthContext';
import { useAnimeById, useAnime } from '../../hooks/useAnime';
import { useWatchlist } from '../../hooks/useWatchlist';
import { useFavorites } from '../../hooks/useFavorites';
import { generatePlayerUrl } from '../../utils/playerUtils';
import ErrorBoundary from '../../components/ErrorBoundary';
import { SectionError, ContentError } from '../../components/ErrorFallbacks';

export default function AnimeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [watchProgress, setWatchProgress] = useState(0);
  const [progressSeconds, setProgressSeconds] = useState(0);
  
  const { anime, loading: animeLoading, error: animeError } = useAnimeById(id!, user?.id);
  const { anime: similarAnime } = useAnime({ limit: 6 });
  const { addToWatchlist, removeFromWatchlist, isInWatchlist: checkWatchlist } = useWatchlist();
  const { addToFavorites, removeFromFavorites, isInFavorites: checkFavorites } = useFavorites();

  // Check if anime is in user's watchlist and favorites
  useEffect(() => {
    const checkUserData = async () => {
      if (anime && user) {
        try {
          const [watchlistStatus, favoritesStatus] = await Promise.all([
            checkWatchlist(anime.id),
            checkFavorites(anime.id)
          ]);
          setIsInWatchlist(watchlistStatus);
          setIsFavorite(favoritesStatus);

          // Extract continue watching data from user_progress
          if (anime.user_progress && anime.user_progress.length > 0) {
            // Find the most recent episode with progress
            const recentProgress = anime.user_progress
              .filter((progress: any) => !progress.is_completed)
              .sort((a: any, b: any) => new Date(b.last_watched).getTime() - new Date(a.last_watched).getTime())[0];
            
            if (recentProgress) {
              // Find the episode number for this progress
              const episode = anime.episodes?.find((ep: any) => ep.id === recentProgress.episode_id);
              if (episode) {
                setWatchProgress(episode.episode_number);
                setProgressSeconds(recentProgress.progress_seconds);
              }
            }
          }
        } catch (error) {
          console.error('Error checking user data:', error);
        }
      } else if (anime && !user) {
        // Fallback to localStorage for non-logged-in users
        const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const savedWatchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        setIsFavorite(savedFavorites.some((item: any) => item.id === anime.id));
        setIsInWatchlist(savedWatchlist.some((item: any) => item.id === anime.id));
      }
    };

    checkUserData();
  }, [anime, user, checkWatchlist, checkFavorites]);

  const showToastMessage = (message: string) => {
    setShowToast(message);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleWatchlistToggle = async () => {
    if (!anime) return;
    
    if (!user) {
      // Fallback to localStorage for non-logged-in users
      const savedWatchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
      
      if (isInWatchlist) {
        // Remove from watchlist
        const updatedWatchlist = savedWatchlist.filter((item: any) => item.id !== anime.id);
        localStorage.setItem('watchlist', JSON.stringify(updatedWatchlist));
        setIsInWatchlist(false);
        showToastMessage('Removed from watchlist');
      } else {
        // Add to watchlist
        const animeData = {
          id: anime.id,
          title: anime.title,
          image: anime.poster_url,
          rating: anime.rating,
          year: anime.year,
          episodes: anime.total_episodes,
          genres: anime.genres,
          status: anime.status,
          description: anime.description,
          addedAt: new Date().toISOString()
        };
        const updatedWatchlist = [...savedWatchlist, animeData];
        localStorage.setItem('watchlist', JSON.stringify(updatedWatchlist));
        setIsInWatchlist(true);
        showToastMessage('Added to watchlist (local storage)');
      }
      return;
    }

    try {
      if (isInWatchlist) {
        await removeFromWatchlist(anime.id);
        setIsInWatchlist(false);
        showToastMessage('Removed from watchlist');
      } else {
        await addToWatchlist(anime.id);
        setIsInWatchlist(true);
        showToastMessage('Added to watchlist');
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      showToastMessage('Failed to update watchlist. Please try again.');
    }
  };

  const handleFavoriteToggle = async () => {
    if (!anime) return;
    
    if (!user) {
      // Fallback to localStorage for non-logged-in users
      const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      
      if (isFavorite) {
        // Remove from favorites
        const updatedFavorites = savedFavorites.filter((item: any) => item.id !== anime.id);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        setIsFavorite(false);
        showToastMessage('Removed from favorites');
      } else {
        // Add to favorites
        const animeData = {
          id: anime.id,
          title: anime.title,
          image: anime.poster_url,
          rating: anime.rating,
          year: anime.year,
          episodes: anime.total_episodes,
          genres: anime.genres,
          status: anime.status,
          description: anime.description,
          addedAt: new Date().toISOString()
        };
        const updatedFavorites = [...savedFavorites, animeData];
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        setIsFavorite(true);
        showToastMessage('Added to favorites (local storage)');
      }
      return;
    }

    try {
      if (isFavorite) {
        await removeFromFavorites(anime.id);
        setIsFavorite(false);
        showToastMessage('Removed from favorites');
      } else {
        await addToFavorites(anime.id);
        setIsFavorite(true);
        showToastMessage('Added to favorites');
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      showToastMessage('Failed to update favorites. Please try again.');
    }
  };

  const handleEpisodeClick = (episodeNumber: number) => {
    setSelectedEpisode(episodeNumber);
    // Update watch progress
    if (anime) {
      const savedProgress = JSON.parse(localStorage.getItem('watchProgress') || '{}');
      const newProgress = Math.max(savedProgress[anime.id] || 0, episodeNumber);
      const updatedProgress = { ...savedProgress, [anime.id]: newProgress };
      localStorage.setItem('watchProgress', JSON.stringify(updatedProgress));
      setWatchProgress(newProgress);
    }
  };

  // Show loading state while fetching data
  if (animeLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-pink-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <SparkleLoadingSpinner size="xl" text="Loading anime details..." />
          </div>
        </div>
      </div>
    );
  }

  // Show error state only after loading is complete and no anime found
  if (animeError || (!animeLoading && !anime)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-pink-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-16 max-w-md mx-auto border border-white/50">
              <i className="ri-error-warning-line text-7xl text-teal-300 mb-6"></i>
              <h2 className="text-2xl font-bold text-teal-800 mb-4">Anime not found</h2>
              <p className="text-teal-600 mb-6 text-lg">The anime you're looking for doesn't exist.</p>
              <Link to="/anime">
                <Button size="lg">Browse Anime</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Generate episodes from database or fallback
  const episodes = anime.episodes || Array.from({ length: anime.total_episodes || 1 }, (_, i) => ({
    id: i + 1,
    episode_number: i + 1,
    title: `Episode ${i + 1}`,
    thumbnail_url: `https://readdy.ai/api/search-image?query=Anime%20episode%20scene%20from%20${anime.title.replace(/\s+/g, '%20')}%2C%20Studio%20Ghibli%20style%2C%20magical%20atmosphere%2C%20detailed%20animation%20frame%2C%20simple%20background&width=200&height=120&seq=ep${i + 1}&orientation=landscape`,
    duration: anime.duration || 1470 // 24:30 in seconds
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-pink-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative">
        {/* Background Image */}
        {anime.banner_url && (
          <div className="absolute inset-0 h-96 md:h-[500px] lg:h-[600px]">
            <img
              src={anime.banner_url}
              alt={anime.title}
              className="w-full h-full object-cover"
              width={1920}
              height={600}
              loading="eager"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
            <div className="absolute inset-0 backdrop-blur-sm" />
          </div>
        )}
        
        {/* Content */}
        <ErrorBoundary fallback={<ContentError title="Anime Details Error" message="Couldn't load anime details. Please try again." />}>
          <div className="relative z-10 min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex items-end">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                
                {/* Left: Poster */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="lg:col-span-1"
                >
                  <div className="w-64 h-96 mx-auto lg:mx-0 rounded-2xl overflow-hidden shadow-2xl">
                    <img
                      src={anime.poster_url || "https://readdy.ai/api/search-image?query=Anime%20poster&width=300&height=450&seq=anime-poster&orientation=portrait"}
                      alt={anime.title}
                      className="w-full h-full object-cover"
                      width={300}
                      height={450}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = "https://readdy.ai/api/search-image?query=Anime%20poster&width=300&height=450&seq=anime-poster-fallback&orientation=portrait"
                      }}
                    />
                  </div>
                </motion.div>

                {/* Right: Info */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="lg:col-span-2 text-white"
                >
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 leading-tight break-words hyphens-auto overflow-hidden">
                    {anime.title}
                  </h1>
                  
                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/40 shadow-lg">
                      <i className="ri-star-fill text-yellow-400 text-lg"></i>
                      <span className="font-bold text-lg">{anime.rating}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/40 shadow-lg">
                      <i className="ri-calendar-line text-blue-300 text-lg"></i>
                      <span className="font-semibold">{anime.year}</span>
                    </div>
                    {anime.total_episodes && anime.total_episodes > 0 && (
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/40 shadow-lg">
                        <i className="ri-calendar-check-line text-purple-300 text-lg"></i>
                        <span className="font-semibold">{anime.total_episodes} episodes planned</span>
                      </div>
                    )}
                    {anime.status && (
                      <span className={`px-6 py-3 rounded-full text-sm font-bold backdrop-blur-md border border-white/40 shadow-lg ${
                        anime.status === 'completed' 
                          ? 'bg-green-500/60 text-white'
                          : anime.status === 'ongoing'
                          ? 'bg-blue-500/60 text-white'
                          : 'bg-gray-500/60 text-white'
                      }`}>
                        {anime.status.charAt(0).toUpperCase() + anime.status.slice(1)}
                      </span>
                    )}
                  </div>

                  {/* Genres */}
                  {anime.genres && anime.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {anime.genres.map((genre: string, index: number) => {
                        const colors = [
                          'bg-gradient-to-r from-pink-500/80 to-rose-500/80',
                          'bg-gradient-to-r from-blue-500/80 to-cyan-500/80',
                          'bg-gradient-to-r from-green-500/80 to-emerald-500/80',
                          'bg-gradient-to-r from-purple-500/80 to-violet-500/80',
                          'bg-gradient-to-r from-orange-500/80 to-yellow-500/80',
                          'bg-gradient-to-r from-red-500/80 to-pink-500/80',
                          'bg-gradient-to-r from-indigo-500/80 to-blue-500/80',
                          'bg-gradient-to-r from-teal-500/80 to-green-500/80'
                        ];
                        const colorClass = colors[index % colors.length];
                        
                        return (
                          <span
                            key={genre}
                            className={`px-4 py-2 ${colorClass} backdrop-blur-md text-white text-sm rounded-full font-semibold border border-white/50 shadow-lg hover:scale-105 transition-transform duration-200`}
                          >
                            {genre}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Description */}
                  {anime.description && (
                    <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/40 shadow-lg max-w-3xl">
                      <h3 className="text-white/90 text-sm font-semibold uppercase tracking-wider mb-4 opacity-80">
                        Synopsis
                      </h3>
                      <p className="text-white text-base leading-relaxed font-normal tracking-wide">
                        {anime.description.length > 300 
                          ? `${anime.description.substring(0, 300)}...` 
                          : anime.description
                        }
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4">
                    {(anime.episodes && anime.episodes.length > 0) ? (
                      <Link to={generatePlayerUrl(anime.id, watchProgress > 0 ? watchProgress : 1, watchProgress > 0 ? progressSeconds : undefined)}>
                        <motion.div 
                          whileHover={{ 
                            scale: 1.08, 
                            boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)",
                            y: -3
                          }} 
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <Button size="lg" className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-700/90 hover:to-purple-700/90 backdrop-blur-lg text-white px-8 py-4 text-lg font-bold border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                            <motion.i 
                              className="ri-play-fill mr-2"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            ></motion.i>
                            {watchProgress > 0 ? 'Continue Watching' : 'Watch Now'}
                          </Button>
                        </motion.div>
                      </Link>
                    ) : (
                      <motion.div 
                        whileHover={{ 
                          scale: 1.02, 
                          boxShadow: "0 10px 20px rgba(107, 114, 128, 0.2)",
                          y: -1
                        }} 
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      >
                        <Button 
                          size="lg" 
                          disabled
                          className="bg-gradient-to-r from-gray-600/60 to-gray-700/60 backdrop-blur-lg text-white/70 px-8 py-4 text-lg font-bold border border-white/40 shadow-lg cursor-not-allowed opacity-75"
                        >
                          <i className="ri-calendar-line mr-2"></i>
                          Upcoming
                        </Button>
                      </motion.div>
                    )}
                    
                    <motion.div 
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 15px 30px rgba(255, 255, 255, 0.2)",
                        y: -2
                      }} 
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Button 
                        variant="secondary" 
                        size="lg" 
                        onClick={handleWatchlistToggle}
                        className="bg-white/25 backdrop-blur-lg text-white border-white/60 hover:bg-white/35 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <motion.i 
                          className={`mr-2 ${isInWatchlist ? 'ri-check-line' : 'ri-add-line'}`}
                          animate={isInWatchlist ? { rotate: [0, 10, -10, 0] } : {}}
                          transition={{ duration: 0.5 }}
                        ></motion.i>
                        {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                      </Button>
                    </motion.div>

                    <motion.div 
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 15px 30px rgba(255, 255, 255, 0.2)",
                        y: -2
                      }} 
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Button 
                        variant="secondary" 
                        size="lg" 
                        onClick={handleFavoriteToggle}
                        className="bg-white/25 backdrop-blur-lg text-white border-white/60 hover:bg-white/35 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <motion.i 
                          className={`mr-2 ${isFavorite ? 'ri-heart-fill text-red-400' : 'ri-heart-line'}`}
                          animate={isFavorite ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.6 }}
                        ></motion.i>
                        {isFavorite ? 'Favorited' : 'Add to Favorites'}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        </ErrorBoundary>
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Progress Bar Section */}
          {isInWatchlist && watchProgress > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-16"
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
                <div className="flex justify-between text-sm text-teal-600 mb-3 font-medium">
                  <span>Your Progress</span>
                  <span>{watchProgress}/{anime.total_episodes || anime.episodes?.length || 0} episodes</span>
                </div>
                <div className="w-full bg-teal-100 rounded-full h-3">
                  <div 
                    className="bg-teal-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(watchProgress / (anime.total_episodes || anime.episodes?.length || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </motion.section>
          )}

          {/* Episodes Section */}
          <ErrorBoundary fallback={<SectionError title="Episodes Error" message="Couldn't load episodes list. Please try again." />}>
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-16"
            >
            <h2 className="text-2xl md:text-3xl font-bold text-teal-800 mb-8 flex items-center">
              <i className="ri-play-list-line mr-3 text-green-600"></i>
              Episodes
            </h2>
            
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {episodes.map((episode: any) => {
                  const episodeNumber = episode.episode_number || episode.number;
                  const episodeTitle = episode.title || `Episode ${episodeNumber}`;
                  const episodeDuration = episode.duration;
                  
                  return (
                    <motion.div
                      key={episode.id || episodeNumber}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                        selectedEpisode === episodeNumber
                          ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-teal-100 shadow-lg'
                          : episodeNumber <= watchProgress
                          ? 'border-green-300 bg-gradient-to-br from-green-50 to-green-100 shadow-md'
                          : 'border-gray-200 hover:border-teal-300 hover:bg-gradient-to-br hover:from-teal-50 hover:to-teal-100 hover:shadow-md'
                      }`}
                      onClick={() => handleEpisodeClick(episodeNumber)}
                    >
                      <Link to={`/player/${anime.id}/${episodeNumber}`} className="block">
                        <div className="flex items-center space-x-4">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                            selectedEpisode === episodeNumber
                              ? 'bg-teal-500 text-white shadow-lg'
                              : episodeNumber <= watchProgress
                              ? 'bg-green-500 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <i className="ri-play-fill text-xl"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold text-lg text-gray-800 truncate">
                                Episode {episodeNumber}
                              </h4>
                              {episodeNumber <= watchProgress && (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <i className="ri-check-line text-white text-sm"></i>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {episodeTitle}
                            </p>
                            {episodeDuration && (
                              <p className="text-xs text-gray-500 mt-1">
                                {Math.floor(episodeDuration / 60)}:{(episodeDuration % 60).toString().padStart(2, '0')}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.section>
          </ErrorBoundary>

          {/* Trailer Section */}
          <ErrorBoundary fallback={<SectionError title="Trailer Error" message="Couldn't load trailer. Please try again." />}>
            <Suspense fallback={<div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>}>
              <LazyTrailerSection 
                trailerUrl={anime.trailer_url} 
                title={anime.title} 
              />
            </Suspense>
          </ErrorBoundary>

          {/* Related Anime & Seasons */}
          <ErrorBoundary fallback={<SectionError title="Related Anime Error" message="Couldn't load related anime. Please try again." />}>
            <Suspense fallback={<div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>}>
              <LazyRelatedAnime 
                animeId={anime.id} 
                currentTitle={anime.title} 
                currentGenres={anime.genres || []} 
              />
            </Suspense>
          </ErrorBoundary>

          {/* Characters Section */}
          <ErrorBoundary fallback={<SectionError title="Characters Error" message="Couldn't load character information. Please try again." />}>
            <Suspense fallback={<div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>}>
              <LazyAnimeCharacters animeId={anime.id} />
            </Suspense>
          </ErrorBoundary>
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mb-16"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-teal-800 mb-8 flex items-center">
              <i className="ri-heart-line mr-3 text-pink-500"></i>
              You Might Also Like
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {similarAnime.map((similarAnimeItem: any, index: number) => {
                // Map database anime structure to AnimeCard expected structure
                const mappedAnime = {
                  _id: similarAnimeItem.id,
                  title: similarAnimeItem.title,
                  cover: similarAnimeItem.poster_url || "https://readdy.ai/api/search-image?query=Anime%20poster%2C%20default%20anime%20image&width=300&height=400&seq=anime-poster&orientation=portrait",
                  banner: similarAnimeItem.banner_url,
                  rating: similarAnimeItem.rating || 0,
                  year: similarAnimeItem.year || new Date().getFullYear(),
                  totalEpisodes: similarAnimeItem.total_episodes || 1,
                  currentEpisode: 0,
                  genres: similarAnimeItem.genres || [],
                  status: similarAnimeItem.status === 'ongoing' ? 'Ongoing' : 
                          similarAnimeItem.status === 'completed' ? 'Completed' : 
                          similarAnimeItem.status === 'upcoming' ? 'Upcoming' : 'Ongoing' as 'Ongoing' | 'Completed' | 'Upcoming',
                  description: similarAnimeItem.description || '',
                  type: similarAnimeItem.type === 'tv' ? 'TV' :
                        similarAnimeItem.type === 'movie' ? 'Movie' :
                        similarAnimeItem.type === 'ova' ? 'OVA' :
                        similarAnimeItem.type === 'special' ? 'Special' : 'TV' as 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special',
                  studios: similarAnimeItem.studios || [],
                  popularity: 0,
                  views: 0
                };
                
                return (
                  <motion.div
                    key={similarAnimeItem.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                  >
                    <AnimeCard {...mappedAnime} />
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-teal-800 text-white py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: '"Pacifico", serif' }}>
                AnimeStream
              </h3>
              <p className="text-teal-200 leading-relaxed">
                Your magical gateway to the world of anime. Discover, watch, and fall in love with stories that inspire.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Browse</h4>
              <ul className="space-y-3 text-teal-200">
                <li><a href="#" className="hover:text-white transition-colors duration-200 cursor-pointer">Popular</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200 cursor-pointer">Trending</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200 cursor-pointer">New Releases</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200 cursor-pointer">Top Rated</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Genres</h4>
              <ul className="space-y-3 text-teal-200">
                <li><a href="#" className="hover:text-white transition-colors duration-200 cursor-pointer">Action</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200 cursor-pointer">Romance</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200 cursor-pointer">Fantasy</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200 cursor-pointer">Comedy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-teal-200 hover:text-white transition-colors duration-200 cursor-pointer">
                  <i className="ri-twitter-fill text-xl"></i>
                </a>
                <a href="#" className="text-teal-200 hover:text-white transition-colors duration-200 cursor-pointer">
                  <i className="ri-facebook-fill text-xl"></i>
                </a>
                <a href="#" className="text-teal-200 hover:text-white transition-colors duration-200 cursor-pointer">
                  <i className="ri-instagram-fill text-xl"></i>
                </a>
                <a href="#" className="text-teal-200 hover:text-white transition-colors duration-200 cursor-pointer">
                  <i className="ri-discord-fill text-xl"></i>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-teal-700 mt-12 pt-8 text-center text-teal-200">
            <p>&copy; 2024 AnimeStream. All rights reserved. | 
              <a href="https://readdy.ai/?origin=logo" className="hover:text-white transition-colors duration-200 ml-1 cursor-pointer">
                Powered by Readdy
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 bg-teal-600 text-white px-8 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 backdrop-blur-sm"
        >
          <i className="ri-check-line text-lg"></i>
          <span className="font-medium">{showToast}</span>
        </motion.div>
      )}
    </div>
  );
}
