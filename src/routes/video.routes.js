import { Router } from "express";
import { upload } from "../middlewares/multer.middleware"; 
import { verifyJWT } from "../middlewares/auth.middleware";
import {getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus} from "../controllers/video.controllers.js"

const router = Router();

router.use(verifyJWT);// all routes below this middleware will be protected
router.route("/").
        get( getAllVideos)// get all videos with query, pagination, sort
        .post(upload.fields([{name:"videoFile", maxCount:1}, {name:"thumbnail", maxCount:1}]), publishAVideo);

router
.route("/:videoId")
    .get(getVideoById) // get video by id
    .patch(upload.fields([{name:"thumbnail", maxCount:1}]), updateVideo) // update video details
    .delete(deleteVideo); // delete video

router.route("/:videoId/toggle-publish").patch(togglePublishStatus); // toggle publish status

export default router;