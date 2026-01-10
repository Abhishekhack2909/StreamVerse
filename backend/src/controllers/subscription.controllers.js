import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user._id;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const existedSubscription = await Subscription.findOne({
    channelId: channelId,
    subscriberId: subscriberId,
  });

  let subscribed = false;
  if (existedSubscription) {
    await Subscription.deleteOne({ _id: existedSubscription._id });
    subscribed = false;
  } else {
    await Subscription.create({
      channelId: channelId,
      subscriberId: subscriberId,
    });
    subscribed = true;
  }

  res.status(200).json(
    new ApiResponse(200, { subscribed }, "Subscription toggled successfully")
  );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: get all subscribers of a channel
  //step1: validate channelId
  // step2: fetch subscribers from db
  // step3: return response with subscribers list

  //cheak for channel existence
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "channel not found");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }
  const subscribers = await Subscription.find({
    channelId: channelId,
  }).populate("subscriberId", "username email");
  //step3 return the response
  res
    .status(200)
    .json(
      new ApiResponse(200, "Subscribers fetched Succesfully ", subscribers)
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  //step1: validate subscriberId
  // step2: fetch subscribed channels from db
  // step3: return response with channels list

  // cheak for user existence
  const user = await User.findById(subscriberId);
  if (!user) {
    throw new ApiError(404, "User not fouund");
  }

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid SubscriberId");
  }
  const subscribedChannels = await Subscription.find({
    subscriberId: subscriberId,
  }).populate("channelId", "username email");
  //step3 return the response
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Subscribed channels fetched Succesfully ",
        subscribedChannels
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
