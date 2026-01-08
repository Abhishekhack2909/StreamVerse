import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    // for  use for configuration and middlware.
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" })); // limit the file to not to become heavy

app.use(express.urlencoded({ extended: true, limit: "16kb" })); // making the url encoded  and decoded

app.use(express.static("public")); // for making  the any asset(like images or fevicon) that is loaded into public file

app.use(cookieParser()); // for taking cookie info to server or many thing with secure manner

//routes import
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/likes.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweets.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import healthcheckRouter from "./routes/healthcheakup.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);

export { app };

//final model structure of app.js
// app.js
//│
//├─ Security (CORS, cookies)
//├─ Body parsing (JSON, forms)
//├─ Static assets
//├─ Route connection
//│
//└─ Export app
