import { Router } from "express";
import {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} from "../controllers/video.controllers.js";
import { verifyJWT, optionalAuth } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes - with optional auth for personalized data
router.route("/").get(getAllVideos);
router.route("/:videoId").get(optionalAuth, getVideoById);

// Protected routes
router.use(verifyJWT);

router.route("/").post(
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAVideo
);

router
  .route("/:videoId")
  .delete(deleteVideo)
  .patch(upload.fields([{ name: "thumbnail", maxCount: 1 }]), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;
