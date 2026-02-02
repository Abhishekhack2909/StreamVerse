import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUsers, FiRadio, FiVideo, FiUpload, FiPlay, FiGlobe } from 'react-icons/fi';
import API from '../../api/axios';
import { getPopularVideos } from '../../api/pexels';
import VideoGrid from '../../components/Video/VideoGrid';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

const categories = [
  'All', 'Music', 'Gaming', 'News', 'Sports', 'Entertainment', 
  'Education', 'Science', 'Technology', 'Comedy', 'Film', 'Travel'
];

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [streams, setStreams] = useState([]);
  const [exploreVideos, setExploreVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVideos();
    fetchLiveStreams();
    fetchExploreVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data } = await API.get('/videos');
      setVideos(data.data?.videos || data.data?.docs || data.data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveStreams = async () => {
    try {
      const { data } = await API.get('/streams/live');
      setStreams(data.data?.streams || []);
    } catch (error) {
      console.error('Error fetching streams:', error);
    }
  };

  const fetchExploreVideos = async () => {
    try {
      const pexelsVideos = await getPopularVideos(8);
      setExploreVideos(pexelsVideos);
    } catch (error) {
      console.error('Error fetching explore videos:', error);
    }
  };

  const handleVideoDelete = (videoId) => {
    setVideos(videos.filter(v => v._id !== videoId));
  };

  const handleStreamClick = (stream) => {
    if (stream.mode === 'meet') {
      navigate(`/streammeet/${stream._id}`);
    } else {
      navigate(`/live/${stream._id}`);
    }
  };

  const handleExploreVideoClick = (video) => {
    // Open Pexels video in new tab or play inline
    window.open(video.pexelsUrl, '_blank');
  };

  const trendingVideos = [...videos].sort((a, b) => b.views - a.views).slice(0, 6);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">StreamVerse</h1>
          <p className="hero-tagline">Watch, Stream, Meet - All in One</p>
          <div className="hero-actions">
            <Link to="/streammeet" className="hero-btn hero-btn-primary">
              <FiUsers /> Start Meeting
            </Link>
            <Link to="/streammeet" className="hero-btn hero-btn-secondary">
              <FiRadio /> Go Live
            </Link>
            {user && (
              <Link to="/upload" className="hero-btn hero-btn-outline">
                <FiUpload /> Upload Video
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Live Now Section */}
      {streams.length > 0 && (
        <section className="section live-section">
          <div className="section-header">
            <h2><FiRadio className="section-icon" /> Live Now</h2>
            <Link to="/live" className="see-all">See all</Link>
          </div>
          <div className="live-scroll">
            {streams.map((stream) => (
              <div 
                key={stream._id} 
                className="live-card"
                onClick={() => handleStreamClick(stream)}
              >
                <div className="live-avatar">
                  <img src={stream.streamer?.avatar} alt={stream.streamer?.username} />
                  <span className="live-badge">LIVE</span>
                </div>
                <div className="live-info">
                  <h4>{stream.title}</h4>
                  <p>{stream.streamer?.username}</p>
                  <span className="live-viewers"><FiUsers /> {stream.viewers || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Category Chips */}
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

      {/* Trending Videos Section */}
      {trendingVideos.length > 0 && (
        <section className="section trending-section">
          <div className="section-header">
            <h2><FiPlay className="section-icon" /> Trending Videos</h2>
            <Link to="/trending" className="see-all">See all</Link>
          </div>
          <div className="trending-scroll">
            {trendingVideos.map((video) => (
              <Link to={`/watch/${video._id}`} key={video._id} className="trending-card">
                <div className="trending-thumbnail">
                  <img src={video.thumbnail} alt={video.title} />
                  <span className="trending-duration">
                    {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                  </span>
                </div>
                <div className="trending-info">
                  <h4>{video.title}</h4>
                  <p>{video.owner?.username}</p>
                  <span className="trending-views">{video.views} views</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Explore Section - Pexels Videos */}
      {exploreVideos.length > 0 && (
        <section className="section explore-section">
          <div className="section-header">
            <h2><FiGlobe className="section-icon explore-icon" /> Explore</h2>
            <span className="pexels-credit">Powered by Pexels</span>
          </div>
          <div className="explore-grid">
            {exploreVideos.map((video) => (
              <div 
                key={video._id} 
                className="explore-card"
                onClick={() => handleExploreVideoClick(video)}
              >
                <div className="explore-thumbnail">
                  <img src={video.thumbnail} alt={video.title} />
                  <div className="explore-overlay">
                    <FiPlay className="play-icon" />
                  </div>
                  <span className="explore-duration">
                    {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                  </span>
                  <span className="explore-badge">Pexels</span>
                </div>
                <div className="explore-info">
                  <h4>{video.title}</h4>
                  <p>by {video.owner?.username}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Videos */}
      <section className="section">
        <div className="section-header">
          <h2><FiVideo className="section-icon" /> Recent Videos</h2>
        </div>
        <VideoGrid videos={videos} loading={loading} onVideoDelete={handleVideoDelete} />
      </section>
    </div>
  );
};

export default Home;
