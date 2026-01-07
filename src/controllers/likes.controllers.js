import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video means if already liked then unlike else like
    //to make the toggle functionality firts we need to get the userId from req.user_id (set by verifyJWT middleware)
    // we need to check if a like document already exists for the given videoId and userId
    // if exists then remove it (unlike) else creat a new like document (like)
    //return appropriate reponse

const userId= req.userId;
if(!isValidObjectId(videoId)){
    throw new ApiError(400, "Invalid video ID");
}
    const existingLike=await Like.findOne({videoId:videoId, likedBy:userId});
    if (existingLike){
        await Like.deleteOne({_id:existingLike._id}) //delete the existing like
    }
    else{
        const newLike= await Like.create({
            videoId:videoId,
            likedBy:userId
        })
    }

    // now response
    res
    .status(200)
    .json(new ApiResponse(200, "video is liked or unliked succesfully", null ));
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const userId= req.userId;
if(!isValidObjectId(commentId)){
    throw new ApiError(400, "Invalid comment ID");
   }
    const existingLike=await Like.findOne({commentId:commentId, likedBy:userId});
    if (existingLike){
        await Like.deleteOne({_id:existingLike._id}) //delete the existing like
    }
    else{
        const newLike= await Like.create({
            commentId:commentId,
            likedBy:userId
        })
    }
    // now response
    res
    .status(200)
    .json(new ApiResponse(200, "comment is liked or unliked succesfully", null ));
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId= req.userId;
if(!isValidObjectId(tweetId)){
    throw new ApiError(400, "Invalid tweet ID");
}
    const existingLike=await Like.findOne({tweetId:tweetId, likedBy:userId});
    if (existingLike){
        await Like.deleteOne({_id:existingLike._id}) //delete the existing like
    }
    else{
        const newLike= await Like.create({
            tweetId:tweetId,
            likedBy:userId
        })
    }

    // now response
    res
    .status(200)
    .json(new ApiResponse(200, "tweet is liked or unliked succesfully", null ));
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos at one place
    // get userId from req.user_id
    // find all liked videos by the user 
    // return reponse with liked videos
    const userId=req.userid;
    
    //we use .populate to get video details along with like document
    const likedVideos= await Like.findOneandPopulate({likedBy:userId},"video");
res.status(200)
    .json(new ApiResponse(200, "Liked vidoes fetched Succesfully", likedVideos));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}