import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { removefromCloudinary } from "../utils/removeImage.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
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
    owner: req.user_id, // from verifyJWT middleware
  });
  if (!newVideo) {
    throw new ApiError(500, "Failed to publish Video");
  }

  //now return the response
  res.res
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
  const video = await video.findByid(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  // check if the logged in user is the owner of the video
  if (video.owner.toString() !== req.userId) {
    throw new ApiErroe(403, "you are not allowed the update this video");
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
      const thumbnailFile= req.files['thumbnail']?req.files['thumbnail'][0]:null;

      if(thumbnailFile){
        // remove old thumbnail from cloudinary
        await removefromCloudinary(video.thumbnailFile);
        //upload new thumbnail
        const uploadnewthumbnail=await uploadOnCloudinary(thumbnailFile.path, "Video-thumbnails-uploaded");
        video.thumbnailFile=uploadnewthumbnail.secure_url;
        

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
  const video =await video.findById(videoId);
  if(!video){
    throw new ApiError(404, "video not found");
  }
  // check if the logged in user is the owner of the video
  if(video.owner.toString() !== req.userid){
    throw new ApiError(403, "you are not allowed to delete this video");
  }
  //remove video file and thumbnail from cloudinary
  await removefromCloudinary(video.videoFile);
  await removefromCloudinary(video.thumbnailFile);
  //delete video from db
  await Video.findByIdAndDelete(VideoId);

  //return response
  res
  .status(200)
  .json(new ApiResponse(200, "video deleted successfully"));

});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle publish status of video
  const video=await Video.findById(videoId);
  if(!video){
    throw new ApiError(404, "video not found");
  }
  // check if the logged in user is the owner of the video
  if(video.owner.toString() !== req.userid){
    throw new ApiError(403, "you are not allowed to update this video");
  }
  //toggle the published status
  //  as videoFile in video schema is isPublished as true by default
  video.isPublished = !video.isPublished;
  await video.save();

  //return response
  res
  .status(200)
.json(new ApiResponse(200, "video publish status updated successfully", video));



});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
