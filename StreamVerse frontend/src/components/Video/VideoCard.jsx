import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FiMoreVertical, FiEdit, FiTrash2 } from 'react-icons/fi';
import { formatDistanceToNow } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import './VideoCard.css';

const VideoCard = ({ video, onDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

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

  const isOwner = user?._id === video.owner?._id;

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    
    try {
      await API.delete(`/videos/${video._id}`);
      if (onDelete) onDelete(video._id);
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    }
    setShowMenu(false);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/edit/${video._id}`);
    setShowMenu(false);
  };

  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div className="video-card-wrapper">
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
      
      {isOwner && (
        <div className="video-menu">
          <button className="menu-btn" onClick={toggleMenu}>
            <FiMoreVertical />
          </button>
          {showMenu && (
            <div className="menu-dropdown">
              <button onClick={handleEdit}>
                <FiEdit /> Edit
              </button>
              <button onClick={handleDelete} className="delete-btn">
                <FiTrash2 /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoCard;
