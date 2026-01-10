import { useState, useEffect } from 'react';
import API from '../../api/axios';
import VideoGrid from '../../components/Video/VideoGrid';
import './Home.css';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data } = await API.get('/videos');
      console.log('Videos response:', data);
      // Backend returns { data: { videos: [...], pagination: {...} } }
      setVideos(data.data?.videos || data.data?.docs || data.data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
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
      <VideoGrid videos={videos} loading={loading} onVideoDelete={handleVideoDelete} />
    </div>
  );
};

export default Home;
