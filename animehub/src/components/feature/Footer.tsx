
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-teal-800 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4" style={{ fontFamily: '"Pacifico", serif' }}>
              AnimeStream
            </h3>
            <p className="text-teal-200">
              Your magical gateway to the world of anime. Discover, watch, and fall in love with stories that inspire.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Browse</h4>
            <ul className="space-y-2 text-teal-200">
              <li><Link to="/anime" className="hover:text-white transition-colors duration-200">Popular</Link></li>
              <li><Link to="/trending" className="hover:text-white transition-colors duration-200">Trending</Link></li>
              <li><Link to="/anime" className="hover:text-white transition-colors duration-200">New Releases</Link></li>
              <li><Link to="/anime" className="hover:text-white transition-colors duration-200">Top Rated</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Genres</h4>
            <ul className="space-y-2 text-teal-200">
              <li><a href="#" className="hover:text-white transition-colors duration-200">Action</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Romance</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Fantasy</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Comedy</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-teal-200 hover:text-white transition-colors duration-200">
                <i className="ri-twitter-fill text-xl"></i>
              </a>
              <a href="#" className="text-teal-200 hover:text-white transition-colors duration-200">
                <i className="ri-facebook-fill text-xl"></i>
              </a>
              <a href="#" className="text-teal-200 hover:text-white transition-colors duration-200">
                <i className="ri-instagram-fill text-xl"></i>
              </a>
              <a href="#" className="text-teal-200 hover:text-white transition-colors duration-200">
                <i className="ri-discord-fill text-xl"></i>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-teal-700 mt-8 pt-8 text-center text-teal-200">
          <p>&copy; 2024 AnimeStream. All rights reserved. | 
            <a href="https://readdy.ai/?origin=logo" className="hover:text-white transition-colors duration-200 ml-1">
              Powered by Readdy
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
