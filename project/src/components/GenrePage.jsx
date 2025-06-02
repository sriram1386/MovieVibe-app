import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import MovieCard from './MovieCard';
import Spinner from './Spinner';

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const genres = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' }
];

const SORT_OPTIONS = [
  { label: 'Rating (High to Low)', value: 'vote_average.desc' },
  { label: 'Rating (Low to High)', value: 'vote_average.asc' },
  { label: 'Release Year (Newest)', value: 'release_date.desc' },
  { label: 'Release Year (Oldest)', value: 'release_date.asc' },
];

const GenrePage = ({ API_BASE_URL, API_OPTIONS }) => {
  const { genreId: genreIdParam } = useParams();
  const genreId = parseInt(genreIdParam);

  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('vote_average.desc');

  const currentGenre = genres.find(g => g.id === genreId);
  const genreName = currentGenre ? currentGenre.name : 'Unknown Genre';

  const observer = useRef();
  const loadingRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  const fetchMovies = async (pageNum = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const endpoint = `${API_BASE_URL}/discover/movie?with_genres=${genreId}&sort_by=${sortBy}&vote_count.gte=100&page=${pageNum}`;
      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data = await response.json();

      if (data.results.length === 0 && pageNum === 1) {
        setError('No movies found');
        setMovies([]);
        setHasMore(false);
        return;
      }

      setMovies(prevMovies => 
        pageNum === 1 ? data.results : [...prevMovies, ...data.results]
      );
      setHasMore(data.page < data.total_pages);
    } catch (error) {
      console.error("Error fetching movies:", error);
      setError("Failed to fetch movies. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setMovies([]);
    setHasMore(true);
    if (genreId) {
      fetchMovies(1);
    }
  }, [genreId, sortBy, API_BASE_URL, API_OPTIONS]);

  useEffect(() => {
    if (page > 1) {
      fetchMovies(page);
    }
  }, [page, genreId, sortBy, API_BASE_URL, API_OPTIONS]);

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gradient">{genreName} Movies</h1>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 transition-colors"
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </ul>
          <div ref={loadingRef} className="h-10 flex justify-center items-center mt-4">
            {isLoading && <Spinner />}
          </div>
        </>
      )}
    </div>
  );
};

export default GenrePage; 