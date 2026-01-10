import { useState, useEffect } from 'react';
import API from '../../api/axios';
import VideoGrid from '../../components/Video/VideoGrid';
import './History.css';

const History = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await API.get('/users/history');
      setVideos(data.data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="history-page">
      <h1>Watch History</h1>
      <VideoGrid videos={videos} loading={loading} />
    </div>
  );
};

export default History;
