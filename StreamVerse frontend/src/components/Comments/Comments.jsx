import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from '../../utils/helpers';
import './Comments.css';

const Comments = ({ videoId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const fetchComments = async () => {
    try {
      console.log('Fetching comments for video:', videoId);
      const { data } = await API.get(`/comments/${videoId}`);
      console.log('Comments response:', data);
      const commentsList = data.data?.comments || data.data?.docs || data.data || [];
      setComments(Array.isArray(commentsList) ? commentsList : []);
    } catch (error) {
      console.error('Error fetching comments:', error.response?.data || error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      console.log('Posting comment:', { videoId, content: newComment });
      const { data } = await API.post(`/comments/${videoId}`, {
        content: newComment,
      });
      console.log('Comment response:', data);
      setComments([data.data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error.response?.data || error);
    }
  };

  return (
    <div className="comments-section">
      <h3 className="comments-title">{comments.length} Comments</h3>

      {user && (
        <form className="comment-form" onSubmit={handleSubmit}>
          <img src={user.avatar} alt={user.username} className="comment-avatar" />
          <div className="comment-input-wrapper">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
            />
            <div className="comment-actions">
              <button type="button" onClick={() => setNewComment('')}>
                Cancel
              </button>
              <button type="submit" className="submit" disabled={!newComment.trim()}>
                Comment
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="comments-list">
        {loading ? (
          <div className="loading">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="no-comments">No comments yet</div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="comment">
              <img
                src={comment.owner?.avatar}
                alt={comment.owner?.username}
                className="comment-avatar"
              />
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{comment.owner?.username}</span>
                  <span className="comment-time">{formatDistanceToNow(comment.createdAt)}</span>
                </div>
                <p className="comment-text">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
