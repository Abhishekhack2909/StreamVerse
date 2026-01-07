import {router} from 'express';
import{toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos} from '../controllers/likes.controllers.js';
import {verifyJWT} from '../middlewares/verifyJWT.middleware.js';

const router=router();
router.use(verifyJWT);
router.route("/videos").get(getLikedVideos)
router.route("toggle/v/:videoId").post(toggleVideoLike);
router.route("toggle/c/:commentId").post(toggleCommentLike);
router.route("toggle/t/:tweetId").post(toggleTweetLike);

export default router;


    
