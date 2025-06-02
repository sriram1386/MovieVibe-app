import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MovieDetails from '../components/MovieDetails';

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const MovieDetailsPage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();

  return (
    <MovieDetails
      movieId={movieId}
      onClose={() => navigate(-1)}
      onMovieSelect={(movieId) => navigate(`/movie/${movieId}`)}
    />
  );
};

export default MovieDetailsPage; 