import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  FiVideo, FiVideoOff, FiMic, FiMicOff, FiMonitor, 
  FiPhoneOff, FiUsers, FiMessageSquare, FiCopy, FiCheck,
  FiMaximize, FiMinimize
} from 'react-icons/fi';
import { socket, connectSocket } from '../../lib/socket';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './StreamMeet.css';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const StreamMeet = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'meet';
  const { user } = useAuth();

  // Refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnections = useRef(new Map());
  const roomDataRef = useRef(null);

  // State
  const [isJoined, setIsJoined] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [title, setTitle] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    roomDataRef.current = roomData;
  }, [roomData]);

  // Initialize media
  const initializeMedia = useCallback(async () => {
    try {
      setMediaError('');
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera/microphone not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setSetupComplete(true);
      return true;
    } catch (err) {
      console.error('Media error:', err);
      let msg = 'Failed to access camera/microphone. ';
      if (err.name === 'NotAllowedError') msg += 'Please allow access in browser settings.';
      else if (err.name === 'NotFoundError') msg += 'No camera/microphone found.';
      else if (err.name === 'NotReadableError') msg += 'Device is in use by another app.';
      else msg += err.message;
      setMediaError(msg);
      return false;
    }
  }, []);

  // Socket events
  useEffect(() => {
    connectSocket();

    socket.on('room-participants', ({ participants: list }) => {
      console.log('Room participants:', list);
      setParticipants(list);
      list.forEach(p => {
        if (p.oderId !== user?._id && localStreamRef.current) {
          createPeerConnection(p.oderId, true);
        }
      });
    });

    socket.on('user-joined', ({ oderId, username, participants: list }) => {
      console.log('User joined:', username, oderId);
      setParticipants(list);
      if (oderId !== user?._id && localStreamRef.current) {
        createPeerConnection(oderId, true);
      }
    });

    socket.on('user-left', ({ oderId, participants: list }) => {
      console.log('User left:', oderId);
      setParticipants(list);
      const pc = peerConnections.current.get(oderId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(oderId);
      }
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(oderId);
        return newMap;
      });
    });

    socket.on('offer', async ({ offer, senderId }) => {
      console.log('Received offer from:', senderId);
      await handleOffer(offer, senderId);
    });

    socket.on('answer', async ({ answer, senderId }) => {
      console.log('Received answer from:', senderId);
      const pc = peerConnections.current.get(senderId);
      if (pc && pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async ({ candidate, senderId }) => {
      const pc = peerConnections.current.get(senderId);
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('ICE error:', err);
        }
      }
    });

    socket.on('chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    socket.on('room-ended', () => {
      alert('The meeting has ended');
      cleanupAndNavigate();
    });

    return () => {
      socket.off('room-participants');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('chat-message');
      socket.off('room-ended');
    };
  }, [user, navigate]);

  // Create peer connection
  const createPeerConnection = async (oderId, createOffer = false) => {
    if (peerConnections.current.has(oderId)) return peerConnections.current.get(oderId);

    console.log('Creating peer connection for:', oderId);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current.set(oderId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      console.log('Received track from:', oderId);
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(oderId, event.streams[0]);
        return newMap;
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && roomDataRef.current) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          targetId: oderId,
          roomId: roomDataRef.current._id,
        });
      }
    };

    if (createOffer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', {
        offer,
        targetId: oderId,
        roomId: roomDataRef.current._id,
      });
    }

    return pc;
  };

  const handleOffer = async (offer, senderId) => {
    let pc = peerConnections.current.get(senderId);
    if (!pc) {
      pc = await createPeerConnection(senderId, false);
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('answer', {
      answer,
      targetId: senderId,
      roomId: roomDataRef.current._id,
    });
  };

  // Cleanup function
  const cleanupAndNavigate = () => {
    // Close all peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();

    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    navigate('/streammeet');
  };

  // Create room
  const createRoom = async () => {
    if (!title.trim() && mode === 'stream') {
      setError('Please enter a title');
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await API.post('/streams/room', { 
        title: title || `${user.username}'s ${mode === 'meet' ? 'Meeting' : 'Stream'}`,
        mode,
      });
      
      console.log('Room created:', data.data);
      setRoomData(data.data);
      setIsJoined(true);
      setIsHost(true);
      
      socket.emit('join-room', { 
        roomId: data.data._id, 
        oderId: user._id,
        username: user.username,
        isHost: true,
      });

      window.history.replaceState(null, '', `/streammeet/${data.data._id}?mode=${mode}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  // Join existing room
  const joinRoom = async () => {
    if (!roomId) return;

    setIsLoading(true);
    setError('');
    try {
      const { data } = await API.get(`/streams/room/${roomId}`);
      console.log('Joining room:', data.data);
      
      // Check if room has ended
      if (data.data.hasEnded || !data.data.isLive) {
        setError('This meeting has ended');
        setIsLoading(false);
        return;
      }
      
      setRoomData(data.data);
      setIsJoined(true);
      setIsHost(data.data.streamer?._id === user?._id);
      
      socket.emit('join-room', { 
        roomId: data.data._id, 
        oderId: user?._id || socket.id,
        username: user?.username || 'Guest',
        isHost: data.data.streamer?._id === user?._id,
      });
    } catch (err) {
      console.error('Join error:', err);
      setError(err.response?.data?.message || 'Room not found or has ended');
    } finally {
      setIsLoading(false);
    }
  };

  // End meeting (host only)
  const endMeeting = async () => {
    if (!isHost || !roomData) return;
    
    setIsEnding(true);
    try {
      await API.patch(`/streams/${roomData._id}/end`);
      socket.emit('end-room', { roomId: roomData._id });
      cleanupAndNavigate();
    } catch (err) {
      console.error('Error ending meeting:', err);
      // Still leave even if API fails
      cleanupAndNavigate();
    }
  };

  // Leave room (for non-hosts)
  const leaveRoom = () => {
    if (roomData) {
      socket.emit('leave-room', { roomId: roomData._id, oderId: user?._id });
    }
    cleanupAndNavigate();
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setVideoEnabled(track.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setAudioEnabled(track.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      // Restore camera
      await initializeMedia();
      peerConnections.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender && localStreamRef.current) {
          sender.replaceTrack(localStreamRef.current.getVideoTracks()[0]);
        }
      });
      setIsScreenSharing(false);
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screen;
        if (localVideoRef.current) localVideoRef.current.srcObject = screen;
        
        peerConnections.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screen.getVideoTracks()[0]);
        });
        
        screen.getVideoTracks()[0].onended = () => toggleScreenShare();
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen share error:', err);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomData) return;
    socket.emit('chat-message', {
      roomId: roomData._id,
      message: newMessage,
      user: { _id: user?._id, username: user?.username || 'Guest' },
    });
    setNewMessage('');
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/streammeet/${roomData?._id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Initialize on mount
  useEffect(() => {
    initializeMedia().then(success => {
      if (success && roomId && roomId !== 'new') {
        joinRoom();
      }
    });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId]);

  // Get participant count
  const participantCount = participants.length || 1;

  // Setup screen (before joining)
  if (!isJoined) {
    return (
      <div className="meet-setup">
        <div className="meet-setup-container">
          <div className="meet-preview-section">
            <div className="meet-preview">
              <video ref={localVideoRef} autoPlay muted playsInline />
              {!videoEnabled && (
                <div className="video-off-overlay">
                  <div className="avatar-circle">
                    {user?.username?.charAt(0).toUpperCase() || 'G'}
                  </div>
                </div>
              )}
              {!setupComplete && !mediaError && (
                <div className="setup-loading">
                  <div className="spinner"></div>
                  <p>Accessing camera...</p>
                </div>
              )}
              {mediaError && (
                <div className="setup-error">
                  <p>{mediaError}</p>
                  <button onClick={initializeMedia} className="retry-btn">Try Again</button>
                </div>
              )}
            </div>
            <div className="preview-controls">
              <button 
                onClick={toggleAudio} 
                className={`preview-btn ${!audioEnabled ? 'off' : ''}`} 
                disabled={!setupComplete}
                title={audioEnabled ? 'Turn off microphone' : 'Turn on microphone'}
              >
                {audioEnabled ? <FiMic size={20} /> : <FiMicOff size={20} />}
              </button>
              <button 
                onClick={toggleVideo} 
                className={`preview-btn ${!videoEnabled ? 'off' : ''}`} 
                disabled={!setupComplete}
                title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {videoEnabled ? <FiVideo size={20} /> : <FiVideoOff size={20} />}
              </button>
            </div>
          </div>

          <div className="meet-join-section">
            <h1>{roomId && roomId !== 'new' ? 'Ready to join?' : 'Start a meeting'}</h1>
            <p className="meet-subtitle">
              {roomId && roomId !== 'new' 
                ? 'Your video and audio are off by default' 
                : 'Create a new meeting room'}
            </p>
            
            {mode === 'stream' && !roomId && (
              <input
                type="text"
                placeholder="Enter stream title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="meet-input"
              />
            )}

            {error && <div className="meet-error">{error}</div>}

            <div className="meet-actions">
              <button 
                onClick={roomId && roomId !== 'new' ? joinRoom : createRoom} 
                className="meet-join-btn"
                disabled={!setupComplete || isLoading}
              >
                {isLoading ? 'Please wait...' : (roomId && roomId !== 'new' ? 'Join now' : 'Start meeting')}
              </button>
              <button onClick={() => navigate('/streammeet')} className="meet-back-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main room view
  return (
    <div className={`meet-room ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="meet-main">
        <div className={`meet-video-grid grid-${Math.min(participantCount, 4)}`}>
          {/* Local video */}
          <div className={`meet-video-tile ${participantCount === 1 ? 'solo' : ''}`}>
            <video ref={localVideoRef} autoPlay muted playsInline />
            {!videoEnabled && (
              <div className="video-off-overlay">
                <div className="avatar-circle large">
                  {user?.username?.charAt(0).toUpperCase() || 'Y'}
                </div>
              </div>
            )}
            <div className="tile-label">
              <span>You {isHost && '(Host)'}</span>
              <div className="tile-icons">
                {!audioEnabled && <FiMicOff size={14} />}
                {!videoEnabled && <FiVideoOff size={14} />}
              </div>
            </div>
          </div>

          {/* Remote videos */}
          {Array.from(remoteStreams.entries()).map(([oderId, stream]) => {
            const participant = participants.find(p => p.oderId === oderId);
            return (
              <RemoteVideo 
                key={oderId} 
                oderId={oderId} 
                stream={stream} 
                participant={participant}
              />
            );
          })}
        </div>

        {/* Bottom controls */}
        <div className="meet-controls">
          <div className="controls-info">
            <span className="meeting-title">{roomData?.title || 'Meeting'}</span>
          </div>

          <div className="controls-main">
            <button 
              onClick={toggleAudio} 
              className={`ctrl-btn ${!audioEnabled ? 'off' : ''}`}
              title={audioEnabled ? 'Turn off microphone' : 'Turn on microphone'}
            >
              {audioEnabled ? <FiMic size={22} /> : <FiMicOff size={22} />}
            </button>
            <button 
              onClick={toggleVideo} 
              className={`ctrl-btn ${!videoEnabled ? 'off' : ''}`}
              title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {videoEnabled ? <FiVideo size={22} /> : <FiVideoOff size={22} />}
            </button>
            <button 
              onClick={toggleScreenShare} 
              className={`ctrl-btn ${isScreenSharing ? 'active' : ''}`}
              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
              <FiMonitor size={22} />
            </button>
            <button 
              onClick={isHost ? endMeeting : leaveRoom} 
              className="ctrl-btn leave"
              disabled={isEnding}
              title={isHost ? 'End meeting for all' : 'Leave meeting'}
            >
              <FiPhoneOff size={22} />
            </button>
          </div>

          <div className="controls-extra">
            <button 
              onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }} 
              className={`ctrl-btn-sm ${showParticipants ? 'active' : ''}`}
              title="Participants"
            >
              <FiUsers size={20} />
              <span>{participantCount}</span>
            </button>
            <button 
              onClick={() => { setShowChat(!showChat); setShowParticipants(false); }} 
              className={`ctrl-btn-sm ${showChat ? 'active' : ''}`}
              title="Chat"
            >
              <FiMessageSquare size={20} />
            </button>
            <button 
              onClick={copyRoomLink} 
              className="ctrl-btn-sm"
              title="Copy meeting link"
            >
              {copied ? <FiCheck size={20} /> : <FiCopy size={20} />}
            </button>
            <button 
              onClick={toggleFullscreen} 
              className="ctrl-btn-sm"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <FiMinimize size={20} /> : <FiMaximize size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Side panel */}
      {(showChat || showParticipants) && (
        <div className="meet-sidebar">
          <div className="sidebar-header">
            <h3>{showChat ? 'In-call messages' : 'People'}</h3>
            <button onClick={() => { setShowChat(false); setShowParticipants(false); }} className="close-sidebar">
              ×
            </button>
          </div>

          {showParticipants && (
            <div className="participants-list">
              {participants.map((p, i) => (
                <div key={i} className="participant-item">
                  <div className="participant-avatar">
                    {p.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="participant-info">
                    <span className="participant-name">
                      {p.username} {p.oderId === user?._id && '(You)'}
                    </span>
                    {p.isHost && <span className="host-tag">Host</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showChat && (
            <div className="chat-container">
              <div className="chat-messages">
                {chatMessages.length === 0 ? (
                  <div className="no-messages">
                    <FiMessageSquare size={32} />
                    <p>Messages can only be seen by people in the call</p>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className={`chat-msg ${msg.user?._id === user?._id ? 'own' : ''}`}>
                      <span className="msg-sender">{msg.user?.username}</span>
                      <span className="msg-text">{msg.message}</span>
                      <span className="msg-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={sendMessage} className="chat-form">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Send a message to everyone"
                />
                <button type="submit" disabled={!newMessage.trim()}>Send</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Remote video component
const RemoteVideo = ({ oderId, stream, participant }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="meet-video-tile">
      <video ref={videoRef} autoPlay playsInline />
      <div className="tile-label">
        <span>{participant?.username || 'Participant'} {participant?.isHost && '(Host)'}</span>
      </div>
    </div>
  );
};

export default StreamMeet;
