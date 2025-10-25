
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/feature/Navbar';
import AnimeCard from '../../components/feature/AnimeCard';
import Input from '../../components/base/Input';
import Button from '../../components/base/Button';
import { useAnime, useGenres } from '../../hooks/useAnime';

export default function AnimePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const { genres, loading: genresLoading } = useGenres();
  const { anime, loading: animeLoading, totalPages, total } = useAnime({
    page: currentPage,
    limit: itemsPerPage,
    genre: selectedGenre || undefined,
    search: searchQuery || undefined
  });

  // Helper function to map database anime to AnimeCard format
  const mapAnimeToCard = (animeItem: any) => ({
    _id: animeItem.id,
    title: animeItem.title,
    cover: animeItem.poster_url || "https://readdy.ai/api/search-image?query=Anime%20poster%20default&width=300&height=400&seq=browse-poster&orientation=portrait",
    banner: animeItem.banner_url,
    rating: animeItem.rating || 0,
    year: animeItem.release_year || new Date().getFullYear(),
    totalEpisodes: animeItem.total_episodes || 1,
    currentEpisode: 0,
    genres: animeItem.genres || [],
    status: animeItem.status === 'ongoing' ? 'Ongoing' : 
            animeItem.status === 'completed' ? 'Completed' : 
            animeItem.status === 'upcoming' ? 'Upcoming' : 'Ongoing' as 'Ongoing' | 'Completed' | 'Upcoming',
    description: animeItem.description || '',
    type: animeItem.type === 'tv' ? 'TV' :
          animeItem.type === 'movie' ? 'Movie' :
          animeItem.type === 'ova' ? 'OVA' :
          animeItem.type === 'special' ? 'Special' : 'TV' as 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special',
    studios: animeItem.studios || [],
    popularity: 0,
    views: 0
  });

  // Update current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenre]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-pink-50">
      <Navbar />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-teal-800 mb-4 flex items-center">
              <i className="ri-movie-2-line mr-3 text-green-600"></i>
              Anime Collection
            </h1>
            <p className="text-teal-600 text-lg">Discover magical stories and enchanting adventures</p>
          </motion.div>

          {/* Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="sticky top-20 z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-8 mb-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search anime titles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-12 text-sm"
                  />
                  <i className="ri-search-line absolute right-4 top-1/2 transform -translate-y-1/2 text-teal-600 pointer-events-none text-lg"></i>
                </div>
              </div>

              {/* Genre Filter */}
              <div className="relative">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full px-4 py-3 pr-12 text-sm bg-white/95 backdrop-blur-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 cursor-pointer appearance-none font-medium"
                >
                  <option value="">All Genres</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line absolute right-4 top-1/2 transform -translate-y-1/2 text-teal-600 pointer-events-none text-lg"></i>
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 pr-12 text-sm bg-white/95 backdrop-blur-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 cursor-pointer appearance-none font-medium"
                >
                  <option value="title">Sort by Title</option>
                  <option value="rating">Sort by Rating</option>
                  <option value="year">Sort by Year</option>
                </select>
                <i className="ri-arrow-down-s-line absolute right-4 top-1/2 transform -translate-y-1/2 text-teal-600 pointer-events-none text-lg"></i>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-6 text-sm text-teal-600 font-medium bg-teal-50 px-4 py-2 rounded-lg inline-block">
              Showing {anime.length} of {total} anime
            </div>
          </motion.div>

          {/* Anime Grid */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-16"
          >
            {animeLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {[...Array(12)].map((_, index) => (
                  <div key={index} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/50">
                    <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : anime.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {anime.map((animeItem, index) => (
                  <motion.div
                    key={animeItem.id}
                    variants={itemVariants}
                    custom={index}
                  >
                    <AnimeCard {...mapAnimeToCard(animeItem)} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-16 max-w-md mx-auto border border-white/50">
                  <i className="ri-search-line text-7xl text-teal-300 mb-6"></i>
                  <h3 className="text-2xl font-semibold text-teal-800 mb-4">No anime found</h3>
                  <p className="text-teal-600 text-lg">Try adjusting your search or filter criteria</p>
                </div>
              </motion.div>
            )}
          </motion.section>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center items-center space-x-3 md:space-x-4"
            >
              <Button
                variant="ghost"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3"
              >
                <i className="ri-arrow-left-line mr-2"></i>
                Previous
              </Button>

              <div className="flex space-x-2">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-xl font-semibold transition-all duration-200 text-sm md:text-base cursor-pointer ${
                        page === currentPage
                          ? 'bg-teal-700 text-white shadow-lg scale-105'
                          : 'bg-white/95 text-teal-700 hover:bg-teal-100 border border-green-200 hover:scale-105'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="ghost"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3"
              >
                Next
                <i className="ri-arrow-right-line ml-2"></i>
              </Button>
            </motion.div>
          )}
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
