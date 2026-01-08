import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
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
  //TODO: get all videos based on query, sort, pagination using aggregation pipeline

  // Build match stage for filtering
  const matchStage = { isPublished: true };

  // If userId is provided, filter by owner
  if (userId && isValidObjectId(userId)) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  // If search query is provided, search in title and description
  if (query) {
    matchStage.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  // Build sort stage
  const sortOrder = sortType === "asc" ? 1 : -1;
  const sortStage = { [sortBy]: sortOrder };

  // Calculate skip value for pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Aggregation pipeline
  const videos = await Video.aggregate([
    // Stage 1: Match - filter videos
    {
      $match: matchStage,
    },
    // Stage 2: Lookup - join with users collection to get owner details
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              fullname: 1,
            },
          },
        ],
      },
    },
    // Stage 3: Unwind - convert owner array to single object
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
    // Stage 4: Sort
    {
      $sort: sortStage,
    },
    // Stage 5: Facet - for pagination (get both data and total count in one query)
    {
      $facet: {
        // Get paginated videos
        videos: [{ $skip: skip }, { $limit: limitNum }],
        // Get total count
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  // Extract results from facet
  const videosList = videos[0]?.videos || [];
  const totalVideos = videos[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalVideos / limitNum);

  res.status(200).json(
    new ApiResponse(200, "Videos fetched successfully", {
      videos: videosList,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalVideos,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    })
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  // to get video
  //  video file : req.files['videoFile'][0]
  // thumbnail : req.files['thumbnail'][0]

  const videoFile = req.files["videoFile"] ? req.files["videoFile"][0] : null;
  const thumbnailFile = req.files["thumbnail"]
    ? req.files["thumbnail"][0]
    : null;
  if (!videoFile) {
    throw new ApiError(400, "video file  is required");
  }
  if (!thumbnailFile) {
    throw new ApiError(400, "thumbnail file  is required");
  }
  //now upload these files to cloudinary
  const uploadedvideo = await uploadOnCloudinary(
    videoFile.path,
    "video-uploads"
  );
  const uploadthumbnail = await uploadOnCloudinary(
    thumbnailFile.path,
    "Video-thumbnails-uploaded"
  );

  //create the video file in db

  const newVideo = await Video.create({
    videoFile: uploadedvideo.secure_url,
    thumbnailFile: uploadthumbnail.secure_url,
    title,
    description,
    duration: uploadedvideo.duration,
    owner: req.user._id, // from verifyJWT middleware
  });
  if (!newVideo) {
    throw new ApiError(500, "Failed to publish Video");
  }

  //now return the response
  res
    .status(201)
    .json(new ApiResponse(201, "video published  successfully", newVideo));
});
//controller to get video by id
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  const video = await Video.findById(videoId).populate(
    "owner",
    "username avatar"
  );

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  //return response
  res
    .status(200)
    .json(new ApiResponse(200, "video fetched successfully", video));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  //title and description from req.body and thumbnail from req.files
  // first find the video
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  // check if the logged in user is the owner of the video
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "you are not allowed the update this video");
  }
  // then update the fields if provided
  const { title, description } = req.body;

  if (title) {
    video.title = title;
  }
  if (description) {
    video.description = description;
  }
  //if thumbnail is provided then remove the old one from cloudinary and upload the new one
  const thumbnailFile = req.files["thumbnail"]
    ? req.files["thumbnail"][0]
    : null;

  if (thumbnailFile) {
    // remove old thumbnail from cloudinary
    await removefromCloudinary(video.thumbnailFile);
    //upload new thumbnail
    const uploadnewthumbnail = await uploadOnCloudinary(
      thumbnailFile.path,
      "Video-thumbnails-uploaded"
    );
    video.thumbnailFile = uploadnewthumbnail.secure_url;
  }
  // then save the video
  await video.save();
  // return the updated video in response
  res
    .status(200)
    .json(new ApiResponse(200, "video updated Succesfully ", video));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  // check if the logged in user is the owner of the video
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "you are not allowed to delete this video");
  }
  //remove video file and thumbnail from cloudinary
  await removefromCloudinary(video.videoFile);
  await removefromCloudinary(video.thumbnailFile);
  //delete video from db
  await Video.findByIdAndDelete(videoId);

  //return response
  res.status(200).json(new ApiResponse(200, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle publish status of video
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  // check if the logged in user is the owner of the video
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "you are not allowed to update this video");
  }
  //toggle the published status
  //  as videoFile in video schema is isPublished as true by default
  video.isPublished = !video.isPublished;
  await video.save();

  //return response
  res
    .status(200)
    .json(
      new ApiResponse(200, "video publish status updated successfully", video)
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
