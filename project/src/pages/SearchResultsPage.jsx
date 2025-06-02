import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import Spinner from '../components/Spinner';
import { updateSearchCount } from '../appwrite'; // Import the updateSearchCount function

// Helper functions for relevance scoring
const calculateTitleMatchScore = (query, title) => {
  const normalizedQuery = query.toLowerCase();
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle === normalizedQuery) return 1.0;
  if (normalizedTitle.startsWith(normalizedQuery)) return 0.9;
  if (normalizedTitle.includes(normalizedQuery)) return 0.7;
  
  // Simple fuzzy match - count matching characters
  const queryChars = new Set(normalizedQuery.split(''));
  const matchingChars = normalizedTitle.split('').filter(char => queryChars.has(char)).length;
  const fuzzyScore = matchingChars / normalizedQuery.length;
  return Math.max(0.3, Math.min(0.6, fuzzyScore));
};

const calculateRecencyScore = (releaseDate) => {
  if (!releaseDate) return 0.5; // Default score for missing dates
  
  const currentYear = new Date().getFullYear();
  const releaseYear = new Date(releaseDate).getFullYear();
  const yearDiff = currentYear - releaseYear;
  return 1 - Math.min(yearDiff / 10, 1); // Max cap at 10 years
};

const calculateRelevanceScore = (movie, query, minPopularity, maxPopularity) => {
  const titleMatchScore = calculateTitleMatchScore(query, movie.title);
  
  // Normalize popularity
  const normalizedPopularity = (movie.popularity - minPopularity) / (maxPopularity - minPopularity);
  
  // Calculate recency score
  const recencyScore = calculateRecencyScore(movie.release_date);
  
  // Weighted sum
  return (titleMatchScore * 0.5) + (normalizedPopularity * 0.3) + (recencyScore * 0.2);
};

const SearchResultsPage = ({ API_BASE_URL, API_OPTIONS }) => {
  const { query } = useParams();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setIsLoading(true);
      setError(null);
      setSearchResults([]);

      if (!query) {
        setIsLoading(false);
        return;
      }

      try {
        // Step 1: Search multi endpoint to get both movies and people
        const multiEndpoint = `${API_BASE_URL}/search/multi?query=${encodeURIComponent(query)}`;
        const multiResponse = await fetch(multiEndpoint, API_OPTIONS);

        if (!multiResponse.ok) {
          throw new Error(`Error fetching search results: ${multiResponse.statusText}`);
        }

        const multiData = await multiResponse.json();
        
        // Filter results by media type
        let movieResults = multiData.results.filter(r => r.media_type === "movie");
        const personResults = multiData.results.filter(r => r.media_type === "person");

        // Step 2: Get top movies for each matched person
        for (const person of personResults) {
          try {
            const creditsEndpoint = `${API_BASE_URL}/person/${person.id}/movie_credits`;
            const creditsResponse = await fetch(creditsEndpoint, API_OPTIONS);
            
            if (creditsResponse.ok) {
              const creditsData = await creditsResponse.json();
              
              // Take most popular movies they've acted in
              const actedIn = creditsData.cast
                .sort((a, b) => (b.popularity * b.vote_average) - (a.popularity * a.vote_average))
                .slice(0, 5); // top 5 relevant

              movieResults.push(...actedIn);
            }
          } catch (personError) {
            console.error(`Error fetching movies for person ${person.id}:`, personError);
            // Continue with other people even if one fails
          }
        }

        // Step 3: De-duplicate movies by ID
        const uniqueMovies = Object.values(
          movieResults.reduce((acc, movie) => {
            if (!acc[movie.id]) acc[movie.id] = movie;
            return acc;
          }, {})
        );

        if (uniqueMovies.length > 0) {
          // Calculate min and max popularity for normalization
          const popularities = uniqueMovies.map(movie => movie.popularity);
          const minPopularity = Math.min(...popularities);
          const maxPopularity = Math.max(...popularities);

          // Calculate relevance scores and sort
          const scoredResults = uniqueMovies.map(movie => ({
            ...movie,
            relevanceScore: calculateRelevanceScore(movie, query, minPopularity, maxPopularity)
          }));

          // Sort by combined relevance score and popularity
          const sortedResults = scoredResults.sort((a, b) => 
            (b.relevanceScore * b.popularity * b.vote_average) - 
            (a.relevanceScore * a.popularity * a.vote_average)
          );

          setSearchResults(sortedResults);

          // Update search count for the most relevant result
          try {
            // Find the most relevant movie result
            const mostRelevantMovie = sortedResults[0];
            
            // If we have a person match, try to find their most popular movie
            if (personResults.length > 0) {
              const person = personResults[0]; // Get the first matching person
              const creditsEndpoint = `${API_BASE_URL}/person/${person.id}/movie_credits`;
              const creditsResponse = await fetch(creditsEndpoint, API_OPTIONS);
              
              if (creditsResponse.ok) {
                const creditsData = await creditsResponse.json();
                const topMovie = creditsData.cast
                  .sort((a, b) => (b.popularity * b.vote_average) - (a.popularity * a.vote_average))[0];
                
                if (topMovie) {
                  await updateSearchCount(query, topMovie);
                  console.log(`Updated search count for actor's top movie: "${query}" -> "${topMovie.title}"`);
                  return;
                }
              }
            }
            
            // If no person match or couldn't get their movies, use the most relevant movie
            await updateSearchCount(query, mostRelevantMovie);
            console.log(`Updated search count for query: "${query}" -> "${mostRelevantMovie.title}"`);
          } catch (appwriteError) {
            console.error("Error updating search count in Appwrite:", appwriteError);
          }
        } else {
          setSearchResults([]);
          setError('No movies found matching your search.');
        }
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError('Failed to fetch search results. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, API_BASE_URL, API_OPTIONS]);

  const handleMovieSelect = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  return (
    <div className="py-8 px-4">
      <h2 className="text-3xl font-bold text-gradient mb-8 text-center">
        Search Results for "{decodeURIComponent(query || '')}"
      </h2>

      {isLoading && (
        <div className="flex justify-center py-8"><Spinner /></div>
      )}

      {error && !isLoading && (
        <p className="text-red-500 text-center">{error}</p>
      )}

      {!isLoading && !error && searchResults.length > 0 && (
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {searchResults.map((movie) => (
            <MovieCard 
              key={movie.id} 
              movie={movie} 
              onMovieSelect={handleMovieSelect}
            />
          ))}
        </ul>
      )}

      {!isLoading && !error && searchResults.length === 0 && query && (
        <p className="text-yellow-500 text-center">No movies found for "{decodeURIComponent(query)}".</p>
      )}
    </div>
  );
};

export default SearchResultsPage; 