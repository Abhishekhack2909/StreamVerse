import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  FiVideo, FiVideoOff, FiMic, FiMicOff, FiMonitor, 
  FiPhoneOff, FiUsers, FiMessageSquare, FiCopy, FiCheck
} from 'react-icons/fi';
import { socket, connectSocket } from '../../lib/socket';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './StreamMeet.css';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
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
      // Create peer connections for existing participants
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
      alert('The session has ended');
      navigate('/streammeet');
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
    try {
      const { data } = await API.get(`/streams/room/${roomId}`);
      console.log('Joining room:', data.data);
      setRoomData(data.data);
      setIsJoined(true);
      
      socket.emit('join-room', { 
        roomId: data.data._id, 
        oderId: user?._id || socket.id,
        username: user?.username || 'Guest',
        isHost: false,
      });
    } catch (err) {
      console.error('Join error:', err);
      setError(err.response?.data?.message || 'Room not found or has ended');
    } finally {
      setIsLoading(false);
    }
  };

  // Leave room
  const leaveRoom = () => {
    if (roomData) {
      socket.emit('leave-room', { roomId: roomData._id, oderId: user?._id });
    }

    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }

    navigate('/streammeet');
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
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
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


  // Setup screen (before joining)
  if (!isJoined) {
    return (
      <div className="streammeet-setup">
        <div className="setup-container">
          <div className="setup-preview">
            <video ref={localVideoRef} autoPlay muted playsInline />
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

          <div className="setup-controls">
            <h1>{roomId && roomId !== 'new' ? 'Join Meeting' : (mode === 'meet' ? 'Start Meeting' : 'Go Live')}</h1>
            
            {mode === 'stream' && !roomId && (
              <input
                type="text"
                placeholder="Stream title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="setup-input"
              />
            )}

            <div className="media-controls">
              <button onClick={toggleVideo} className={`media-btn ${!videoEnabled ? 'off' : ''}`} disabled={!setupComplete}>
                {videoEnabled ? <FiVideo /> : <FiVideoOff />}
              </button>
              <button onClick={toggleAudio} className={`media-btn ${!audioEnabled ? 'off' : ''}`} disabled={!setupComplete}>
                {audioEnabled ? <FiMic /> : <FiMicOff />}
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              onClick={roomId && roomId !== 'new' ? joinRoom : createRoom} 
              className="join-btn"
              disabled={!setupComplete || isLoading}
            >
              {isLoading ? 'Please wait...' : (roomId && roomId !== 'new' ? 'Join Now' : (mode === 'meet' ? 'Start Meeting' : 'Go Live'))}
            </button>

            <button onClick={() => navigate('/streammeet')} className="back-btn">Back</button>
          </div>
        </div>
      </div>
    );
  }

  // Main room view
  return (
    <div className="streammeet-room">
      <div className="room-main">
        <div className={`video-grid participants-${Math.min(remoteStreams.size + 1, 4)}`}>
          <div className="video-tile local">
            <video ref={localVideoRef} autoPlay muted playsInline />
            <div className="tile-info">
              <span>{user?.username || 'You'} (You)</span>
              {!videoEnabled && <FiVideoOff />}
              {!audioEnabled && <FiMicOff />}
            </div>
          </div>

          {Array.from(remoteStreams.entries()).map(([oderId, stream]) => (
            <RemoteVideo key={oderId} oderId={oderId} stream={stream} participants={participants} />
          ))}
        </div>

        <div className="controls-bar">
          <div className="controls-left">
            <span className="room-info">{roomData?.title || 'Meeting'}</span>
          </div>

          <div className="controls-center">
            <button onClick={toggleAudio} className={`control-btn ${!audioEnabled ? 'off' : ''}`} title="Toggle Mic">
              {audioEnabled ? <FiMic /> : <FiMicOff />}
            </button>
            <button onClick={toggleVideo} className={`control-btn ${!videoEnabled ? 'off' : ''}`} title="Toggle Camera">
              {videoEnabled ? <FiVideo /> : <FiVideoOff />}
            </button>
            <button onClick={toggleScreenShare} className={`control-btn ${isScreenSharing ? 'active' : ''}`} title="Share Screen">
              <FiMonitor />
            </button>
            <button onClick={leaveRoom} className="control-btn leave" title="Leave">
              <FiPhoneOff />
            </button>
          </div>

          <div className="controls-right">
            <button onClick={() => setShowParticipants(!showParticipants)} className={`control-btn ${showParticipants ? 'active' : ''}`}>
              <FiUsers /> <span className="btn-label">{participants.length}</span>
            </button>
            <button onClick={() => setShowChat(!showChat)} className={`control-btn ${showChat ? 'active' : ''}`}>
              <FiMessageSquare />
            </button>
            <button onClick={copyRoomLink} className="control-btn" title="Copy Link">
              {copied ? <FiCheck /> : <FiCopy />}
            </button>
          </div>
        </div>
      </div>

      {(showChat || showParticipants) && (
        <div className="side-panel">
          <div className="panel-tabs">
            <button className={showChat ? 'active' : ''} onClick={() => { setShowChat(true); setShowParticipants(false); }}>
              Chat
            </button>
            <button className={showParticipants ? 'active' : ''} onClick={() => { setShowParticipants(true); setShowChat(false); }}>
              People ({participants.length})
            </button>
          </div>

          {showChat && (
            <div className="chat-panel">
              <div className="chat-messages">
                {chatMessages.length === 0 && <p className="no-messages">No messages yet</p>}
                {chatMessages.map((msg, i) => (
                  <div key={i} className="chat-message">
                    <span className="chat-user">{msg.user?.username}</span>
                    <span className="chat-text">{msg.message}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="chat-input">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Send a message..."
                />
                <button type="submit">Send</button>
              </form>
            </div>
          )}

          {showParticipants && (
            <div className="participants-panel">
              {participants.map((p, i) => (
                <div key={i} className="participant">
                  <div className="participant-avatar">{p.username?.charAt(0).toUpperCase()}</div>
                  <span>{p.username}</span>
                  {p.isHost && <span className="host-badge">Host</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RemoteVideo = ({ oderId, stream, participants }) => {
  const videoRef = useRef(null);
  const participant = participants.find(p => p.oderId === oderId);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-tile">
      <video ref={videoRef} autoPlay playsInline />
      <div className="tile-info">
        <span>{participant?.username || 'Participant'}</span>
      </div>
    </div>
  );
};

export default StreamMeet;
