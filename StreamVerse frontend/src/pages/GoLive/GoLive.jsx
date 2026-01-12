import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiMonitor } from 'react-icons/fi';
import { socket, connectSocket } from '../../lib/socket';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './GoLive.css';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const GoLive = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const streamDataRef = useRef(null);
  const peerConnections = useRef(new Map());

  const [isLive, setIsLive] = useState(false);
  const [streamData, setStreamData] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  // Keep streamDataRef in sync with streamData
  useEffect(() => {
    streamDataRef.current = streamData;
  }, [streamData]);

  useEffect(() => {
    connectSocket();
    
    socket.on('viewer-joined', ({ viewerId, viewerCount }) => {
      console.log('Viewer joined:', viewerId);
      setViewerCount(viewerCount);
      
      // Create offer for new viewer
      createOfferForViewer(viewerId);
    });

    socket.on('viewer-left', ({ viewerId, viewerCount }) => {
      console.log('Viewer left:', viewerId);
      setViewerCount(viewerCount);
      
      // Clean up peer connection
      const pc = peerConnections.current.get(viewerId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(viewerId);
      }
    });

    socket.on('answer', async ({ answer, viewerId }) => {
      console.log('Received answer from viewer:', viewerId);
      const pc = peerConnections.current.get(viewerId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async ({ candidate, senderId }) => {
      const pc = peerConnections.current.get(senderId);
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('viewer-joined');
      socket.off('viewer-left');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('chat-message');
      stopStream();
    };
  }, []);

  const createOfferForViewer = async (viewerId) => {
    if (!streamRef.current || !streamDataRef.current) {
      console.log('Cannot create offer: stream not ready');
      return;
    }

    console.log('Creating offer for viewer:', viewerId, 'Stream ID:', streamDataRef.current._id);

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current.set(viewerId, pc);

    // Add tracks to connection
    streamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, streamRef.current);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && streamDataRef.current) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          targetId: viewerId,
          streamId: streamDataRef.current._id,
        });
      }
    };

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('offer', {
      offer,
      viewerId,
      streamId: streamDataRef.current._id,
    });

    console.log('Offer sent to viewer:', viewerId);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Failed to access camera/microphone');
      console.error(err);
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Failed to share screen');
      console.error(err);
    }
  };

  const goLive = async () => {
    if (!title.trim()) {
      setError('Please enter a stream title');
      return;
    }

    if (!streamRef.current) {
      setError('Please start your camera or screen share first');
      return;
    }

    try {
      const { data } = await API.post('/streams', { title, description });
      setStreamData(data.data);
      setIsLive(true);
      setError('');

      // Join socket room as broadcaster
      socket.emit('start-broadcast', { streamId: data.data._id });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start stream');
    }
  };

  const stopStream = async () => {
    if (streamData) {
      socket.emit('end-broadcast', { streamId: streamData._id });
      
      try {
        await API.post(`/streams/${streamData._id}/end`);
      } catch (err) {
        console.error('Error ending stream:', err);
      }
    }

    // Close all peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();

    // Stop media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsLive(false);
    setStreamData(null);
    setViewerCount(0);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  return (
    <div className="go-live-page">
      <div className="stream-container">
        <div className="video-preview">
          <video ref={videoRef} autoPlay muted playsInline />
          {isLive && (
            <div className="live-badge">
              <span className="live-dot"></span>
              LIVE • {viewerCount} viewers
            </div>
          )}
        </div>

        <div className="stream-controls">
          {!isLive ? (
            <>
              <div className="source-buttons">
                <button onClick={startCamera} className="source-btn">
                  <FiVideo /> Camera
                </button>
                <button onClick={startScreenShare} className="source-btn">
                  <FiMonitor /> Screen
                </button>
              </div>

              <div className="stream-form">
                <input
                  type="text"
                  placeholder="Stream title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button onClick={goLive} className="go-live-btn" disabled={!streamRef.current}>
                Go Live
              </button>
            </>
          ) : (
            <>
              <div className="live-controls">
                <button onClick={toggleVideo} className={`control-btn ${!videoEnabled ? 'off' : ''}`}>
                  {videoEnabled ? <FiVideo /> : <FiVideoOff />}
                </button>
                <button onClick={toggleAudio} className={`control-btn ${!audioEnabled ? 'off' : ''}`}>
                  {audioEnabled ? <FiMic /> : <FiMicOff />}
                </button>
                <button onClick={stopStream} className="end-stream-btn">
                  End Stream
                </button>
              </div>

              <div className="stream-info">
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {isLive && (
        <div className="chat-section">
          <h3>Live Chat</h3>
          <div className="chat-messages">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="chat-message">
                <span className="chat-user">{msg.user?.username}:</span>
                <span className="chat-text">{msg.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoLive;
