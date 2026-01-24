
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/feature/Navbar';
import AnimeCard from '../../components/feature/AnimeCard';
import Button from '../../components/base/Button';
import SmartVideoPlayer from '../../components/player/SmartVideoPlayer';
import { SparkleLoadingSpinner } from '../../components/base/LoadingSpinner';
import useAnimePlayer from '../../hooks/useAnimePlayer';
import { useAnimeById, useSimilarAnime } from '../../hooks/useAnime';
import { useAuthContext } from '../../contexts/AuthContext';
import type { VideoSource } from '../../services/videoService';
import ErrorBoundary from '../../components/ErrorBoundary';
import { VideoPlayerError } from '../../components/ErrorFallbacks';

export default function PlayerPage() {
  const { animeId, episode } = useParams<{ animeId: string; episode: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuthContext();
  
  const currentEpisode = parseInt(episode || '1');
  const [sources, setSources] = useState<VideoSource[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [initialTime, setInitialTime] = useState(0);

  const { getEpisodeSources, updateWatchProgress, getWatchProgress } = useAnimePlayer();
  const { anime, loading: animeLoading } = useAnimeById(animeId || '', user?.id);
  
  // Memoize genres to prevent infinite loops
  const memoizedGenres = useMemo(() => anime?.genres || [], [anime?.genres?.join(',')]);
  
  const { anime: similarAnime, loading: similarLoading } = useSimilarAnime(
    animeId || '', 
    memoizedGenres, 
    6
  );

  // Handle player events
  const handleTimeUpdate = (currentTime: number, _duration: number) => {
    setCurrentTime(currentTime);
  };

  const handlePlay = () => {
    console.log('Video started playing');
  };

  const handlePause = () => {
    console.log('Video paused');
  };

  const handleEnded = () => {
    console.log('Video ended');
  };

  const handleError = (error: string) => {
    console.error('Video player error:', error);
  };

  // Handle progress restoration from URL params or saved progress
  useEffect(() => {
    const restoreProgress = async () => {
      if (!animeId || !episode) return;

      // Check for progress in URL params (from continue watching)
      const progressParam = searchParams.get('progress');
      if (progressParam) {
        const progressSeconds = parseInt(progressParam);
        if (!isNaN(progressSeconds) && progressSeconds > 0) {
          setInitialTime(progressSeconds);
          return;
        }
      }

      // Check if this is a "continue watching" request (has continue=true param)
      const isContinueWatching = searchParams.get('continue') === 'true';
      
      if (isContinueWatching) {
        // For continue watching, get saved progress from database/localStorage
        try {
          const savedProgress = await getWatchProgress(animeId, parseInt(episode));
          if (savedProgress > 0) {
            setInitialTime(savedProgress);
          }
        } catch (error) {
          console.warn('Failed to get saved progress:', error);
        }
      } else {
        // For direct episode clicks, start from beginning
        setInitialTime(0);
      }
    };

    restoreProgress();
  }, [animeId, episode, searchParams, getWatchProgress]);

  useEffect(() => {
    const fetchVideoSources = async () => {
      if (!animeId || !episode) return;
      
      console.log('Fetching video sources for:', animeId, 'episode:', episode);
      
      try {
        const episodeData = await getEpisodeSources(animeId, parseInt(episode));
        setSources(episodeData.sources);
        console.log('Video sources loaded:', episodeData.sources);
      } catch (err) {
        console.error('Error fetching video sources:', err);
      }
    };

    fetchVideoSources();

    // Save progress periodically
    const progressInterval = setInterval(() => {
      if (currentTime > 0 && animeId && episode) {
        updateWatchProgress(animeId, parseInt(episode), Math.floor(currentTime))
          .catch(console.error);
      }
    }, 30000); // Save every 30 seconds

    return () => {
      clearInterval(progressInterval);
    };
  }, [animeId, episode, getEpisodeSources, updateWatchProgress, currentTime]);

  // Generate episodes for navigation with fallback
  const episodes = useMemo(() => {
    if (!anime) return [];
    
    if (anime.episodes && anime.episodes.length > 0) {
      return anime.episodes.map((ep: any, index: number) => {
        // Ensure we have a valid episode object
        if (!ep || typeof ep !== 'object') {
          return {
            number: index + 1,
            title: `Episode ${index + 1}`
          };
        }
        
        return {
          number: ep.episode_number || ep.number || (index + 1),
          title: ep.title || `Episode ${ep.episode_number || ep.number || (index + 1)}`
        };
      });
    }
    
    // Fallback: generate episodes based on total_episodes
    const totalEpisodes = anime.total_episodes || 1;
    return Array.from({ length: totalEpisodes }, (_, i) => ({
      number: i + 1,
      title: `Episode ${i + 1}`
    }));
  }, [anime]);





  if (animeLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-pink-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <SparkleLoadingSpinner size="xl" text="Loading anime..." />
          </div>
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-pink-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-16 max-w-md mx-auto border border-white/50">
              <i className="ri-error-warning-line text-7xl text-teal-300 mb-6"></i>
              <h2 className="text-2xl font-bold text-teal-800 mb-4">Anime not found</h2>
              <Link to="/anime">
                <Button size="lg">Browse Anime</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-pink-50">
      <Navbar />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb Navigation */}
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-3 text-sm text-teal-600">
              <Link to="/" className="hover:text-teal-700 transition-colors duration-200 cursor-pointer">
                <i className="ri-home-line mr-1"></i>
                Home
              </Link>
              <i className="ri-arrow-right-s-line text-teal-500"></i>
              <Link to="/anime" className="hover:text-teal-700 transition-colors duration-200 cursor-pointer">
                Anime
              </Link>
              <i className="ri-arrow-right-s-line text-teal-500"></i>
              <Link to={`/anime/${animeId}`} className="hover:text-teal-700 transition-colors duration-200 cursor-pointer">
                {anime.title}
              </Link>
              <i className="ri-arrow-right-s-line text-teal-500"></i>
              <span className="text-teal-700 font-medium">Episode {currentEpisode}</span>
            </div>
          </motion.nav>

          {/* Video Player */}
          <ErrorBoundary fallback={<VideoPlayerError title="Video Player Error" message="The video player encountered an error. This might be due to network issues or an unsupported video format." />}>
            <motion.div
              key={`${animeId}-${currentEpisode}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video mb-12"
            >
              <SmartVideoPlayer
                key={`${animeId}-${currentEpisode}`}
                sources={sources}
                animeId={animeId!}
                episodeNumber={currentEpisode}
                title={`${anime.title} - Episode ${currentEpisode}`}
                onTimeUpdate={handleTimeUpdate}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
                onError={handleError}
                autoPlay={true}
                startTime={initialTime}
                className="w-full h-full"
              />
            </motion.div>
          </ErrorBoundary>

          {/* Episode List */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-teal-800 mb-8 flex items-center">
              <i className="ri-play-list-line mr-3 text-green-600"></i>
              Episodes
            </h2>
            
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3" style={{ contentVisibility: 'auto', containIntrinsicSize: '1000px' }}>
                {episodes.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-teal-600">No episodes available</p>
                  </div>
                ) : (
                  episodes.map((ep: any) => {
                    // Safety check to ensure ep is a valid object with required properties
                    if (!ep || typeof ep !== 'object' || !ep.number || !ep.title) {
                      console.warn('Invalid episode object:', ep);
                      return null;
                    }
                    
                    return (
                      <Link
                        key={ep.number}
                        to={`/player/${animeId}/${ep.number}`}
                        className={`block p-3 rounded-lg transition-all duration-200 cursor-pointer text-center ${
                          ep.number === currentEpisode
                            ? 'bg-teal-600 text-white shadow-lg transform scale-105'
                            : 'bg-teal-50 text-teal-800 hover:bg-teal-100 hover:shadow-md border border-teal-200 hover:transform hover:scale-105'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                            ep.number === currentEpisode
                              ? 'bg-white/20'
                              : 'bg-teal-100'
                          }`}>
                            <i className={`ri-play-fill text-sm ${
                              ep.number === currentEpisode
                                ? 'text-white'
                                : 'text-teal-600'
                            }`}></i>
                          </div>
                          <p className="text-xs font-semibold truncate w-full">{ep.number}</p>
                        </div>
                      </Link>
                    );
                  }).filter(Boolean)
                )}
              </div>
            </div>
          </motion.section>

          {/* Anime Info */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-12"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
              <div className="flex items-start space-x-8">
                <img
                  src={anime.poster_url || `https://readdy.ai/api/search-image?query=Anime%20poster%20${anime.title}%2C%20Studio%20Ghibli%20style%2C%20beautiful%20artwork%2C%20detailed%20illustration&width=300&height=450&seq=player-poster&orientation=portrait`}
                  alt={anime.title}
                  className="w-32 h-44 object-cover object-top rounded-xl flex-shrink-0"
                  width={128}
                  height={176}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://readdy.ai/api/search-image?query=Anime%20poster%20${anime.title}%2C%20Studio%20Ghibli%20style%2C%20beautiful%20artwork%2C%20detailed%20illustration&width=300&height=450&seq=player-poster-fallback&orientation=portrait`;
                  }}
                />
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold text-teal-800 mb-4">{anime.title}</h3>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {anime.genres?.map((genre: string) => (
                      <span
                        key={genre}
                        className="px-3 py-2 bg-pink-200 text-teal-800 text-sm rounded-full font-medium"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-teal-600 mb-4">
                    <span className="flex items-center gap-2">
                      <i className="ri-star-fill text-yellow-500"></i>
                      <span className="font-semibold">{anime.rating || 'N/A'}</span>
                    </span>
                    <span className="font-medium">{anime.release_year}</span>
                    <span className="font-medium">{anime.total_episodes || anime.episodes?.length || 0} episodes</span>
                  </div>
                  <p className="text-teal-700 leading-relaxed text-lg">
                    {anime.description || `Experience the magical world of ${anime.title}, a captivating story that will transport you to enchanting realms filled with wonder and adventure.`}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Similar Anime */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-teal-800 mb-8 flex items-center">
              <i className="ri-heart-line mr-3 text-pink-500"></i>
              Similar Anime
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {similarLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-white/80 rounded-xl p-4 animate-pulse border border-white/20">
                    <div className="aspect-[3/4] bg-teal-100 rounded-lg mb-3"></div>
                    <div className="h-4 bg-teal-200 rounded mb-2"></div>
                    <div className="h-3 bg-teal-200 rounded w-2/3"></div>
                  </div>
                ))
              ) : similarAnime.length > 0 ? (
                similarAnime.map((similarAnimeItem: any, index: number) => {
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
                })
              ) : (
                <div className="col-span-full text-center py-8">
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 border border-white/50">
                    <i className="ri-movie-2-line text-4xl text-teal-400 mb-4"></i>
                    <h4 className="text-teal-800 font-semibold mb-2">No Similar Anime Found</h4>
                    <p className="text-teal-600 text-sm mb-4">
                      We couldn't find anime with similar genres
                    </p>
                    <Link
                      to="/anime"
                      className="inline-block px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors cursor-pointer"
                    >
                      Browse All Anime
                    </Link>
                  </div>
                </div>
              )}
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

    </div>
  );
}
