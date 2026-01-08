import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; // pagination plugin
const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // clouinary URL
      required: true,
    },
    thumbnail: {
      type: String, // clouinary URL
      required: true,
    },
    thumbnailFile: {
      type: String, // clouinary URL
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // duration in seconds
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate); // adding pagination plugin to video schema

export const Video = mongoose.model("Video", videoSchema);
