import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../api/axios';
import VideoGrid from '../../components/Video/VideoGrid';
import './Search.css';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      searchVideos();
    }
  }, [query]);

  const searchVideos = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/videos?query=${encodeURIComponent(query)}`);
      setVideos(data.data.docs || data.data || []);
    } catch (error) {
      console.error('Error searching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <h1>Search results for "{query}"</h1>
      <VideoGrid videos={videos} loading={loading} />
    </div>
  );
};

export default Search;
