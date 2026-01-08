import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  // step1: get name, description from req.body
  // step2: get userId from req.user._id (set by verifyJWT middleware)
  // step3: create playlist document and save to db
  // step4: return response with created playlist

  const { name, description } = req.body;

  if (!name || name.trim() === "") {
    throw new ApiError(400, "Playlist name is required");
  }

  const newPlaylist = await Playlist.create({
    name,
    description: description || "",
    owner: req.user._id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, "Playlist created successfully", newPlaylist));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists
  // step1: get userId from req.params
  // step2: validate userId
  // step3: fetch playlists from db
  // step4: return response with playlists

  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const playlists = await Playlist.find({ owner: userId }).sort({
    createdAt: -1,
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, "User playlists fetched successfully", playlists)
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id
  // step1: get playlistId from req.params
  // step2: validate playlistId
  // step3: fetch playlist from db
  // step4: return response with playlist

  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId)
    .populate("videos")
    .populate("owner", "username avatar");

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Playlist fetched successfully", playlist));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  //TODO: add video to playlist
  // step1: get playlistId, videoId from req.params
  // step2: validate playlistId and videoId
  // step3: check if playlist exists and user is owner
  // step4: add video to playlist
  // step5: return response

  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to modify this playlist");
  }

  // Add video to videos array if not already present
  if (!playlist.videos.includes(videoId)) {
    playlist.videos.push(videoId);
    await playlist.save();
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, "Video added to playlist successfully", playlist)
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  //TODO: remove video from playlist
  // step1: get playlistId, videoId from req.params
  // step2: validate playlistId and videoId
  // step3: check if playlist exists and user is owner
  // step4: remove video from playlist
  // step5: return response

  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to modify this playlist");
  }

  // Remove video from videos array
  playlist.videos = playlist.videos.filter((vid) => vid.toString() !== videoId);
  await playlist.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, "Video removed from playlist successfully", playlist)
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  //TODO: delete playlist
  // step1: get playlistId from req.params
  // step2: validate playlistId
  // step3: check if playlist exists and user is owner
  // step4: delete playlist
  // step5: return response

  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this playlist");
  }

  await Playlist.findByIdAndDelete(playlistId);

  res.status(200).json(new ApiResponse(200, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  //TODO: update playlist
  // step1: get playlistId from req.params
  // step2: get name, description from req.body
  // step3: validate playlistId
  // step4: check if playlist exists and user is owner
  // step5: update playlist
  // step6: return response

  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this playlist");
  }

  if (name) {
    playlist.name = name;
  }
  if (description !== undefined) {
    playlist.description = description;
  }

  await playlist.save();

  res
    .status(200)
    .json(new ApiResponse(200, "Playlist updated successfully", playlist));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
