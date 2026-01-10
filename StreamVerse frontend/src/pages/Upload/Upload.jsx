import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUploadCloud } from 'react-icons/fi';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './Upload.css';

const Upload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please login to upload videos');
      navigate('/login');
      return;
    }
    
    setError('');
    setLoading(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('videoFile', videoFile);
    data.append('thumbnail', thumbnail);

    try {
      console.log('Uploading video...', { title: formData.title, videoFile: videoFile?.name, thumbnail: thumbnail?.name });
      const response = await API.post('/videos', data, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        },
      });
      console.log('Upload success:', response.data);
      navigate(`/watch/${response.data.data._id}`);
    } catch (err) {
      console.error('Upload error:', err.response?.data || err);
      setError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <h1>Upload Video</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="file-upload-area">
            <input
              type="file"
              id="videoFile"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              required
            />
            <label htmlFor="videoFile" className="file-upload-label">
              <FiUploadCloud />
              <span>{videoFile ? videoFile.name : 'Select video file'}</span>
              <small>MP4, WebM, MOV supported</small>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="thumbnail">Thumbnail *</label>
            <input
              type="file"
              id="thumbnail"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                  setThumbnail(file);
                } else {
                  e.target.value = '';
                  setError('Please select an image file for thumbnail');
                }
              }}
              required
            />
            {thumbnail && <small className="file-selected">Selected: {thumbnail.name}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter video title"
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
              placeholder="Tell viewers about your video"
              rows={5}
              required
            />
          </div>

          {loading && (
            <div className="progress-bar">
              <div className="progress" style={{ width: `${progress}%` }} />
              <span>{progress}%</span>
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
