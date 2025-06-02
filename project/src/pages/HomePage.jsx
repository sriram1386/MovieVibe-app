import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Search from "../components/search";
import MovieCard from "../components/MovieCard";
import Spinner from "../components/Spinner";
import { useTheme } from '../contexts/ThemeContext';

const HomePage = ({
  movieList,
  errorMessage,
  isLoading,
  loadingRef,
  trendingMovies
}) => {
  const navigate = useNavigate();
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const { isDarkMode } = useTheme();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (localSearchTerm.trim()) {
      navigate(`/search/${encodeURIComponent(localSearchTerm.trim())}`);
      setLocalSearchTerm('');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent dark:from-gray-900/10"></div>
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-indigo-900 dark:text-white mb-6">
            Welcome to Movie
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Vibe
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-indigo-800 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Discover, explore, and immerse yourself in the world of cinema. Your ultimate destination for movie recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/discover"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            >
              Start Exploring
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Animated elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 dark:bg-blue-400/10 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500/10 dark:bg-purple-400/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-500/10 dark:bg-pink-400/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <header className="relative min-h-[60vh] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent animate-pulse"></div>
          <div className="absolute inset-0">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl px-4 mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-indigo-900 dark:text-white mb-8">
            Find the Films You'll Actually <span className="text-gradient">Vibe</span> With, No Stress
          </h1>

          <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl mx-auto">
            <Search searchTerm={localSearchTerm} setSearchTerm={setLocalSearchTerm} />
          </form>
        </div>
      </header>

      {trendingMovies.length > 0 && !localSearchTerm && (
        <section className="trending mb-12">
          <h2 className="text-2xl font-bold text-gradient mb-6">Trending Movies</h2>
          <div className="relative">
            <div className="overflow-x-auto pb-4">
              <ul className="flex gap-4">
                {trendingMovies.map((movie, index) => (
                  <div key={movie.id} className="relative">
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient rounded-full flex items-center justify-center text-white font-bold z-10">
                      {index + 1}
                    </div>
                    <MovieCard movie={movie} isTrending={true} />
                  </div>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="all-movies">
        <h2 className="text-2xl font-bold text-gradient mb-6">All Movies</h2>

        {errorMessage ? (
          <p className="text-red-500">{errorMessage}</p>
        ) : (
          <>
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
            <div ref={loadingRef} className="h-10 flex justify-center items-center mt-4">
              {isLoading && <Spinner />}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default HomePage; 