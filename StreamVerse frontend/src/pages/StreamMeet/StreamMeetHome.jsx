import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiVideo, FiUsers, FiMonitor, FiLink, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './StreamMeetHome.css';

const StreamMeetHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    if (!joinCode.trim()) {
      setError('Please enter a meeting code or link');
      return;
    }
    
    // Extract room ID from URL or code
    let roomId = joinCode.trim();
    
    // Handle full URLs
    if (joinCode.includes('/streammeet/')) {
      const parts = joinCode.split('/streammeet/');
      roomId = parts[1]?.split('?')[0]?.split('/')[0];
    }
    
    // Handle just the code
    if (roomId) {
      navigate(`/streammeet/${roomId}`);
    } else {
      setError('Invalid meeting code');
    }
  };

  const startMeeting = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/streammeet/new?mode=meet');
  };

  const startStream = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/streammeet/new?mode=stream');
  };

  return (
    <div className="streammeet-home">
      <div className="hero-section">
        <h1>StreamMeet</h1>
        <p>Video meetings and live streaming for everyone</p>
      </div>

      <div className="action-cards">
        <div className="action-card meet">
          <div className="card-icon">
            <FiUsers />
          </div>
          <h2>Start a Meeting</h2>
          <p>Create an instant video meeting and invite others to join</p>
          <button onClick={startMeeting} className="card-btn">
            New Meeting <FiArrowRight />
          </button>
        </div>

        <div className="action-card stream">
          <div className="card-icon">
            <FiMonitor />
          </div>
          <h2>Go Live</h2>
          <p>Start streaming to your audience with screen share support</p>
          <button onClick={startStream} className="card-btn">
            Start Stream <FiArrowRight />
          </button>
        </div>
      </div>

      <div className="join-section">
        <div className="join-card">
          <FiLink className="join-icon" />
          <h3>Join with a code</h3>
          <div className="join-input-group">
            <input
              type="text"
              placeholder="Enter meeting code or link"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <button onClick={handleJoin}>Join</button>
          </div>
          {error && <span className="join-error">{error}</span>}
        </div>
      </div>

      <div className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature">
            <FiVideo />
            <h4>HD Video</h4>
            <p>Crystal clear video quality for all participants</p>
          </div>
          <div className="feature">
            <FiMonitor />
            <h4>Screen Share</h4>
            <p>Share your screen with one click</p>
          </div>
          <div className="feature">
            <FiUsers />
            <h4>Group Calls</h4>
            <p>Connect with multiple people at once</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamMeetHome;
