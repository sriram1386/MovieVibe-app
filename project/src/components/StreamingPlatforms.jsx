import React, { useEffect, useState } from 'react';
import { API_BASE_URL, API_OPTIONS } from '../config';

const StreamingPlatforms = ({ movieId }) => {
  const [platforms, setPlatforms] = useState([]);
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlatforms = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/movie/${movieId}/watch/providers`,
          API_OPTIONS
        );

        if (!response.ok) {
          throw new Error('Failed to fetch streaming platforms');
        }

        const data = await response.json();
        const indiaData = data.results?.IN || {};
        
        setPlatforms(indiaData.flatrate || []);
        setLink(indiaData.link || '');
      } catch (err) {
        console.error('Failed to load platforms:', err);
        setError('Unable to load streaming information');
        setPlatforms([]);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchPlatforms();
    }
  }, [movieId]);

  if (loading) {
    return (
      <div className="text-gray-400 text-sm animate-pulse">
        Loading streaming platforms...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (!platforms.length) {
    return (
      <div className="text-gray-400 text-sm">
        Streaming platform info not available
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h4 className="text-lg font-semibold text-white mb-2">Available on:</h4>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {platforms.map((platform) => (
          <div key={platform.provider_id} className="flex-shrink-0">
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity"
              >
                <img
                  src={`https://image.tmdb.org/t/p/original${platform.logo_path}`}
                  alt={platform.provider_name}
                  className="w-12 h-12 object-contain bg-gray-800 rounded-lg p-1"
                  loading="lazy"
                />
              </a>
            ) : (
              <img
                src={`https://image.tmdb.org/t/p/original${platform.logo_path}`}
                alt={platform.provider_name}
                className="w-12 h-12 object-contain bg-gray-800 rounded-lg p-1"
                loading="lazy"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StreamingPlatforms; 