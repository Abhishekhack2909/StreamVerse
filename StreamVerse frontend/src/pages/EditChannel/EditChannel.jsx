import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCamera } from 'react-icons/fi';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './EditChannel.css';

const EditChannel = () => {
  const navigate = useNavigate();
  const { user, fetchUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        fullname: user.fullname || '',
        email: user.email || '',
      });
      setAvatarPreview(user.avatar || '');
      setCoverPreview(user.coverImage || '');
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Update basic details
      await API.patch('/users/update-details', formData);

      // Update avatar if changed
      if (avatar) {
        const avatarData = new FormData();
        avatarData.append('avatar', avatar);
        await API.patch('/users/update-avatar', avatarData);
      }

      // Update cover image if changed
      if (coverImage) {
        const coverData = new FormData();
        coverData.append('coverImage', coverImage);
        await API.patch('/users/cover-image', coverData);
      }

      setSuccess('Profile updated successfully!');
      fetchUserProfile();
      
      setTimeout(() => {
        navigate(`/channel/${user.username}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="edit-channel-page"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="edit-channel-page">
      <div className="edit-channel-container">
        <h1>Edit Channel</h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="edit-channel-form">
          <div className="cover-section">
            <label>Cover Image</label>
            <div className="cover-preview">
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" />
              ) : (
                <div className="cover-placeholder">No cover image</div>
              )}
              <label className="cover-upload-btn">
                <FiCamera />
                <input type="file" accept="image/*" onChange={handleCoverChange} />
              </label>
            </div>
          </div>

          <div className="avatar-section">
            <label>Profile Picture</label>
            <div className="avatar-preview">
              <img src={avatarPreview} alt="Avatar" />
              <label className="avatar-upload-btn">
                <FiCamera />
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="fullname">Display Name</label>
            <input
              type="text"
              id="fullname"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input type="text" value={`@${user.username}`} disabled />
            <small>Username cannot be changed</small>
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

export default EditChannel;
