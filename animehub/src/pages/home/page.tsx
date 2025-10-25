import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import Navbar from '../../components/feature/Navbar';
import HeroCarousel from '../../components/feature/HeroCarousel';
import AnimeCard from '../../components/feature/AnimeCard';
import { SparkleLoadingSpinner } from '../../components/base/LoadingSpinner';
import { useFeaturedAnime, useTrendingAnime, usePopularAnime, useAnime } from '../../hooks/useAnime';
import ErrorBoundary from '../../components/ErrorBoundary';
import { SectionError, ContentError } from '../../components/ErrorFallbacks';

/* -------------------------------------------------------------------------- */
/*                             Primary Home Page                              */
/* -------------------------------------------------------------------------- */
export default function Home() {
  // Use the new hooks for data fetching
  const { anime: featuredAnime, loading: featuredLoading } = useFeaturedAnime();
  const { anime: trendingAnime, loading: trendingLoading } = useTrendingAnime();
  const { anime: popularAnime, loading: popularLoading } = usePopularAnime();
  const { anime: recentAnime, loading: recentLoading } = useAnime({ limit: 6, page: 1 });

  // State for delayed loading display
  const [showTrendingSpinner, setShowTrendingSpinner] = useState(false);
  const [showPopularSpinner, setShowPopularSpinner] = useState(false);
  const [showRecentSpinner, setShowRecentSpinner] = useState(false);

  // Show spinner only after 800ms delay
  useEffect(() => {
    if (trendingLoading) {
      const timer = setTimeout(() => setShowTrendingSpinner(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShowTrendingSpinner(false);
    }
  }, [trendingLoading]);

  useEffect(() => {
    if (popularLoading) {
      const timer = setTimeout(() => setShowPopularSpinner(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShowPopularSpinner(false);
    }
  }, [popularLoading]);

  useEffect(() => {
    if (recentLoading) {
      const timer = setTimeout(() => setShowRecentSpinner(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShowRecentSpinner(false);
    }
  }, [recentLoading]);



  // Helper function to map database anime to HeroCarousel format
  const mapAnimeToHeroSlide = useMemo(() => (anime: any) => ({
    id: anime.id,
    title: anime.title,
    description: anime.description || 'An amazing anime adventure awaits!',
    image: anime.banner_url || anime.poster_url || "https://readdy.ai/api/search-image?query=Anime%20banner%2C%20default%20anime%20image&width=1200&height=600&seq=hero-banner&orientation=landscape",
    genres: anime.genres || [],
    rating: anime.rating || 0
  }), []);

  // Helper function to map database anime to AnimeCard format
  const mapAnimeToCard = useMemo(() => (anime: any) => {
    const mapped = {
      _id: anime.id,
      title: anime.title,
      cover: anime.poster_url || "https://readdy.ai/api/search-image?query=Anime%20poster%2C%20default%20anime%20image&width=300&height=400&seq=anime-poster&orientation=portrait",
      banner: anime.banner_url,
      rating: anime.rating || 0,
      year: anime.year || new Date().getFullYear(),
      totalEpisodes: anime.total_episodes || 1,
      currentEpisode: 0,
      genres: anime.genres || [],
      status: anime.status === 'ongoing' ? 'Ongoing' : 
              anime.status === 'completed' ? 'Completed' : 
              anime.status === 'upcoming' ? 'Upcoming' : 'Ongoing' as 'Ongoing' | 'Completed' | 'Upcoming',
      description: anime.description || '',
      type: anime.type === 'tv' ? 'TV' :
            anime.type === 'movie' ? 'Movie' :
            anime.type === 'ova' ? 'OVA' :
            anime.type === 'special' ? 'Special' : 'TV' as 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special',
      studios: anime.studios || [],
      popularity: 0,
      views: 0
    };
    
    return mapped;
  }, []);

  // Memoize the mapped data to prevent unnecessary re-renders
  const featuredSlides = useMemo(() => 
    featuredAnime.map(mapAnimeToHeroSlide), 
    [featuredAnime, mapAnimeToHeroSlide]
  );

  const trendingCards = useMemo(() => 
    trendingAnime.map(mapAnimeToCard), 
    [trendingAnime, mapAnimeToCard]
  );

  const popularCards = useMemo(() => 
    popularAnime.map(mapAnimeToCard), 
    [popularAnime, mapAnimeToCard]
  );

  const recentCards = useMemo(() => 
    recentAnime.map(mapAnimeToCard), 
    [recentAnime, mapAnimeToCard]
  );

  // Calculate average rating from featured anime (more efficient than fetching all anime)
  const averageRating = useMemo(() => {
    const allAnimeForRating = [...featuredAnime, ...trendingAnime, ...popularAnime];
    if (!allAnimeForRating || allAnimeForRating.length === 0) return 0;
    const validRatings = allAnimeForRating.filter(anime => anime.rating && anime.rating > 0);
    if (validRatings.length === 0) return 0;
    const sum = validRatings.reduce((acc, anime) => acc + (anime.rating || 0), 0);
    return Math.round((sum / validRatings.length) * 10) / 10; // Round to 1 decimal place
  }, [featuredAnime, trendingAnime, popularAnime]);

  // Calculate total anime count from available data
  const totalAnimeCount = useMemo(() => {
    return featuredAnime.length + trendingAnime.length + popularAnime.length + recentAnime.length;
  }, [featuredAnime.length, trendingAnime.length, popularAnime.length, recentAnime.length]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  // Loading spinner component with sparkle effect
  const LoadingCard = ({ text = "Loading anime..." }: { text?: string }) => (
    <div className="bg-white/80 rounded-xl shadow-md overflow-hidden border border-white/20 flex items-center justify-center">
      <div className="aspect-[3/4] w-full flex flex-col items-center justify-center p-4">
        <SparkleLoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-pink-50">
      <Navbar />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <ErrorBoundary fallback={<SectionError title="Hero Section Error" message="The featured anime carousel couldn't load." />}>
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-16"
            >
              <HeroCarousel 
                slides={featuredSlides} 
                loading={featuredLoading}
              />
            </motion.section>
          </ErrorBoundary>

          {/* Quick Stats Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 text-center"
              >
                <div className="text-3xl mb-2">📺</div>
                <div className="text-2xl font-bold text-teal-800">{totalAnimeCount || 0}</div>
                <div className="text-gray-600 text-sm">Total Anime</div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 text-center"
              >
                <div className="text-3xl mb-2">🔥</div>
                <div className="text-2xl font-bold text-orange-600">{trendingAnime.length}</div>
                <div className="text-gray-600 text-sm">Trending Now</div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 text-center"
              >
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-2xl font-bold text-yellow-600">{averageRating || 'N/A'}</div>
                <div className="text-gray-600 text-sm">Avg Rating</div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 text-center"
              >
                <div className="text-3xl mb-2">🎬</div>
                <div className="text-2xl font-bold text-purple-600">24/7</div>
                <div className="text-gray-600 text-sm">Streaming</div>
              </motion.div>
            </div>
          </motion.section>

          {/* Trending Now */}
          <ErrorBoundary fallback={<ContentError title="Trending Anime Error" message="Couldn't load trending anime. Please try again." />}>
            <motion.section
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mb-16"
            >
            <motion.div 
              variants={itemVariants}
              className="mb-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-bold text-teal-800 flex items-center">
                  <i className="ri-fire-line mr-3 text-pink-500"></i>
                  Trending Now
                </h2>
                <Link 
                  to="/anime?filter=trending"
                  className="text-teal-600 hover:text-teal-800 font-medium flex items-center text-sm transition-colors"
                >
                  View All <i className="ri-arrow-right-line ml-1"></i>
                </Link>
              </div>
              <div className="h-1 w-20 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full mt-2"></div>
            </motion.div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {showTrendingSpinner ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <LoadingCard key={index} text="Loading trending anime..." />
                ))
              ) : (
                trendingCards.map((anime, index) => (
                  <motion.div
                    key={anime._id}
                    variants={itemVariants}
                    custom={index}
                  >
                    <AnimeCard {...anime} showTrendingBadge />
                  </motion.div>
                ))
              )}
            </div>
          </motion.section>
          </ErrorBoundary>

          {/* Popular Anime */}
          <ErrorBoundary fallback={<ContentError title="Popular Anime Error" message="Couldn't load popular anime. Please try again." />}>
            <motion.section
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mb-16"
            >
            <motion.div 
              variants={itemVariants}
              className="mb-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-bold text-teal-800 flex items-center">
                  <i className="ri-star-line mr-3 text-yellow-500"></i>
                  Popular Anime
                </h2>
                <Link 
                  to="/anime?filter=popular"
                  className="text-teal-600 hover:text-teal-800 font-medium flex items-center text-sm transition-colors"
                >
                  View All <i className="ri-arrow-right-line ml-1"></i>
                </Link>
              </div>
              <div className="h-1 w-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mt-2"></div>
            </motion.div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {showPopularSpinner ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <LoadingCard key={index} text="Loading popular anime..." />
                ))
              ) : (
                popularCards.map((anime, index) => (
                  <motion.div
                    key={anime._id}
                    variants={itemVariants}
                    custom={index}
                  >
                    <AnimeCard {...anime} />
                  </motion.div>
                ))
              )}
            </div>
          </motion.section>
          </ErrorBoundary>

          {/* Recently Added */}
          <ErrorBoundary fallback={<ContentError title="Recent Anime Error" message="Couldn't load recent anime. Please try again." />}>
            <motion.section
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mb-16"
            >
            <motion.div 
              variants={itemVariants}
              className="mb-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-bold text-teal-800 flex items-center">
                  <i className="ri-add-circle-line mr-3 text-green-600"></i>
                  Recently Added
                </h2>
                <Link 
                  to="/anime?filter=recent"
                  className="text-teal-600 hover:text-teal-800 font-medium flex items-center text-sm transition-colors"
                >
                  View All <i className="ri-arrow-right-line ml-1"></i>
                </Link>
              </div>
              <div className="h-1 w-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full mt-2"></div>
            </motion.div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {showRecentSpinner ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <LoadingCard key={index} text="Loading recent anime..." />
                ))
              ) : (
                recentCards.map((anime, index) => (
                  <motion.div
                    key={anime._id}
                    variants={itemVariants}
                    custom={index}
                  >
                    <AnimeCard {...anime} showNewBadge />
                  </motion.div>
                ))
              )}
            </div>
          </motion.section>
          </ErrorBoundary>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-teal-800 via-teal-900 to-teal-800 text-white py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                  <i className="ri-play-fill text-white"></i>
                </div>
                <span className="text-xl font-bold font-pacifico">AnimeStream</span>
              </div>
              <p className="text-teal-200 mb-6 max-w-md">
                Your ultimate destination for streaming the best anime series and movies. 
                Discover new favorites and enjoy unlimited entertainment.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-teal-700 rounded-full flex items-center justify-center hover:bg-teal-600 transition-colors">
                  <i className="ri-facebook-fill"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-teal-700 rounded-full flex items-center justify-center hover:bg-teal-600 transition-colors">
                  <i className="ri-twitter-fill"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-teal-700 rounded-full flex items-center justify-center hover:bg-teal-600 transition-colors">
                  <i className="ri-instagram-fill"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-teal-700 rounded-full flex items-center justify-center hover:bg-teal-600 transition-colors">
                  <i className="ri-discord-fill"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/anime" className="text-teal-200 hover:text-white transition-colors">Browse Anime</Link></li>
                <li><Link to="/search" className="text-teal-200 hover:text-white transition-colors">Search</Link></li>
                <li><Link to="/watchlist" className="text-teal-200 hover:text-white transition-colors">My Watchlist</Link></li>
                <li><Link to="/favorites" className="text-teal-200 hover:text-white transition-colors">Favorites</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link to="/help" className="text-teal-200 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="text-teal-200 hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/privacy" className="text-teal-200 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-teal-200 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-teal-700 mt-8 pt-8 text-center">
            <p className="text-teal-300">
              © 2024 AnimeStream. All rights reserved. Made with ❤️ for anime lovers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}