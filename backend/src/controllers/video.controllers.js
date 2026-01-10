import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { removefromCloudinary } from "../utils/removeImage.js";

const getAllVideos = asyncHandler(async (req, res) => {
  console.log("=== GET ALL VIDEOS ===");
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;
  console.log("Query params:", { page, limit, query, sortBy, sortType, userId });

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

  console.log("Videos found:", videosList.length, "Total:", totalVideos);

  res.status(200).json(
    new ApiResponse(200, {
      videos: videosList,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalVideos,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    }, "Videos fetched successfully")
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  console.log("=== PUBLISH VIDEO START ===");
  const { title, description } = req.body;

  console.log("1. Request body:", { title, description });
  console.log("2. Files object:", JSON.stringify(req.files, null, 2));

  const videoFile = req.files?.["videoFile"]?.[0] || null;
  const thumbnailFile = req.files?.["thumbnail"]?.[0] || null;

  console.log("3. Video file:", videoFile ? videoFile.path : "NULL");
  console.log("4. Thumbnail file:", thumbnailFile ? thumbnailFile.path : "NULL");

  if (!videoFile) {
    console.log("ERROR: No video file");
    return res.status(400).json({ success: false, message: "Video file is required" });
  }
  if (!thumbnailFile) {
    console.log("ERROR: No thumbnail file");
    return res.status(400).json({ success: false, message: "Thumbnail file is required" });
  }

  // Upload video to cloudinary
  console.log("5. Starting video upload to Cloudinary...");
  const uploadedvideo = await uploadOnCloudinary(videoFile.path);
  console.log("6. Video upload result:", uploadedvideo ? "SUCCESS" : "FAILED", uploadedvideo?.secure_url);

  if (!uploadedvideo || !uploadedvideo.secure_url) {
    console.log("ERROR: Video upload failed");
    return res.status(500).json({ success: false, message: "Failed to upload video to cloudinary" });
  }

  // Upload thumbnail to cloudinary
  console.log("7. Starting thumbnail upload to Cloudinary...");
  const uploadthumbnail = await uploadOnCloudinary(thumbnailFile.path);
  console.log("8. Thumbnail upload result:", uploadthumbnail ? "SUCCESS" : "FAILED", uploadthumbnail?.secure_url);

  if (!uploadthumbnail || !uploadthumbnail.secure_url) {
    console.log("ERROR: Thumbnail upload failed");
    return res.status(500).json({ success: false, message: "Failed to upload thumbnail to cloudinary" });
  }

  // Create the video in db
  console.log("9. Creating video in database...");
  const videoData = {
    videoFile: uploadedvideo.secure_url,
    thumbnail: uploadthumbnail.secure_url,
    title,
    description,
    duration: uploadedvideo.duration || 0,
    owner: req.user._id,
  };
  console.log("10. Video data:", videoData);

  const newVideo = await Video.create(videoData);
  console.log("11. Video created:", newVideo._id);

  res.status(201).json(new ApiResponse(201, newVideo, "Video published successfully"));
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
    .json(new ApiResponse(200, video, "video fetched successfully"));
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
    await removefromCloudinary(video.thumbnail);
    //upload new thumbnail
    const uploadnewthumbnail = await uploadOnCloudinary(
      thumbnailFile.path,
      "Video-thumbnails-uploaded"
    );
    video.thumbnail = uploadnewthumbnail.secure_url;
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
  await removefromCloudinary(video.thumbnail);
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
