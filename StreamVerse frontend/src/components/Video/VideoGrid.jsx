import VideoCard from './VideoCard';
import './VideoGrid.css';

const VideoGrid = ({ videos, loading, onVideoDelete }) => {
  if (loading) {
    return (
      <div className="video-grid">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="video-skeleton">
            <div className="skeleton-thumbnail" />
            <div className="skeleton-info">
              <div className="skeleton-avatar" />
              <div className="skeleton-text">
                <div className="skeleton-title" />
                <div className="skeleton-subtitle" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Ensure videos is an array
  const videoList = Array.isArray(videos) ? videos : [];

  if (!videoList.length) {
    return (
      <div className="empty-state">
        <p>No videos found</p>
      </div>
    );
  }

  return (
    <div className="video-grid">
      {videoList.map((video) => (
        <VideoCard key={video._id} video={video} onDelete={onVideoDelete} />
      ))}
    </div>
  );
};

export default VideoGrid;
