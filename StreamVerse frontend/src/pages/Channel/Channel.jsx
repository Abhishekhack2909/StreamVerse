import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiEdit } from 'react-icons/fi';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import VideoGrid from '../../components/Video/VideoGrid';
import './Channel.css';

const Channel = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');

  useEffect(() => {
    fetchChannel();
  }, [username]);

  const fetchChannel = async () => {
    try {
      const { data } = await API.get(`/users/c/${username}`);
      setChannel(data.data);
      setSubscribed(data.data.isSubscribed);
      
      // Fetch user's videos
      const videosRes = await API.get(`/videos?userId=${data.data._id}`);
      setVideos(videosRes.data.data?.videos || videosRes.data.data?.docs || videosRes.data.data || []);
    } catch (error) {
      console.error('Error fetching channel:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user || !channel) return;
    try {
      await API.post(`/subscriptions/c/${channel._id}`);
      setSubscribed(!subscribed);
      setChannel({
        ...channel,
        subscribersCount: subscribed
          ? channel.subscribersCount - 1
          : channel.subscribersCount + 1,
      });
    } catch (error) {
      console.error('Error toggling subscription:', error);
    }
  };

  const handleVideoDelete = (videoId) => {
    setVideos(videos.filter(v => v._id !== videoId));
  };

  const isOwner = user?.username === channel?.username;

  if (loading) {
    return <div className="channel-page loading">Loading...</div>;
  }

  if (!channel) {
    return <div className="channel-page error">Channel not found</div>;
  }

  return (
    <div className="channel-page">
      <div className="channel-banner">
        {channel.coverImage && (
          <img src={channel.coverImage} alt="Cover" />
        )}
      </div>

      <div className="channel-header">
        <div className="channel-info">
          <img src={channel.avatar} alt={channel.username} className="channel-avatar" />
          <div className="channel-details">
            <h1>{channel.fullname}</h1>
            <p className="channel-handle">@{channel.username}</p>
            <p className="channel-stats">
              {channel.subscribersCount} subscribers • {videos.length} videos
            </p>
          </div>
        </div>
        
        {isOwner ? (
          <Link to="/edit-channel" className="edit-channel-btn">
            <FiEdit /> Edit Channel
          </Link>
        ) : user && (
          <button
            className={`subscribe-btn ${subscribed ? 'subscribed' : ''}`}
            onClick={handleSubscribe}
          >
            {subscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        )}
      </div>

      <div className="channel-tabs">
        <button
          className={`tab ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          Videos
        </button>
        <button
          className={`tab ${activeTab === 'playlists' ? 'active' : ''}`}
          onClick={() => setActiveTab('playlists')}
        >
          Playlists
        </button>
      </div>

      <div className="channel-content">
        {activeTab === 'videos' && (
          <VideoGrid videos={videos} loading={false} onVideoDelete={handleVideoDelete} />
        )}
        {activeTab === 'playlists' && (
          <div className="empty-state">No playlists yet</div>
        )}
      </div>
    </div>
  );
};

export default Channel;
