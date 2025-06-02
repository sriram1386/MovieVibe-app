import React from 'react';
import GenreList from "../components/GenreList";
// import GenrePage from "../components/GenrePage"; // No longer rendered directly here

// DiscoverPage will now primarily render the GenreList
const DiscoverPage = ({ /* Remove selectedGenre and onGenreSelect props */ }) => {
  return (
    // GenrePage will be rendered by the router on /discover/:genreId
    <GenreList />
  );
};

export default DiscoverPage; 