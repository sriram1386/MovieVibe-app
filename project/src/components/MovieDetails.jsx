import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import { database, DATABASE_ID, COLLECTION_ID } from '../appwrite';
import { Query, ID } from 'appwrite';
import StreamingPlatforms from './StreamingPlatforms';
import { API_BASE_URL, API_OPTIONS } from '../config';
import { Link } from 'react-router-dom';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// Helper function to fetch recommended movies with fallback logic
const fetchRecommendedMovies = async (movieId) => {
  const base = `${API_BASE_URL}/movie/${movieId}`;

  // 1. Try recommendations
  try {
    const recResponse = await fetch(`${base}/recommendations`, API_OPTIONS);
    const recData = await recResponse.json();
    if (recData.results?.length > 0) return recData.results;
  } catch (error) { console.error("Error fetching recommendations:", error); /* continue to next fallback */ }

  // 2. Try similar
  try {
    const simResponse = await fetch(`${base}/similar`, API_OPTIONS);
    const simData = await simResponse.json();
    if (simData.results?.length > 0) return simData.results;
  } catch (error) { console.error("Error fetching similar movies:", error); /* continue to next fallback */ }

  // 3. Try collection (This will be handled separately now, but keeping this fallback just in case)
  try {
    const detailsResponse = await fetch(`${base}`, API_OPTIONS);
    const details = await detailsResponse.json();
    if (details.belongs_to_collection) {
      const colId = details.belongs_to_collection.id;
      const colResponse = await fetch(`${API_BASE_URL}/collection/${colId}`, API_OPTIONS);
      const col = await colResponse.json();
      // Filter out the current movie from the collection list
      if (col.parts?.length > 0) return col.parts.filter(m => m.id !== parseInt(movieId)); // Parse movieId as it comes from useParams
    }
  } catch (error) { console.error("Error fetching collection details (fallback):", error); /* continue to next fallback */ }

  // 4. Fallback to genre-based discover
  try {
    const detailsResponse = await fetch(`${base}`, API_OPTIONS);
    const details = await detailsResponse.json();
    if (details.genres?.length > 0) {
      const genreIds = details.genres.map(g => g.id).join(',');
      const byGenreResponse = await fetch(`${API_BASE_URL}/discover/movie?with_genres=${genreIds}`, API_OPTIONS);
      const byGenre = await byGenreResponse.json();
      // Filter out the current movie
      if (byGenre.results?.length > 0) return byGenre.results.filter(m => m.id !== parseInt(movieId)); // Parse movieId
    }
  } catch (error) { console.error("Error fetching genre-based movies:", error); /* continue to next fallback */ }

  // 5. Final fallback — popular
  try {
    const popResponse = await fetch(`${API_BASE_URL}/movie/popular`, API_OPTIONS);
    const pop = await popResponse.json();
    // Filter out the current movie
    if (pop.results?.length > 0) return pop.results.filter(m => m.id !== parseInt(movieId)); // Parse movieId
  } catch (error) { console.error("Error fetching popular movies:", error); }

  return []; // Return empty array if no recommendations are found
};

const MovieDetails = ({ movieId, onClose, onMovieSelect }) => {
  const [movie, setMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [collectionMovies, setCollectionMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [isLoadingCollection, setIsLoadingCollection] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        // Fetch main movie details
        const response = await fetch(
          `${API_BASE_URL}/movie/${movieId}?append_to_response=credits,videos`,
          API_OPTIONS
        );

        if (!response.ok) {
          throw new Error("Failed to fetch movie details");
        }

        const data = await response.json();
        setMovie(data);
        setIsLoading(false);

        // Fetch recommendations using the fallback logic
        setIsLoadingRecommendations(true);
        const recommendedMovies = await fetchRecommendedMovies(movieId);
        // Sort by vote average and take top 8
        const sortedRecommendedMovies = recommendedMovies
          .sort((a, b) => b.vote_average - a.vote_average)
          .slice(0, 8);
        setRecommendations(sortedRecommendedMovies);
        setIsLoadingRecommendations(false);

        // Fetch collection details if available
        if (data.belongs_to_collection) {
          setIsLoadingCollection(true);
          try {
            const collectionResponse = await fetch(
              `${API_BASE_URL}/collection/${data.belongs_to_collection.id}`,
              API_OPTIONS
            );

            if (!collectionResponse.ok) {
              console.error("Failed to fetch collection details:", collectionResponse.status);
              setCollectionMovies([]); // Set to empty array on failure
            } else {
              const collectionData = await collectionResponse.json();
              if (collectionData.parts?.length > 0) {
                // Filter out the current movie and sort by release date
                const filteredAndSortedCollection = collectionData.parts
                  .filter(m => m.id !== parseInt(movieId))
                  .sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
                setCollectionMovies(filteredAndSortedCollection);
              } else {
                 setCollectionMovies([]); // Set to empty array if no parts
              }
            }
          } catch (collectionError) {
            console.error("Error fetching collection details:", collectionError);
            setCollectionMovies([]); // Set to empty array on error
          } finally {
            setIsLoadingCollection(false);
          }
        } else {
          setIsLoadingCollection(false); // No collection, so not loading
        }

      } catch (error) {
        console.error("Error fetching movie data:", error);
        setError("Failed to load movie details or recommendations. Please try again later.");
        setIsLoading(false);
        setIsLoadingRecommendations(false);
        setIsLoadingCollection(false); // Ensure all loading states are false on main error
      }
    };

    fetchMovieData();
  }, [movieId]);

  // Effect to increment open count in Appwrite
  useEffect(() => {
    const incrementOpenCount = async () => {
      try {
        console.log('Attempting to increment open count for movie_id:', parseInt(movieId)); // Debug log
        
        // Find the document for this movie using movie_id
        const response = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
          Query.equal('movie_id', parseInt(movieId)),
        ]);

        console.log('Query response:', response.documents.length, 'documents found'); // Debug log

        if (response.documents.length > 0) {
          // Document exists - update openCount and recalculate trendingScore
          const doc = response.documents[0];
          console.log('Updating existing document:', doc.$id); // Debug log

          const newOpenCount = (doc.openCount || 0) + 1;
          const currentSearchCount = doc.count || 0;
          const newTrendingScore = (currentSearchCount * 2) + newOpenCount;

          await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
            openCount: newOpenCount,
            trendingScore: newTrendingScore,
          });

          console.log('Successfully updated openCount to:', newOpenCount); // Debug log

        } else {
          // Document doesn't exist - attempt to create new complete document
          console.log('No existing document found, attempting to create new one'); // Debug log

          try {
            // First fetch movie details from TMDB
            const movieResponse = await fetch(
              `https://api.themoviedb.org/3/movie/${movieId}`,
              {
                method: "GET",
                headers: {
                  accept: "application/json",
                  Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
                },
              }
            );

            if (movieResponse.ok) {
              const movieData = await movieResponse.json();

              // Attempt to create the document
              await database.createDocument(
                DATABASE_ID,
                COLLECTION_ID,
                ID.unique(), // Use unique ID for creation attempt
                {
                  movie_id: parseInt(movieId), // Ensure it's stored as integer
                  openCount: 1,
                  count: 0, // No searches yet
                  searchTerm: movieData.title, // Use movie title as searchTerm
                  poster_url: `https://image.tmdb.org/t/p/w500${movieData.poster_path}`,
                  trendingScore: 1, // (0 * 2) + 1 = 1
                }
              );
              console.log('Successfully created new document for movie_id:', parseInt(movieId)); // Debug log

            } else {
              console.error('Failed to fetch movie details from TMDB'); // Debug log
            }
          } catch (createError) {
            // If creation failed (possibly due to a race condition creating it simultaneously)
            console.warn('Create document failed, checking if it was a race condition:', createError); // Debug log

            // Perform a check to see if the document now exists
            const raceCheckResponse = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
              Query.equal('movie_id', parseInt(movieId)),
            ]);

            if (raceCheckResponse.documents.length > 0) {
              // Document was created by another call, update it instead
              const existingDoc = raceCheckResponse.documents[0];
              const newOpenCount = (existingDoc.openCount || 0) + 1;
              const currentSearchCount = existingDoc.count || 0;
              const newTrendingScore = (currentSearchCount * 2) + newOpenCount;

              await database.updateDocument(DATABASE_ID, COLLECTION_ID, existingDoc.$id, {
                openCount: newOpenCount,
                trendingScore: newTrendingScore,
              });
              console.log('Updated document that was created during race condition:', existingDoc.$id); // Debug log
            } else {
              // If create failed and the document *still* doesn't exist after re-checking,
              // then it was a different error or a very unusual race. Log the original error.
              console.error("Error handling new document creation after failed create attempt:", createError);
            }
          }
        }
      } catch (err) {
        console.error("Error updating open count in Appwrite:", err);
      }
    };

    if (movieId && movieId !== 'undefined') {
      incrementOpenCount();
    }
  }, [movieId]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      
    };
  }, [onClose]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <Spinner />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-6 rounded-lg max-w-2xl w-full mx-4">
          <p className="text-red-500 text-center">{error || "Movie not found"}</p>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const trailer = movie.videos?.results?.find(
    (video) => video.type === "Trailer" && video.site === "YouTube"
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-start justify-center z-50 overflow-y-auto">
      <div className="w-full min-h-screen bg-gray-900 relative">
        {/* Backdrop Image */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        {/* Added pt-16 to offset content below the fixed navbar */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 pt-16">
          {/* Removed the two-column layout for lg screens */}
          <div className="flex flex-col gap-8">
            {/* Content Column */}
            <div className="w-full">
              {/* Poster */}
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full lg:w-1/3 rounded-lg shadow-2xl mb-8 lg:float-left lg:mr-8"
              />

              {/* Movie Details */}
              <h2 className="text-4xl font-bold text-white mb-4">{movie.title}</h2>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-gray-300">
                  {new Date(movie.release_date).getFullYear()}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-300">{movie.runtime} min</span>
                <span className="text-gray-500">•</span>
                <div className="flex items-center gap-1">
                  <img src="/star.svg" alt="Rating" className="w-5 h-5" />
                  <span className="text-gray-300">{movie.vote_average.toFixed(1)}</span>
                </div>
              </div>

              <p className="text-gray-300 text-lg mb-8 leading-relaxed">{movie.overview}</p>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <Link
                      key={genre.id}
                      to={`/discover/${genre.id}`}
                      className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full text-sm hover:bg-indigo-600 hover:text-white transition-colors duration-300"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Streaming Platforms Section */}
              <div className="mb-8">
                <StreamingPlatforms movieId={movieId} />
              </div>

              {trailer && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-3">Trailer</h3>
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${trailer.key}`}
                      title="Movie Trailer"
                      className="w-full h-full rounded-lg shadow-2xl"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Cast Section */}
              {movie.credits?.cast && movie.credits.cast.length > 0 && (
                <div className="mb-8 mt-8 lg:mt-0 clear-both">
                  <h3 className="text-xl font-semibold text-white mb-3">Cast</h3>
                  <div className="overflow-x-scroll pb-4 hide-scrollbar">
                    <ul className="flex gap-4">
                      {movie.credits.cast.slice(0, 15).map((person) => (
                        <li key={person.id} className="flex-shrink-0 w-32">
                          <div className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors">
                            <div className="relative aspect-[2/3]">
                              <img
                                src={person.profile_path 
                                  ? `https://image.tmdb.org/t/p/w342${person.profile_path}`
                                  : '/no-profile.png'}
                                alt={person.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-2">
                              <p className="text-white font-medium text-sm truncate">{person.name}</p>
                              <p className="text-gray-400 text-xs truncate">{person.character}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Crew Section */}
              {movie.credits?.crew && movie.credits.crew.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-3">Crew</h3>
                  <div className="overflow-x-scroll pb-4 hide-scrollbar">
                    <ul className="flex gap-4">
                      {movie.credits.crew
                        .filter(person => 
                          ['Director', 'Producer', 'Screenplay', 'Story', 'Writer'].includes(person.job)
                        )
                        .slice(0, 15)
                        .map((person) => (
                          <li key={person.id} className="flex-shrink-0 w-32">
                            <div className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors">
                              <div className="relative aspect-[2/3]">
                                <img
                                  src={person.profile_path 
                                    ? `https://image.tmdb.org/t/p/w342${person.profile_path}`
                                    : '/no-movie.png'}
                                  alt={person.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-2">
                                <p className="text-white font-medium text-sm truncate">{person.name}</p>
                                <p className="text-gray-400 text-xs truncate">{person.job}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* More from this Series section */}
              {!isLoadingCollection && collectionMovies.length > 0 && (
                <div className="mt-12">
                   <h3 className="text-2xl font-bold text-gradient mb-6">
                    More from this Series
                  </h3>
                  <div className="overflow-x-scroll pb-4 hide-scrollbar">
                    <ul className="flex gap-4">
                      {collectionMovies.map((colMovie) => (
                         <li
                          key={colMovie.id}
                          onClick={() => onMovieSelect(colMovie.id)}
                          className="flex-shrink-0 w-48 cursor-pointer transform transition-all duration-300 hover:scale-105"
                        >
                          <div className="relative">
                            <img
                              src={colMovie.poster_path ? `https://image.tmdb.org/t/p/w500${colMovie.poster_path}` : '/no-movie.png'}
                              alt={colMovie.title}
                              className="w-full h-72 object-cover rounded-lg shadow-lg"
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent rounded-b-lg">
                              <h3 className="text-white font-semibold text-sm truncate">{colMovie.title}</h3>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* You Might Also Like section */}
              {!isLoadingRecommendations && recommendations.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-2xl font-bold text-gradient mb-6">
                    You Might Also Like
                  </h3>
                  <div className="overflow-x-scroll pb-4 hide-scrollbar">
                    <ul className="flex gap-4">
                      {recommendations.map((recMovie) => (
                        <li
                          key={recMovie.id}
                          onClick={() => onMovieSelect(recMovie.id)}
                          className="flex-shrink-0 w-48 cursor-pointer transform transition-all duration-300 hover:scale-105"
                        >
                          <div className="relative">
                            <img
                              src={recMovie.poster_path ? `https://image.tmdb.org/t/p/w500${recMovie.poster_path}` : '/no-movie.png'}
                              alt={recMovie.title}
                              className="w-full h-72 object-cover rounded-lg shadow-lg"
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent rounded-b-lg">
                              <h3 className="text-white font-semibold text-sm truncate">{recMovie.title}</h3>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails; 