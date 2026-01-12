import { Server } from "socket.io";
import { Stream } from "./models/stream.model.js";

const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        const allowedOrigins = [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:3000",
          process.env.FRONTEND_URL,
        ].filter(Boolean);
        
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const streams = new Map();
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // STREAM EVENTS
    socket.on("start-broadcast", async ({ streamId }) => {
      console.log(`Broadcaster ${socket.id} starting stream ${streamId}`);
      streams.set(streamId, { broadcaster: socket.id, viewers: new Set() });
      socket.join(streamId);
      socket.streamId = streamId;
      socket.isBroadcaster = true;
    });

    socket.on("join-stream", async ({ streamId }) => {
      const stream = streams.get(streamId);
      if (stream) {
        stream.viewers.add(socket.id);
        socket.join(streamId);
        socket.streamId = streamId;
        socket.isBroadcaster = false;
        try { await Stream.findByIdAndUpdate(streamId, { $inc: { viewers: 1 } }); } catch (e) {}
        io.to(stream.broadcaster).emit("viewer-joined", { viewerId: socket.id, viewerCount: stream.viewers.size });
      }
    });

    socket.on("end-broadcast", async ({ streamId }) => {
      const stream = streams.get(streamId);
      if (stream) {
        io.to(streamId).emit("stream-ended");
        try { await Stream.findByIdAndUpdate(streamId, { isLive: false, endedAt: new Date(), viewers: 0 }); } catch (e) {}
        streams.delete(streamId);
      }
    });

    // ROOM EVENTS (StreamMeet)
    socket.on("join-room", async (data) => {
      const { roomId, username, isHost } = data;
      const oderId = data.oderId || socket.id;
      
      console.log(`User ${username} (${oderId}) joining room ${roomId}`);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { participants: new Map() });
      }
      
      const room = rooms.get(roomId);
      room.participants.set(oderId, { socketId: socket.id, username: username || 'Guest', isHost: !!isHost, oderId });
      
      socket.join(roomId);
      socket.roomId = roomId;
      socket.oderId = oderId;
      socket.username = username;

      const participantsList = Array.from(room.participants.values());
      
      // Notify others
      socket.to(roomId).emit("user-joined", { oderId, username, participants: participantsList });
      
      // Send participants to new user
      socket.emit("room-participants", { participants: participantsList });

      try { await Stream.findByIdAndUpdate(roomId, { $inc: { viewers: 1 } }); } catch (e) {}
    });

    socket.on("leave-room", async (data) => {
      const oderId = data.oderId || socket.oderId;
      await handleLeaveRoom(socket, data.roomId, oderId);
    });

    // WebRTC Signaling
    socket.on("offer", ({ offer, targetId, roomId }) => {
      const room = rooms.get(roomId);
      if (room) {
        const target = room.participants.get(targetId);
        if (target) {
          io.to(target.socketId).emit("offer", { offer, senderId: socket.oderId });
        }
      }
    });

    socket.on("answer", ({ answer, targetId, roomId }) => {
      const room = rooms.get(roomId);
      if (room) {
        const target = room.participants.get(targetId);
        if (target) {
          io.to(target.socketId).emit("answer", { answer, senderId: socket.oderId });
        }
      }
    });

    socket.on("ice-candidate", ({ candidate, targetId, roomId }) => {
      const room = rooms.get(roomId);
      if (room) {
        const target = room.participants.get(targetId);
        if (target) {
          io.to(target.socketId).emit("ice-candidate", { candidate, senderId: socket.oderId });
        }
      }
    });

    // Chat
    socket.on("chat-message", ({ roomId, streamId, message, user }) => {
      const targetRoom = roomId || streamId;
      io.to(targetRoom).emit("chat-message", { id: Date.now(), message, user, timestamp: new Date().toISOString() });
    });

    // Disconnect
    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id);
      
      if (socket.streamId) {
        if (socket.isBroadcaster) {
          const stream = streams.get(socket.streamId);
          if (stream) {
            io.to(socket.streamId).emit("stream-ended");
            try { await Stream.findByIdAndUpdate(socket.streamId, { isLive: false, endedAt: new Date(), viewers: 0 }); } catch (e) {}
            streams.delete(socket.streamId);
          }
        } else {
          await handleLeaveStream(socket, socket.streamId);
        }
      }
      
      if (socket.roomId && socket.oderId) {
        await handleLeaveRoom(socket, socket.roomId, socket.oderId);
      }
    });
  });

  async function handleLeaveStream(socket, streamId) {
    const stream = streams.get(streamId);
    if (stream && stream.viewers.has(socket.id)) {
      stream.viewers.delete(socket.id);
      socket.leave(streamId);
      try { await Stream.findByIdAndUpdate(streamId, { $inc: { viewers: -1 } }); } catch (e) {}
      io.to(stream.broadcaster).emit("viewer-left", { viewerId: socket.id, viewerCount: stream.viewers.size });
    }
  }

  async function handleLeaveRoom(socket, roomId, oderId) {
    const room = rooms.get(roomId);
    if (room && room.participants.has(oderId)) {
      room.participants.delete(oderId);
      socket.leave(roomId);
      try { await Stream.findByIdAndUpdate(roomId, { $inc: { viewers: -1 } }); } catch (e) {}
      
      const participantsList = Array.from(room.participants.values());
      io.to(roomId).emit("user-left", { oderId, participants: participantsList });
      
      if (room.participants.size === 0) {
        rooms.delete(roomId);
        try { await Stream.findByIdAndUpdate(roomId, { isLive: false, endedAt: new Date() }); } catch (e) {}
      }
    }
  }

  return io;
};

export { initSocketServer };
