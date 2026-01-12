import mongoose, { Schema } from "mongoose";

const streamSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    thumbnail: {
      type: String,
      default: "",
    },
    streamer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    streamKey: {
      type: String,
      required: true,
      unique: true,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      enum: ["meet", "stream"],
      default: "stream",
    },
    viewers: {
      type: Number,
      default: 0,
    },
    peakViewers: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Stream = mongoose.model("Stream", streamSchema);
