import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { removefromCloudinary } from "../utils/removeImage.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const matchStage = { isPublished: true };

  if (userId && isValidObjectId(userId)) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  if (query) {
    matchStage.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  const sortOrder = sortType === "asc" ? 1 : -1;
  const sortStage = { [sortBy]: sortOrder };
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const videos = await Video.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [{ $project: { username: 1, avatar: 1, fullname: 1 } }],
      },
    },
    { $addFields: { owner: { $first: "$owner" } } },
    { $sort: sortStage },
    {
      $facet: {
        videos: [{ $skip: skip }, { $limit: limitNum }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const videosList = videos[0]?.videos || [];
  const totalVideos = videos[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalVideos / limitNum);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        videos: videosList,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalVideos,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
      "Videos fetched successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const videoFile = req.files?.["videoFile"]?.[0] || null;
  const thumbnailFile = req.files?.["thumbnail"]?.[0] || null;

  if (!videoFile) {
    return res
      .status(400)
      .json({ success: false, message: "Video file is required" });
  }
  if (!thumbnailFile) {
    return res
      .status(400)
      .json({ success: false, message: "Thumbnail file is required" });
  }

  const uploadedvideo = await uploadOnCloudinary(videoFile.path);
  if (!uploadedvideo || !uploadedvideo.secure_url) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to upload video" });
  }

  const uploadthumbnail = await uploadOnCloudinary(thumbnailFile.path);
  if (!uploadthumbnail || !uploadthumbnail.secure_url) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to upload thumbnail" });
  }

  const newVideo = await Video.create({
    videoFile: uploadedvideo.secure_url,
    thumbnail: uploadthumbnail.secure_url,
    title,
    description,
    duration: uploadedvideo.duration || 0,
    owner: req.user._id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, newVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }

  // Increment view count
  video.views = (video.views || 0) + 1;
  await video.save();

  // Get video with owner details, like status, and subscription status
  const videoData = await Video.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerData",
      },
    },
    { $addFields: { owner: { $first: "$ownerData" } } },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "allLikes",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "owner._id",
        foreignField: "channelId",
        as: "allSubscribers",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$allLikes" },
        isLiked: userId
          ? { $in: [new mongoose.Types.ObjectId(userId), "$allLikes.likedBy"] }
          : false,
        "owner.subscribersCount": { $size: "$allSubscribers" },
        "owner.isSubscribed": userId
          ? {
              $in: [
                new mongoose.Types.ObjectId(userId),
                "$allSubscribers.subscriberId",
              ],
            }
          : false,
      },
    },
    {
      $project: {
        ownerData: 0,
        allLikes: 0,
        allSubscribers: 0,
        "owner.password": 0,
        "owner.refreshToken": 0,
        "owner.email": 0,
      },
    },
  ]);

  if (!videoData.length) {
    throw new ApiError(404, "video not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, videoData[0], "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "you are not allowed to update this video");
  }

  const { title, description } = req.body;
  if (title) video.title = title;
  if (description) video.description = description;

  const thumbnailFile = req.files?.["thumbnail"]?.[0] || null;
  if (thumbnailFile) {
    await removefromCloudinary(video.thumbnail);
    const uploadnewthumbnail = await uploadOnCloudinary(thumbnailFile.path);
    video.thumbnail = uploadnewthumbnail.secure_url;
  }

  await video.save();
  res
    .status(200)
    .json(new ApiResponse(200, video, "video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "you are not allowed to delete this video");
  }

  await removefromCloudinary(video.videoFile);
  await removefromCloudinary(video.thumbnail);
  await Video.findByIdAndDelete(videoId);

  res
    .status(200)
    .json(new ApiResponse(200, null, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "you are not allowed to update this video");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, video, "video publish status updated successfully")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
