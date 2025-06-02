import React, { useState, useEffect, useRef } from 'react';
import Spinner from './Spinner';
import { Link } from 'react-router-dom';

// TMDB API config (assuming these are accessible, maybe from a config file)
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

// Default fallback image URL
const DEFAULT_FALLBACK_IMAGE = '/no-movie.png'; // Assuming you have a default image at public/no-movie.png

// Async function to fetch a cover image for a genre, avoiding duplicates
const fetchGenreCoverImage = async (genre, usedPathsSet) => {
  try {
    const endpoint = `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&vote_average.gte=6.0&with_genres=${genre.id}&language=en`;
    const response = await fetch(endpoint, API_OPTIONS);

    if (!response.ok) {
      console.error(`Failed to fetch movies for genre ${genre.name}:`, response.status);
      return DEFAULT_FALLBACK_IMAGE;
    }

    const data = await response.json();

    let selectedMovie = null;
    let selectedPath = null;

    // 1. Find first movie with a unique poster_path
    for (const movie of data.results) {
      if (movie.poster_path && !usedPathsSet.has(movie.poster_path)) {
        selectedMovie = movie;
        selectedPath = movie.poster_path;
        usedPathsSet.add(selectedPath); // Add to set as soon as it's selected
        break;
      }
    }

    // 2. If no unique poster, find first with a unique backdrop_path
    if (!selectedMovie) {
       console.warn(`No unique poster found for genre ${genre.name}. Trying backdrop_path.`);
      for (const movie of data.results) {
        if (movie.backdrop_path && !usedPathsSet.has(movie.backdrop_path)) {
          selectedMovie = movie;
          selectedPath = movie.backdrop_path;
           usedPathsSet.add(selectedPath); // Add to set
          break;
        }
      }
    }

    // 3. If still no suitable unique image, return fallback
    if (!selectedMovie) {
      console.warn(`No unique poster or backdrop found for genre: ${genre.name}. Using fallback.`);
      return DEFAULT_FALLBACK_IMAGE;
    }

    // Return the URL for the selected image
    const imageUrl = selectedMovie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`
      : `https://image.tmdb.org/t/p/w500${selectedMovie.backdrop_path}`;
      
     return imageUrl;

  } catch (error) {
    console.error(`Error fetching cover image for genre ${genre.name}:`, error);
    return DEFAULT_FALLBACK_IMAGE;
  }
};

const GenreList = ({ onGenreSelect, selectedGenre }) => {
  const [genreCovers, setGenreCovers] = useState({});
  const [isLoadingCovers, setIsLoadingCovers] = useState(true);
  // Ref to track used image paths across fetches
  const usedPosterPathsRef = useRef(new Set());

  useEffect(() => {
    const loadGenreCovers = async () => {
      setIsLoadingCovers(true);
      const covers = {};
      // Clear the set before starting a new load, in case the effect re-runs (though dependency array is empty)
      usedPosterPathsRef.current.clear(); 

      for (const genre of genres) {
        // Pass the Set to the fetching function
        covers[genre.id] = await fetchGenreCoverImage(genre, usedPosterPathsRef.current);
      }
      setGenreCovers(covers);
      setIsLoadingCovers(false);
    };

    loadGenreCovers();
  }, []); // Empty dependency array means this effect runs once on mount

  // Optional: Display a loading indicator while covers are fetching
  if (isLoadingCovers) {
    return <div className="flex justify-center py-8"><Spinner /></div>; // Assuming Spinner is available
  }

  return (
    <div className="py-8 px-4">
      <h2 className="text-3xl font-bold text-gradient mb-8 text-center">Discover by Genre</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {genres.map((genre) => (
          <Link
            key={genre.id}
            to={`/discover/${genre.id}`}
            className={`relative h-48 rounded-xl overflow-hidden group transition-all duration-300 transform hover:scale-105 ${''}`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
            <img
              // Use the fetched cover image, or the default fallback if not loaded yet or failed
              src={genreCovers[genre.id] || DEFAULT_FALLBACK_IMAGE}
              alt={genre.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white text-xl font-bold text-center">{genre.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GenreList; 