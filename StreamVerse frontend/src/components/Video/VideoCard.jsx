import { Link } from 'react-router-dom';
import { formatDistanceToNow } from '../../utils/helpers';
import './VideoCard.css';

const VideoCard = ({ video }) => {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views;
  };

  return (
    <Link to={`/watch/${video._id}`} className="video-card">
      <div className="thumbnail-container">
        <img src={video.thumbnail} alt={video.title} className="thumbnail" />
        <span className="duration">{formatDuration(video.duration)}</span>
      </div>
      <div className="video-info">
        <div className="channel-avatar">
          <img src={video.owner?.avatar} alt={video.owner?.username} />
        </div>
        <div className="video-details">
          <h3 className="video-title">{video.title}</h3>
          <p className="channel-name">{video.owner?.username}</p>
          <p className="video-meta">
            {formatViews(video.views)} views • {formatDistanceToNow(video.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;
