import crypto from "crypto";
import { Stream } from "../models/stream.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Generate unique stream key
const generateStreamKey = () => {
  return crypto.randomBytes(16).toString("hex");
};

// Start a new stream
export const startStream = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const streamerId = req.user._id;

  if (!title?.trim()) {
    throw new ApiError(400, "Stream title is required");
  }

  // Check if user already has an active stream
  const existingStream = await Stream.findOne({
    streamer: streamerId,
    isLive: true,
  });

  if (existingStream) {
    throw new ApiError(400, "You already have an active stream");
  }

  const streamKey = generateStreamKey();

  const stream = await Stream.create({
    title,
    description: description || "",
    streamer: streamerId,
    streamKey,
    isLive: true,
    startedAt: new Date(),
  });

  const populatedStream = await Stream.findById(stream._id).populate(
    "streamer",
    "username avatar fullname"
  );

  res.status(201).json(new ApiResponse(201, populatedStream, "Stream started successfully"));
});

// End a stream
export const endStream = asyncHandler(async (req, res) => {
  const { streamId } = req.params;
  const userId = req.user._id;

  const stream = await Stream.findById(streamId);

  if (!stream) {
    throw new ApiError(404, "Stream not found");
  }

  if (stream.streamer.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to end this stream");
  }

  stream.isLive = false;
  stream.endedAt = new Date();
  await stream.save();

  res.status(200).json(new ApiResponse(200, stream, "Stream ended successfully"));
});

// Get all live streams
export const getLiveStreams = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const streams = await Stream.find({ isLive: true })
    .populate("streamer", "username avatar fullname")
    .sort({ viewers: -1, startedAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Stream.countDocuments({ isLive: true });

  res.status(200).json(
    new ApiResponse(200, {
      streams,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalStreams: total,
      },
    }, "Live streams fetched successfully")
  );
});

// Get stream by ID
export const getStreamById = asyncHandler(async (req, res) => {
  const { streamId } = req.params;

  const stream = await Stream.findById(streamId).populate(
    "streamer",
    "username avatar fullname"
  );

  if (!stream) {
    throw new ApiError(404, "Stream not found");
  }

  res.status(200).json(new ApiResponse(200, stream, "Stream fetched successfully"));
});

// Get stream by stream key (for broadcaster)
export const getStreamByKey = asyncHandler(async (req, res) => {
  const { streamKey } = req.params;

  const stream = await Stream.findOne({ streamKey }).populate(
    "streamer",
    "username avatar fullname"
  );

  if (!stream) {
    throw new ApiError(404, "Stream not found");
  }

  res.status(200).json(new ApiResponse(200, stream, "Stream fetched successfully"));
});

// Update stream info
export const updateStream = asyncHandler(async (req, res) => {
  const { streamId } = req.params;
  const { title, description } = req.body;
  const userId = req.user._id;

  const stream = await Stream.findById(streamId);

  if (!stream) {
    throw new ApiError(404, "Stream not found");
  }

  if (stream.streamer.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to update this stream");
  }

  if (title) stream.title = title;
  if (description !== undefined) stream.description = description;

  await stream.save();

  res.status(200).json(new ApiResponse(200, stream, "Stream updated successfully"));
});

// Get my streams (past and current)
export const getMyStreams = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const streams = await Stream.find({ streamer: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Stream.countDocuments({ streamer: userId });

  res.status(200).json(
    new ApiResponse(200, {
      streams,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalStreams: total,
      },
    }, "Your streams fetched successfully")
  );
});

// Delete a stream
export const deleteStream = asyncHandler(async (req, res) => {
  const { streamId } = req.params;
  const userId = req.user._id;

  const stream = await Stream.findById(streamId);

  if (!stream) {
    throw new ApiError(404, "Stream not found");
  }

  if (stream.streamer.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this stream");
  }

  await Stream.findByIdAndDelete(streamId);

  res.status(200).json(new ApiResponse(200, null, "Stream deleted successfully"));
});


// Create a room (for StreamMeet)
export const createRoom = asyncHandler(async (req, res) => {
  const { title, mode = 'meet' } = req.body;
  const hostId = req.user._id;

  const roomCode = crypto.randomBytes(4).toString("hex");

  const room = await Stream.create({
    title: title || `${req.user.username}'s ${mode === 'meet' ? 'Meeting' : 'Stream'}`,
    streamer: hostId,
    streamKey: roomCode,
    isLive: true,
    mode: mode,
    startedAt: new Date(),
  });

  const populatedRoom = await Stream.findById(room._id).populate(
    "streamer",
    "username avatar fullname"
  );

  res.status(201).json(new ApiResponse(201, populatedRoom, "Room created successfully"));
});

// Get room by ID
export const getRoomById = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const room = await Stream.findById(roomId).populate(
    "streamer",
    "username avatar fullname"
  );

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  if (!room.isLive) {
    throw new ApiError(400, "This room has ended");
  }

  res.status(200).json(new ApiResponse(200, room, "Room fetched successfully"));
});
