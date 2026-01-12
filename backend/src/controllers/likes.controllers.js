import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;
  
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  
  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: userId,
  });
  
  let isLiked = false;
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    isLiked = false;
  } else {
    await Like.create({
      video: videoId,
      likedBy: userId,
    });
    isLiked = true;
  }

  res.status(200).json(
    new ApiResponse(200, { isLiked }, "Like toggled successfully")
  );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }
  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });
  
  let isLiked = false;
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    isLiked = false;
  } else {
    await Like.create({
      comment: commentId,
      likedBy: userId,
    });
    isLiked = true;
  }
  
  res.status(200).json(
    new ApiResponse(200, { isLiked }, "Comment like toggled successfully")
  );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }
  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: userId,
  });
  
  let isLiked = false;
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    isLiked = false;
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: userId,
    });
    isLiked = true;
  }

  res.status(200).json(
    new ApiResponse(200, { isLiked }, "Tweet like toggled successfully")
  );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const likedVideos = await Like.find({ likedBy: userId, video: { $exists: true } }).populate("video");
  res.status(200).json(
    new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
  );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
