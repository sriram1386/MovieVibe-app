import React, { useState, useEffect, useRef, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { getTrendingMovies, updateSearchCount } from "./appwrite";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import DiscoverPage from "./pages/DiscoverPage";
import AboutUs from "./components/AboutUs";
import MovieDetailsPage from "./pages/MovieDetailsPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import GenrePage from "./components/GenrePage";
import { RefreshProvider, useRefresh } from "./contexts/RefreshContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import GlobalClickRefresh from "./contexts/GlobalClickRefresh";
import { API_BASE_URL, API_OPTIONS } from "./config";

// Component to handle route changes and trigger refreshes
const RouteChangeHandler = ({ children }) => {
  const location = useLocation();
  const { triggerRefresh } = useRefresh();

  useEffect(() => {
    // Trigger refresh when route changes
    triggerRefresh(['all']);
  }, [location.pathname, triggerRefresh]);

  return children;
};

const App = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState(null);
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
    setErrorMessage("");
    try {
      const endpoint = `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&page=${pageNum}`;

      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data = await response.json();

      if (data.results.length === 0 && pageNum === 1) {
        setErrorMessage("No movies found.");
        setMovieList([]);
        setHasMore(false);
        return;
      }

      setMovieList(prevMovies => 
        pageNum === 1 ? data.results : [...prevMovies, ...data.results]
      );
      setHasMore(data.page < data.total_pages);

    } catch (error) {
      console.error("Error fetching movies:", error);
      setErrorMessage("Failed to fetch movies. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre);
  };

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
    }
  };

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  useEffect(() => {
    fetchMovies(page);
  }, [page]);

  const pageProps = {
    movieList,
    errorMessage,
    isLoading,
    loadingRef,
    trendingMovies,
    selectedGenre,
    onGenreSelect: handleGenreSelect,
  };

  return (
    <Router>
      <ThemeProvider>
        <RefreshProvider>
          <GlobalClickRefresh />
          <RouteChangeHandler>
            <Layout>
              <Routes>
                <Route
                  path="/"
                  element={<HomePage {...pageProps} />}
                />
                <Route
                  path="/discover"
                  element={<DiscoverPage {...pageProps} />}
                />
                <Route 
                  path="/discover/:genreId"
                  element={<GenrePage API_BASE_URL={API_BASE_URL} API_OPTIONS={API_OPTIONS} />}
                />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/movie/:movieId" element={<MovieDetailsPage />} />
                <Route path="/search/:query" element={<SearchResultsPage API_BASE_URL={API_BASE_URL} API_OPTIONS={API_OPTIONS} />} />
              </Routes>
            </Layout>
          </RouteChangeHandler>
        </RefreshProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
