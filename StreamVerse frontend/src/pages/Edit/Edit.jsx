import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './Edit.css';

const Edit = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [currentThumbnail, setCurrentThumbnail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVideo();
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      const { data } = await API.get(`/videos/${videoId}`);
      const video = data.data;
      
      if (video.owner?._id !== user?._id) {
        navigate('/');
        return;
      }
      
      setFormData({
        title: video.title,
        description: video.description,
      });
      setCurrentThumbnail(video.thumbnail);
    } catch (error) {
      console.error('Error fetching video:', error);
      setError('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    if (thumbnail) {
      data.append('thumbnail', thumbnail);
    }

    try {
      await API.patch(`/videos/${videoId}`, data);
      navigate(`/watch/${videoId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update video');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="edit-page"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="edit-page">
      <div className="edit-container">
        <h1>Edit Video</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="current-thumbnail">
            <label>Current Thumbnail</label>
            <img src={currentThumbnail} alt="Current thumbnail" />
          </div>

          <div className="form-group">
            <label htmlFor="thumbnail">New Thumbnail (optional)</label>
            <input
              type="file"
              id="thumbnail"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files[0])}
            />
          </div>

          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate(-1)} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Edit;
