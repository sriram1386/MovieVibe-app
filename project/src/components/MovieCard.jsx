import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRefresh } from '../contexts/RefreshContext';

const MovieCard = ({ movie, isTrending, onMovieSelect }) => {
  const navigate = useNavigate();
  const { triggerRefresh } = useRefresh();

  const handleClick = () => {
    // For trending movies from Appwrite, use movie_id, for TMDB movies use id
    const movieId = isTrending ? movie.movie_id : movie.id;
    
    // Trigger refresh for movie details and trending sections
    triggerRefresh(['movieDetails', 'trending']);
    
    // If onMovieSelect callback is provided, use it
    if (onMovieSelect) {
      onMovieSelect(movieId);
    } else {
      // Fallback to direct navigation
      navigate(`/movie/${movieId}`);
    }
  };

  const posterUrl = isTrending 
    ? movie.poster_url 
    : movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : '/no-movie.png';

  if (isTrending) {
    // Only render trending movies with valid data
    if (!movie || !movie.poster_url || !movie.title) return null;
    return (
      <li
        onClick={handleClick}
        className="cursor-pointer transform transition-all duration-300 hover:scale-105 w-[280px]"
      >
        <div className="relative">
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-[270px] object-cover rounded-lg shadow-lg"
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent rounded-b-lg">
            <h3 className="text-white font-semibold text-lg truncate">{movie.title}</h3>
            <div className="flex items-center justify-between mt-1">
              <p className="text-gray-300 text-sm">
                {movie.release_date ? new Date(movie.release_date).getFullYear() : ''}
              </p>
              <div className="flex items-center gap-1">
                <img src="/star.svg" alt="Rating" className="w-4 h-4" />
                <span className="text-gray-300 text-sm">
                  {movie.vote_average ? movie.vote_average.toFixed(1) : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </li>
    );
  }

  // Render full details for non-trending movies
  return (
    <li
      onClick={handleClick}
      className="cursor-pointer transform transition-all duration-300 hover:scale-105"
    >
      <div className="relative">
        <img
          src={posterUrl}
          alt={movie.title}
          className="w-full h-[450px] object-cover rounded-lg shadow-lg"
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent rounded-b-lg">
          <h3 className="text-white font-semibold text-lg truncate">{movie.title}</h3>
          <div className="flex items-center justify-between mt-1">
            <p className="text-gray-300 text-sm">
              {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
            </p>
            <div className="flex items-center gap-1">
              <img src="/star.svg" alt="Rating" className="w-4 h-4" />
              <span className="text-gray-300 text-sm">
                {movie.vote_average?.toFixed(1) || 'N/A'}
              </span>
            </div>
          </div>
          {movie.original_language && (
            <p className="text-gray-400 text-xs mt-1 uppercase">
              {movie.original_language}
            </p>
          )}
        </div>
      </div>
    </li>
  );
};

export default MovieCard;
