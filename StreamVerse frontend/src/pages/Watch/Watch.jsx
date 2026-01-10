import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiThumbsUp, FiThumbsDown, FiShare2 } from 'react-icons/fi';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { formatViews, formatDistanceToNow, formatDate } from '../../utils/helpers';
import Comments from '../../components/Comments/Comments';
import './Watch.css';

const Watch = () => {
  const { videoId } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    fetchVideo();
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      const { data } = await API.get(`/videos/${videoId}`);
      setVideo(data.data);
    } catch (error) {
      console.error('Error fetching video:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      await API.post(`/likes/toggle/v/${videoId}`);
      setLiked(!liked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user || !video?.owner) return;
    try {
      await API.post(`/subscriptions/c/${video.owner._id}`);
      setSubscribed(!subscribed);
    } catch (error) {
      console.error('Error toggling subscription:', error);
    }
  };

  if (loading) {
    return (
      <div className="watch-page">
        <div className="video-skeleton-player" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="watch-page">
        <div className="error-state">Video not found</div>
      </div>
    );
  }

  return (
    <div className="watch-page">
      <div className="video-container">
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
          
          <div className="video-actions">
            <div className="channel-info">
              <Link to={`/channel/${video.owner?.username}`} className="channel-link">
                <img src={video.owner?.avatar} alt={video.owner?.username} className="channel-avatar" />
                <div className="channel-details">
                  <span className="channel-name">{video.owner?.username}</span>
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
              <button className={`action-btn ${liked ? 'active' : ''}`} onClick={handleLike}>
                <FiThumbsUp />
                <span>Like</span>
              </button>
              <button className="action-btn">
                <FiShare2 />
                <span>Share</span>
              </button>
            </div>
          </div>

          <div className="video-description">
            <div className="description-header">
              <span>{formatViews(video.views)} views</span>
              <span>•</span>
              <span>{formatDate(video.createdAt)}</span>
            </div>
            <p className={`description-text ${showDescription ? 'expanded' : ''}`}>
              {video.description}
            </p>
            {video.description?.length > 200 && (
              <button 
                className="show-more"
                onClick={() => setShowDescription(!showDescription)}
              >
                {showDescription ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>

        <Comments videoId={videoId} />
      </div>
    </div>
  );
};

export default Watch;
