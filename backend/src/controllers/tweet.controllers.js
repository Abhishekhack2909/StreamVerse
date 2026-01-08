import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  //get content from  req.body
  // owner from req.user._id (from verifyJWT middleware)
  //save tweet to db
  // return response with created tweet
  const { content } = req.body;
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Tweet content cannot be empty");
  }
  const newtweet = await Tweet.create({
    content,
    owner: req.user._id,
  });
  res
    .status(201)
    .json(new ApiResponse(201, "Tweet created successfully", newtweet));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const userId = req.params.userId;
  // validate userId
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userID");
  }
  // check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  // get tweets of the user
  const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

  //return response
  res
    .status(200)
    .json(new ApiResponse(200, "User tweets fetched Succesfully ", tweets));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  // get tweetId from req.params
  // get content  from req.body
  //find the tweet in db
  // check if the logged in user is the owner of the tweet
  //update the tweet content
  //sav the tweet
  // return response with updated tweet
  const { tweetId } = req.params;
  const { content } = req.body;

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "you are not allowed to update this tweet");
  }
  //update the content with previded content
  if (content && content.trim() !== "") {
    tweet.content = content;
  }
  await tweet.save();
  res
    .status(200)
    .json(new ApiResponse(200, "tweet updated Successfully", tweet));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  // get tweetId  from  req.params
  // find the tweet in db
  // check if the logged in user is the owner of the tweet
  // delete the tweet
  // return response with success message
  const { tweetId } = req.params;
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  //validate owner
  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this tweet");
  }
  await tweet.deleteOne();
  res.status(200).json(new ApiResponse(200, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
