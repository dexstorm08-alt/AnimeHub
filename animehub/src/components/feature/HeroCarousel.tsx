
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../base/Button';

interface HeroSlide {
  id: string;
  title: string;
  description: string;
  image: string;
  genres: string[];
  rating: number;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  loading?: boolean;
}

const HeroCarousel = React.memo(function HeroCarousel({ slides, loading = false }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || !slides.length) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length, isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Show loading state
  if (loading || !slides.length) {
    return (
      <div className="relative h-96 md:h-[500px] overflow-hidden rounded-2xl bg-gray-200 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"></div>
        <div className="absolute bottom-8 left-8 right-8">
          <div className="h-8 bg-gray-300 rounded mb-4 w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="flex gap-4 mt-6">
            <div className="h-12 bg-gray-300 rounded w-32"></div>
            <div className="h-12 bg-gray-300 rounded w-28"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <div 
      className="relative h-96 md:h-[500px] overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img
            src={currentSlideData.image}
            alt={currentSlideData.title}
            className="w-full h-full object-cover object-top"
            loading="eager"
            width={1920}
            height={1080}
            decoding="sync"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            key={`content-${currentSlide}`}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-lg"
          >
            <div className="flex flex-wrap gap-2 mb-4">
              {currentSlideData.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-yellow-400/90 text-teal-800 text-sm rounded-full font-medium backdrop-blur-sm"
                >
                  {genre}
                </span>
              ))}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              {currentSlideData.title}
            </h1>

            <p className="text-gray-200 text-lg mb-6 line-clamp-3 drop-shadow-md">
              {currentSlideData.description}
            </p>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1 text-yellow-400">
                <i className="ri-star-fill"></i>
                <span className="text-white font-medium">{currentSlideData.rating}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Link to={`/player/${currentSlideData.id}/1`}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="bg-teal-700 hover:bg-teal-600">
                    <i className="ri-play-fill mr-2"></i>
                    Watch Now
                  </Button>
                </motion.div>
              </Link>
              
              <Link to={`/anime/${currentSlideData.id}`}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="lg" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30">
                    <i className="ri-information-line mr-2"></i>
                    More Info
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
      >
        <i className="ri-arrow-left-line text-xl"></i>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
      >
        <i className="ri-arrow-right-line text-xl"></i>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentSlide 
                ? 'bg-white scale-125' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </div>
  );
});

export default HeroCarousel;
