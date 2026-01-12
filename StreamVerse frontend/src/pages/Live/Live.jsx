import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiRadio } from 'react-icons/fi';
import API from '../../api/axios';
import './Live.css';

const Live = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveStreams();
  }, []);

  const fetchLiveStreams = async () => {
    try {
      const { data } = await API.get('/streams/live');
      setStreams(data.data?.streams || []);
    } catch (error) {
      console.error('Error fetching live streams:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="live-page">
        <div className="loading">Loading live streams...</div>
      </div>
    );
  }

  return (
    <div className="live-page">
      <div className="live-header">
        <FiRadio className="live-icon" />
        <h1>Live Now</h1>
      </div>

      {streams.length === 0 ? (
        <div className="no-streams">
          <FiRadio size={48} />
          <h2>No live streams right now</h2>
          <p>Check back later or start your own stream!</p>
          <Link to="/go-live" className="start-stream-btn">
            Go Live
          </Link>
        </div>
      ) : (
        <div className="streams-grid">
          {streams.map((stream) => (
            <Link to={`/live/${stream._id}`} key={stream._id} className="stream-card">
              <div className="stream-thumbnail">
                {stream.thumbnail ? (
                  <img src={stream.thumbnail} alt={stream.title} />
                ) : (
                  <div className="thumbnail-placeholder">
                    <FiRadio size={32} />
                  </div>
                )}
                <div className="stream-badges">
                  <span className="live-badge">LIVE</span>
                  <span className="viewer-badge">
                    <FiUsers /> {stream.viewers}
                  </span>
                </div>
              </div>
              <div className="stream-info">
                <img src={stream.streamer?.avatar} alt="" className="streamer-avatar" />
                <div className="stream-details">
                  <h3>{stream.title}</h3>
                  <p>{stream.streamer?.username}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Live;
