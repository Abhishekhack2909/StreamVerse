import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FiVideo,
  FiVideoOff,
  FiMic,
  FiMicOff,
  FiMonitor,
  FiPhoneOff,
  FiUsers,
  FiMessageSquare,
  FiCopy,
  FiCheck,
  FiMaximize,
  FiMinimize,
} from "react-icons/fi";
import { socket, connectSocket } from "../../lib/socket";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "./StreamMeet.css";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
  ],
};

const StreamMeet = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "meet";
  const { user, loading: authLoading } = useAuth();

  // Refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnections = useRef({});
  const pendingCandidates = useRef({});
  const roomDataRef = useRef(null);

  // Keep roomDataRef in sync
  useEffect(() => {
    roomDataRef.current = roomData;
  }, [roomData]);

  // State
  const [isJoined, setIsJoined] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [title, setTitle] = useState("");
  const [setupComplete, setSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // State for pre-created room
  const [preCreatedRoom, setPreCreatedRoom] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Check if user needs to login
  useEffect(() => {
    if (!authLoading && !user && roomId && roomId !== "new") {
      // Save the meeting URL and redirect to login
      sessionStorage.setItem("redirectAfterLogin", `/streammeet/${roomId}`);
      navigate("/login", { state: { from: `/streammeet/${roomId}` } });
    }
  }, [authLoading, user, roomId, navigate]);

  // Initialize media
  const initializeMedia = useCallback(async () => {
    try {
      setMediaError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera/microphone not supported in this browser");
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
      return stream;
    } catch (err) {
      console.error("Media error:", err);
      let msg = "Failed to access camera/microphone. ";
      if (err.name === "NotAllowedError")
        msg += "Please allow access in browser settings.";
      else if (err.name === "NotFoundError")
        msg += "No camera/microphone found.";
      else if (err.name === "NotReadableError")
        msg += "Device is in use by another app.";
      else msg += err.message;
      setMediaError(msg);
      return null;
    }
  }, []);

  // Create peer connection for a specific user
  const createPeerConnection = useCallback((oderId) => {
    if (peerConnections.current[oderId]) {
      return peerConnections.current[oderId];
    }

    console.log("Creating peer connection for:", oderId);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[oderId] = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        console.log("Adding track to peer connection:", track.kind);
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log("Received remote track from:", oderId, event.track.kind);
      setRemoteStreams((prev) => ({ ...prev, [oderId]: event.streams[0] }));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && roomDataRef.current) {
        console.log("Sending ICE candidate to:", oderId);
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          targetId: oderId,
          roomId: roomDataRef.current._id,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(
        "ICE connection state for",
        oderId,
        ":",
        pc.iceConnectionState,
      );
      if (
        pc.iceConnectionState === "failed" ||
        pc.iceConnectionState === "disconnected"
      ) {
        console.log("Connection failed/disconnected for:", oderId);
      }
    };

    // Process any pending ICE candidates
    if (pendingCandidates.current[oderId]) {
      pendingCandidates.current[oderId].forEach((candidate) => {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      });
      delete pendingCandidates.current[oderId];
    }

    return pc;
  }, []);

  // Send offer to a peer
  const sendOffer = useCallback(
    async (oderId) => {
      if (!roomDataRef.current) {
        console.log("Cannot send offer, roomData not set yet");
        return;
      }
      const pc = createPeerConnection(oderId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log("Sending offer to:", oderId);
        socket.emit("offer", {
          offer: pc.localDescription,
          targetId: oderId,
          roomId: roomDataRef.current._id,
        });
      } catch (err) {
        console.error("Error creating offer:", err);
      }
    },
    [createPeerConnection],
  );

  // Handle received offer
  const handleOffer = useCallback(
    async (offer, senderId) => {
      console.log("Handling offer from:", senderId);
      if (!roomDataRef.current) {
        console.log("Cannot handle offer, roomData not set yet");
        return;
      }
      const pc = createPeerConnection(senderId);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log("Sending answer to:", senderId);
        socket.emit("answer", {
          answer: pc.localDescription,
          targetId: senderId,
          roomId: roomDataRef.current._id,
        });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    },
    [createPeerConnection],
  );

  // Handle received answer
  const handleAnswer = useCallback(async (answer, senderId) => {
    console.log("Handling answer from:", senderId);
    const pc = peerConnections.current[senderId];
    if (pc && pc.signalingState !== "stable") {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("Error setting remote description:", err);
      }
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (candidate, senderId) => {
    const pc = peerConnections.current[senderId];
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    } else {
      // Store candidate for later
      if (!pendingCandidates.current[senderId]) {
        pendingCandidates.current[senderId] = [];
      }
      pendingCandidates.current[senderId].push(candidate);
    }
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!user) return;

    connectSocket();

    const handleRoomParticipants = ({ participants: list }) => {
      console.log("Room participants:", list);
      setParticipants(list);

      // When we first join, we receive the list of existing participants
      // We should send offers to all of them to establish connections
      // Small delay to ensure roomData is set
      setTimeout(() => {
        list.forEach((p) => {
          if (p.oderId !== user._id && roomDataRef.current) {
            console.log("Sending offer to existing participant:", p.oderId);
            sendOffer(p.oderId);
          }
        });
      }, 500);
    };

    const handleUserJoined = ({ oderId, username, participants: list }) => {
      console.log("User joined:", username, oderId);
      setParticipants(list);

      // When a new user joins, WE (existing user) should send them an offer
      // This ensures both sides establish a connection
      if (oderId !== user._id && roomDataRef.current) {
        console.log("Sending offer to new user:", oderId);
        sendOffer(oderId);
      }
    };

    const handleUserLeft = ({ oderId, participants: list }) => {
      console.log("User left:", oderId);
      setParticipants(list);

      // Clean up peer connection
      if (peerConnections.current[oderId]) {
        peerConnections.current[oderId].close();
        delete peerConnections.current[oderId];
      }

      // Clean up remote stream
      setRemoteStreams((prev) => {
        const newStreams = { ...prev };
        delete newStreams[oderId];
        return newStreams;
      });

      // Also clean up any pending candidates
      if (pendingCandidates.current[oderId]) {
        delete pendingCandidates.current[oderId];
      }
    };

    const handleOfferReceived = async ({ offer, senderId }) => {
      console.log("Received offer from:", senderId);
      await handleOffer(offer, senderId);
    };

    const handleAnswerReceived = async ({ answer, senderId }) => {
      console.log("Received answer from:", senderId);
      await handleAnswer(answer, senderId);
    };

    const handleIceCandidateReceived = async ({ candidate, senderId }) => {
      await handleIceCandidate(candidate, senderId);
    };

    const handleChatMessage = (message) => {
      setChatMessages((prev) => [...prev, message]);
    };

    const handleRoomEnded = () => {
      alert("The meeting has ended");
      cleanupAndNavigate();
    };

    socket.on("room-participants", handleRoomParticipants);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("offer", handleOfferReceived);
    socket.on("answer", handleAnswerReceived);
    socket.on("ice-candidate", handleIceCandidateReceived);
    socket.on("chat-message", handleChatMessage);
    socket.on("room-ended", handleRoomEnded);

    return () => {
      socket.off("room-participants", handleRoomParticipants);
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("offer", handleOfferReceived);
      socket.off("answer", handleAnswerReceived);
      socket.off("ice-candidate", handleIceCandidateReceived);
      socket.off("chat-message", handleChatMessage);
      socket.off("room-ended", handleRoomEnded);
    };
  }, [
    user,
    sendOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanupAndNavigate,
  ]);

  // Cleanup function
  const cleanupAndNavigate = useCallback(() => {
    // Close all peer connections
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};

    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    navigate("/streammeet");
  }, [navigate]);

  // Pre-create room to get meeting link (like Google Meet)
  const preCreateRoom = async () => {
    if (!user) {
      sessionStorage.setItem(
        "redirectAfterLogin",
        "/streammeet/new?mode=" + mode,
      );
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await API.post("/streams/room", {
        title:
          title ||
          `${user.username}'s ${mode === "meet" ? "Meeting" : "Stream"}`,
        mode,
      });

      console.log("Room pre-created:", data.data);
      setPreCreatedRoom(data.data);
      window.history.replaceState(
        null,
        "",
        `/streammeet/${data.data._id}?mode=${mode}`,
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create room");
    } finally {
      setIsLoading(false);
    }
  };

  // Actually join the pre-created room
  const joinPreCreatedRoom = () => {
    if (!preCreatedRoom || !user) return;

    setRoomData(preCreatedRoom);
    setIsJoined(true);
    setIsHost(true);

    socket.emit("join-room", {
      roomId: preCreatedRoom._id,
      oderId: user._id,
      username: user.username,
      isHost: true,
    });
  };

  // Create room
  const createRoom = async () => {
    if (!title.trim() && mode === "stream") {
      setError("Please enter a title");
      return;
    }
    if (!user) {
      sessionStorage.setItem(
        "redirectAfterLogin",
        "/streammeet/new?mode=" + mode,
      );
      navigate("/login");
      return;
    }

    // If we already pre-created a room, just join it
    if (preCreatedRoom) {
      joinPreCreatedRoom();
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await API.post("/streams/room", {
        title:
          title ||
          `${user.username}'s ${mode === "meet" ? "Meeting" : "Stream"}`,
        mode,
      });

      console.log("Room created:", data.data);
      setRoomData(data.data);
      setIsJoined(true);
      setIsHost(true);

      socket.emit("join-room", {
        roomId: data.data._id,
        oderId: user._id,
        username: user.username,
        isHost: true,
      });

      window.history.replaceState(
        null,
        "",
        `/streammeet/${data.data._id}?mode=${mode}`,
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create room");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy pre-created room link
  const copyPreCreatedLink = () => {
    if (!preCreatedRoom) return;
    const link = `${window.location.origin}/streammeet/${preCreatedRoom._id}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Join existing room
  const joinRoom = async () => {
    if (!roomId || !user) return;

    setIsLoading(true);
    setError("");
    try {
      const { data } = await API.get(`/streams/room/${roomId}`);
      console.log("Joining room:", data.data);

      if (data.data.hasEnded || !data.data.isLive) {
        setError("This meeting has ended");
        setIsLoading(false);
        return;
      }

      setRoomData(data.data);
      setIsJoined(true);
      const amIHost = data.data.streamer?._id === user._id;
      setIsHost(amIHost);

      socket.emit("join-room", {
        roomId: data.data._id,
        oderId: user._id,
        username: user.username,
        isHost: amIHost,
      });
    } catch (err) {
      console.error("Join error:", err);
      setError(err.response?.data?.message || "Room not found or has ended");
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
      socket.emit("end-room", { roomId: roomData._id });
    } catch (err) {
      console.error("Error ending meeting:", err);
    }
    cleanupAndNavigate();
  };

  // Leave room
  const leaveRoom = () => {
    if (roomData && user) {
      socket.emit("leave-room", { roomId: roomData._id, oderId: user._id });
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
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await initializeMedia();
      if (stream) {
        // Replace track in all peer connections
        const videoTrack = stream.getVideoTracks()[0];
        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screen;
        if (localVideoRef.current) localVideoRef.current.srcObject = screen;

        const videoTrack = screen.getVideoTracks()[0];
        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(videoTrack);
        });

        videoTrack.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share error:", err);
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
    if (!newMessage.trim() || !roomData || !user) return;
    socket.emit("chat-message", {
      roomId: roomData._id,
      message: newMessage,
      user: { _id: user._id, username: user.username },
    });
    setNewMessage("");
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/streammeet/${roomData?._id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Initialize on mount
  useEffect(() => {
    if (!user) return;

    initializeMedia().then((stream) => {
      if (stream && roomId && roomId !== "new") {
        joinRoom();
      }
    });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId, user]);

  // Cleanup stale remote streams when participants change
  useEffect(() => {
    if (!isJoined) return;

    // Get list of valid participant IDs (excluding self)
    const validParticipantIds = participants
      .filter((p) => p.oderId !== user._id)
      .map((p) => p.oderId);

    // Remove remote streams for participants who are no longer in the list
    setRemoteStreams((prev) => {
      const newStreams = { ...prev };
      let changed = false;

      Object.keys(newStreams).forEach((oderId) => {
        if (!validParticipantIds.includes(oderId)) {
          delete newStreams[oderId];
          changed = true;

          // Also close the peer connection
          if (peerConnections.current[oderId]) {
            peerConnections.current[oderId].close();
            delete peerConnections.current[oderId];
          }
        }
      });

      return changed ? newStreams : prev;
    });
  }, [participants, isJoined, user]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="meet-setup">
        <div className="setup-loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return null;
  }

  const participantCount = participants.length || 1;

  // Filter remote streams to only show those with matching participants
  // This prevents ghost participants from appearing
  const validRemoteStreams = Object.entries(remoteStreams).filter(
    ([oderId]) => {
      const hasParticipant = participants.some((p) => p.oderId === oderId);
      const isNotMe = oderId !== user._id;
      return hasParticipant && isNotMe;
    },
  );

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
                    {user.username?.charAt(0).toUpperCase() || "U"}
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
                  <button onClick={initializeMedia} className="retry-btn">
                    Try Again
                  </button>
                </div>
              )}
            </div>
            <div className="preview-controls">
              <button
                onClick={toggleAudio}
                className={`preview-btn ${!audioEnabled ? "off" : ""}`}
                disabled={!setupComplete}
              >
                {audioEnabled ? <FiMic size={20} /> : <FiMicOff size={20} />}
              </button>
              <button
                onClick={toggleVideo}
                className={`preview-btn ${!videoEnabled ? "off" : ""}`}
                disabled={!setupComplete}
              >
                {videoEnabled ? (
                  <FiVideo size={20} />
                ) : (
                  <FiVideoOff size={20} />
                )}
              </button>
            </div>
          </div>

          <div className="meet-join-section">
            <h1>
              {roomId && roomId !== "new"
                ? "Ready to join?"
                : preCreatedRoom
                  ? "Your meeting is ready"
                  : "Start a meeting"}
            </h1>
            <p className="meet-subtitle">
              {roomId && roomId !== "new"
                ? "Choose your audio and video settings"
                : preCreatedRoom
                  ? "Share this link with others you want in the meeting"
                  : "Create a new meeting room"}
            </p>

            {/* Show meeting link if pre-created */}
            {preCreatedRoom && (
              <div className="meeting-link-box">
                <div className="meeting-link">
                  <span className="link-text">
                    {window.location.origin}/streammeet/{preCreatedRoom._id}
                  </span>
                  <button
                    onClick={copyPreCreatedLink}
                    className="copy-link-btn"
                  >
                    {linkCopied ? <FiCheck size={18} /> : <FiCopy size={18} />}
                  </button>
                </div>
                <p className="link-hint">
                  {linkCopied ? "Link copied!" : "Click to copy meeting link"}
                </p>
              </div>
            )}

            {mode === "stream" &&
              (!roomId || roomId === "new") &&
              !preCreatedRoom && (
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
              {/* Show different buttons based on state */}
              {!roomId || roomId === "new" ? (
                preCreatedRoom ? (
                  <button
                    onClick={joinPreCreatedRoom}
                    className="meet-join-btn"
                    disabled={!setupComplete || isLoading}
                  >
                    Join now
                  </button>
                ) : (
                  <button
                    onClick={preCreateRoom}
                    className="meet-join-btn"
                    disabled={!setupComplete || isLoading}
                  >
                    {isLoading ? "Creating..." : "Create meeting"}
                  </button>
                )
              ) : (
                <button
                  onClick={joinRoom}
                  className="meet-join-btn"
                  disabled={!setupComplete || isLoading}
                >
                  {isLoading ? "Please wait..." : "Join now"}
                </button>
              )}
              <button
                onClick={() => navigate("/streammeet")}
                className="meet-back-btn"
              >
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
    <div className={`meet-room ${isFullscreen ? "fullscreen" : ""}`}>
      <div className="meet-main">
        <div
          className={`meet-video-grid grid-${Math.min(participantCount, 4)}`}
        >
          {/* Local video */}
          <div
            className={`meet-video-tile ${validRemoteStreams.length === 0 ? "solo" : ""}`}
          >
            <video ref={localVideoRef} autoPlay muted playsInline />
            {!videoEnabled && (
              <div className="video-off-overlay">
                <div className="avatar-circle large">
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </div>
              </div>
            )}
            <div className="tile-label">
              <span>You {isHost && "(Host)"}</span>
              <div className="tile-icons">
                {!audioEnabled && <FiMicOff size={14} />}
                {!videoEnabled && <FiVideoOff size={14} />}
              </div>
            </div>
          </div>

          {/* Remote videos - only show valid participants */}
          {validRemoteStreams.map(([oderId, stream]) => {
            const participant = participants.find((p) => p.oderId === oderId);
            if (!participant) return null;
            return (
              <RemoteVideo
                key={oderId}
                stream={stream}
                participant={participant}
              />
            );
          })}
        </div>

        {/* Bottom controls */}
        <div className="meet-controls">
          <div className="controls-info">
            <span className="meeting-title">
              {roomData?.title || "Meeting"}
            </span>
          </div>

          <div className="controls-main">
            <button
              onClick={toggleAudio}
              className={`ctrl-btn ${!audioEnabled ? "off" : ""}`}
            >
              {audioEnabled ? <FiMic size={22} /> : <FiMicOff size={22} />}
            </button>
            <button
              onClick={toggleVideo}
              className={`ctrl-btn ${!videoEnabled ? "off" : ""}`}
            >
              {videoEnabled ? <FiVideo size={22} /> : <FiVideoOff size={22} />}
            </button>
            <button
              onClick={toggleScreenShare}
              className={`ctrl-btn ${isScreenSharing ? "active" : ""}`}
            >
              <FiMonitor size={22} />
            </button>
            <button
              onClick={isHost ? endMeeting : leaveRoom}
              className="ctrl-btn leave"
              disabled={isEnding}
            >
              <FiPhoneOff size={22} />
            </button>
          </div>

          <div className="controls-extra">
            <button
              onClick={() => {
                setShowParticipants(!showParticipants);
                setShowChat(false);
              }}
              className={`ctrl-btn-sm ${showParticipants ? "active" : ""}`}
            >
              <FiUsers size={20} />
              <span>{participantCount}</span>
            </button>
            <button
              onClick={() => {
                setShowChat(!showChat);
                setShowParticipants(false);
              }}
              className={`ctrl-btn-sm ${showChat ? "active" : ""}`}
            >
              <FiMessageSquare size={20} />
            </button>
            <button onClick={copyRoomLink} className="ctrl-btn-sm">
              {copied ? <FiCheck size={20} /> : <FiCopy size={20} />}
            </button>
            <button onClick={toggleFullscreen} className="ctrl-btn-sm">
              {isFullscreen ? (
                <FiMinimize size={20} />
              ) : (
                <FiMaximize size={20} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Side panel */}
      {(showChat || showParticipants) && (
        <div className="meet-sidebar">
          <div className="sidebar-header">
            <h3>{showChat ? "In-call messages" : "People"}</h3>
            <button
              onClick={() => {
                setShowChat(false);
                setShowParticipants(false);
              }}
              className="close-sidebar"
            >
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
                      {p.username} {p.oderId === user._id && "(You)"}
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
                    <div
                      key={i}
                      className={`chat-msg ${msg.user?._id === user._id ? "own" : ""}`}
                    >
                      <span className="msg-sender">{msg.user?.username}</span>
                      <span className="msg-text">{msg.message}</span>
                      <span className="msg-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
                <button type="submit" disabled={!newMessage.trim()}>
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Remote video component
const RemoteVideo = ({ stream, participant }) => {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(true);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;

      // Check if video track is enabled
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        setHasVideo(videoTrack.enabled);
        videoTrack.onmute = () => setHasVideo(false);
        videoTrack.onunmute = () => setHasVideo(true);
      }
    }
  }, [stream]);

  const username = participant?.username || "Participant";
  const isHost = participant?.isHost;

  return (
    <div className="meet-video-tile">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ display: hasVideo ? "block" : "none" }}
      />
      {!hasVideo && (
        <div className="video-off-overlay">
          <div className="avatar-circle large">
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      <div className="tile-label">
        <span>
          {username} {isHost && "(Host)"}
        </span>
      </div>
    </div>
  );
};

export default StreamMeet;
