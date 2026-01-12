import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiThumbsUp, FiThumbsDown, FiShare2, FiDownload } from 'react-icons/fi';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { formatViews, formatDistanceToNow, formatDate } from '../../utils/helpers';
import Comments from '../../components/Comments/Comments';
import './Watch.css';

const Watch = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    fetchVideo();
    fetchRecommended();
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      const { data } = await API.get(`/videos/${videoId}`);
      setVideo(data.data);
      setLiked(data.data?.isLiked || false);
      setSubscribed(data.data?.owner?.isSubscribed || false);
    } catch (error) {
      console.error('Error fetching video:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommended = async () => {
    try {
      const { data } = await API.get('/videos?limit=10');
      const videos = data.data?.videos || data.data?.docs || data.data || [];
      setRecommended(videos.filter(v => v._id !== videoId));
    } catch (error) {
      console.error('Error fetching recommended:', error);
    }
  };

  const handleLike = async () => {
    if (!user || likeLoading) return;
    setLikeLoading(true);
    try {
      const { data } = await API.post(`/likes/toggle/v/${videoId}`);
      const newLiked = data.data?.isLiked ?? !liked;
      setLiked(newLiked);
      setVideo(prev => ({
        ...prev,
        likesCount: newLiked ? (prev.likesCount || 0) + 1 : Math.max((prev.likesCount || 0) - 1, 0)
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user || !video?.owner || subLoading) return;
    setSubLoading(true);
    try {
      const { data } = await API.post(`/subscriptions/c/${video.owner._id}`);
      const newSubscribed = data.data?.subscribed ?? !subscribed;
      setSubscribed(newSubscribed);
      setVideo(prev => ({
        ...prev,
        owner: {
          ...prev.owner,
          subscribersCount: newSubscribed 
            ? (prev.owner?.subscribersCount || 0) + 1 
            : Math.max((prev.owner?.subscribersCount || 0) - 1, 0)
        }
      }));
    } catch (error) {
      console.error('Error toggling subscription:', error);
    } finally {
      setSubLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="watch-page">
        <div className="primary-content">
          <div className="video-skeleton-player" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="watch-page">
        <div className="primary-content">
          <div className="error-state">Video not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="watch-page">
      <div className="primary-content">
        <div className="video-player">
          <video
            src={video.videoFile}
            controls
            autoPlay
            poster={video.thumbnail}
          />
        </div>

        <div className="video-info">
          <h1 className="video-title">{video.title}</h1>
          
          <div className="channel-row">
            <div className="channel-info">
              <Link to={`/channel/${video.owner?.username}`} className="channel-link">
                <img src={video.owner?.avatar} alt={video.owner?.username} className="channel-avatar" />
                <div className="channel-details">
                  <span className="channel-name">{video.owner?.username}</span>
                  <span className="subscriber-count">{video.owner?.subscribersCount || 0} subscribers</span>
                </div>
              </Link>
              {user && user._id !== video.owner?._id && (
                <button 
                  className={`subscribe-btn ${subscribed ? 'subscribed' : ''}`}
                  onClick={handleSubscribe}
                >
                  {subscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              )}
            </div>

            <div className="action-buttons">
              <div className="like-dislike-group">
                <button 
                  className={`action-btn ${liked ? 'active' : ''}`} 
                  onClick={handleLike}
                  disabled={likeLoading}
                >
                  <FiThumbsUp />
                  <span>{video.likesCount || 0}</span>
                </button>
                <button className="action-btn">
                  <FiThumbsDown />
                </button>
              </div>
              <button className="action-btn">
                <FiShare2 />
                <span>Share</span>
              </button>
              <button className="action-btn">
                <FiDownload />
                <span>Download</span>
              </button>
            </div>
          </div>

          <div 
            className={`video-description ${showDescription ? 'expanded' : ''}`}
            onClick={() => !showDescription && setShowDescription(true)}
          >
            <div className="description-header">
              <span>{formatViews(video.views)} views</span>
              <span>{formatDistanceToNow(video.createdAt)}</span>
            </div>
            <p className={`description-text ${showDescription ? 'expanded' : ''}`}>
              {video.description || 'No description'}
            </p>
            {showDescription && (
              <button className="show-more" onClick={(e) => { e.stopPropagation(); setShowDescription(false); }}>
                Show less
              </button>
            )}
          </div>
        </div>

        <Comments videoId={videoId} />
      </div>

      <div className="secondary-content">
        <div className="recommended-section">
          {recommended.map((rec) => (
            <div 
              key={rec._id} 
              className="recommended-video"
              onClick={() => navigate(`/watch/${rec._id}`)}
            >
              <div className="recommended-thumbnail">
                <img src={rec.thumbnail} alt={rec.title} />
                <span className="duration">{formatDuration(rec.duration)}</span>
              </div>
              <div className="recommended-info">
                <h4>{rec.title}</h4>
                <p className="channel">{rec.owner?.username}</p>
                <p className="meta">{formatViews(rec.views)} views • {formatDistanceToNow(rec.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Watch;
