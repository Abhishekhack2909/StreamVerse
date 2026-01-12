import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSend, FiUsers } from 'react-icons/fi';
import { socket, connectSocket } from '../../lib/socket';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './LiveStream.css';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const LiveStream = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetchStream();
    connectSocket();

    socket.on('offer', async ({ offer, broadcasterId }) => {
      console.log('Received offer from broadcaster');
      await handleOffer(offer, broadcasterId);
    });

    socket.on('ice-candidate', async ({ candidate, senderId }) => {
      if (peerConnectionRef.current && candidate) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('viewer-count', (count) => {
      setViewerCount(count);
    });

    socket.on('chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    socket.on('stream-ended', () => {
      alert('Stream has ended');
      navigate('/');
    });

    return () => {
      leaveStream();
      socket.off('offer');
      socket.off('ice-candidate');
      socket.off('viewer-count');
      socket.off('chat-message');
      socket.off('stream-ended');
    };
  }, [streamId]);

  const fetchStream = async () => {
    try {
      const { data } = await API.get(`/streams/${streamId}`);
      setStream(data.data);
      setViewerCount(data.data.viewers);
      
      if (!data.data.isLive) {
        alert('This stream is not live');
        navigate('/');
        return;
      }

      // Join the stream room
      socket.emit('join-stream', { streamId });
      setIsConnected(true);
    } catch (err) {
      console.error('Error fetching stream:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleOffer = async (offer, broadcasterId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.ontrack = (event) => {
      console.log('Received track from broadcaster');
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          targetId: broadcasterId,
          streamId,
        });
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('answer', {
      answer,
      broadcasterId,
      streamId,
    });
  };

  const leaveStream = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    socket.emit('leave-stream', { streamId });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    socket.emit('chat-message', {
      streamId,
      message: newMessage,
      user: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
      },
    });

    setNewMessage('');
  };

  if (loading) {
    return (
      <div className="live-stream-page">
        <div className="loading">Loading stream...</div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="live-stream-page">
        <div className="error">Stream not found</div>
      </div>
    );
  }

  return (
    <div className="live-stream-page">
      <div className="stream-main">
        <div className="video-container">
          <video ref={videoRef} autoPlay playsInline />
          <div className="stream-overlay">
            <div className="live-indicator">
              <span className="live-dot"></span>
              LIVE
            </div>
            <div className="viewer-count">
              <FiUsers /> {viewerCount}
            </div>
          </div>
        </div>

        <div className="stream-info">
          <div className="streamer-info">
            <img src={stream.streamer?.avatar} alt={stream.streamer?.username} className="streamer-avatar" />
            <div>
              <h1>{stream.title}</h1>
              <p className="streamer-name">{stream.streamer?.username}</p>
            </div>
          </div>
          {stream.description && (
            <p className="stream-description">{stream.description}</p>
          )}
        </div>
      </div>

      <div className="chat-panel">
        <div className="chat-header">
          <h3>Live Chat</h3>
        </div>

        <div className="chat-messages">
          {chatMessages.length === 0 ? (
            <div className="no-messages">No messages yet</div>
          ) : (
            chatMessages.map((msg) => (
              <div key={msg.id} className="chat-message">
                <img src={msg.user?.avatar} alt="" className="chat-avatar" />
                <div className="chat-content">
                  <span className="chat-username">{msg.user?.username}</span>
                  <span className="chat-text">{msg.message}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {user ? (
          <form className="chat-input" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="Send a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit" disabled={!newMessage.trim()}>
              <FiSend />
            </button>
          </form>
        ) : (
          <div className="chat-login-prompt">
            Sign in to chat
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveStream;
