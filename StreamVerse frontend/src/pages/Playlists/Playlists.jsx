import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiPlay } from 'react-icons/fi';
import API from '../../api/axios';
import './Playlists.css';

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const { data } = await API.get('/playlist/user');
      setPlaylists(data.data || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/playlist', newPlaylist);
      setPlaylists([...playlists, data.data]);
      setShowModal(false);
      setNewPlaylist({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  if (loading) {
    return <div className="playlists-page loading">Loading...</div>;
  }

  return (
    <div className="playlists-page">
      <div className="playlists-header">
        <h1>Playlists</h1>
        <button className="create-btn" onClick={() => setShowModal(true)}>
          <FiPlus /> New Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="empty-state">
          <p>No playlists yet</p>
        </div>
      ) : (
        <div className="playlists-grid">
          {playlists.map((playlist) => (
            <Link
              key={playlist._id}
              to={`/playlist/${playlist._id}`}
              className="playlist-card"
            >
              <div className="playlist-thumbnail">
                {playlist.videos?.[0]?.thumbnail ? (
                  <img src={playlist.videos[0].thumbnail} alt={playlist.name} />
                ) : (
                  <div className="placeholder" />
                )}
                <div className="playlist-overlay">
                  <FiPlay />
                  <span>{playlist.videos?.length || 0} videos</span>
                </div>
              </div>
              <div className="playlist-info">
                <h3>{playlist.name}</h3>
                <p>{playlist.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Playlist</h2>
            <form onSubmit={createPlaylist}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newPlaylist.name}
                  onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                  placeholder="Playlist name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newPlaylist.description}
                  onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                  placeholder="Add a description"
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Playlists;
