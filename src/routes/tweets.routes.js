import {Router} from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js';
import {createTweet, getUserTweets, updateTweet, deleteTweet} from '../controllers/tweet.controllers.js';
import { verify } from 'jsonwebtoken';

const router=Router();
router.use(verifyJWT);// all routes below this middleware will be protected
router.route('/').post(createTweet);
router.routre('/user/:userId').getUserTweets;
router.route('/:tweetId').patch(updateTweet).delete(deleteTweet);

export default router;


