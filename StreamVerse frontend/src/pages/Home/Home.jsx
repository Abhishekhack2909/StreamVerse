import { useState, useEffect } from 'react';
import API from '../../api/axios';
import VideoGrid from '../../components/Video/VideoGrid';
import './Home.css';

const categories = [
  'All', 'Music', 'Gaming', 'News', 'Sports', 'Entertainment', 
  'Education', 'Science', 'Technology', 'Comedy', 'Film', 'Travel'
];

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      console.log('🎬 Fetching videos from:', API.defaults.baseURL + '/videos');
      const { data } = await API.get('/videos');
      console.log('✅ Videos response:', data);
      setVideos(data.data?.videos || data.data?.docs || data.data || []);
    } catch (error) {
      console.error('❌ Error fetching videos:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoDelete = (videoId) => {
    setVideos(videos.filter(v => v._id !== videoId));
  };

  return (
    <div className="home">
      <div className="category-chips">
        {categories.map((category) => (
          <button
            key={category}
            className={`chip ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <VideoGrid videos={videos} loading={loading} onVideoDelete={handleVideoDelete} />
    </div>
  );
};

export default Home;
