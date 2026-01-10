import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const isValid = mongoose.Types.ObjectId.isValid(videoId);
  if (!isValid) {
    throw new ApiError(400, "Invalid videoId");
  }

  const comments = await Comment.find({ videoId: videoId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate("commentedBy", "username avatar");

  // Transform to match frontend expectations
  const transformedComments = comments.map(comment => ({
    _id: comment._id,
    content: comment.text,
    owner: comment.commentedBy,
    videoId: comment.videoId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  }));

  res.status(200).json(new ApiResponse(200, transformedComments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;
  
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment text cannot be empty");
  }
  
  const newComment = await Comment.create({
    videoId: videoId,
    text: content,
    commentedBy: userId,
  });

  // Populate and transform
  const populatedComment = await Comment.findById(newComment._id)
    .populate("commentedBy", "username avatar");

  const response = {
    _id: populatedComment._id,
    content: populatedComment.text,
    owner: populatedComment.commentedBy,
    videoId: populatedComment.videoId,
    createdAt: populatedComment.createdAt,
    updatedAt: populatedComment.updatedAt,
  };

  res.status(201).json(new ApiResponse(201, response, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  // step 1: get commentId from req.params
  // step 2: get new comment text from req.body
  // step 3: get userId from req.user_id (set by verifyJWT middleware)
  // step 4: find the comment in db
  // step 5: check if the logged in user is the owner of the comment
  // step 6: update the comment text and save
  // step 7: return response with updated comment

  const { commentId } = req.params;
  const { text } = req.body;
  const userId = req.user._id;
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if (comment.commentedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to update this comment");
  }

  comment.text = text;
  await comment.save();

  res
    .status(200)
    .json(new ApiResponse(200, "Comment updated successfully", comment));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  // step 1: get commentId from req.params
  // step 2: get userId from req.user_id (set by verifyJWT middleware)
  // step 3: find the comment in db
  // step 4: check if the logged in user is the owner of the comment
  // step 5: delete the comment
  // step 6: return response with success message
  const { commentId } = req.params;
  const userId = req.user._id;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if (comment.commentedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }
  await comment.deleteOne();

  res.status(200).json(new ApiResponse(200, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
