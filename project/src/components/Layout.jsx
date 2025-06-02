import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const { isDarkMode, toggleTheme } = useTheme();
  const searchRef = useRef(null);

  const toggleSearchVisibility = () => {
    setIsSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      setLocalSearchTerm('');
      // Focus the input after a short delay to allow for animation
      setTimeout(() => {
        searchRef.current?.focus();
      }, 100);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (localSearchTerm.trim()) {
      navigate(`/search/${encodeURIComponent(localSearchTerm.trim())}`);
      setIsSearchVisible(false);
      setLocalSearchTerm('');
    }
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSearchVisible && searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchVisible(false);
        setLocalSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchVisible]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-indigo-50/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-indigo-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-indigo-900 dark:text-white">
                MovieVibe
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to="/" className="text-indigo-900 dark:text-white hover:text-indigo-600 dark:hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                  Home
                </Link>
                <Link to="/discover" className="text-indigo-900 dark:text-white hover:text-indigo-600 dark:hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                  Discover
                </Link>
                <Link to="/about" className="text-indigo-900 dark:text-white hover:text-indigo-600 dark:hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                  About
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Search Container */}
              <div className="relative flex items-center" ref={searchRef}>
                <div className={`relative flex items-center transition-all duration-300 ease-in-out ${isSearchVisible ? 'w-64' : 'w-0'}`}>
                  <form onSubmit={handleSearchSubmit} className="w-full">
                    <input
                      type="text"
                      value={localSearchTerm}
                      onChange={(e) => setLocalSearchTerm(e.target.value)}
                      placeholder="Search for movies..."
                      className={`w-full px-4 py-2 pl-10 text-indigo-900 dark:text-white bg-indigo-50 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-400 transition-all duration-300 ${
                        isSearchVisible ? 'opacity-100 visible' : 'opacity-0 invisible'
                      }`}
                      style={{ minWidth: isSearchVisible ? '16rem' : '0' }}
                    />
                    <svg
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400 dark:text-gray-400 transition-opacity duration-300 ${
                        isSearchVisible ? 'opacity-100' : 'opacity-0'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </form>
                </div>
                <button
                  type="button"
                  onClick={toggleSearchVisibility}
                  className={`p-2 rounded-lg text-indigo-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-gray-800 transition-colors ${
                    isSearchVisible ? 'bg-indigo-100 dark:bg-gray-800' : ''
                  }`}
                  aria-label="Toggle search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 hover:bg-indigo-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-indigo-900" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="pt-16">
        <div className="pattern"></div>
        <div className="wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout; 