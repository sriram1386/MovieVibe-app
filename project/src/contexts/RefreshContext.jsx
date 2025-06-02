import React, { createContext, useContext, useState, useCallback } from 'react';

const RefreshContext = createContext(null);

// Debug logger for refresh events
const logRefreshEvent = (event, sections) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Refresh] ${event}:`, sections);
  }
};

export const RefreshProvider = ({ children }) => {
  // Counter to force re-renders when needed
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Track which sections need refreshing
  const [refreshFlags, setRefreshFlags] = useState({
    trending: true,
    discover: true,
    search: true,
    genres: true,
    movieDetails: true,
    category: true, // Added for Popular, Top Rated, etc.
    home: true     // Added for home page sections
  });

  // Function to trigger a refresh for specific sections
  const triggerRefresh = useCallback((sections = ['all']) => {
    logRefreshEvent('Triggering refresh for sections', sections);
    
    if (sections.includes('all')) {
      // Refresh everything
      setRefreshFlags(prev => ({
        trending: true,
        discover: true,
        search: true,
        genres: true,
        movieDetails: true,
        category: true,
        home: true
      }));
    } else {
      // Refresh only specified sections
      setRefreshFlags(prev => {
        const newFlags = { ...prev };
        sections.forEach(section => {
          if (section in newFlags) {
            newFlags[section] = true;
          }
        });
        return newFlags;
      });
    }
    // Increment counter to force re-renders
    setRefreshCounter(prev => prev + 1);
  }, []);

  // Function to mark a section as refreshed
  const markRefreshed = useCallback((section) => {
    logRefreshEvent('Marking section as refreshed', section);
    setRefreshFlags(prev => ({
      ...prev,
      [section]: false
    }));
  }, []);

  // Function to check if a section needs refreshing
  const needsRefresh = useCallback((section) => {
    const needs = refreshFlags[section] || false;
    if (needs) {
      logRefreshEvent('Section needs refresh', section);
    }
    return needs;
  }, [refreshFlags]);

  const value = {
    refreshCounter,
    triggerRefresh,
    markRefreshed,
    needsRefresh,
    refreshFlags
  };

  return (
    <RefreshContext.Provider value={value}>
      {children}
    </RefreshContext.Provider>
  );
};

// Custom hook to use the refresh context
export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
}; 