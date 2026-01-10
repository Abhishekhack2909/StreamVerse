import { useState, useEffect } from 'react';
import API from '../../api/axios';
import VideoGrid from '../../components/Video/VideoGrid';
import './LikedVideos.css';

const LikedVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLikedVideos();
  }, []);

  const fetchLikedVideos = async () => {
    try {
      const { data } = await API.get('/likes/videos');
      // Extract video data from likes
      const likedVideos = data.data?.map(like => like.video) || [];
      setVideos(likedVideos.filter(Boolean));
    } catch (error) {
      console.error('Error fetching liked videos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="liked-page">
      <h1>Liked Videos</h1>
      <VideoGrid videos={videos} loading={loading} />
    </div>
  );
};

export default LikedVideos;
