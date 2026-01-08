import mongoose, { Schema } from "mongoose";
const subscriptionSchema = new Schema(
  {
    subscriberId: {
      type: Schema.Types.ObjectId, // one who is subscribing
      ref: "User",
    },
    channelId: {
      type: Schema.Types.ObjectId, // one whom "Subscriber " is subscribing
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
