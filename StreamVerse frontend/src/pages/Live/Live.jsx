import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUsers, FiRadio, FiTrash2 } from 'react-icons/fi';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './Live.css';

const Live = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const handleDelete = async (e, streamId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to end this stream/meeting?')) return;
    
    try {
      await API.delete(`/streams/${streamId}`);
      setStreams(prev => prev.filter(s => s._id !== streamId));
    } catch (error) {
      console.error('Error deleting stream:', error);
      alert('Failed to delete stream');
    }
  };

  const handleStreamClick = (e, stream) => {
    e.preventDefault();
    // If it's a meeting (mode === 'meet'), go to StreamMeet
    if (stream.mode === 'meet') {
      navigate(`/streammeet/${stream._id}`);
    } else {
      navigate(`/live/${stream._id}`);
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
          <Link to="/streammeet" className="start-stream-btn">
            Go Live
          </Link>
        </div>
      ) : (
        <div className="streams-grid">
          {streams.map((stream) => (
            <div 
              key={stream._id} 
              className="stream-card"
              onClick={(e) => handleStreamClick(e, stream)}
            >
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
                    <FiUsers /> {stream.viewers || 0}
                  </span>
                </div>
                {user && stream.streamer?._id === user._id && (
                  <button 
                    className="delete-stream-btn"
                    onClick={(e) => handleDelete(e, stream._id)}
                    title="End stream"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
              <div className="stream-info">
                <img src={stream.streamer?.avatar} alt="" className="streamer-avatar" />
                <div className="stream-details">
                  <h3>{stream.title}</h3>
                  <p>{stream.streamer?.username}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Live;
