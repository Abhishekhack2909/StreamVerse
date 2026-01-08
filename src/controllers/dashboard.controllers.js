import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    // step1: get channelId from req.params
    // step2: validate channelId
    // step3: fetch total subscribers from Subscription model
    // step4: fetch total videos and total views from Video model
    // step5: fetch total likes from Like model
    // step6: return response with the stats
    const {channelId}= req.params;
    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(400, "Invalid channelId");
    } 
    const totalSubscribers= await Subscription.countDocuments({channelId:channelId});
    const totalVideos= await Video.countDocuments({uploadedBy:channelId});
    const videos= await Video.find({uploadedBy:channelId});
    let totalViews=0;
    let totalLikes=0;
    for(const video of videos){
        totalViews += video.views;
        const likesCount= await Like.countDocuments({videoId:video._id});
        totalLikes += likesCount;
    }

    res
    .status(200)
    .json(new ApiResponse(200, "Channel stats fetched successfully", {
        totalSubscribers,
        totalVideos,
        totalViews,
        totalLikes
    }));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    // step1: get channelId from req.params
    // step2: validate channelId
    // step3: fetch videos from Video model
    // step4: return response with the videos
    const {channelId}= req.params;
    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(400, "Invalid channelId");
    } 
    const videos= await Video.find({uploadedBy:channelId}).sort({createdAt:-1}); // sort by newest first
    res
    .status(200)
    .json(new ApiResponse(200, "Channel videos fetched successfully", videos));
})

export {
    getChannelStats, 
    getChannelVideos
    }